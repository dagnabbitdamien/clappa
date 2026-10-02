#include "qr-transport.h"
#include "prompts.h"
#include "freshness.h"
#include "dual-view.h"
#define CPPHTTPLIB_MBEDTLS_SUPPORT
#define CPPHTTPLIB_DISABLE_WINDOWS_AUTOMATIC_ROOT_CERTIFICATES_UPDATE
#include "httplib.h"
#include "native-service.h"
#include "json.hpp"
#include "qrcodegen.hpp"
#include <mbedtls/entropy.h>
#include <mbedtls/ctr_drbg.h>
#include <mbedtls/pk.h>
#include <mbedtls/x509_crt.h>
#include <mbedtls/ecdsa.h>
#include <zlib.h>
#include <QCryptographicHash>
#include <QDateTime>
#include <QDir>
#include <QFile>
#include <QSaveFile>
#include <QImageReader>
#include <QPainter>
#include "board-art.h"
#include "twitch-identity.h"
#include <QBuffer>
#include <QUuid>
#include <deque>
#include <mutex>
#include <thread>
#include <set>
#include <regex>
using J=nlohmann::json;
namespace {
void need(bool b,const char *s){if(!b)throw std::runtime_error(s);}
QByteArray bytes(const std::string &s){return QByteArray(s.data(),int(s.size()));}
std::string hash(const QByteArray &b){return QCryptographicHash::hash(b,QCryptographicHash::Sha256).toHex().toStdString();}
std::string b64(const QByteArray &b){return b.toBase64(QByteArray::Base64UrlEncoding|QByteArray::OmitTrailingEquals).toStdString();}
QByteArray un64(const J &v){auto s=v.get<std::string>();auto b=QByteArray::fromBase64(bytes(s),QByteArray::Base64UrlEncoding);need(b64(b)==s,"Invalid base64url");return b;}
J parse(const QByteArray &b){std::vector<std::set<std::string>> keys;return J::parse(b.constData(),b.constData()+b.size(),[&](int depth,J::parse_event_t e,J &v){need(depth<64,"JSON nesting limit");if(e==J::parse_event_t::object_start)keys.emplace_back();if(e==J::parse_event_t::key)need(keys.back().insert(v.get<std::string>()).second,"Duplicate JSON key");if(e==J::parse_event_t::object_end)keys.pop_back();return true;});}
J read(const QString &f){QFile q(f);need(q.open(QIODevice::ReadOnly),"Cannot read local proof");return parse(q.readAll());}
void write(const QString &f,const QByteArray &b){QDir().mkpath(QFileInfo(f).absolutePath());QSaveFile q(f);need(q.open(QIODevice::WriteOnly)&&q.write(b)==b.size()&&q.commit(),"Cannot save local proof");}
void save(const QString &f,const J &j){write(f,bytes(j.dump()));}
const J schema=J::parse(
#include "schema.inc"
);
bool valid(const J &s,const J &v){
 if(s.contains("$ref"))return valid(schema.at(J::json_pointer(s["$ref"].get<std::string>().substr(1))),v);
 if(s.contains("const")&&s["const"]!=v)return false;
 if(s.contains("enum")){bool ok=false;for(auto &e:s["enum"])ok|=e==v;if(!ok)return false;}
 for(auto key:{"oneOf","anyOf"})if(s.contains(key)){int n=0;for(auto &x:s[key])n+=valid(x,v);if(n<1||(std::string(key)=="oneOf"&&n!=1))return false;}
 if(s.contains("type")){std::string t=s["type"];if(t=="object"){if(!v.is_object())return false;for(auto &k:s.value("required",J::array()))if(!v.contains(k.get<std::string>()))return false;auto props=s.value("properties",J::object());for(auto it=v.begin();it!=v.end();++it){if(!props.contains(it.key())){if(s.value("additionalProperties",true)==false)return false;}else if(!valid(props[it.key()],it.value()))return false;}}
 else if(t=="array"){if(!v.is_array()||v.size()<s.value("minItems",0)||v.size()>s.value("maxItems",100000))return false;for(auto &x:v)if(!valid(s["items"],x))return false;}
 else if(t=="string"){if(!v.is_string())return false;auto x=v.get<std::string>();if(x.size()>s.value("maxLength",100000000))return false;if(s.contains("pattern")&&!std::regex_search(x,std::regex(s["pattern"].get<std::string>())))return false;}
 else if(t=="integer"){if(!v.is_number_integer()||v.get<double>()<s.value("minimum",0.0)||v.get<double>()>s.value("maximum",9007199254740991.0))return false;}
 else if(t=="boolean"&&!v.is_boolean())return false;else if(t=="null"&&!v.is_null())return false;
 }return true;
}
void validate(const char *kind,const J &j){need(valid(schema["definitions"][kind],j),"Invalid protocol fields");}
QImage qr(const std::string &s,int pixels){auto q=qrcodegen::QrCode::encodeText(s.c_str(),qrcodegen::QrCode::Ecc::MEDIUM);const int n=q.getSize(),scale=std::max(1,pixels/(n+8));QImage im((n+8)*scale,(n+8)*scale,QImage::Format_RGB32);im.fill(Qt::white);QPainter p(&im);p.setPen(Qt::NoPen);p.setBrush(Qt::black);for(int y=0;y<n;y++)for(int x=0;x<n;x++)if(q.getModule(x,y))p.drawRect((x+4)*scale,(y+4)*scale,scale,scale);return im;}
std::string fileHash(const QString &f){QFile q(f);need(q.open(QIODevice::ReadOnly),"Recording cannot be read");QCryptographicHash h(QCryptographicHash::Sha256);need(h.addData(&q),"Recording hash failed");return h.result().toHex().toStdString();}
}
struct NativeService::Impl {
 TwitchIdentityVerifier twitchVerifier;std::set<std::string> shownIdentities;
 QString root,message="Starting encrypted pairing…";int port=qEnvironmentVariableIntValue("CLAPPA_TEST_PORT")?qEnvironmentVariableIntValue("CLAPPA_TEST_PORT"):17443;std::string token,pin,address;std::unique_ptr<httplib::SSLServer> server;std::thread thread;
 std::mutex mutex;std::deque<J> incoming;J outbound=J::array();long long next=0;bool connected=false,fault=false,ended=false,finalized=false,announced=false;std::string sid,head,lastType;int count=0;long long lastAt=0,successAt=0,lastPoll=0;J pub,state,pending,sealRequest,issuedEvent;bool startOK=false,endOK=false,timedSession=false;std::string lastChallenge,lastPrompt;bool closedNotified=false;std::set<std::string> ids;J latestOutputs,armedEvent;bool freshSession=false,armPending=false;std::string cameraProfile,captureProfile;bool tolerantSession=false;long long claimWindow=6000;
 std::vector<QString> frames;int frame=0;long long tileEnd=0,renderBefore=0,lastTick=0,frameTick=0;bool stopPending=false;
 mbedtls_entropy_context entropy;mbedtls_ctr_drbg_context rng;mbedtls_pk_context key;
 explicit Impl(QString r):root(r){mbedtls_entropy_init(&entropy);mbedtls_ctr_drbg_init(&rng);mbedtls_pk_init(&key);}
 ~Impl(){if(server)server->stop();if(thread.joinable())thread.join();mbedtls_pk_free(&key);mbedtls_ctr_drbg_free(&rng);mbedtls_entropy_free(&entropy);}
 void send(J j){std::lock_guard<std::mutex> l(mutex);need(outbound.size()<512,"Phone is not receiving messages");outbound.push_back({{"id",++next},{"message",j}});}
 void error(const std::string &s){fault=true;message="Incomplete: "+QString::fromStdString(s);try{send({{"type","error"},{"message",s},{"recording",!state.is_null()&&!state.value("closed",true)}});}catch(...){} }
 void resetSession(){fault=false;ended=false;finalized=false;announced=false;closedNotified=false;sid.clear();head.clear();lastType.clear();count=0;lastAt=0;successAt=0;pending=nullptr;sealRequest=nullptr;startOK=false;endOK=false;timedSession=false;tolerantSession=false;claimWindow=6000;freshSession=false;armPending=false;armedEvent=nullptr;captureProfile.clear();lastChallenge.clear();lastPrompt.clear();ids.clear();latestOutputs=nullptr;stopPending=false;}
 void init(){
  need(mbedtls_ctr_drbg_seed(&rng,mbedtls_entropy_func,&entropy,(const unsigned char*)"CLAPPA",6)==0,"Random generator failed");
  unsigned char random[32];need(mbedtls_ctr_drbg_random(&rng,random,32)==0,"Random failed");token=b64(QByteArray((char*)random,32));
  mbedtls_pk_context tlskey;mbedtls_pk_init(&tlskey);mbedtls_x509write_cert cert;mbedtls_x509write_crt_init(&cert);
  need(mbedtls_pk_setup(&tlskey,mbedtls_pk_info_from_type(MBEDTLS_PK_ECKEY))==0,"TLS key setup failed");need(mbedtls_ecp_gen_key(MBEDTLS_ECP_DP_SECP256R1,mbedtls_pk_ec(tlskey),mbedtls_ctr_drbg_random,&rng)==0,"TLS key failed");
  mbedtls_x509write_crt_set_version(&cert,MBEDTLS_X509_CRT_VERSION_3);mbedtls_x509write_crt_set_md_alg(&cert,MBEDTLS_MD_SHA256);mbedtls_x509write_crt_set_subject_key(&cert,&tlskey);mbedtls_x509write_crt_set_issuer_key(&cert,&tlskey);
  need(mbedtls_x509write_crt_set_subject_name(&cert,"CN=CLAPPA OBS") ==0&&mbedtls_x509write_crt_set_issuer_name(&cert,"CN=CLAPPA OBS")==0,"TLS certificate name failed");
  auto from=QDateTime::currentDateTimeUtc().addDays(-1).toString("yyyyMMddHHmmss").toLatin1(),to=QDateTime::currentDateTimeUtc().addDays(7).toString("yyyyMMddHHmmss").toLatin1();
  need(mbedtls_x509write_crt_set_validity(&cert,from.constData(),to.constData())==0,"TLS dates failed");random[0]&=0x7f;need(mbedtls_x509write_crt_set_serial_raw(&cert,random,16)==0,"TLS serial failed");
  unsigned char cp[4096]{},kp[2048]{};need(mbedtls_x509write_crt_pem(&cert,cp,sizeof(cp),mbedtls_ctr_drbg_random,&rng)==0&&mbedtls_pk_write_key_pem(&tlskey,kp,sizeof(kp))==0,"TLS encoding failed");
  mbedtls_x509_crt parsed;mbedtls_x509_crt_init(&parsed);need(mbedtls_x509_crt_parse(&parsed,cp,strlen((char*)cp)+1)==0,"TLS parse failed");pin=hash(QByteArray((char*)parsed.raw.p,parsed.raw.len));mbedtls_x509_crt_free(&parsed);mbedtls_x509write_crt_free(&cert);mbedtls_pk_free(&tlskey);
  httplib::SSLServer::PemMemory pem{};pem.cert_pem=(char*)cp;pem.cert_pem_len=strlen((char*)cp)+1;pem.key_pem=(char*)kp;pem.key_pem_len=strlen((char*)kp)+1;server=std::make_unique<httplib::SSLServer>(pem);
  // The bundled Mbed TLS build has no threading abstraction: TLS 1.3 shares
  // PSA state and the server configuration shares its RNG/key. Confine all
  // handshakes and records to one worker. Close each response so an idle poll
  // connection cannot monopolize that worker and starve a photo upload.
  server->new_task_queue=[] {return new httplib::ThreadPool(1,1,16);};
  server->set_keep_alive_max_count(1);
  server->set_payload_max_length(110*1024*1024);server->set_read_timeout(10);server->set_write_timeout(10);
  auto auth=[this](const httplib::Request &r){auto a=r.get_header_value("Authorization"),expected="Bearer "+token;unsigned diff=unsigned(a.size()^expected.size());for(size_t i=0;i<std::min(a.size(),expected.size());i++)diff|=a[i]^expected[i];return diff==0;};
  server->Post("/message",[this,auth](const httplib::Request &r,httplib::Response &out){if(!auth(r)){out.status=401;return;}try{auto m=parse(bytes(r.body));std::lock_guard<std::mutex> l(mutex);need(incoming.size()<16,"Incoming queue full");incoming.push_back(std::move(m));out.set_content("{}","application/json");}catch(...){out.status=400;}});
  server->Get("/poll",[this,auth](const httplib::Request &r,httplib::Response &out){if(!auth(r)){out.status=401;return;}try{auto after=std::stoll(r.get_param_value("after"));std::lock_guard<std::mutex> l(mutex);need(after>=0&&after<=next,"Invalid acknowledgment");while(!outbound.empty()&&outbound[0]["id"].get<long long>()<=after)outbound.erase(outbound.begin());lastPoll=QDateTime::currentMSecsSinceEpoch();out.set_content(outbound.dump(),"application/json");}catch(...){out.status=400;}});
  need(server->is_valid(),"Encrypted listener setup failed");need(server->bind_to_port("0.0.0.0",port),"Port 17443 is busy. Close the old local companion, then restart OBS.");thread=std::thread([this]{server->listen_after_bind();});message="Scan this QR in CLAPPA on your phone";
 }
 QString folder()const{return root+"/sessions/"+QString::fromStdString(sid)+"/proof";}
 void signature(const J &e){auto sig=un64(e.at("signature"));need(sig.size()==64,"Signature length");auto half=QByteArray::fromHex("7fffffff800000007fffffffffffffffde737d56d38bcf4279dce5617e3192a8");need(sig.mid(32)<=half,"Noncanonical signature");
  auto integer=[](QByteArray a){while(a.size()>1&&a[0]==0)a.remove(0,1);if((unsigned char)a[0]&128)a.prepend(char(0));return QByteArray(1,char(2))+QByteArray(1,char(a.size()))+a;};auto body=integer(sig.left(32))+integer(sig.mid(32));auto der=QByteArray(1,char(0x30))+QByteArray(1,char(body.size()))+body;auto digest=QCryptographicHash::hash(bytes(e.at("payload").dump()),QCryptographicHash::Sha256);
  need(mbedtls_pk_verify(&key,MBEDTLS_MD_SHA256,(unsigned char*)digest.data(),digest.size(),(unsigned char*)der.data(),der.size())==0,"Phone signature mismatch");
 }
 void outputs(const J &o){need(o.size()==state["outputs"].size(),"Output coverage missing");std::set<std::string> seen;for(auto &x:o){need(x["complete"]==true,"Incomplete packet coverage");auto id=x["output_id"].get<std::string>();need(seen.insert(id).second,"Duplicate output");bool found=false;for(auto &actual:state["outputs"])if(actual["output_id"]==x["output_id"]){found=true;need(actual["role"]==x["role"]&&x["packets"]<=actual["packets"]&&x["bytes"]<=actual["bytes"],"Unknown media checkpoint");}need(found,"Unknown output");for(auto &old:latestOutputs)if(old["output_id"]==x["output_id"])need(x["packets"]>=old["packets"]&&x["bytes"]>=old["bytes"]&&(x["packets"]!=old["packets"]||x==old),"Checkpoint regression or conflicting head");}latestOutputs=o;}
 void showArm(const J &e,long long target){auto digest=hash(bytes(e.dump()));auto text="CLAPPA-ARM1:"+digest+":"+std::to_string(e["payload"]["data"]["round"].get<long long>());auto image=BoardArt::arming(qr(text,292),QString::fromStdString(digest.substr(0,12)),target);auto name=root+"/armed-"+QString::number(count)+".png";need(image.save(name),"Cannot display locked challenge");tileEnd=target+20000;save(root+"/tile.json",{{"path",name.toStdString()},{"frames",J::array({name.toStdString()})},{"flash_path",""},{"until",tileEnd}});}
 void tile(const J &e,const J &images,const J &context,const J &identity){auto d=e["payload"]["data"];bool claim=e["payload"]["type"]=="claim";J pairs=claim?J::array({d["photo"]}):J::array({d["photo_a"],d["photo_b"]});J photos=J::array();if(!freshSession)for(auto &p:pairs)photos.push_back(images.at(p["proof"]["path"].get<std::string>()));
  J envelope={{"event",e},{"key",pub},{"photos",photos},{"context",context}};QString twitchName;std::string identityDigest;
  if(!identity.is_null()){
   auto binding=identity.at("binding"),v=binding.at("payload");need(identity.is_object()&&identity.size()==2&&binding.size()==2&&v.size()==6&&v.at("profile")=="CLAPPA-TWITCH-BINDING-v1"&&v.at("algorithm")=="ES256-P1363"&&v.at("key_id")==pub.at("key_id")&&v.at("session_id")==sid&&v.at("event_sha256")==hash(bytes(e.dump())),"Wrong Twitch identity binding");signature(binding);
   identityDigest=hash(bytes(identity.at("evidence").dump()));need(v.at("identity_sha256")==identityDigest,"Wrong Twitch evidence digest");
   save(folder()+QString("/identities/%1.json").arg(count,6,10,QChar('0')),identity);twitchName=twitchVerifier.verifiedName(identity.at("evidence"),pub.at("key_id"));
   envelope["identity"]=identity;if(shownIdentities.count(sid+identityDigest))envelope["identity"].erase("evidence");
  }
  auto raw=bytes(envelope.dump());QByteArray compressed(16384,0);z_stream z{};need(deflateInit2(&z,9,Z_DEFLATED,-15,8,Z_DEFAULT_STRATEGY)==Z_OK,"QR compression setup");z.next_in=(Bytef*)raw.data();z.avail_in=raw.size();z.next_out=(Bytef*)compressed.data();z.avail_out=compressed.size();int result=deflate(&z,Z_FINISH);int size=int(z.total_out);deflateEnd(&z);need(result==Z_STREAM_END&&size<=8192,"Proof exceeds QR budget");compressed.resize(size);
  QImageReader reader(folder()+"/"+QString::fromStdString(pairs[0]["original"]["path"]));reader.setAutoTransform(true);if(reader.size().isValid())reader.setScaledSize(reader.size().scaled(1348,984,Qt::KeepAspectRatio));auto photo=reader.read();need(!photo.isNull(),"Photo cannot be displayed");bool dual=!claim&&d.contains("dual");auto rearPhoto=[&](const char *which){QImageReader r(folder()+"/"+QString::fromStdString(d["dual"][which]["original"]["path"]));r.setAutoTransform(true);if(r.size().isValid())r.setScaledSize(r.size().scaled(1348,984,Qt::KeepAspectRatio));auto image=r.read();need(!image.isNull(),"Rear photo cannot be displayed");return image;};if(dual)photo=BoardArt::dualPhoto(photo,rearPhoto("rear_a"));frames.clear();const int n=(size+199)/200;
  std::vector<std::string> texts;int version=12;
  const auto digest=QByteArray::fromHex(QByteArray::fromStdString(hash(compressed)));
  for(int i=0;i<n;i++){texts.push_back(compactQrFrame(digest,i,n,compressed.mid(i*200,200)));version=std::max(version,qrcodegen::QrCode::encodeText(texts.back().c_str(),qrcodegen::QrCode::Ecc::MEDIUM).getVersion());}
  for(int i=0;i<n;i++){
   auto q=qrcodegen::QrCode::encodeSegments(qrcodegen::QrSegment::makeSegments(texts[i].c_str()),qrcodegen::QrCode::Ecc::MEDIUM,version,version,-1,false);
   need(version==12,"QR profile exceeds its fixed grid");const int cells=q.getSize()+8,scale=12;QImage code(cells*scale,cells*scale,QImage::Format_RGB32);code.fill(Qt::white);QPainter painter(&code);
   for(int y=0;y<q.getSize();y++)for(int x=0;x<q.getSize();x++)if(q.getModule(x,y))painter.fillRect((x+4)*scale,(y+4)*scale,scale,scale,Qt::black);painter.end();
   auto im=BoardArt::proof(photo,code,freshSession?issuedEvent["payload"]["data"]["freshness"]["pulse"]["at"].get<long long>():d[claim?"captured_at":"a_at"].get<long long>(),claim?QStringLiteral("Your additional photo!"):promptText(lastPrompt,dual),freshSession,twitchName);auto name=root+QString("/native-tile-%1-%2.png").arg(count).arg(i);need(im.save(name),"Cannot save proof tile");frames.push_back(name);
  }
  QString flashPath;
  if(!claim){QImageReader flashReader(folder()+"/"+QString::fromStdString(pairs[1]["original"]["path"]));flashReader.setAutoTransform(true);if(flashReader.size().isValid())flashReader.setScaledSize(flashReader.size().scaled(1348,984,Qt::KeepAspectRatio));auto b=flashReader.read();need(!b.isNull(),"Flash photo cannot be displayed");if(dual)b=BoardArt::dualPhoto(b,rearPhoto("rear_b"));flashPath=root+QString("/native-flash-%1.png").arg(count);need(b.save(flashPath),"Cannot save flash preview");}
  tileEnd=QDateTime::currentMSecsSinceEpoch()+600+std::max(4500,n*480);renderBefore=state.value("tile_renders",0LL);
  J paths=J::array();for(auto &path:frames)paths.push_back(path.toStdString());save(root+"/tile.json",{{"path",frames.front().toStdString()},{"frames",paths},{"flash_path",flashPath.toStdString()},{"until",tileEnd}});
  if(!identityDigest.empty()){if(shownIdentities.size()>256)shownIdentities.clear();shownIdentities.insert(sid+identityDigest);}
 }
 void messageIn(const J &m){std::string type=m.at("type");if(type=="hello"){
   auto candidate=m.at("key");validate("key",candidate);auto spki=un64(candidate["spki"]);need(hash(spki)==candidate["key_id"],"Key fingerprint mismatch");
   if(!pub.is_null())need(candidate["key_id"]==pub["key_id"],"A different phone identity requires a new pairing code");
   bool interrupted=announced&&!finalized&&!state.value("closed",true);
   pub=candidate;
   if(QFile::exists(root+"/trusted-phone.json")){auto trusted=read(root+"/trusted-phone.json").value("key_id",std::string());need(trusted.empty()||trusted==pub["key_id"],"Phone identity does not match the trusted fingerprint in the OBS dock");}
   mbedtls_pk_free(&key);mbedtls_pk_init(&key);need(mbedtls_pk_parse_public_key(&key,(unsigned char*)spki.data(),spki.size())==0,"Invalid phone key");need(mbedtls_pk_can_do(&key,MBEDTLS_PK_ECDSA)&&mbedtls_pk_get_bitlen(&key)==256&&mbedtls_pk_ec(key)->MBEDTLS_PRIVATE(grp).id==MBEDTLS_ECP_DP_SECP256R1,"Unsupported phone key");connected=true;{std::lock_guard<std::mutex> l(mutex);outbound=J::array();lastPoll=QDateTime::currentMSecsSinceEpoch();}send({{"type","paired"},{"recording",!state.is_null()&&state.value("recording_active",false)}});if(interrupted){error("Phone reconnected during a recording. Stop this incomplete recording, then start another");return;}resetSession();message="Phone connected. Start recording to begin. Signing identity: "+QString::fromStdString(pub["key_id"]);return;
  }need(connected,"Phone is not connected");
  if(type=="start-recording"){need(state.is_null()||!state.value("recording_active",false),"OBS is already recording");save(root+"/command.json",{{"type","start"}});return;}
  if(type=="stop-incomplete"){need(!state.is_null()&&!state.value("closed",true),"No active recording");fault=true;save(root+"/command.json",{{"type","stop"},{"session_id",state["session_id"]}});return;}
  need(!fault,"This recording is incomplete. Stop it, then start another");
  if(type=="event"){auto e=m.at("event");validate("event",e);signature(e);auto p=e["payload"],d=p["data"];std::string t=p["type"];need(announced&&!ended&&p["session_id"]==sid&&p["key_id"]==pub["key_id"]&&p["seq"]==count&&p["prev"]==(count?J(head):J(nullptr))&&p["at"].get<long long>()>=lastAt,"Event chain disagreement");need((count==0)==(t=="session-start"),"Session start position");
   if(t=="session-start"&&m.value("twitch_identity_linked",false))twitchVerifier.refresh();
   if(t=="session-start"){tolerantSession=d.value("session_policy",std::string())=="CLAPPA-SESSION-v2";claimWindow=d.value("claim_window_ms",6000LL);need(tolerantSession==(claimWindow==30000),"Invalid session/claim policy");timedSession=d.value("response_profile",std::string())=="CLAPPA-RESPONSE-v1";freshSession=d.value("freshness_profile",std::string())=="CLAPPA-QUICKNET-v1";if(freshSession)cameraProfile=d.at("camera_profile");captureProfile=d.value("capture_profile",std::string());need(captureProfile.empty()||(freshSession&&tolerantSession&&cameraProfile=="front-only"),"Invalid dual session policy");}
   if(t=="session-start")need(d["outputs"]==state["descriptors"]&&d["recording_id"]==state["recording_id"],"Session output mismatch");
   else if(t=="output-checkpoint")outputs(d["outputs"]);
   else if(t=="challenge-armed"){need(d.value("capture_profile",std::string())==captureProfile&&d.at("camera_profile")==cameraProfile&&freshSession&&!armPending&&pending.is_null()&&!endOK,"Challenge already locked");auto target=Freshness::at(d["round"]);auto now=QDateTime::currentMSecsSinceEpoch();need(d["chain"]==Freshness::chain&&target>now+500&&target<now+15000&&p["at"].get<long long>()<target,"Target beacon must be future");need(d["obs"]["recording_id"]==state["recording_id"],"Recording mismatch");outputs(d["obs"]["outputs"]);armedEvent=e;armPending=true;}
   else if(t=="challenge-issued"){if(freshSession){need(armPending,"Challenge was not locked");Freshness::challenge(e,armedEvent);need(QDateTime::currentMSecsSinceEpoch()<=d["freshness"]["pulse"]["at"].get<long long>()+10000,"Beacon expired before issue");armPending=false;}else need(!d.contains("freshness")&&!d.contains("pitches")&&!d.contains("qr_profile"),"Freshness without session policy");need(!timedSession||d.value("response_window_ms",0)==10000,"Missing response deadline");need(!tolerantSession||d.value("pair_window_ms",0)==3000,"Missing signed photo pair window");need(pending.is_null()&&!endOK&&ids.insert(d["challenge_id"]).second,"Challenge ordering");need((d["phase"]=="start")?!startOK:startOK,"Bookend order");need(d["obs"]["recording_id"]==state["recording_id"],"Recording mismatch");if(!freshSession)outputs(d["obs"]["outputs"]);issuedEvent=e;pending=d;pending["at"]=p["at"];}
   else if(t=="challenge-captured"){DualView::validate(pending,d);need(!pending.is_null()&&d["challenge_id"]==pending["challenge_id"]&&d["a_at"]>=pending["at"]&&d["b_at"]>=d["a_at"]&&d["b_at"].get<long long>()-d["a_at"].get<long long>()<=pending.value("pair_window_ms",pending["flash"]=="led"?3000:1500)&&p["at"]>=d["b_at"],"Invalid two-photo response");if(pending.contains("response_window_ms")){
     need(d.contains("response_ms")&&d.contains("pair_ms"),"Missing capture timing");
     auto a=d["a_at"].get<long long>(),b=d["b_at"].get<long long>(),issued=pending["at"].get<long long>(),r=d["response_ms"].get<long long>(),gap=d["pair_ms"].get<long long>();
     need(a-issued<=10000&&r<=10000&&gap<=pending.value("pair_window_ms",pending["flash"]=="led"?3000:1500)&&std::abs(a-issued-r)<=250&&std::abs(b-a-gap)<=250,"Response deadline or clocks invalid");
    }else need(!d.contains("response_ms")&&!d.contains("pair_ms"),"Timing without policy");startOK|=pending["phase"]=="start";endOK|=pending["phase"]=="end";lastChallenge=d["challenge_id"];lastPrompt=pending["prompt_id"];successAt=p["at"];pending=nullptr;}
   else if(t=="claim")need(lastType=="challenge-captured"&&d["challenge_id"]==lastChallenge&&d["captured_at"].get<long long>()>=successAt&&d["captured_at"].get<long long>()<=successAt+claimWindow&&p["at"]>=d["captured_at"],"Claim window expired");
   else if(t=="challenge-failed"){need((!pending.is_null()&&d["challenge_id"]==pending["challenge_id"])||(armPending&&d["challenge_id"]==armedEvent["payload"]["data"]["challenge_id"]),"Unknown failed challenge");if(tolerantSession){auto phase=pending.is_null()?armedEvent["payload"]["data"]["phase"]:pending["phase"];startOK|=phase=="start";endOK|=phase=="end";pending=nullptr;successAt=0;message="Challenge not completed. Recording continues.";}armPending=false;}
   else if(t=="session-end")need((tolerantSession||startOK&&endOK)&&pending.is_null()&&!armPending,"Resolve pending challenges before ending");
   auto images=m.value("images",J::object());J refs=J::array();auto add=[&](J pair){refs.push_back(pair["original"]);refs.push_back(pair["proof"]);};if(t=="challenge-captured"){add(d["photo_a"]);add(d["photo_b"]);if(d.contains("dual")){add(d["dual"]["rear_a"]);add(d["dual"]["rear_b"]);}}if(t=="claim")add(d["photo"]);need(images.size()==refs.size(),"Unexpected image count");
   for(auto &r:refs){auto name=r["path"].get<std::string>();auto b=un64(images.at(name));need(b.size()==r["bytes"]&&hash(b)==r["sha256"]&&b.startsWith(QByteArray::fromHex("ffd8"))&&b.endsWith(QByteArray::fromHex("ffd9")),"Photo transfer mismatch");auto dest=folder()+"/"+QString::fromStdString(name);need(!QFile::exists(dest),"Photo filename reused");write(dest,b);}
   if(t=="challenge-captured"||t=="claim"){
    auto context=m.at("context");need(context.size()==(freshSession?3:2)&&context.at("challenge")==issuedEvent,"Wrong challenge context");if(freshSession)need(context.at("armed")==armedEvent,"Wrong locked commitment");auto proof=context.at("proof");validate("media-proof",proof);signature(proof);auto v=proof.at("payload");
    need(v["key_id"]==pub["key_id"]&&v["session_id"]==sid&&v["recording_id"]==state["recording_id"]&&v["event_sha256"]==hash(bytes(e.dump()))&&v["challenge_sha256"]==hash(bytes(issuedEvent.dump()))&&v["at"]>=p["at"]&&v["descriptors"]==state["descriptors"],"Media proof does not bind this recording and response");
    for(auto &o:v["outputs"])need(o["packets"].get<long long>()>0,"Empty media prefix");outputs(v["outputs"]);
    save(folder()+QString("/media-proofs/%1.json").arg(count,6,10,QChar('0')),context);tile(e,images,context,m.value("identity",J(nullptr)));
   }
   save(folder()+QString("/events/%1.json").arg(count,6,10,QChar('0')),e);head=hash(bytes(e.dump()));count++;lastAt=p["at"];if(t!="output-checkpoint")lastType=t;if(t=="session-end")ended=true;if(t=="challenge-failed"&&!tolerantSession)error("Challenge failed; start a fresh session");send({{"type","ack"},{"seq",count-1},{"event_type",t}});
  }else if(type=="stop-request"){need(ended&&m["session_id"]==sid,"Session has not ended");stopPending=true;}
  else if(type=="final-seal"){need(!sealRequest.is_null()&&!finalized,"No final seal requested");auto e=m.at("seal");validate("seal",e);signature(e);auto p=e["payload"];for(auto k:{"session_id","recording_id","event_count","head","outputs","media"})need(p[k]==sealRequest[k],"Final seal mismatch");need(p["key_id"]==pub["key_id"]&&p["at"].get<long long>()>=lastAt,"Final signing identity/time mismatch");save(folder()+"/final-seal.json",e);finalized=true;send({{"type","sealed"}});message="Recording sealed. Proof saved locally.";}
  else throw std::runtime_error("Unknown phone message");
 }
 void tick(){
  const auto now=QDateTime::currentMSecsSinceEpoch();if(QFile::exists(root+"/obs-state.json"))state=read(root+"/obs-state.json");
  if(connected&&!state.is_null()&&!state.value("closed",true)&&!sid.empty()&&state["session_id"]!=sid)resetSession();
  if(connected&&announced&&state.value("closed",false)&&!ended&&!closedNotified){closedNotified=true;if(tolerantSession){send({{"type","recording-closed"}});message="Recording closed. Finishing the signed transcript…";}else{fault=true;send({{"type","recording-stopped"}});message="Recording incomplete. Ready for another recording.";}}
  std::deque<J> queue;{std::lock_guard<std::mutex> l(mutex);queue.swap(incoming);}for(auto &m:queue)try{messageIn(m);}catch(const std::exception &e){error(e.what());}
  if(fault)return;
  if(stopPending&&now>=tileEnd+240){need(tolerantSession||state.value("tile_renders",0LL)>renderBefore,"Proof tile was not rendered in OBS");save(root+"/command.json",{{"type","stop"},{"session_id",sid}});stopPending=false;}
  if(now-lastTick<1000)return;lastTick=now;if(!connected)return;
  {std::lock_guard<std::mutex> l(mutex);if(lastPoll&&now-lastPoll>12000){connected=false;if(announced&&!state.value("closed",true))fault=true;message="Phone disconnected. Reconnect from the phone.";return;}}
  if(state.is_null()||!state.contains("session_id")||state["descriptors"].empty())return;
  if(!announced){if(state.value("closed",true)||!state.value("recording_active",false))return;sid=state["session_id"];announced=true;save(folder()+"/session.json",{{"protocol","0.3"},{"session_id",sid},{"key_id",pub["key_id"]}});save(folder()+"/public-key.json",pub);send({{"type","session"},{"session_id",sid},{"recording_id",state["recording_id"]},{"descriptors",state["descriptors"]}});}
  need(state["session_id"]==sid,"Recording session changed unexpectedly");
  if(!state.value("closed",false)&&!ended)send({{"type","checkpoint"},{"outputs",state["outputs"]}});
  if(state.value("closed",false)&&ended&&sealRequest.is_null()){for(auto &o:state["outputs"])need(o["complete"]==true&&o["packets"].get<long long>()>0,"Incomplete output coverage");auto f=QString::fromStdString(state["media_path"]);sealRequest={{"type","seal-request"},{"session_id",sid},{"recording_id",state["recording_id"]},{"event_count",count},{"head",head},{"outputs",state["outputs"]},{"media",{{"name",QFileInfo(f).fileName().toStdString()},{"bytes",QFileInfo(f).size()},{"sha256",fileHash(f)}}}};send(sealRequest);message="Recording closed. Phone is signing automatically.";}
 }
};
NativeService::NativeService(const QString &r):p(std::make_unique<Impl>(r)){try{p->init();}catch(const std::exception &e){p->error(e.what());}}
NativeService::~NativeService()=default;
void NativeService::tick(){try{p->tick();}catch(const std::exception &e){p->error(e.what());}}
void NativeService::setAddress(const QString &a){if(p->fault||p->connected)return;p->address=a.toStdString();J pairing={{"url","https://"+p->address+":"+std::to_string(p->port)},{"cert_sha256",p->pin},{"token",p->token},{"transport","https-poll-v1"}};save(p->root+"/pairing.json",pairing);need(qr(pairing.dump(),440).save(p->root+"/pairing.png"),"Cannot render pairing QR");}
QString NativeService::status()const{return p->message;}
bool NativeService::paired()const{return p->connected;}
bool NativeService::notifyChatRequest(){
 // UI hint only. Acceptance uses the ordinary phone/beacon challenge flow.
 if(!p->connected||p->fault||!p->announced||p->ended||p->state.is_null()||p->state.value("closed",true)||!p->pending.is_null()||p->armPending)return false;
 try{p->send({{"type","chat-request"},{"request_id",QUuid::createUuid().toString(QUuid::Id128).toStdString()},{"source","twitch"},{"viewers",3},{"expires_at",QDateTime::currentMSecsSinceEpoch()+60000},{"session_id",p->sid}});return true;}catch(...){return false;}
}






