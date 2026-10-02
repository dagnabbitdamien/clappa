import fs from 'node:fs';
function edit(file,changes){let s=fs.readFileSync(file,'utf8');for(const [from,to] of changes){if(!s.includes(from))throw Error(file+': missing '+from.slice(0,90));s=s.replaceAll(from,to)}fs.writeFileSync(file,s)}
edit('protocol/schema.mjs',[["eventData['session-start'].properties.response_profile", "eventData['session-start'].properties.session_policy={const:'CLAPPA-SESSION-v2'};\neventData['session-start'].properties.claim_window_ms={const:30000};\neventData['session-start'].properties.response_profile"]]);
edit('verifier/proof.mjs',[
 ['let cameraProfile=null,','let sessionPolicy=null,claimWindow=6000;const missed=[];let cameraProfile=null,'],
 ["case 'session-start':cameraProfile=", "case 'session-start':sessionPolicy=d.session_policy??null;claimWindow=d.claim_window_ms??6000;if((sessionPolicy==='CLAPPA-SESSION-v2')!==(d.claim_window_ms===30000))throw Error('Invalid session/claim policy');cameraProfile="],
 ["failed=true;pending=null;armPending=false;break;", "missed.push({challenge_id:d.challenge_id,reason:d.reason,phase:pending?.phase??armedEvent.payload.data.phase});if(sessionPolicy==='CLAPPA-SESSION-v2'){const phase=pending?.phase??armedEvent.payload.data.phase;if(phase==='start')startOK=true;if(phase==='end')endOK=true;}else failed=true;lastChallenge=null;pending=null;armPending=false;break;"],
 ['lastChallenge.at+6000','lastChallenge.at+claimWindow'],
 ['Claim must immediately follow random challenge within six seconds','Claim must follow a captured challenge within its signed offer window'],
 ["if(pending||armPending||!startOK||!endOK)throw Error('End without successful bookends')", "if(pending||armPending||(sessionPolicy!=='CLAPPA-SESSION-v2'&&(!startOK||!endOK)))throw Error('End with unresolved challenges or missing legacy bookends')"],
 ["events:names.length,detached_media_proofs", "events:names.length,session_policy:sessionPolicy??'legacy-strict',missed_challenges:missed,bookends:{start_resolved:startOK,end_resolved:endOK},detached_media_proofs"]
]);
edit('android/app/src/main/java/org/clappa/app/Session.kt',[
 ['.put("response_profile","CLAPPA-RESPONSE-v1")','.put("session_policy","CLAPPA-SESSION-v2").put("claim_window_ms",30000).put("response_profile","CLAPPA-RESPONSE-v1")'],
 ['check(armAcknowledged&&pending==null&&!hadFailure)','check(armAcknowledged&&pending==null)'],
 ['pending=null;hadFailure=true}', 'pending=null;hadFailure=true;if(p.getString("phase")=="start")startDone=true;if(p.getString("phase")=="end")endDone=true;armedEvent=null;issuedEvent=null;lastSuccessAt=0}'],
 ['lastSuccessAt+6000','lastSuccessAt+30000'],
 ['fun finish(){check(startDone&&endDone&&pending==null&&!hadFailure);emit("session-end",JSONObject());ended=true;send(JSONObject().put("type","stop-request").put("session_id",sessionId))}', 'fun finish(alreadyClosed:Boolean=false){check((alreadyClosed||startDone&&endDone)&&pending==null);emit("session-end",JSONObject());ended=true;if(!alreadyClosed)send(JSONObject().put("type","stop-request").put("session_id",sessionId))}'],
 ['check(ended&&!hadFailure)','check(ended)']
]);
edit('obs-plugin/src/native-service.cpp',[
 ['std::string cameraProfile;', 'std::string cameraProfile;bool tolerantSession=false;long long claimWindow=6000;'],
 ['timedSession=false;freshSession=false;', 'timedSession=false;tolerantSession=false;claimWindow=6000;freshSession=false;'],
 ['if(t=="session-start"){timedSession=', 'if(t=="session-start"){tolerantSession=d.value("session_policy",std::string())=="CLAPPA-SESSION-v2";claimWindow=d.value("claim_window_ms",6000LL);need(tolerantSession==(claimWindow==30000),"Invalid session/claim policy");timedSession='],
 ['successAt+6000','successAt+claimWindow'],
 ['"Unknown failed challenge");armPending=false;', '"Unknown failed challenge");if(tolerantSession){auto phase=pending.is_null()?armedEvent["payload"]["data"]["phase"]:pending["phase"];startOK|=phase=="start";endOK|=phase=="end";pending=nullptr;successAt=0;message="Challenge not completed. Recording continues.";}armPending=false;'],
 ['need(startOK&&endOK&&pending.is_null()&&!armPending,"Complete both challenges before ending")','need((tolerantSession||startOK&&endOK)&&pending.is_null()&&!armPending,"Resolve pending challenges before ending")'],
 ['if(t=="challenge-failed")error(', 'if(t=="challenge-failed"&&!tolerantSession)error('],
 ['closedNotified=true;fault=true;send({{"type","recording-stopped"}});message="Recording incomplete. Ready for another recording.";', 'closedNotified=true;if(tolerantSession){send({{"type","recording-closed"}});message="Recording closed. Finishing the signed transcript…";}else{fault=true;send({{"type","recording-stopped"}});message="Recording incomplete. Ready for another recording.";}'],
 ['Recording closed. Confirm the final seal on your phone.','Recording closed. Phone is signing automatically.'],
 ['QImage im(path);if(im.isNull())return;', 'QImage im(path);if(im.isNull())return;'] // separate renderer below
].filter(([a,b])=>a!==b));
edit('obs-plugin/src/plugin.cpp',[
 ['frames.append(im);','frames.append(im.scaled(BoardArt::Width,BoardArt::Height,Qt::IgnoreAspectRatio,Qt::SmoothTransformation));'],
 ['angle=.65*std::sin(std::min(1.,exit/.24)*3.14159265);','angle=2.6*std::sin(std::min(1.,exit/.24)*3.14159265*.75);']
]);
edit('obs-plugin/src/board-art.h',[
 ['p.setRenderHint(QPainter::Antialiasing);p.scale(3,3);','p.setRenderHint(QPainter::Antialiasing);p.setRenderHint(QPainter::TextAntialiasing);p.scale(3,3);'],
 ['if(ch.isDigit()){int m=', 'if(ch.isDigit()){p.setBrush(QColor(0,0,0,38));p.drawRoundedRect(QRectF(-1,-1,22.4,34.4),1,1);p.setBrush(QColor("#eeeade"));int m='],
 ['label.setPixelSize(14);','label.setPixelSize(15);'],
 ['label.setPixelSize(13);','label.setPixelSize(14);']
]);
edit('android/app/src/main/java/org/clappa/app/ClappaBoard.kt',[
 ["if(ch.isDigit()){for(i in 0..6)", "if(ch.isDigit()){p.color=0x26000000;c.drawRoundRect(RectF(-1f,-1f,21.4f,33.4f),1f,1f,p);p.color=0xffeeeade.toInt();for(i in 0..6)"],
 ['"Verify something else?  ${state.claimSeconds}"','"Add a photo · ${state.claimSeconds}s"']
]);
edit('android/app/build.gradle.kts', [['versionCode = 13; versionName = "0.3.0-test11"','versionCode = 14; versionName = "0.3.0-test12"']]);
