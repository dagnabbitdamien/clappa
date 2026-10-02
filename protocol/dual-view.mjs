export const DUAL_PROFILE='CLAPPA-DUAL-v1';
export function validateDualChoice(data){
 if(data.capture_profile===undefined){if(data.rear_flash!==undefined)throw Error('Rear illumination without dual profile');return;}
 if(data.capture_profile!==DUAL_PROFILE||data.camera!=='front'||data.rear_flash!=='torch'||data.pair_window_ms!==3000)throw Error('Invalid dual capture choice');
}
export function validateDualResponse(challenge,response){
 const c=challenge.data??challenge,r=response.data??response;validateDualChoice(c);
 if(c.capture_profile!==DUAL_PROFILE){if(r.dual!==undefined)throw Error('Unexpected dual photos');return;}
 const d=r.dual;if(!d||d.profile!==DUAL_PROFILE||d.exposure_synchronization!=='not-established')throw Error('Missing dual evidence');
 const end=[];
 for(const g of [d.normal,d.illuminated]){
  if(!g||![g.front_delivered_ms,g.rear_delivered_ms,g.front_sensor_us,g.rear_sensor_us].every(x=>Number.isSafeInteger(x)&&x>=0))throw Error('Invalid dual sample times');
  if(Math.abs(g.front_delivered_ms-g.rear_delivered_ms)>120)throw Error('Dual delivery gap exceeds 120 ms');
  for(const n of ['front_width','front_height','rear_width','rear_height'])if(!Number.isInteger(g[n])||g[n]<240||g[n]>4096)throw Error('Invalid dual sample dimensions');
  end.push(Math.max(g.front_delivered_ms,g.rear_delivered_ms));
 }
 if(d.illuminated.front_sensor_us<=d.normal.front_sensor_us||d.illuminated.rear_sensor_us<=d.normal.rear_sensor_us)throw Error('Reused or reversed dual sensor frames');
 if(Math.min(d.illuminated.front_delivered_ms,d.illuminated.rear_delivered_ms)<end[0]||end[1]-end[0]>3000||Math.abs(end[1]-end[0]-r.pair_ms)>1)throw Error('Dual sample timing mismatch');
 return DUAL_PROFILE;
}
