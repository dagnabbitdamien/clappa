#pragma once
#include "json.hpp"
#include "quicknet.h"
#include <QCryptographicHash>
#include <QByteArray>
#include <set>
#include <algorithm>
#include <stdexcept>
namespace Freshness {
using J=nlohmann::json;
inline void need(bool b){if(!b)throw std::runtime_error("Freshness evidence or deterministic choices do not verify");}
inline constexpr auto chain="52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971";
inline QByteArray bytes(const std::string &s){return QByteArray(s.data(),int(s.size()));}
inline QByteArray sha(const QByteArray &v){return QCryptographicHash::hash(v,QCryptographicHash::Sha256);}
inline long long at(long long r){need(r>=1&&r<=10000000000LL);return (1692803367LL+(r-1)*3)*1000;}
inline QByteArray pulse(const J &p){
 auto r=p.at("round").get<long long>();need(p.at("chain")==chain&&p.at("at")==at(r));auto h=p.at("signature").get<std::string>();need(h.size()==96&&h.find_first_not_of("0123456789abcdef")==std::string::npos);
 auto signature=QByteArray::fromHex(bytes(h));QByteArray msg(8,0);for(int i=0;i<8;i++)msg[7-i]=char((uint64_t(r)>>(8*i))&255);auto digest=sha(msg);
 need(clappa_quicknet_verify((const uint8_t*)digest.constData(),(const uint8_t*)signature.constData()));return sha(signature);
}
struct Stream{QByteArray seed,label;uint32_t counter=0;int next(int n){for(;;){QByteArray c(4,0);auto count=counter++;for(int i=0;i<4;i++)c[3-i]=char((count>>(8*i))&255);auto b=sha(seed+label+QByteArray(1,0)+c);uint64_t v=0;for(int i=0;i<4;i++)v=(v<<8)|(unsigned char)b[i];if(v<(4294967296ULL/n)*n)return int(v%n);}}};
inline J choices(const QByteArray &seed,const std::string &profile="front-rear",const std::string &mapping="CLAPPA-CHOICES-v1"){
 need(mapping=="CLAPPA-CHOICES-v1"||mapping=="CLAPPA-CHOICES-v2");
 const char *prompts[]={"left","right","up","down","front","back","recording_camera","main_subject_alt_angle","room_setup","selfie","selfie_cover_left","selfie_cover_right","selfie_wink","selfie_turn"};
 const char *promptsV2[]={"left","right","up","down","front","back","selfie","selfie_left","selfie_right","selfie_around","selfie_nose_left","selfie_nose_right","selfie_chin","selfie_palm","selfie_smile","selfie_tilt","selfie_wink"};
 std::vector<std::string> pool; if(mapping=="CLAPPA-CHOICES-v2")pool.assign(std::begin(promptsV2),std::end(promptsV2));else pool.assign(std::begin(prompts),std::end(prompts));
 Stream prompt{seed,"prompt"},illum{seed,"illumination"},rhythm{seed,"rhythm"},notes{seed,"notes"},tempo{seed,"tempo"};need(profile=="front-rear"||profile=="front-only"||profile=="rear-only");std::vector<std::string> available;for(auto p:pool)if(profile=="front-rear"||(std::string(p).rfind("selfie",0)==0)==(profile=="front-only"))available.push_back(p);auto id=available[prompt.next(int(available.size()))];bool front=id.rfind("selfie",0)==0;
 const char *colors[]={"red","green","blue"};auto flash=front?colors[illum.next(3)]:"led";int off[]={2,6,10,14};for(int i=3;i>0;i--)std::swap(off[i],off[rhythm.next(i+1)]);
 std::set<int> slots{0,4,8,12};int extra=2+rhythm.next(2);for(int i=0;i<extra;i++)slots.insert(off[i]);std::string cadence;for(int i=0;i<16;i++)cadence+=slots.count(i)?'1':'0';
 const int scale[]={-5,-3,0,2,4,7};int note=2;J pitches=J::array();for(int i=0;i<int(slots.size());i++){if(i==int(slots.size())-1)pitches.push_back(0);else{if(i>0)note=std::clamp(note+notes.next(3)-1,0,5);pitches.push_back(scale[note]);}}
 return {{"prompt_id",id},{"camera",front?"front":"rear"},{"flash",flash},{"cadence",cadence},{"slot_ms",tempo.next(2)==0?125:111},{"pitches",pitches},{"response_window_ms",10000}};
}
inline void challenge(const J &e,const J &armed){
 auto c=e.at("payload"),a=armed.at("payload"),d=c.at("data"),f=d.at("freshness"),p=f.at("pulse"),ad=a.at("data");auto output=pulse(p);auto stamp=p.at("at").get<long long>();
 need(f.at("profile")=="CLAPPA-QUICKNET-v1"&&a.at("type")=="challenge-armed"&&a.at("key_id")==c.at("key_id")&&a.at("session_id")==c.at("session_id")&&a.at("seq")<c.at("seq")&&a.at("at").get<long long>()<stamp&&c.at("at").get<long long>()>=stamp&&c.at("at").get<long long>()<=stamp+10000);
 need(f.at("arm_sha256")==sha(bytes(armed.dump())).toHex().toStdString()&&ad.at("round")==p.at("round")&&ad.at("chain")==p.at("chain")&&(ad.at("mapping")=="CLAPPA-CHOICES-v1"||ad.at("mapping")=="CLAPPA-CHOICES-v2")&&ad.at("challenge_id")==d.at("challenge_id")&&ad.at("phase")==d.at("phase")&&ad.at("obs")==d.at("obs")&&d.at("qr_profile")=="hashes-v1");
 need(ad.value("capture_profile",std::string())==d.value("capture_profile",std::string()));
 if(d.contains("capture_profile"))need(d["capture_profile"]=="CLAPPA-DUAL-v1"&&ad["camera_profile"]=="front-only"&&d["camera"]=="front"&&d.value("rear_flash",std::string())=="torch"&&d.value("pair_window_ms",0)==3000);
 else need(!d.contains("rear_flash"));
 const char domain[]="CLAPPA-QUICKNET-SEED-v1";auto expected=choices(sha(QByteArray(domain,sizeof(domain))+bytes(a.dump())+QByteArray(1,0)+output),ad.at("camera_profile").get<std::string>(),ad.at("mapping").get<std::string>());
 for(auto it=expected.begin();it!=expected.end();++it)need(d.at(it.key())==it.value());
}
}
