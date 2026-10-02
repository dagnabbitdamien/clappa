import fs from 'node:fs';
const file='android/app/src/main/java/org/clappa/app/MainActivity.kt';let s=fs.readFileSync(file,'utf8');
function replace(a,b){if(!s.includes(a))throw Error(a);s=s.replace(a,b)}
replace('"ack"->{if(pendingDelivery','"ack"->{if(m.optString("event_type")=="challenge-armed")session?.acknowledgeArm(m.getInt("seq"));if(pendingDelivery');
replace('busy=true;clapVisual++;phase=BoardPhase.CLAPPING','busy=true;phase=BoardPhase.CLAPPING;status="Locking this challenge in OBS…"');
replace('val p=withContext(Dispatchers.IO){s.issue(if(end)"end" else if(!s.startDone)"start" else "verify",SystemClock.elapsedRealtime()-startElapsed)}',`val round=withContext(Dispatchers.IO){s.arm(if(end)"end" else if(!s.startDone)"start" else "verify",SystemClock.elapsedRealtime()-startElapsed)}
            val target=Quicknet.roundTime(round)
            while(!s.armAcknowledged){check(System.currentTimeMillis()<target-200){"OBS did not lock this challenge before the beacon"};delay(50)}
            while(System.currentTimeMillis()<target+100){status="Waiting for fresh beacon · "+((target-System.currentTimeMillis()+999).coerceAtLeast(0)/1000)+"s";delay(100)}
            status="Checking the freshness signature…"
            val pulse=withContext(Dispatchers.IO){Quicknet.fetch(round)}
            val p=withContext(Dispatchers.IO){s.issue(pulse)};clapVisual++`);
replace('}catch(e:Exception){status=e.message?:"Challenge unavailable";phase=if(s.pending==null)BoardPhase.READY else BoardPhase.INCOMPLETE}', '}catch(e:Exception){withContext(Dispatchers.IO){runCatching{s.fail("timeout")}};status=e.message?:"Challenge unavailable";phase=BoardPhase.INCOMPLETE}');
replace('Cadence.pitches(seed,p.getString("cadence").count{it==\'1\'})','p.getJSONArray("pitches").let{a->(0 until a.length()).map{a.getInt(it)}}');
fs.writeFileSync(file,s);
const board='android/app/src/main/java/org/clappa/app/ClappaBoard.kt';s=fs.readFileSync(board,'utf8').replace('BoardPhase.CLAPPING->"Clapping…"','BoardPhase.CLAPPING->"Waiting for fresh beacon…"');fs.writeFileSync(board,s);
