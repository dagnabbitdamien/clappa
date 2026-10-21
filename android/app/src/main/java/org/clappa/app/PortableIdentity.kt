package org.clappa.app

import java.security.*
import java.security.spec.ECGenParameterSpec

/** Validates a portable identity before touching Android Keystore or active identity. */
internal object PortableIdentity {
    private val provider=org.bouncycastle.jce.provider.BouncyCastleProvider()
    fun create():KeyStore.PrivateKeyEntry {
        val pair=KeyPairGenerator.getInstance("EC").apply{initialize(ECGenParameterSpec("secp256r1"))}.generateKeyPair()
        val name=org.bouncycastle.asn1.x500.X500Name("CN=CLAPPA signing identity")
        val now=System.currentTimeMillis()
        val builder=org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder(name,java.math.BigInteger(128,SecureRandom()).add(java.math.BigInteger.ONE),java.util.Date(now-86400000),java.util.Date(now+315360000000L),name,pair.public)
        val signer=org.bouncycastle.operator.jcajce.JcaContentSignerBuilder("SHA256withECDSA").setProvider(provider).build(pair.private)
        val cert=org.bouncycastle.cert.jcajce.JcaX509CertificateConverter().setProvider(provider).getCertificate(builder.build(signer))
        return KeyStore.PrivateKeyEntry(pair.private,arrayOf(cert))
    }
    fun write(entry:KeyStore.PrivateKeyEntry,password:CharArray):ByteArray {
        require(password.size>=12){"Use a backup password of at least 12 characters"}
        val cert=entry.certificate as java.security.cert.X509Certificate
        val id=org.bouncycastle.asn1.DEROctetString(MessageDigest.getInstance("SHA-256").digest(cert.publicKey.encoded))
        val encryptor=org.bouncycastle.pkcs.jcajce.JcePKCSPBEOutputEncryptorBuilder(org.bouncycastle.asn1.nist.NISTObjectIdentifiers.id_aes256_CBC).setProvider(provider).setPRF(org.bouncycastle.asn1.x509.AlgorithmIdentifier(org.bouncycastle.asn1.pkcs.PKCSObjectIdentifiers.id_hmacWithSHA256)).setIterationCount(600000).build(password)
        fun label(b:org.bouncycastle.pkcs.PKCS12SafeBagBuilder)=b.addBagAttribute(org.bouncycastle.asn1.pkcs.PKCSObjectIdentifiers.pkcs_9_at_friendlyName,org.bouncycastle.asn1.DERBMPString("CLAPPA")).addBagAttribute(org.bouncycastle.asn1.pkcs.PKCSObjectIdentifiers.pkcs_9_at_localKeyId,id).build()
        return org.bouncycastle.pkcs.PKCS12PfxPduBuilder().addData(label(org.bouncycastle.pkcs.jcajce.JcaPKCS12SafeBagBuilder(entry.privateKey,encryptor))).addData(label(org.bouncycastle.pkcs.jcajce.JcaPKCS12SafeBagBuilder(cert))).build(org.bouncycastle.pkcs.jcajce.JcePKCS12MacCalculatorBuilder(org.bouncycastle.asn1.nist.NISTObjectIdentifiers.id_sha256).setProvider(provider).setIterationCount(600000),password).encoded
    }
    fun read(bytes:ByteArray,password:CharArray):KeyStore.PrivateKeyEntry {
        val source=KeyStore.getInstance("PKCS12",provider).apply{load(bytes.inputStream(),password)}
        val names=source.aliases().toList().filter{source.isKeyEntry(it)}
        require(names.size==1){"Choose a PKCS#12 file containing one P-256 signing identity"}
        val entry=source.getEntry(names.single(),KeyStore.PasswordProtection(password)) as? KeyStore.PrivateKeyEntry
            ?:error("The file has no private signing key")
        val pub=entry.certificate.publicKey as? java.security.interfaces.ECPublicKey ?:error("P-256 EC key required")
        val expected=java.security.AlgorithmParameters.getInstance("EC").apply{init(ECGenParameterSpec("secp256r1"))}.getParameterSpec(java.security.spec.ECParameterSpec::class.java)
        require(pub.params.curve==expected.curve&&pub.params.generator==expected.generator&&pub.params.order==expected.order&&pub.params.cofactor==expected.cofactor){"Only P-256 keys are supported by protocol 0.3"}
        val probe=ByteArray(32).also(java.security.SecureRandom()::nextBytes)
        val signature=Signature.getInstance("SHA256withECDSA").run{initSign(entry.privateKey);update(probe);sign()}
        require(Signature.getInstance("SHA256withECDSA").run{initVerify(pub);update(probe);verify(signature)}){"Private key and certificate do not match"}
        return entry
    }
}

