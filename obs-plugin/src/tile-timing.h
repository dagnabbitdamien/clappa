#pragma once
#include <algorithm>
namespace TileTiming {
constexpr long long settleMs=500, frameMs=240, freezeMs=100, exitMs=240;
inline int frame(long long age,long long remaining,int count,int previous){
 if(age<settleMs)return 0;
 if(remaining<=freezeMs)return previous;
 return count>0?int((age-settleMs)/frameMs%count):0;
}
inline double flashOpacity(long long age){return std::clamp((1250.-age)/400.,0.,1.);}
}
