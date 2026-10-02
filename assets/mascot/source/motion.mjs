export const durations={rise:440,retreat:280,ear:600,blink:220,rub:1400,acknowledge:480,obs:650,hold:1000,peek:1000};
export const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
function keys(t,a){for(let i=1;i<a.length;i++)if(t<=a[i][0])return lerp(a[i-1][1],a[i][1],smooth((t-a[i-1][0])/(a[i][0]-a[i-1][0])));return a.at(-1)[1];}
export function rotatePoint(p,c,d){const a=d*Math.PI/180,dx=p[0]-c[0],dy=p[1]-c[1];return[c[0]+Math.cos(a)*dx-Math.sin(a)*dy,c[1]+Math.sin(a)*dx+Math.cos(a)*dy];}
export function solveArm(target){const s=[208,146],el=[191,204],hand=[169,243],l1=Math.hypot(el[0]-s[0],el[1]-s[1]),l2=Math.hypot(hand[0]-el[0],hand[1]-el[1]),dx=target[0]-s[0],dy=target[1]-s[1],d=Math.hypot(dx,dy);if(d>l1+l2||d<Math.abs(l1-l2))throw Error('Unreachable nose target');const base=Math.atan2(dy,dx),off=Math.acos((l1*l1+d*d-l2*l2)/(2*l1*d)),a=base+off,ex=s[0]+l1*Math.cos(a),ey=s[1]+l1*Math.sin(a),b=Math.atan2(target[1]-ey,target[0]-ex),restA=Math.atan2(el[1]-s[1],el[0]-s[0]),restB=Math.atan2(hand[1]-el[1],hand[0]-el[0]);return{upperArm:(a-restA)*180/Math.PI,forearm:(b-restB-a+restA)*180/Math.PI};}
export function sample(name,time){const t=Math.min(1,Math.max(0,time/durations[name])),pose={rootY:0,head:0,earNear:0,earFar:0,tail:0,upperArm:0,forearm:0,blink:false};
 if(name==='peek')pose.rootY=245;
 if(name==='rise'){pose.rootY=keys(t,[[0,245],[.78,-4],[1,0]]);pose.earNear=keys(t,[[0,0],[.65,-8],[.87,4],[1,0]]);}
 if(name==='retreat')pose.rootY=245*smooth(t);
 if(name==='ear'||name==='obs'){pose.earNear=keys(t,[[0,0],[.25,-10],[.5,4],[.76,-3],[1,0]]);pose.earFar=pose.earNear*-.35;pose.tail=2.5*Math.sin(t*Math.PI*2)*Math.sin(t*Math.PI);}
 if(name==='blink')pose.blink=t>.22&&t<.72;
 if(name==='acknowledge'){pose.head=keys(t,[[0,0],[.45,6],[.72,-2],[1,0]]);pose.blink=t>.3&&t<.48;pose.earNear=-3*Math.sin(t*Math.PI);}
 if(name==='rub'){const amount=keys(t,[[0,0],[.3,1],[.72,1],[1,0]]);pose.head=4*amount;const target=rotatePoint([224,113],[184,121],pose.head);target[1]+=t>=.3&&t<=.72?1.4*Math.sin((t-.3)/.42*4*Math.PI):0;const a=solveArm(target);pose.upperArm=a.upperArm*amount;pose.forearm=a.forearm*amount;pose.tail=-2*Math.sin(t*Math.PI);pose.contact=amount===1;}
 return pose;
}
export function chain(node,nodes,pose){return node?chain(nodes.find(n=>n.id===node.parent),nodes,pose)+` rotate(${pose[node.id]||0} ${node.pivot.join(' ')})`:'';}
export function sourceAssembly(nodes,pose={}){return `<g transform="translate(0 ${pose.rootY||0})">`+nodes.map(n=>`<g transform="${chain(n,nodes,pose)}" filter="url(#paper)">${n.id==='head'&&pose.blink?n.alternatives.blink:n.art}</g>`).join('')+'</g>';}
