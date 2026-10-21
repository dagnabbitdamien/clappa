#pragma once
#include <QByteArray>
#include <string>
#include <vector>
#include <stdexcept>
#include <zlib.h>

// Transport v2: full SHA-256 + index/count + CRC32 + <=200-byte chunk,
// encoded with RFC 9285 Base45 for QR alphanumeric mode.
inline std::string compactQrFrame(const QByteArray &digest,int index,int count,const QByteArray &part){
 if(digest.size()!=32||index<0||index>=count||count<1||count>41||part.isEmpty()||part.size()>200)throw std::runtime_error("Invalid QR frame");
 QByteArray b=digest;b.append(char(index>>8));b.append(char(index));b.append(char(count>>8));b.append(char(count));
 auto crc=crc32(0,(const Bytef*)part.constData(),part.size());for(int shift:{24,16,8,0})b.append(char(crc>>shift));b+=part;
 const char *alphabet="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";std::string text="CLAPPA2:";
 for(int i=0;i<b.size();i+=2){unsigned v=(unsigned char)b[i];bool pair=i+1<b.size();if(pair)v=v*256+(unsigned char)b[i+1];text+=alphabet[v%45];text+=alphabet[v/45%45];if(pair)text+=alphabet[v/2025];}
 return text;
}

inline unsigned qrMul(unsigned a,unsigned b){unsigned r=0;while(b){if(b&1)r^=a;b>>=1;a<<=1;if(a&256)a^=0x11d;}return r;}
inline unsigned qrInv(unsigned a){unsigned r=1;for(unsigned n=254;n;n>>=1,a=qrMul(a,a))if(n&1)r=qrMul(r,a);return r;}
inline std::vector<std::string> resilientQrFrames(const QByteArray &digest,const QByteArray &packed){
 const int k=(packed.size()+195)/196;if(digest.size()!=32||packed.isEmpty()||packed.size()>8192)throw std::runtime_error("Invalid QR payload");
 std::vector<std::string> frames;const char *alphabet="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
 for(int i=0;i<2*k;i++){QByteArray part(196,0);
  for(int j=0;j<k;j++){unsigned coefficient=i<k?(i==j?1:0):qrInv((i-k)^(k+j));for(int x=0;x<196;x++)if(j*196+x<packed.size())part[x]=char((unsigned char)part[x]^qrMul(coefficient,(unsigned char)packed[j*196+x]));}
  QByteArray b=digest;for(int v:{i,k,int(packed.size())}){b.append(char(v>>8));b.append(char(v));}auto crc=crc32(0,(const Bytef*)part.constData(),part.size());for(int shift:{24,16,8,0})b.append(char(crc>>shift));b+=part;
  std::string text="CLAPPA3:";for(int x=0;x<b.size();x+=2){unsigned v=(unsigned char)b[x]*256+(unsigned char)b[x+1];text+=alphabet[v%45];text+=alphabet[v/45%45];text+=alphabet[v/2025];}frames.push_back(text);
 }return frames;
}
