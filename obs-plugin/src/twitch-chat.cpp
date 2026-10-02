#include "twitch-chat.h"
#include "chat-votes.h"
#include "twitch-device-auth.h"
#include <QSslSocket>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QTimer>
#include <QElapsedTimer>
#include <QGroupBox>
#include <QLabel>
#include <QLineEdit>
#include <QPushButton>
#include <QVBoxLayout>
#include <QDesktopServices>
#include <QPointer>

class TwitchChatPanel final: public QGroupBox {
    QSslSocket socket; QNetworkAccessManager network; QTimer heartbeat,validateTimer;
    QElapsedTimer clock; qint64 lastInput=0; ChatVotes votes;
    QLineEdit *channelEdit,*tokenEdit; QLabel *status; QPushButton *button,*signIn; TwitchDeviceAuth *auth=nullptr;
    QByteArray token,buffer; QString channel,login; bool active=false,joined=false;
    int generation=0; std::function<bool()> request;
    void stop(const QString &why){
        if(auth)auth->cancel();signIn->setEnabled(true);active=false;joined=false;++generation;heartbeat.stop();validateTimer.stop();socket.abort();
        token.fill(0);token.clear();tokenEdit->clear();buffer.clear();votes.clear();
        channelEdit->setEnabled(true);tokenEdit->setEnabled(true);button->setText("Connect with token");button->setVisible(tokenEdit->isVisible());status->setText(why);
    }
    void validate(bool first){
        QNetworkRequest r(QUrl("https://id.twitch.tv/oauth2/validate"));
        r.setRawHeader("Authorization","OAuth "+token);r.setTransferTimeout(10000);
        r.setAttribute(QNetworkRequest::RedirectPolicyAttribute,QNetworkRequest::ManualRedirectPolicy);
        auto *reply=network.get(r);const int version=generation;
        QObject::connect(reply,&QNetworkReply::finished,this,[this,reply,version,first]{
            const auto code=reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
            const auto data=QJsonDocument::fromJson(reply->readAll()).object();reply->deleteLater();
            if(!active||generation!=version)return;
            if(code!=200||!data["scopes"].toArray().contains("chat:read")||data["expires_in"].toInt()<60){stop("Chat permission expired or lacks read access. Connect with a fresh read-only token.");return;}
            const auto name=data["login"].toString();
            if(!QRegularExpression("^[a-z0-9_]{1,25}$").match(name).hasMatch()||(!first&&name!=login)){stop("Chat account could not be confirmed.");return;}
            login=name;
            if(first){status->setText("Connecting securely to Twitch…");lastInput=clock.elapsed();socket.connectToHostEncrypted("irc.chat.twitch.tv",6697);heartbeat.start(1000);validateTimer.start(3600000);}
        });
    }
    void receive(){
        buffer+=socket.readAll();if(buffer.size()>65536){stop("Chat input exceeded its safety limit. Reconnect chat.");return;}
        lastInput=clock.elapsed();
        for(int at;(at=buffer.indexOf("\r\n"))>=0;){
            const auto raw=buffer.left(at);buffer.remove(0,at+2);if(raw.size()>8192)continue;
            auto line=QString::fromUtf8(raw);
            const auto parsed=parseChatCommand(line);
            if(parsed.command=="PING"&&(parsed.prefix.isEmpty()||parsed.server())){socket.write("PONG :"+parsed.trailing.toUtf8()+"\r\n");continue;}
            if(parsed.server()&&parsed.command=="RECONNECT"){stop("Twitch requested a reconnect. Connect chat again.");return;}
            if(parsed.server()&&(parsed.command=="NOTICE"||(parsed.command=="CAP"&&parsed.params.value(1)=="NAK"))){stop("Twitch could not join chat. Check the channel and read permission, then reconnect.");return;}
            if(parsed.server()&&parsed.command=="001"&&parsed.params.value(0)==login)socket.write("JOIN #"+channel.toUtf8()+"\r\n");
            if(parsed.server()&&((parsed.command=="ROOMSTATE"&&parsed.params.value(0)=="#"+channel)||(parsed.command=="366"&&parsed.params.value(0)==login&&parsed.params.value(1)=="#"+channel))){joined=true;status->setText("Listening in #"+channel+" · 3 viewers sending 🎬 within 15 seconds request a challenge. Two-minute cooldown.");}
            if(joined&&votes.ingest(line,channel,clock.elapsed()))status->setText(request()?"Chat request sent to your phone. You decide whether to accept.":"Chat requested a challenge; the phone is not ready. Waiting for the next vote after cooldown.");
        }
    }
public:
    TwitchChatPanel(QWidget *parent,std::function<bool()> callback):QGroupBox("Twitch audience challenges (optional)",parent),request(std::move(callback)){
        clock.start();auto *layout=new QVBoxLayout(this);
        auto *help=new QLabel("Let chat ask for a clap! Three viewers sending 🎬 buzz your phone. You choose when to answer.");help->setWordWrap(true);layout->addWidget(help);
        channelEdit=new QLineEdit;channelEdit->setPlaceholderText("Twitch channel name");channelEdit->setMaxLength(25);layout->addWidget(channelEdit);
        signIn=new QPushButton("Connect with Twitch");layout->addWidget(signIn);
        tokenEdit=new QLineEdit;tokenEdit->setEchoMode(QLineEdit::Password);tokenEdit->setMaxLength(2048);tokenEdit->setPlaceholderText("Read-only token (advanced)");layout->addWidget(tokenEdit);tokenEdit->hide();
        auto *privacy=new QLabel("Read-only access. Sign in again when you reopen OBS.");privacy->setWordWrap(true);layout->addWidget(privacy);
        auto *instructions=new QPushButton("Advanced token setup…");layout->addWidget(instructions);QObject::connect(instructions,&QPushButton::clicked,this,[this]{tokenEdit->setVisible(!tokenEdit->isVisible());button->setVisible(active||tokenEdit->isVisible());});
        button=new QPushButton("Connect with token");layout->addWidget(button);button->hide();status=new QLabel("Chat is off.");status->setWordWrap(true);layout->addWidget(status);
        QObject::connect(button,&QPushButton::clicked,this,[this]{
            if(active){stop("Chat is off. Access token forgotten.");return;}
            channel=channelEdit->text().trimmed().toLower();if(channel.startsWith('#'))channel.remove(0,1);
            auto entered=tokenEdit->text().trimmed();if(entered.startsWith("oauth:"))entered.remove(0,6);
            if(!QRegularExpression("^[a-z0-9_]{1,25}$").match(channel).hasMatch()||!QRegularExpression("^[A-Za-z0-9]{10,2048}$").match(entered).hasMatch()){status->setText("Enter a channel name and a valid Twitch access token.");return;}
            token=entered.toLatin1();tokenEdit->clear();signIn->setEnabled(false);active=true;++generation;votes.clear();channelEdit->setEnabled(false);tokenEdit->setEnabled(false);button->setText("Disconnect chat");status->setText("Checking Twitch read permission…");validate(true);
        });
        auth=new TwitchDeviceAuth(this,[this](QString code,QString url){status->setText("Approve Twitch access in your browser. Code: "+code);QDesktopServices::openUrl(QUrl(url));},[this](QByteArray value){token=std::move(value);status->setText("Checking chat permission…");validate(true);},[this](QString error){stop(error);});
        QObject::connect(signIn,&QPushButton::clicked,this,[this]{
            channel=channelEdit->text().trimmed().toLower();if(channel.startsWith('#'))channel.remove(0,1);
            if(!QRegularExpression("^[a-z0-9_]{1,25}$").match(channel).hasMatch()){status->setText("Enter the Twitch channel to listen to.");return;}
            active=true;++generation;votes.clear();channelEdit->setEnabled(false);tokenEdit->setEnabled(false);signIn->setEnabled(false);button->show();button->setText("Cancel / disconnect");status->setText("Opening Twitch sign-in…");auth->start();
        });
        QObject::connect(&socket,&QSslSocket::encrypted,this,[this]{socket.write("PASS oauth:"+token+"\r\nNICK "+login.toUtf8()+"\r\nCAP REQ :twitch.tv/tags twitch.tv/commands\r\n");});
        QObject::connect(&socket,&QSslSocket::readyRead,this,[this]{receive();});
        QObject::connect(&socket,&QSslSocket::errorOccurred,this,[this](QAbstractSocket::SocketError){if(active)stop("Twitch connection failed. Check your network and reconnect chat.");});
        QObject::connect(&socket,&QSslSocket::sslErrors,this,[this](const QList<QSslError>&){if(active)stop("Twitch TLS verification failed. Chat was disconnected.");});
        QObject::connect(&socket,&QSslSocket::disconnected,this,[this]{if(active)stop("Twitch disconnected. Connect chat again when ready.");});
        QObject::connect(&heartbeat,&QTimer::timeout,this,[this]{if(active&&clock.elapsed()-lastInput>(joined?360000:20000))stop("Twitch chat timed out. Connect chat again.");});
        QObject::connect(&validateTimer,&QTimer::timeout,this,[this]{if(active)validate(false);});
    }
    ~TwitchChatPanel()override{stop("Chat is off.");}
};
QWidget *makeTwitchChatPanel(QWidget *parent,std::function<bool()> request){return new TwitchChatPanel(parent,std::move(request));}

