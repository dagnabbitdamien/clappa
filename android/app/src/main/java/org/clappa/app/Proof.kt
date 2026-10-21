package org.clappa.app

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.security.keystore.KeyProtection
import android.content.Context
import android.util.Base64
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.math.BigInteger
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.MessageDigest
import java.security.SecureRandom
import java.security.Signature
import java.security.spec.ECGenParameterSpec

object Proof {
    private lateinit var preferences: android.content.SharedPreferences
    fun initialize(context:Context){preferences=context.getSharedPreferences("identity",Context.MODE_PRIVATE)}
    private fun alias()=preferences.getString("activeAlias","clappa-v02")!!
    fun importIdentity(bytes:ByteArray,password:CharArray):String {
        return activate(PortableIdentity.read(bytes,password))
    }
    fun createPortableIdentity():String=activate(PortableIdentity.create())
    fun canExportIdentity()=preferences.contains("backup-"+alias())
    private fun wrappingKey():javax.crypto.SecretKey {
        val name="clappa-backup-wrap-v1"
        if(!store().containsAlias(name))javax.crypto.KeyGenerator.getInstance("AES","AndroidKeyStore").apply{init(KeyGenParameterSpec.Builder(name,KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).setKeySize(256).build())}.generateKey()
        return store().getKey(name,null) as javax.crypto.SecretKey
    }
    private fun activate(entry:KeyStore.PrivateKeyEntry):String {
        val pub=entry.certificate.publicKey
        val id=hash(pub.encoded);val target="clappa-import-$id"
        val privateBytes=checkNotNull(entry.privateKey.encoded);val cert=entry.certificate.encoded
        val plain=java.nio.ByteBuffer.allocate(4+privateBytes.size+cert.size).putInt(privateBytes.size).put(privateBytes).put(cert).array()
        val wrapped=try{val c=javax.crypto.Cipher.getInstance("AES/GCM/NoPadding");c.init(javax.crypto.Cipher.ENCRYPT_MODE,wrappingKey());c.updateAAD(target.toByteArray());c.iv+c.doFinal(plain)}finally{plain.fill(0);privateBytes.fill(0)}
        store().setEntry(target,entry,KeyProtection.Builder(KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY).setDigests(KeyProperties.DIGEST_SHA256).build())
        check(preferences.edit().putString("backup-$target",b64(wrapped)).putString("activeAlias",target).commit()){"Could not activate identity"}
        return id
    }
    fun exportIdentity(password:CharArray):ByteArray {
        val target=alias();val bytes=unb64(checkNotNull(preferences.getString("backup-$target",null)){"This older identity cannot be exported"})
        val c=javax.crypto.Cipher.getInstance("AES/GCM/NoPadding");c.init(javax.crypto.Cipher.DECRYPT_MODE,wrappingKey(),javax.crypto.spec.GCMParameterSpec(128,bytes.copyOfRange(0,12)));c.updateAAD(target.toByteArray());val plain=c.doFinal(bytes.copyOfRange(12,bytes.size))
        try{val buffer=java.nio.ByteBuffer.wrap(plain);val size=buffer.int;require(size in 1..buffer.remaining());val pk=ByteArray(size);buffer.get(pk);val cert=ByteArray(buffer.remaining());buffer.get(cert)
            val privateKey=try{java.security.KeyFactory.getInstance("EC").generatePrivate(java.security.spec.PKCS8EncodedKeySpec(pk))}finally{pk.fill(0)}
            val certificate=java.security.cert.CertificateFactory.getInstance("X.509").generateCertificate(cert.inputStream())
            return PortableIdentity.write(KeyStore.PrivateKeyEntry(privateKey,arrayOf(certificate)),password)
        }finally{plain.fill(0)}
    }
    private val random = SecureRandom()
    private val n = BigInteger("ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551",16)
    fun id() = ByteArray(16).also(random::nextBytes).joinToString("") { "%02x".format(it) }
    fun choice(n: Int) = random.nextInt(n)
    fun hash(bytes: ByteArray) = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
    fun b64(bytes: ByteArray): String = Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)
    fun unb64(text: String): ByteArray = Base64.decode(text,Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)
    private fun quoted(s: String): String {
        val out=StringBuilder("\""); var i=0
        while(i<s.length) { val c=s[i]
            when(c) { '"' -> out.append("\\\""); '\\' -> out.append("\\\\"); '\b' -> out.append("\\b"); '\u000c' -> out.append("\\f"); '\n' -> out.append("\\n"); '\r' -> out.append("\\r"); '\t' -> out.append("\\t")
                else -> { if(c.code<32) out.append("\\u%04x".format(c.code)) else { if(c.isHighSurrogate()) { require(i+1<s.length&&s[i+1].isLowSurrogate());out.append(c);i++;out.append(s[i]) } else { require(!c.isLowSurrogate());out.append(c) } } }
            };i++
        };return out.append('"').toString()
    }
    // Protocol fields use integers only; floating point is deliberately not accepted.
    fun canonical(v: Any?): String = when(v) {
        null, JSONObject.NULL -> "null"
        is JSONObject -> v.keys().asSequence().toList().sorted().joinToString(",","{","}") { quoted(it)+":"+canonical(v.get(it)) }
        is JSONArray -> (0 until v.length()).joinToString(",","[","]") { canonical(v.get(it)) }
        is String -> quoted(v)
        is Boolean -> v.toString()
        is Int, is Long -> { require((v as Number).toLong() in -9007199254740991L..9007199254740991L);v.toString() }
        else -> error("Unsupported JSON field")
    }
    private fun store(): KeyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    fun ensureKey() {
        if(store().containsAlias(alias())) return
        check(!preferences.contains("activeAlias")){"Signing identity is unavailable"}
        createPortableIdentity()
    }
    fun publicKey(): JSONObject {
        ensureKey();val bytes=store().getCertificate(alias()).publicKey.encoded
        return JSONObject().put("protocol","0.3").put("algorithm","ES256-P1363").put("key_id",hash(bytes)).put("spki",b64(bytes))
    }
    fun signed(payload: JSONObject): JSONObject {
        val signer=Signature.getInstance("SHA256withECDSA");signer.initSign(store().getKey(alias(),null) as java.security.PrivateKey);signer.update(canonical(payload).toByteArray(Charsets.UTF_8))
        val der=signer.sign();require(der[0].toInt()==0x30&&der[2].toInt()==2);val rlen=der[3].toInt() and 255;val pos=4+rlen;require(der[pos].toInt()==2);val slen=der[pos+1].toInt() and 255
        val r=BigInteger(1,der.copyOfRange(4,pos));var s=BigInteger(1,der.copyOfRange(pos+2,pos+2+slen));if(s>n.shiftRight(1))s=n-s
        fun fixed(v:BigInteger):ByteArray {val a=v.toByteArray();return ByteArray(32).also {a.copyInto(it,32-minOf(a.size,32),maxOf(0,a.size-32))}}
        return JSONObject().put("payload",payload).put("signature",b64(fixed(r)+fixed(s)))
    }
    fun atomic(file: File, value: JSONObject) {file.parentFile?.mkdirs();val tmp=File(file.path+".tmp");tmp.outputStream().use {it.write((canonical(value)+"\n").toByteArray());it.fd.sync()};check(tmp.renameTo(file)) { "Cannot save proof" }}
}


