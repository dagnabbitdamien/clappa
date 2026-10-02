#include <QTabWidget>
#include <QScrollArea>
#include <QClipboard>
#include <QPainter>
#include <QFileDialog>
#include <QDialog>
#include <QRegularExpression>
#include "tile-timing.h"
#include "board-art.h"
#include <obs-module.h>
#include <obs-frontend-api.h>
#include <QApplication>
#include <QCryptographicHash>
#include <QDateTime>
#include <QDir>
#include <QFile>
#include <QFileInfo>
#include <QJsonArray>
#include <QJsonDocument>
#include <QJsonObject>
#include <QLabel>
#include <QLineEdit>
#include <QPushButton>
#include <QSaveFile>
#include <QTimer>
#include <QUuid>
#include <QVBoxLayout>
#include <QImage>
#include <atomic>
#include <condition_variable>
#include <deque>
#include <mutex>
#include <thread>
#include <memory>
#include <QNetworkInterface>
#include <QComboBox>
#include <QPointer>
#include <QDesktopServices>
#include <QUrl>
#include <QElapsedTimer>
#include "session-summary.h"
#include "native-service.h"
#include "twitch-chat.h"

OBS_DECLARE_MODULE()
MODULE_EXPORT const char *obs_module_description(void) { return "CLAPPA local capture proof and continuous output commitment"; }
static QPointer<QLineEdit> identityCode;
static QPointer<QPushButton> copyPublic;
static QString root;
static QString sessionId, recordingId;
static QString summarySession;
static qint64 summaryStarted=0,summaryEnded=0,summaryDuration=0,summaryWritten=0;
static QElapsedTimer summaryClock;
static QPointer<QLabel> label,pairImage;
static QPointer<QLineEdit> rootEdit;
static QPointer<QLineEdit> proofLocation;
static QPointer<QTimer> timer;
static QPointer<QPushButton> pairButton;
static QPointer<QWidget> dockWidget;
static QPointer<QWidget> twitchPanel;
static bool shuttingDown=false;
static std::unique_ptr<NativeService> service;
static std::atomic<uint64_t> renders{0};
static qint64 tileUntil=0;
static QStringList tileFrames;static QString tileFlash;
static QString tilePath;
static std::mutex tileMutex;
static QString newId(){return QUuid::createUuid().toString(QUuid::Id128);}
static QByteArray digest(const QByteArray &v){return QCryptographicHash::hash(v,QCryptographicHash::Sha256);}
static QByteArray jcs(const QJsonValue &v){
    if(v.isObject()){QByteArray out="{";auto o=v.toObject();auto keys=o.keys();keys.sort();for(const auto &k:keys){if(out.size()>1)out+=',';out+=jcs(k)+':'+jcs(o[k]);}return out+'}';}
    if(v.isArray()){QByteArray out="[";for(auto x:v.toArray()){if(out.size()>1)out+=',';out+=jcs(x);}return out+']';}
    auto b=QJsonDocument(QJsonArray{v}).toJson(QJsonDocument::Compact);return b.mid(1,b.size()-2);
}
static bool save(const QString &file,const QJsonObject &o){QSaveFile f(file);if(!f.open(QIODevice::WriteOnly))return false;f.write(jcs(o));return f.commit();}
static QJsonObject read(const QString &file){QFile f(file);if(!f.open(QIODevice::ReadOnly))return {};return QJsonDocument::fromJson(f.readAll()).object();}
struct Work {QByteArray bytes;QJsonObject meta;};
class OutputChain {
public:
    obs_output_t *output=nullptr;QString id,role;QJsonObject descriptor;
    std::mutex mutex;std::condition_variable cv;std::deque<Work> queue;std::thread thread;
    bool stopping=false;std::atomic<bool> good{true};size_t queued=0;uint64_t packets=0,bytes=0;QByteArray head;
    OutputChain(obs_output_t *o,const QString &r):output(o),id(newId()),role(r){
        descriptor={{"session_id",sessionId},{"output_id",id},{"role",role},{"codec","obs-encoded-packets-v1"}};
        head=digest(QByteArray("CLAPPA-OUTPUT-v1\0",17)+jcs(descriptor));
        thread=std::thread([this]{worker();});obs_output_add_packet_callback(output,callback,this);
    }
    static void callback(obs_output_t*,encoder_packet *pkt,encoder_packet_time*,void *param){auto *c=static_cast<OutputChain*>(param);if(!pkt||!pkt->data||!pkt->size){c->good=false;return;}
        std::lock_guard<std::mutex> lock(c->mutex);if(c->stopping||!c->good)return;
        if(c->queued+pkt->size>64*1024*1024){c->good=false;return;}
        Work w;w.bytes=QByteArray(reinterpret_cast<const char*>(pkt->data),int(pkt->size));w.meta={{"type",pkt->type==OBS_ENCODER_VIDEO?"video":"audio"},{"track",int(pkt->track_idx)},{"pts",QString::number(pkt->pts)},{"dts",QString::number(pkt->dts)},{"timebase_num",pkt->timebase_num},{"timebase_den",pkt->timebase_den},{"keyframe",pkt->keyframe}};
        c->queued+=pkt->size;c->queue.push_back(std::move(w));c->cv.notify_one();
    }
    void worker(){const auto dir=root+"/sessions/"+sessionId+"/proof/outputs/";QDir().mkpath(dir);QFile data(dir+id+".bin"),manifest(dir+id+".jsonl");if(!data.open(QIODevice::WriteOnly|QIODevice::NewOnly)||!manifest.open(QIODevice::WriteOnly|QIODevice::NewOnly)){good=false;return;}
        for(;;){Work w;{std::unique_lock<std::mutex> l(mutex);cv.wait(l,[this]{return stopping||!queue.empty();});if(queue.empty()&&stopping)break;w=std::move(queue.front());queue.pop_front();queued-=w.bytes.size();}
            w.meta["seq"]=double(packets);w.meta["offset"]=double(bytes);w.meta["bytes"]=w.bytes.size();w.meta["sha256"]=QString::fromLatin1(digest(w.bytes).toHex());
            auto line=jcs(w.meta);if(data.write(w.bytes)!=w.bytes.size()||manifest.write(line+'\n')!=line.size()+1){good=false;break;}
            {std::lock_guard<std::mutex> l(mutex);head=digest(QByteArray("CLAPPA-PACKET-v1\0",17)+head+line);packets++;bytes+=w.bytes.size();}
        }data.flush();manifest.flush();
    }
    QJsonObject snapshot(){std::lock_guard<std::mutex> l(mutex);return {{"output_id",id},{"role",role},{"packets",double(packets)},{"bytes",double(bytes)},{"head",QString::fromLatin1(head.toHex())},{"complete",good.load()}};}
    void stop(){if(!output)return;obs_output_remove_packet_callback(output,callback,this);{std::lock_guard<std::mutex> l(mutex);stopping=true;}cv.notify_all();if(thread.joinable())thread.join();obs_output_release(output);output=nullptr;}
    ~OutputChain(){stop();}
};
static std::unique_ptr<OutputChain> recordChain,streamChain;
static QString mediaPath;static bool closed=false;
static void shutdownPlugin(){
    if(shuttingDown)return;
    shuttingDown=true;
    delete twitchPanel.data();twitchPanel.clear();
    if(timer){timer->stop();QObject::disconnect(timer,nullptr,nullptr,nullptr);}
    service.reset();recordChain.reset();streamChain.reset();
}
static QJsonArray states(){QJsonArray a;if(recordChain)a.append(recordChain->snapshot());if(streamChain)a.append(streamChain->snapshot());return a;}
static QJsonArray descriptors(){QJsonArray a;if(recordChain)a.append(recordChain->descriptor);if(streamChain)a.append(streamChain->descriptor);return a;}
static void writeState(){if(sessionId.isEmpty())return;save(root+"/obs-state.json",{{"session_id",sessionId},{"recording_id",recordingId},{"descriptors",descriptors()},{"outputs",states()},{"closed",closed},{"recording_active",obs_frontend_recording_active()},{"media_path",mediaPath},{"updated_at",double(QDateTime::currentMSecsSinceEpoch())},{"tile_renders",double(renders.load())}});}
static void frontend(enum obs_frontend_event e,void*){
    if(e==OBS_FRONTEND_EVENT_EXIT){shutdownPlugin();return;}
    if(shuttingDown)return;
    if(e==OBS_FRONTEND_EVENT_RECORDING_STARTING){recordChain.reset();streamChain.reset();root=rootEdit->text();QDir().mkpath(root);sessionId=newId();recordingId=newId();closed=false;mediaPath.clear();auto *o=obs_frontend_get_recording_output();if(o)recordChain=std::make_unique<OutputChain>(o,"recording");if(obs_frontend_streaming_active()){auto *s=obs_frontend_get_streaming_output();if(s)streamChain=std::make_unique<OutputChain>(s,"streaming");}writeState();}
    if(e==OBS_FRONTEND_EVENT_STREAMING_STARTING){if(recordChain&&recordChain->output){recordChain->good=false;return;}streamChain.reset();recordChain.reset();root=rootEdit->text();QDir().mkpath(root);sessionId=newId();recordingId=newId();closed=false;mediaPath.clear();auto *o=obs_frontend_get_streaming_output();if(o)streamChain=std::make_unique<OutputChain>(o,"streaming");}
    if(e==OBS_FRONTEND_EVENT_STREAMING_STOPPED&&streamChain){streamChain->stop();if(recordChain&&!recordChain->output&&!mediaPath.isEmpty())closed=true;writeState();}
    if(e==OBS_FRONTEND_EVENT_RECORDING_STOPPED){if(recordChain)recordChain->stop();if(streamChain)streamChain->stop();char *p=obs_frontend_get_last_recording();if(p){mediaPath=QString::fromUtf8(p);bfree(p);}closed=true;writeState();}
}
struct Tile {gs_texture_t *texture=nullptr;QList<QImage> frames;QImage flash;qint64 until=0,start=0;int index=0;bool settled=false;uint32_t width=BoardArt::Width,height=BoardArt::Height;};
static const char *tileName(void*){return "CLAPPA proof tile";}
static void *tileCreate(obs_data_t*,obs_source_t*){return new Tile;}
static void tileDestroy(void *data){auto *t=static_cast<Tile*>(data);obs_enter_graphics();gs_texture_destroy(t->texture);obs_leave_graphics();delete t;}
static void tileTick(void *data,float){
 QStringList paths;QString flash;qint64 until;{std::lock_guard<std::mutex> lock(tileMutex);paths=tileFrames;flash=tileFlash;until=tileUntil;}
 auto *t=static_cast<Tile*>(data);auto now=QDateTime::currentMSecsSinceEpoch();if(paths.empty()||now>until+TileTiming::exitMs)return;
 bool fresh=until!=t->until;
 if(fresh){QList<QImage> frames;for(const auto &path:paths){QImage im(path);if(im.isNull())return;frames.append(im.scaled(BoardArt::Width,BoardArt::Height,Qt::IgnoreAspectRatio,Qt::SmoothTransformation));}t->frames=frames;t->flash=flash.isEmpty()?QImage():QImage(flash);now=QDateTime::currentMSecsSinceEpoch();t->start=now;t->until=until;t->settled=false;t->index=0;}
 const auto ageMs=now-t->start;int index=TileTiming::frame(ageMs,until-now,t->frames.size(),t->index);bool changed=index!=t->index;t->index=index;
 double age=ageMs/1000.,exit=(now-until)/1000.;bool moving=age<.5||exit>0;bool fading=!t->flash.isNull()&&ageMs<1250;
 if(!moving&&!fading&&!changed&&t->settled&&!fresh)return;t->settled=!moving&&!fading;
 double y=0,angle=0;if(age<.38){double u=age/.38;double ease=1-std::pow(1-u,3);y=(BoardArt::Height+53)*(1-ease)-3;}else if(age<.49)y=-3*(1-(age-.38)/.11);
 if(age>.07&&age<.40)angle=2.6*std::sin((age-.07)/.33*3.14159265);
 if(exit>0){
  const double t=std::min(.24,exit),travel=BoardArt::Height+60,omega=18;
  y=travel*std::pow(t/.24,2);
  // Damped hinge response to downward acceleration, with zero initial velocity.
  // The free tip keeps falling, initially more slowly than the board; no upward kick.
  const double acceleration=2*travel/(.24*.24);
  const double lag=.85*acceleration/(omega*omega)*(1-(1+omega*t)*std::exp(-omega*t));
  angle=std::asin(lag/(BoardArt::BoardWidth-14))*180/3.14159265;
 }
 QImage im(BoardArt::Width,BoardArt::Height,QImage::Format_ARGB32_Premultiplied);im.fill(Qt::transparent);QPainter p(&im);p.setRenderHint(QPainter::Antialiasing);p.translate(0,y);p.drawImage(QRectF(0,0,BoardArt::Width,BoardArt::Height),t->frames[t->index]);p.translate(12,40);
 if(!t->flash.isNull()&&ageMs<1250){p.save();p.setOpacity(TileTiming::flashOpacity(ageMs));BoardArt::drawPhoto(p,t->flash);p.restore();}
 BoardArt::bar(p,angle);BoardArt::bracket(p);p.end();im=im.convertToFormat(QImage::Format_RGBA8888);
 const uint8_t *ptr=im.constBits();obs_enter_graphics();if(!t->texture)t->texture=gs_texture_create(im.width(),im.height(),GS_RGBA,1,&ptr,GS_DYNAMIC);else gs_texture_set_image(t->texture,ptr,im.bytesPerLine(),false);obs_leave_graphics();
}
static void tileRender(void *data,gs_effect_t *effect){qint64 until;{std::lock_guard<std::mutex> lock(tileMutex);until=tileUntil;}auto *t=static_cast<Tile*>(data);if(!t->texture||QDateTime::currentMSecsSinceEpoch()>until+240||!effect)return;gs_effect_set_texture(gs_effect_get_param_by_name(effect,"image"),t->texture);gs_draw_sprite(t->texture,0,t->width,t->height);renders++;}
static void poll(){
    if(shuttingDown||!label||!pairImage)return;
    writeState();if(service)service->tick();
    if(!sessionId.isEmpty()){
     const auto now=QDateTime::currentMSecsSinceEpoch();
     if(summarySession!=sessionId){summarySession=sessionId;summaryStarted=now;summaryEnded=0;summaryClock.start();summaryWritten=0;}
     if(!summaryEnded){summaryDuration=summaryClock.elapsed();if(closed)summaryEnded=now;}
     if(now-summaryWritten>=2000){SessionSummary::write(root,sessionId,recordingId,summaryStarted,summaryEnded,summaryDuration,obs_frontend_recording_active(),mediaPath);summaryWritten=now;}
    }
    const auto pairing=read(root+"/pairing.json");if(!pairing.isEmpty()){auto pix=QPixmap(root+"/pairing.png");if(!pix.isNull())pairImage->setPixmap(pix.scaled(220,220,Qt::KeepAspectRatio,Qt::SmoothTransformation));}
    const auto tile=read(root+"/tile.json");{std::lock_guard<std::mutex> lock(tileMutex);tilePath=tile["path"].toString();tileUntil=qint64(tile["until"].toDouble());tileFrames.clear();for(auto f:tile["frames"].toArray())tileFrames.append(f.toString());tileFlash=tile["flash_path"].toString();}
    auto command=read(root+"/command.json");if(command["type"]=="start"){QFile::remove(root+"/command.json");if(!obs_frontend_recording_active())obs_frontend_recording_start();}if(command["type"]=="stop"&&command["session_id"]==sessionId){QFile::remove(root+"/command.json");obs_frontend_recording_stop();}
    label->setText(service?service->status():QString("Connection unavailable"));
    if(identityCode){identityCode->setText(service?service->publicIdentity():QString());if(copyPublic)copyPublic->setEnabled(!identityCode->text().isEmpty());}
    if(proofLocation)proofLocation->setText(QDir::toNativeSeparators(sessionId.isEmpty()?root+"/sessions":root+"/sessions/"+sessionId+"/proof"));
    pairImage->setVisible(!service||!service->paired());if(pairButton)pairButton->setEnabled(!obs_frontend_recording_active()&&!obs_frontend_streaming_active());
}
bool obs_module_load(void){root=qEnvironmentVariable("CLAPPA_HOME",QDir::homePath()+"/CLAPPA");QDir().mkpath(root);
    shuttingDown=false;
    auto *dock=new QWidget();auto *layout=new QVBoxLayout(dock);
    dock->setStyleSheet("QWidget { background:#24231f; color:#eeeade; font-family:Segoe UI; } QLabel { background:transparent; } QPushButton { background:#35332d; border:1px solid #756047; border-radius:6px; padding:9px 12px; } QPushButton:hover { border-color:#ffad66; } QPushButton:disabled { color:#88867e; border-color:#4a4842; } QLineEdit,QComboBox { background:#181816; padding:8px; border:1px solid #626057; border-radius:4px; selection-background-color:#936132; } QTabBar::tab { padding:10px; background:#302e28; } QTabBar::tab:selected { background:#3b3329; color:#ffad66; border-bottom:2px solid #ffad66; }");
    auto *brand=new QLabel();QPixmap header(600,84);header.fill(QColor("#24231f"));{QPainter p(&header);p.setRenderHint(QPainter::Antialiasing);for(int row=0;row<2;row++){p.fillRect(0,row*14,600,14,QColor("#eeeade"));p.setBrush(QColor("#171715"));p.setPen(Qt::NoPen);for(int x=-28;x<620;x+=40){QPolygon q;if(row==0)q<<QPoint(x,0)<<QPoint(x+20,0)<<QPoint(x+34,14)<<QPoint(x+14,14);else q<<QPoint(x+14,14)<<QPoint(x+34,14)<<QPoint(x+20,28)<<QPoint(x,28);p.drawPolygon(q);}}QFont font("Arial",22,QFont::Bold);font.setItalic(true);p.setFont(font);p.setPen(QColor("#eeeade"));p.drawText(10,66,"CLAPPA");}brand->setPixmap(header.scaledToWidth(300,Qt::SmoothTransformation));layout->addWidget(brand);
    auto *settingsDialog=new QDialog(dock);settingsDialog->setWindowTitle("CLAPPA settings");settingsDialog->resize(480,520);auto *settingsLayout=new QVBoxLayout(settingsDialog);auto *settingsBrand=new QLabel();settingsBrand->setPixmap(brand->pixmap());settingsLayout->addWidget(settingsBrand);auto *tabs=new QTabWidget();settingsLayout->addWidget(tabs);
    auto page=[tabs](const QString &name){auto *w=new QWidget();auto *l=new QVBoxLayout(w);l->setSpacing(12);auto *scroll=new QScrollArea();scroll->setWidgetResizable(true);scroll->setFrameShape(QFrame::NoFrame);scroll->setWidget(w);tabs->addTab(scroll,name);return l;};
    auto *networkLayout=page("Connection");auto *identityLayout=page("Identity");auto *filesLayout=page("Saved proofs");
    auto *settingsButton=new QPushButton("Settings…");layout->addWidget(settingsButton);QObject::connect(settingsButton,&QPushButton::clicked,settingsDialog,[settingsDialog]{settingsDialog->show();settingsDialog->raise();});
    auto *done=new QPushButton("Done");settingsLayout->addWidget(done);QObject::connect(done,&QPushButton::clicked,settingsDialog,&QDialog::hide);
rootEdit=new QLineEdit(root);rootEdit->setReadOnly(true);rootEdit->hide();label=new QLabel("CLAPPA — incomplete until sealed");label->setWordWrap(true);pairImage=new QLabel();
    filesLayout->addWidget(new QLabel("Where your proofs are saved"));proofLocation=new QLineEdit(QDir::toNativeSeparators(root+"/sessions"));proofLocation->setReadOnly(true);filesLayout->addWidget(proofLocation);
    auto *openProof=new QPushButton("Open proof folder");filesLayout->addWidget(openProof);QObject::connect(openProof,&QPushButton::clicked,[]{QString folder=sessionId.isEmpty()?root+"/sessions":root+"/sessions/"+sessionId+"/proof";QDir().mkpath(folder);QDesktopServices::openUrl(QUrl::fromLocalFile(folder));});
    auto *proofHelp=new QLabel("Each recording has a folder containing its photos and signed proof.");proofHelp->setWordWrap(true);filesLayout->addWidget(proofHelp);
    SessionSummary::index(root);auto *browseSessions=new QPushButton("Browse recordings and proofs");layout->addWidget(browseSessions);QObject::connect(browseSessions,&QPushButton::clicked,[]{SessionSummary::index(root);QDesktopServices::openUrl(QUrl::fromLocalFile(root+"/sessions/Sessions.html"));});
    auto *addresses=new QComboBox();for(const auto &nic:QNetworkInterface::allInterfaces())if(nic.flags().testFlag(QNetworkInterface::IsUp)&&!nic.flags().testFlag(QNetworkInterface::IsLoopBack))for(const auto &entry:nic.addressEntries())if(entry.ip().protocol()==QAbstractSocket::IPv4Protocol&&!entry.ip().toString().startsWith("169.254."))addresses->addItem(nic.humanReadableName()+" — "+entry.ip().toString(),entry.ip().toString());
    if(addresses->count()==0)addresses->addItem("No LAN address — connect to Wi-Fi or Ethernet","127.0.0.1");networkLayout->addWidget(new QLabel("Use the same Wi-Fi or local network as your phone."));networkLayout->addWidget(addresses);networkLayout->addStretch();pairImage->setAlignment(Qt::AlignCenter);layout->addWidget(label);auto *pairHelp=new QLabel("Open CLAPPA on your phone and scan this code to connect.");pairHelp->setWordWrap(true);pairHelp->hide();layout->addWidget(pairImage);
    QFile::remove(root+"/obs-state.json");QFile::remove(root+"/pairing.png");QFile::remove(root+"/pairing.json");service=std::make_unique<NativeService>(root);service->setAddress(addresses->currentData().toString());QObject::connect(addresses,&QComboBox::currentIndexChanged,[addresses](int){if(service)service->setAddress(addresses->currentData().toString());});
    pairButton=new QPushButton("Pair another phone / reconnect");pairButton->setToolTip("Your paired phone reconnects automatically. Use a new code when changing the pairing; stop recording first. Existing proofs are kept.");layout->addWidget(pairButton);QObject::connect(pairButton,&QPushButton::clicked,[addresses]{if(obs_frontend_recording_active()||obs_frontend_streaming_active())return;service.reset();recordChain.reset();streamChain.reset();sessionId.clear();recordingId.clear();mediaPath.clear();closed=false;QFile::remove(root+"/obs-state.json");QFile::remove(root+"/tile.json");QFile::remove(root+"/command.json");service=std::make_unique<NativeService>(root);service->setAddress(addresses->currentData().toString());});
    auto *trust=new QLineEdit(read(root+"/trusted-phone.json")["key_id"].toString());trust->setPlaceholderText("Identity code from your phone (optional)");identityCode=new QLineEdit();identityCode->setReadOnly(true);identityCode->setPlaceholderText("Connect a phone to see its public code");identityLayout->addWidget(new QLabel("Connected phone’s public identity"));identityLayout->addWidget(identityCode);auto *copyIdentity=new QPushButton("Copy public code");copyPublic=copyIdentity;copyIdentity->setEnabled(false);identityLayout->addWidget(copyIdentity);QObject::connect(copyIdentity,&QPushButton::clicked,[]{if(identityCode&&!identityCode->text().isEmpty())QApplication::clipboard()->setText(identityCode->text());});identityLayout->addWidget(new QLabel("Only allow a specific identity (optional)"));identityLayout->addWidget(trust);auto *help=new QLabel("Leave this empty for normal pairing. Enter a public code to accept only that identity. Private backups belong on your phone.");help->setWordWrap(true);identityLayout->addWidget(help);
    auto *trustResult=new QLabel();trustResult->setWordWrap(true);identityLayout->addWidget(trustResult);
    auto applyTrust=[trust,trustResult]{if((service&&service->paired())||obs_frontend_recording_active()||obs_frontend_streaming_active()){trustResult->setText("Stop recording and broadcasting, choose Pair another phone / reconnect, then apply this rule before scanning.");return;}auto id=trust->text().trimmed().toLower();if(!id.isEmpty()&&!QRegularExpression("^[a-f0-9]{64}$").match(id).hasMatch()){trustResult->setText("Enter the 64-character public-key fingerprint from the phone.");return;}save(root+"/trusted-phone.json",{{"key_id",id}});trustResult->setText(id.isEmpty()?"Any identity can pair with a new code.":"Only this phone identity will be accepted on pairing.");};
    auto *trustSave=new QPushButton("Apply pairing rule");identityLayout->addWidget(trustSave);QObject::connect(trustSave,&QPushButton::clicked,applyTrust);
    auto *trustImport=new QPushButton("Choose public identity file…");identityLayout->addWidget(trustImport);QObject::connect(trustImport,&QPushButton::clicked,[dock,trust,trustResult,applyTrust]{auto path=QFileDialog::getOpenFileName(dock,"Import public signing identity",{},"Public key (*.json)");if(path.isEmpty())return;auto record=read(path);auto bytes=QByteArray::fromBase64(record["spki"].toString().toLatin1(),QByteArray::Base64UrlEncoding);auto fingerprint=QString::fromLatin1(QCryptographicHash::hash(bytes,QCryptographicHash::Sha256).toHex());if(bytes.isEmpty()||fingerprint!=record["key_id"].toString()||record["algorithm"]!="ES256-P1363"){trustResult->setText("Invalid public-key record. Never import a private key into OBS.");return;}trust->setText(fingerprint);applyTrust();});
    auto *chatLayout=page("Twitch chat");auto *chatDialog=chatLayout->parentWidget();
    twitchPanel=makeTwitchChatPanel(chatDialog,[]{return !shuttingDown&&service&&service->notifyChatRequest();});chatLayout->addWidget(twitchPanel);
    identityLayout->addStretch();filesLayout->addStretch();layout->removeWidget(settingsButton);layout->addWidget(settingsButton);layout->addStretch();
    dockWidget=dock;obs_frontend_add_dock_by_id("clappa-dock","CLAPPA",dock);obs_frontend_add_event_callback(frontend,nullptr);
    obs_source_info info={};info.id="clappa-proof-tile";info.type=OBS_SOURCE_TYPE_INPUT;info.output_flags=OBS_SOURCE_VIDEO;info.get_name=tileName;info.create=tileCreate;info.destroy=tileDestroy;info.video_tick=tileTick;info.video_render=tileRender;info.get_width=[](void *d){return static_cast<Tile*>(d)->width;};info.get_height=[](void *d){return static_cast<Tile*>(d)->height;};obs_register_source(&info);
    timer=new QTimer(dock);QObject::connect(timer,&QTimer::timeout,poll);timer->start(50);
#ifdef CLAPPA_UI_REVIEW
    if(qEnvironmentVariable("CLAPPA_TEST_PORT")=="17444")QTimer::singleShot(2000,dock,[dock,settingsDialog,tabs]{
     const auto folder=qEnvironmentVariable("CLAPPA_UI_REVIEW_DIR");if(folder.isEmpty())return;QDir().mkpath(folder);
     dock->resize(360,620);dock->grab().save(folder+"/obs-dock.png");settingsDialog->ensurePolished();settingsDialog->resize(520,620);
     for(int i=0;i<tabs->count();i++){tabs->setCurrentIndex(i);settingsDialog->layout()->activate();settingsDialog->grab().save(folder+QString("/obs-settings-%1.png").arg(i));}
    });
#endif
    return true;
}
void obs_module_unload(void){
    const bool exiting=shuttingDown;
    shutdownPlugin();
    obs_frontend_remove_event_callback(frontend,nullptr);
    // During normal exit OBS owns dock destruction and has already torn down
    // the frontend before unloading modules. Only remove it on a live unload.
    if(!exiting&&dockWidget)obs_frontend_remove_dock("clappa-dock");
    timer.clear();pairButton.clear();rootEdit.clear();label.clear();pairImage.clear();dockWidget.clear();
}





