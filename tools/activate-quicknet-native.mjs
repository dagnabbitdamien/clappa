import fs from 'node:fs';
let file='obs-plugin/src/native-service.cpp',s=fs.readFileSync(file,'utf8');function r(a,b){if(!s.includes(a))throw Error(a);s=s.replace(a,b)}
r('#include "prompts.h"','#include "prompts.h"\n#include "freshness.h"');
r('J latestOutputs;','J latestOutputs,armedEvent;bool freshSession=false,armPending=false;');
r('timedSession=false;lastChallenge.clear()','timedSession=false;freshSession=false;armPending=false;armedEvent=nullptr;lastChallenge.clear()');
r('if(t=="session-start")timedSession=d.value("response_profile",std::string())=="CLAPPA-RESPONSE-v1";','if(t=="session-start"){timedSession=d.value("response_profile",std::string())=="CLAPPA-RESPONSE-v1";freshSession=d.value("freshness_profile",std::string())=="CLAPPA-QUICKNET-v1";}');
r('else if(t=="challenge-issued"){','else if(t=="challenge-armed"){need(freshSession&&!armPending&&pending.is_null()&&!endOK,"Challenge already locked");auto target=Freshness::at(d["round"]);auto now=QDateTime::currentMSecsSinceEpoch();need(d["chain"]==Freshness::chain&&target>now+500&&target<now+15000&&p["at"].get<long long>()<target,"Target beacon must be future");need(d["obs"]["recording_id"]==state["recording_id"],"Recording mismatch");outputs(d["obs"]["outputs"]);armedEvent=e;armPending=true;showArm(e,target);}\n   else if(t=="challenge-issued"){if(freshSession){need(armPending,"Challenge was not locked");Freshness::challenge(e,armedEvent);need(QDateTime::currentMSecsSinceEpoch()<=d["freshness"]["pulse"]["at"].get<long long>()+10000,"Beacon expired before issue");armPending=false;}else need(!d.contains("freshness")&&!d.contains("pitches")&&!d.contains("qr_profile"),"Freshness without session policy");');
r('outputs(d["obs"]["outputs"]);issuedEvent=e;','if(!freshSession)outputs(d["obs"]["outputs"]);issuedEvent=e;');
r('need(context.size()==2&&context.at("challenge")==issuedEvent,"Wrong challenge context");','need(context.size()==(freshSession?3:2)&&context.at("challenge")==issuedEvent,"Wrong challenge context");if(freshSession)need(context.at("armed")==armedEvent,"Wrong locked commitment");');
r('else if(t=="session-end")need(startOK&&endOK&&pending.is_null(),','else if(t=="challenge-failed"){need((!pending.is_null()&&d["challenge_id"]==pending["challenge_id"])||(armPending&&d["challenge_id"]==armedEvent["payload"]["data"]["challenge_id"]),"Unknown failed challenge");armPending=false;}\n   else if(t=="session-end")need(startOK&&endOK&&pending.is_null()&&!armPending,');
r('for(auto &p:pairs)photos.push_back(images.at(p["proof"]["path"].get<std::string>()));','if(!freshSession)for(auto &p:pairs)photos.push_back(images.at(p["proof"]["path"].get<std::string>()));');
// A one-frame public lock marker is visible before the designated pulse. Later evidence supplies its exact signed preimage.
r(' void tile(const J &e,',` void showArm(const J &e,long long target){auto digest=hash(bytes(e.dump()));auto text="CLAPPA-ARM1:"+digest+":"+std::to_string(e["payload"]["data"]["round"].get<long long>());auto image=BoardArt::arming(qr(text,292),QString::fromStdString(digest.substr(0,12)),target);auto name=root+"/armed-"+QString::number(count)+".png";need(image.save(name),"Cannot display locked challenge");tileEnd=target+20000;save(root+"/tile.json",{{"path",name.toStdString()},{"frames",J::array({name.toStdString()})},{"flash_path",""},{"until",tileEnd}});}
 void tile(const J &e,`);
r('d[claim?"captured_at":"a_at"].get<long long>()','freshSession?issuedEvent["payload"]["data"]["freshness"]["pulse"]["at"].get<long long>():d[claim?"captured_at":"a_at"].get<long long>()');
r('claim?QStringLiteral("Your additional photo!"):promptText(lastPrompt));','claim?QStringLiteral("Your additional photo!"):promptText(lastPrompt),freshSession);');
fs.writeFileSync(file,s);
file='verifier/proof.mjs';s=fs.readFileSync(file,'utf8');
r("import {validateResponseWindow", "import {validateFreshChallenge,QUICKNET_PROFILE,roundTime} from '../protocol/quicknet.mjs';\nimport {validateResponseWindow");
r('const ids=new Set();let lastElapsed=0;','let freshnessProfile=null,armedEvent=null,armPending=false,freshResponses=0;const ids=new Set();let lastElapsed=0;');
r("case 'session-start':responseProfile=", "case 'session-start':freshnessProfile=d.freshness_profile??null;responseProfile=");
r("case 'challenge-issued':",`case 'challenge-armed':
          if(freshnessProfile!==QUICKNET_PROFILE||armPending||pending||endOK||p.at>=roundTime(d.round)||d.obs.recording_id!==recording||d.obs.elapsed_ms<lastElapsed)throw Error('Invalid challenge lock');
          collect(d.obs.outputs);lastElapsed=d.obs.elapsed_ms;armedEvent=e;armPending=true;break;
        case 'challenge-issued':
          if(freshnessProfile===QUICKNET_PROFILE){if(!armPending)throw Error('Missing challenge lock');validateFreshChallenge(e,armedEvent);armPending=false;freshResponses++;}else if(d.freshness||d.pitches||d.qr_profile)throw Error('Freshness without session policy');`);
r('collect(d.obs.outputs);lastElapsed=d.obs.elapsed_ms;ids.add', 'if(freshnessProfile!==QUICKNET_PROFILE)collect(d.obs.outputs);lastElapsed=d.obs.elapsed_ms;ids.add');
r("case 'challenge-failed':if(!pending||pending.challenge_id!==d.challenge_id)throw Error('Unmatched failed challenge');failed=true;pending=null;break;", "case 'challenge-failed':if((!pending||pending.challenge_id!==d.challenge_id)&&(!armPending||armedEvent.payload.data.challenge_id!==d.challenge_id))throw Error('Unmatched failed challenge');failed=true;pending=null;armPending=false;break;");
r("case 'session-end':if(pending||", "case 'session-end':if(pending||armPending||");
r('canonical(context.challenge)!==canonical(issuedEvent)||','canonical(context.challenge)!==canonical(issuedEvent)||(freshnessProfile===QUICKNET_PROFILE&&canonical(context.armed)!==canonical(armedEvent))||');
r('timed_responses:timedResponses,media_binding','timed_responses:timedResponses,freshness_profile:freshnessProfile??"none",beacon_challenges:freshResponses,media_binding');
fs.writeFileSync(file,s);
