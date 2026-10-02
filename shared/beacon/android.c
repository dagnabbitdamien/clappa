#include <jni.h>
#include "quicknet.h"
JNIEXPORT jboolean JNICALL Java_org_clappa_app_Quicknet_nativeVerify(JNIEnv *env,jobject self,jbyteArray digest,jbyteArray signature){
 (void)self;if((*env)->GetArrayLength(env,digest)!=32||(*env)->GetArrayLength(env,signature)!=48)return JNI_FALSE;
 uint8_t d[32],s[48];(*env)->GetByteArrayRegion(env,digest,0,32,(jbyte*)d);(*env)->GetByteArrayRegion(env,signature,0,48,(jbyte*)s);
 return clappa_quicknet_verify(d,s)?JNI_TRUE:JNI_FALSE;
}
