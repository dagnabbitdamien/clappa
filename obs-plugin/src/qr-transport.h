#pragma once
#include <QByteArray>
#include <string>
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
