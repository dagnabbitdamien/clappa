#pragma once
#include "json.hpp"
#include <stdexcept>
#include <algorithm>
#include <cstdlib>
namespace DualView {
using J=nlohmann::json;
inline void need(bool b){if(!b)throw std::runtime_error("Dual-camera evidence does not match its signed timing profile");}
inline void validate(const J &c,const J &r){
 if(!c.contains("capture_profile")){need(!r.contains("dual"));return;}
 need(c["capture_profile"]=="CLAPPA-DUAL-v1"&&c["camera"]=="front"&&c.value("rear_flash",std::string())=="torch"&&r.contains("dual"));
 auto d=r.at("dual");need(d["profile"]=="CLAPPA-DUAL-v1"&&d["exposure_synchronization"]=="not-established");
 long long ends[2];int i=0;for(const auto *name:{"normal","illuminated"}){auto g=d.at(name);auto f=g["front_delivered_ms"].get<long long>(),b=g["rear_delivered_ms"].get<long long>();need(std::llabs(f-b)<=120);ends[i++]=std::max(f,b);}
 need(d["illuminated"]["front_sensor_us"]>d["normal"]["front_sensor_us"]&&d["illuminated"]["rear_sensor_us"]>d["normal"]["rear_sensor_us"]);
 need(std::min(d["illuminated"]["front_delivered_ms"].get<long long>(),d["illuminated"]["rear_delivered_ms"].get<long long>())>=ends[0]&&ends[1]-ends[0]<=3000&&std::llabs(ends[1]-ends[0]-r["pair_ms"].get<long long>())<=1);
}
}
