#include "src/freshness.h"
#include <QCoreApplication>
#include <QFile>
#include <iostream>
int main(int argc,char **argv){
 QCoreApplication app(argc,argv);
 if(argc!=2)return 2;
 QFile file(argv[1]);
 if(!file.open(QIODevice::ReadOnly))return 2;
 try{
  const auto fixture=Freshness::J::parse(file.readAll().toStdString());
  if(fixture.is_array()){
   for(const auto &row:fixture){
    const auto actual=Freshness::choices(QByteArray::fromHex(Freshness::bytes(row.at("seed").get<std::string>())),row.value("profile",std::string("front-rear")),row.at("mapping").get<std::string>());
    for(auto field: {"prompt_id","camera","flash","cadence","slot_ms","pitches","response_window_ms"})
     if(actual.at(field)!=row.at(field))throw std::runtime_error(std::string("Choice vector mismatch: ")+field);
   }
   try{Freshness::choices(QByteArray(32,0),"front-only","CLAPPA-CHOICES-unknown");return 3;}catch(...){}
   std::cout<<"PASS "<<fixture.size()<<" shared native choice vectors and unknown-mapping rejection\n";
   return 0;
  }
  Freshness::challenge(fixture.at("issue"),fixture.at("arm"));
  auto bad=fixture.at("issue");
  auto signature=bad["payload"]["data"]["freshness"]["pulse"]["signature"].get<std::string>();
  signature[0]=signature[0]=='0'?'1':'0';
  bad["payload"]["data"]["freshness"]["pulse"]["signature"]=signature;
  try{Freshness::challenge(bad,fixture.at("arm"));return 3;}catch(...){}
  auto relabelled=fixture.at("arm");
  relabelled["payload"]["data"]["mapping"]=relabelled["payload"]["data"]["mapping"]=="CLAPPA-CHOICES-v1"?"CLAPPA-CHOICES-v3":"CLAPPA-CHOICES-v1";
  try{Freshness::challenge(fixture.at("issue"),relabelled);return 4;}catch(...){}
  std::cout<<"PASS native beacon signature, deterministic mapping and mutation rejection\n";
  return 0;
 }catch(const std::exception &error){std::cerr<<error.what()<<'\n';return 1;}
}
