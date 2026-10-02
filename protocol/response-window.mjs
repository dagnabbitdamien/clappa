// Signed local timing reports. This policy is not a NIST freshness proof.
export const RESPONSE_PROFILE='CLAPPA-RESPONSE-v1';
export function validateResponseWindow(challenge,response,{required=false}={}){
 const c=challenge.data,r=response.data;
 if(![challenge.at,response.at,r.a_at,r.b_at].every(Number.isSafeInteger))throw Error('Invalid capture clock fields');
 const pairLimit=c.pair_window_ms??(c.flash==='led'?3000:1500);if(![1500,3000].includes(pairLimit))throw Error('Invalid photo pair window');
 if(r.a_at<challenge.at||r.b_at<r.a_at||r.b_at-r.a_at>pairLimit||response.at<r.b_at)throw Error('Invalid two-photo response timing');
 if(required&&c.response_window_ms!==10000)throw Error('Missing required response window');
 if(c.response_window_ms===undefined){
  if(r.response_ms!==undefined||r.pair_ms!==undefined)throw Error('Timing without a response policy');
  return 'legacy-unbounded';
 }
 if(c.response_window_ms!==10000||!Number.isSafeInteger(r.response_ms)||!Number.isSafeInteger(r.pair_ms))throw Error('Invalid response timing fields');
 if(r.response_ms<0||r.response_ms>10000||r.pair_ms<0||r.pair_ms>pairLimit)throw Error('Response deadline exceeded');
 if(r.a_at<challenge.at||r.a_at-challenge.at>10000||r.b_at<r.a_at||r.b_at-r.a_at>pairLimit||response.at<r.b_at)throw Error('Response clock deadline exceeded');
 if(Math.abs(r.a_at-challenge.at-r.response_ms)>250||Math.abs(r.b_at-r.a_at-r.pair_ms)>250)throw Error('Response clocks disagree');
 return RESPONSE_PROFILE;
}
