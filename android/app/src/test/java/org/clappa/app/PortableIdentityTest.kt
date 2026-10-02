package org.clappa.app

import org.junit.Assert.*
import org.junit.Test
import java.security.Signature

class PortableIdentityTest {
 @Test fun generatedIdentityExportsAndRestoresTheSameKey(){val entry=PortableIdentity.create();val password="portable-test-password".toCharArray();val bytes=PortableIdentity.write(entry,password);val restored=PortableIdentity.read(bytes,password);assertArrayEquals(entry.certificate.publicKey.encoded,restored.certificate.publicKey.encoded);assertEquals((entry.privateKey as java.security.interfaces.ECPrivateKey).s,(restored.privateKey as java.security.interfaces.ECPrivateKey).s);val standard=java.security.KeyStore.getInstance("PKCS12").apply{load(bytes.inputStream(),password)};assertTrue(standard.isKeyEntry("clappa"));assertThrows(Exception::class.java){PortableIdentity.read(bytes,"wrong-password".toCharArray())};bytes[bytes.size/2]=(bytes[bytes.size/2].toInt() xor 1).toByte();assertThrows(Exception::class.java){PortableIdentity.read(bytes,password)}}
 @Test fun shortExportPasswordIsRejected(){assertThrows(IllegalArgumentException::class.java){PortableIdentity.write(PortableIdentity.create(),"short".toCharArray())}}
 private fun fixture(name:String)=javaClass.getResourceAsStream("/portable-$name.p12")!!.readBytes()
 @Test fun portableIdentitySignsAndKeepsFingerprintAcrossImports(){
  val first=PortableIdentity.read(fixture("p256"),"test-only-password".toCharArray())
  val second=PortableIdentity.read(fixture("p256"),"test-only-password".toCharArray())
  assertArrayEquals(first.certificate.publicKey.encoded,second.certificate.publicKey.encoded)
  val text="CLAPPA portable identity test".toByteArray()
  val sig=Signature.getInstance("SHA256withECDSA").run{initSign(first.privateKey);update(text);sign()}
  assertTrue(Signature.getInstance("SHA256withECDSA").run{initVerify(second.certificate.publicKey);update(text);verify(sig)})
 }
 @Test fun wrongPasswordAndUnsupportedCurveAreRejected(){
  assertThrows(Exception::class.java){PortableIdentity.read(fixture("p256"),"wrong".toCharArray())}
  assertThrows(IllegalArgumentException::class.java){PortableIdentity.read(fixture("p384"),"test-only-password".toCharArray())}
 }
 @Test fun corruptFileIsRejected(){assertThrows(Exception::class.java){PortableIdentity.read(byteArrayOf(1,2,3),charArrayOf())}}
}
