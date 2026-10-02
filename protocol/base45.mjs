// RFC 9285. Its alphabet fits QR alphanumeric mode (5.5 bits per character).
const alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
export function encodeBase45(bytes){let text='';for(let i=0;i<bytes.length;i+=2){let n=bytes[i];const pair=i+1<bytes.length;if(pair)n=n*256+bytes[i+1];text+=alphabet[n%45]+alphabet[Math.floor(n/45)%45];if(pair)text+=alphabet[Math.floor(n/2025)];}return text;}
export function decodeBase45(text){
 if(text.length%3===1)throw Error('Invalid Base45 length');const out=[];
 for(let i=0;i<text.length;i+=3){const count=Math.min(3,text.length-i);let n=0;for(let j=0;j<count;j++){const v=alphabet.indexOf(text[i+j]);if(v<0)throw Error('Invalid Base45 character');n+=v*45**j;}if(count===3){if(n>65535)throw Error('Base45 pair overflow');out.push(n>>8,n&255);}else{if(n>255)throw Error('Base45 byte overflow');out.push(n);}}
 return Buffer.from(out);
}
