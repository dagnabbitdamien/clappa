#include "src/freshness.h"
#include <QCoreApplication>
#include <QFile>
#include <iostream>
int main(int argc,char **argv){QCoreApplication app(argc,argv);if(argc!=2)return 2;QFile f(argv[1]);if(!f.open(QIODevice::ReadOnly))return 2;auto j=Freshness::J::parse(f.readAll().toStdString());try{Freshness::challenge(j["issue"],j["arm"]);auto bad=j["issue"];bad["payload"]["data"]["freshness"]["pulse"]["signature"]="00"+bad["payload"]["data"]["freshness"]["pulse"]["signature"].get<std::string>().substr(2);try{Freshness::challenge(bad,j["arm"]);return 3;}catch(...){}std::cout<<"PASS native beacon signature, deterministic mapping and mutation rejection\n";return 0;}catch(const std::exception &e){std::cerr<<e.what();return 1;}}
