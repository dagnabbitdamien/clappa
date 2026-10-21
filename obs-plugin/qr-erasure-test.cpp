#include "src/qr-transport.h"
#include "json.hpp"
#include <QFile>
#include <QCryptographicHash>
#include <iostream>
int main(int argc,char **argv){try{if(argc!=2)return 2;QFile file(argv[1]);if(!file.open(QIODevice::ReadOnly))return 3;auto cases=nlohmann::json::parse(file.readAll().constData());for(auto &c:cases){auto packed=QByteArray::fromHex(QByteArray::fromStdString(c.at("hex")));auto frames=resilientQrFrames(QCryptographicHash::hash(packed,QCryptographicHash::Sha256),packed);if(frames!=c.at("frames").get<std::vector<std::string>>())throw std::runtime_error("Cross-language QR mismatch");}std::cout<<"C++/JavaScript erasure frames match\n";return 0;}catch(const std::exception&e){std::cerr<<e.what();return 1;}}
