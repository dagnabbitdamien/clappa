#define CLAPPA_IDENTITY_TEST
#include "src/twitch-identity.h"
#include "src/board-art.h"
#include <QGuiApplication>
#include <QFile>
#include <iostream>
int main(int argc,char **argv){std::cerr<<"Starting identity test\n";QGuiApplication app(argc,argv);std::cerr<<"Qt initialized\n";try{
 if(argc!=3)throw std::runtime_error("Expected fixture and render path");QFile file(argv[1]);if(!file.open(QIODevice::ReadOnly))throw std::runtime_error("Fixture missing");auto raw=file.readAll();auto fixture=nlohmann::json::parse(raw.constData());TwitchIdentityVerifier verifier;verifier.provisionTestKeys(fixture.at("jwks"));
 for(auto &c:fixture.at("cases")){auto name=verifier.verifiedName(c.at("evidence"),c.at("key_id"));if((!name.isEmpty())!=c.at("valid").get<bool>())throw std::runtime_error(c.at("name").get<std::string>());}
 QImage photo(492,292,QImage::Format_RGB32);photo.fill(QColor("#777266"));QImage qr(876,876,QImage::Format_RGB32);qr.fill(Qt::white);
 auto image=BoardArt::proof(photo,qr,1790800000000LL,"Cover your left eye with your left hand!",true,"ClappaTestAccount");{QPainter painter(&image);painter.setRenderHint(QPainter::Antialiasing);painter.scale(3,3);painter.translate(12,40);BoardArt::bar(painter);BoardArt::bracket(painter);}if(!image.save(argv[2]))throw std::runtime_error("Cannot render board");std::cout<<"Native Twitch identity cases passed; layout rendered.\n";return 0;
 }catch(const std::exception &e){std::cerr<<e.what()<<"\n";return 1;}}
