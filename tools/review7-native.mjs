import fs from 'node:fs';
const path='obs-plugin/src/native-service.cpp';let s=fs.readFileSync(path,'utf8');
s='#include "prompts.h"\n'+s;
s=s.replace('std::string lastChallenge;', 'std::string lastChallenge,lastPrompt;bool closedNotified=false;');
s=s.replace('void error(const std::string &s){fault=true;message="Incomplete: "+QString::fromStdString(s);try{send({{"type","error"},{"message",s}});}catch(...){} }',`void error(const std::string &s){fault=true;message="Incomplete: "+QString::fromStdString(s);try{send({{"type","error"},{"message",s},{"recording",!state.is_null()&&!state.value("closed",true)}});}catch(...){} }
 void resetSession(){fault=false;ended=false;finalized=false;announced=false;closedNotified=false;sid.clear();head.clear();lastType.clear();count=0;lastAt=0;successAt=0;pending=nullptr;sealRequest=nullptr;startOK=false;endOK=false;lastChallenge.clear();lastPrompt.clear();ids.clear();latestOutputs=nullptr;stopPending=false;}`);
s=s.replace('const int cells=q.getSize()+8,scale=284/cells;need(scale>=2', 'const int cells=q.getSize()+8,scale=568/cells;need(scale>=4');
s=s.replace('BoardArt::proof(photo,code,d[claim?"captured_at":"a_at"].get<long long>())','BoardArt::proof(photo,code,d[claim?"captured_at":"a_at"].get<long long>(),claim?QStringLiteral("Your additional photo!"):promptText(lastPrompt))');
const start=s.indexOf('   need(!connected&&!announced,');const end=s.indexOf('   if(QFile::exists(root+"/trusted-phone.json"))',start);
s=s.slice(0,start)+`   auto candidate=m.at("key");validate("key",candidate);auto spki=un64(candidate["spki"]);need(hash(spki)==candidate["key_id"],"Key fingerprint mismatch");
   if(!pub.is_null())need(candidate["key_id"]==pub["key_id"],"A different phone identity requires a new pairing code");
   bool interrupted=announced&&!finalized&&!state.value("closed",true);
   pub=candidate;
`+s.slice(end);
s=s.replace('connected=true;send({{"type","paired"}});message=',`connected=true;{std::lock_guard<std::mutex> l(mutex);outbound=J::array();lastPoll=QDateTime::currentMSecsSinceEpoch();}send({{"type","paired"}});if(interrupted){error("Phone reconnected during a recording. Stop this incomplete recording, then start another");return;}resetSession();message=`);
s=s.replace('}need(connected&&!fault,"Phone is not connected or session is incomplete");',`}need(connected,"Phone is not connected");
  if(type=="start-recording"){need(state.is_null()||state.value("closed",true),"OBS is already recording");save(root+"/command.json",{{"type","start"}});return;}
  if(type=="stop-incomplete"){need(!state.is_null()&&!state.value("closed",true),"No active recording");fault=true;save(root+"/command.json",{{"type","stop"},{"session_id",state["session_id"]}});return;}
  need(!fault,"This recording is incomplete. Stop it, then start another");`);
s=s.replace('lastChallenge=d["challenge_id"];successAt=p["at"];pending=nullptr;', 'lastChallenge=d["challenge_id"];lastPrompt=pending["prompt_id"];successAt=p["at"];pending=nullptr;');
s=s.replace('send({{"type","ack"},{"seq",count-1}});','send({{"type","ack"},{"seq",count-1},{"event_type",t}});');
s=s.replace('  std::deque<J> queue;',`  if(connected&&!state.is_null()&&!state.value("closed",true)&&!sid.empty()&&state["session_id"]!=sid)resetSession();
  if(connected&&announced&&state.value("closed",false)&&!ended&&!closedNotified){closedNotified=true;fault=true;send({{"type","recording-stopped"}});message="Recording incomplete. Ready for another recording.";}
  std::deque<J> queue;`);
s=s.replace('connected=false;throw std::runtime_error("Phone disconnected. Check Wi-Fi and start a fresh session.");','connected=false;if(announced&&!state.value("closed",true))fault=true;message="Phone disconnected. Reconnect from the phone.";return;');
s=s.replace('  need(state["session_id"]==sid,"Restart OBS and phone before another test session");','  need(state["session_id"]==sid,"Recording session changed unexpectedly");');
fs.writeFileSync(path,s);
const plugin='obs-plugin/src/plugin.cpp';s=fs.readFileSync(plugin,'utf8');
s=s.replace('auto command=read(root+"/command.json");if(command["type"]=="stop"','auto command=read(root+"/command.json");if(command["type"]=="start"){QFile::remove(root+"/command.json");if(!obs_frontend_recording_active())obs_frontend_recording_start();}if(command["type"]=="stop"');
// Render the board at double resolution while retaining its existing OBS bounds.
s=s.replace('QImage im(872,430,QImage::Format_ARGB32_Premultiplied);','QImage im(1744,860,QImage::Format_ARGB32_Premultiplied);');
s=s.replace('p.setRenderHint(QPainter::Antialiasing);p.translate(0,y);p.drawImage(0,0,t->frames[t->index]);','p.setRenderHint(QPainter::Antialiasing);p.scale(2,2);p.translate(0,y);p.drawImage(QRectF(0,0,872,430),t->frames[t->index]);');
fs.writeFileSync(plugin,s);
