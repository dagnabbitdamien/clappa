#undef NDEBUG
#include "src/tile-timing.h"
#include <cassert>
#include <iostream>
int main(){
 for(int count:{1,3,21}){
  int last=0;
  for(long long age=0;age<6000;age+=10){
   auto next=TileTiming::frame(age,5100-age,count,last);
   if(age<500)assert(next==0);
   if(age>=5000)assert(next==last);
   assert(next>=0&&next<count);last=next;
  }
 }
 assert(TileTiming::frame(980,4000,3,0)==2);
 assert(TileTiming::flashOpacity(0)==1);
 assert(TileTiming::flashOpacity(850)==1);
 assert(TileTiming::flashOpacity(1050)==.5);
 assert(TileTiming::flashOpacity(1250)==0);
 std::cout<<"PASS: QR frozen during entrance/exit; flash crossfade bounded\n";
}

