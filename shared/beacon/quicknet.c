#include "quicknet.h"
#include "blst.h"
#include <string.h>
bool clappa_quicknet_verify(const uint8_t digest[32],const uint8_t signature[48]) {
 const char *hex="83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76a4bc09e76eae8991ef5ece45a";
 unsigned char key[96];for(int i=0;i<96;i++){unsigned a=hex[i*2],b=hex[i*2+1];key[i]=((a<='9'?a-'0':a-'a'+10)<<4)|(b<='9'?b-'0':b-'a'+10);}
 const unsigned char dst[]="BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_";
 blst_p2_affine pk;blst_p1_affine sig;
 if(blst_p2_uncompress(&pk,key)!=BLST_SUCCESS||blst_p1_uncompress(&sig,signature)!=BLST_SUCCESS)return false;
 if(blst_p2_affine_is_inf(&pk)||blst_p1_affine_is_inf(&sig)||!blst_p2_affine_in_g2(&pk)||!blst_p1_affine_in_g1(&sig))return false;
 return blst_core_verify_pk_in_g2(&pk,&sig,true,digest,32,dst,sizeof(dst)-1,NULL,0)==BLST_SUCCESS;
}
