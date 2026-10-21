// Shared, deterministic motion evaluator. Body spring drives hinge inertia.
(function(root){
const frames=[],impacts=[.34];
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);},mix=(a,b,t)=>a+(b-a)*t;
function keys(t,arr){if(t<=arr[0][0])return arr[0][1];for(let i=1;i<arr.length;i++)if(t<arr[i][0])return mix(arr[i-1][1],arr[i][1],ease((t-arr[i-1][0])/(arr[i][0]-arr[i-1][0])));return arr.at(-1)[1];}
function rotate(p,c,d){const a=d*Math.PI/180,x=p[0]-c[0],y=p[1]-c[1];return[c[0]+Math.cos(a)*x-Math.sin(a)*y,c[1]+Math.sin(a)*x+Math.cos(a)*y];}
const lengths={obs:3,exit:.28,clap:2.8,guide:1.7,ear:1.1,rub:2.1,success:1.4,error:1.2,capture:1.2};
function sprite(name,t){let changes=[];if(name==='guide')changes=[[.28,'guide']];if(name==='clap')changes=[[1.12,'guide']];if(name==='rub')changes=[[.16,'rub'],[1.55,'rest']];if(name==='success')changes=[[.13,'success']];if(name==='error')changes=[[.02,'error']];if(name==='ear')changes=[[.14,'blink'],[.47,'rest']];let id='rest',sx=1,sy=1,y=0,angle=0;for(const [start,target] of changes){const u=t-start;if(u>=.075)id=target;if(u>=0&&u<=.31){sx=keys(u,[[0,1],[.075,1.085],[.14,.95],[.23,1.025],[.31,1]]);sy=keys(u,[[0,1],[.075,.915],[.14,1.065],[.23,.985],[.31,1]]);y=keys(u,[[0,0],[.075,2],[.14,-5],[.31,0]]);angle=keys(u,[[0,0],[.075,-1],[.14,1],[.31,0]]);}}return{id,sx,sy,y,angle};}
function evaluate(name,t){const p={bodyY:0,bar:0,photo:1,qr:true,rootY:0,head:0,earNear:0,earFar:0,tail:0,upperArm:0,forearm:0,blink:false,press:0};
 if(name==='obs'){p.bodyY=keys(t,[[0,480],[.25,-3],[.36,0]]);p.bar=keys(t,[[0,0],[.12,0],[.23,2.7],[.34,0],[.38,.15],[.42,0]]);p.photoAngle=keys(t,[[0,0],[.18,-.5],[.30,.35],[.45,0]]);}
 if(name==='exit'){const u=clamp(t/.24);p.bodyY=490*u*u;p.bar=keys(t,[[0,0],[.08,.65],[.19,.25],[.24,0]]);p.photoAngle=.35*Math.sin(u*Math.PI);}
 if(name==='clap'){const hits=[.24];for(const hit of hits){p.bar+=keys(t,[[hit-.19,0],[hit-.085,10],[hit,0],[hit+.023,2.2],[hit+.064,0]]);const s=t-hit;if(s>=0&&s<.15)p.bodyY+=2.4*Math.sin(s*48)*Math.exp(-s*24);}p.press=keys(t,[[0,0],[.07,1],[.19,0]]);p.rootY=keys(t,[[0,210],[1.06,210],[1.38,-5],[1.57,0]]);p.head=keys(t,[[0,0],[1.3,-3],[1.6,0]]);p.earNear=keys(t,[[0,0],[1.37,7],[1.53,-3],[1.8,0]]);}
 if(name==='guide'){p.rootY=keys(t,[[0,210],[.13,215],[.48,-5],[.7,0]]);p.earNear=keys(t,[[0,0],[.42,7],[.58,-4],[.77,0]]);p.head=keys(t,[[0,0],[.43,-3],[.7,0]]);}
 if(name==='ear'){p.earNear=keys(t,[[0,0],[.18,-11],[.29,4],[.4,-3],[.62,0]]);p.earFar=p.earNear*-.28;p.blink=t>.73&&t<.84;p.tail=-2*Math.sin(clamp(t/1.1)*Math.PI);}
 if(name==='rub'){p.rub=keys(t,[[0,0],[.18,0],[.42,1],[1.4,1],[1.65,0]]);p.head=4*p.rub;p.farArm=-3*Math.sin(p.rub*Math.PI)+(p.rub===1?.7*Math.sin((t-.42)*16):0);p.blink=t>.73&&t<.84;p.earNear=-3*p.rub;}
 if(name==='success'){p.head=keys(t,[[0,0],[.22,-3],[.43,5],[.7,0]]);p.blink=t>.24&&t<.38;p.thumb=keys(t,[[0,0],[.18,0],[.36,1],[.85,1],[1.05,0]]);p.farArm=-4*Math.sin(p.thumb*Math.PI);p.earNear=keys(t,[[0,0],[.45,-7],[.65,3],[.9,0]]);}
 if(name==='error'){p.head=keys(t,[[0,0],[.3,-4],[1.2,-4]]);p.earNear=-3*ease(t/.3);p.alert=keys(t,[[0,0],[.16,1.08],[.27,1]]);p.blink=t>.22&&t<.34;}
 if(name==='capture'){p.rootY=keys(t,[[0,0],[.14,-3],[.48,210]]);p.earNear=keys(t,[[0,0],[.2,5],[.5,0]]);}
 p.ui= name==='clap'?ease((t-1.04)/.20):name==='guide'?ease((t-.23)/.20):1; p.sprite=sprite(name,t);return p;}
for(let i=0;i<=180;i++){const t=i/60,p=evaluate('obs',t);frames.push({t,y:p.bodyY,a:p.bar});}root.MOTION={evaluate,lengths,frames,impacts,rotate};
})(typeof window==='undefined'?globalThis:window);





