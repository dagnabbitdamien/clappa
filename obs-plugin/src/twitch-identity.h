#pragma once
#include "json.hpp"
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QCryptographicHash>
#include <QDateTime>
#include <mbedtls/pk.h>
#include <mbedtls/rsa.h>
#include <set>
#include <regex>

// Only this fixed, HTTPS-authenticated issuer endpoint supplies trusted RSA keys.
class TwitchIdentityVerifier {
 using J=nlohmann::json;
 QNetworkAccessManager network;
 J keys;
 qint64 requested=0;
 bool fetching=false;
 static void need(bool b){if(!b)throw std::runtime_error("Invalid Twitch identity");}
 static QByteArray decode(const J &j){auto s=QByteArray::fromStdString(j.get<std::string>());auto b=QByteArray::fromBase64(s,QByteArray::Base64UrlEncoding);need(b.toBase64(QByteArray::Base64UrlEncoding|QByteArray::OmitTrailingEquals)==s);return b;}
 static J parse(const QByteArray &b){std::vector<std::set<std::string>> keys;return J::parse(b.constData(),b.constData()+b.size(),[&](int depth,J::parse_event_t e,J &v){need(depth<24);if(e==J::parse_event_t::object_start)keys.emplace_back();if(e==J::parse_event_t::key)need(keys.back().insert(v.get<std::string>()).second);if(e==J::parse_event_t::object_end)keys.pop_back();return true;});}
public:
#ifdef CLAPPA_IDENTITY_TEST
 void provisionTestKeys(const J &value){keys=value;requested=QDateTime::currentMSecsSinceEpoch();}
#endif
 void refresh(){const auto now=QDateTime::currentMSecsSinceEpoch();if(fetching||(requested&&now-requested<60000)||(!keys.is_null()&&now-requested<3600000))return;requested=now;fetching=true;
  QNetworkRequest request(QUrl("https://id.twitch.tv/oauth2/keys"));request.setTransferTimeout(8000);request.setAttribute(QNetworkRequest::RedirectPolicyAttribute,QNetworkRequest::ManualRedirectPolicy);
  auto reply=network.get(request);reply->setReadBufferSize(65537);
  QObject::connect(reply,&QNetworkReply::readyRead,reply,[reply]{if(reply->bytesAvailable()>65536)reply->abort();});
  QObject::connect(reply,&QNetworkReply::finished,&network,[this,reply]{fetching=false;try{need(reply->error()==QNetworkReply::NoError&&reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt()==200);auto raw=reply->readAll();need(raw.size()<=65536);auto value=parse(raw);need(value.at("keys").is_array()&&value["keys"].size()<=32);keys=value;}catch(...){}reply->deleteLater();});
 }
 QString verifiedName(const J &e,const std::string &keyId){refresh();try{
  need(e.is_object()&&e.size()==4&&e.at("profile")=="CLAPPA-TWITCH-OIDC-v1"&&e.at("client_id")=="dohpa93i266ysl246z4b82zy9as97r");
  auto salt=e.at("salt").get<std::string>();need(std::regex_match(salt,std::regex("[a-f0-9]{64}"))&&std::regex_match(keyId,std::regex("[a-f0-9]{64}")));
  auto token=QByteArray::fromStdString(e.at("id_token").get<std::string>());need(token.size()<=8192);auto parts=token.split('.');need(parts.size()==3);
  auto h=parse(decode(parts[0].toStdString())),c=parse(decode(parts[1].toStdString()));need(h.at("alg")=="RS256"&&!h.contains("crit")&&!h.contains("jku")&&!h.contains("jwk")&&!h.contains("x5u"));
  J jwk;int matches=0;for(auto &k:keys.at("keys"))if(k.at("kid")==h.at("kid")){jwk=k;matches++;}need(matches==1&&jwk.at("kty")=="RSA"&&jwk.value("alg","RS256")=="RS256"&&jwk.value("use","sig")=="sig");
  auto n=decode(jwk.at("n")),exponent=decode(jwk.at("e"));need(n.size()>=256&&n.size()<=512&&exponent==QByteArray::fromHex("010001"));
  mbedtls_pk_context pk;mbedtls_pk_init(&pk);struct Cleanup{mbedtls_pk_context *p;~Cleanup(){mbedtls_pk_free(p);}} cleanup{&pk};
  need(mbedtls_pk_setup(&pk,mbedtls_pk_info_from_type(MBEDTLS_PK_RSA))==0);auto rsa=mbedtls_pk_rsa(pk);
  need(mbedtls_rsa_import_raw(rsa,(const unsigned char*)n.constData(),n.size(),nullptr,0,nullptr,0,nullptr,0,(const unsigned char*)exponent.constData(),exponent.size())==0&&mbedtls_rsa_complete(rsa)==0&&mbedtls_rsa_check_pubkey(rsa)==0);
  auto digest=QCryptographicHash::hash(parts[0]+"."+parts[1],QCryptographicHash::Sha256),sig=decode(parts[2].toStdString());need(mbedtls_pk_verify(&pk,MBEDTLS_MD_SHA256,(const unsigned char*)digest.constData(),digest.size(),(const unsigned char*)sig.constData(),sig.size())==0);
  need(c.at("iss")=="https://id.twitch.tv/oauth2"&&c.at("aud")==e.at("client_id")&&c.value("azp",e.at("client_id"))==e.at("client_id"));
  QByteArray nonce("CLAPPA-TWITCH-OIDC-v1");nonce.append('\0');nonce.append(QByteArray::fromStdString(keyId));nonce.append('\0');nonce.append(QByteArray::fromStdString(salt));need(c.at("nonce")==QCryptographicHash::hash(nonce,QCryptographicHash::Sha256).toHex().toStdString());
  need(c.at("iat").is_number_integer()&&c.at("exp").is_number_integer());auto iat=c.at("iat").get<qint64>(),exp=c.at("exp").get<qint64>();need(iat>=0&&iat<=QDateTime::currentSecsSinceEpoch()+60&&exp>iat&&exp<=8640000000000LL);
  need(std::regex_match(c.at("sub").get<std::string>(),std::regex("[0-9]{1,30}")));auto name=QString::fromStdString(c.at("preferred_username").get<std::string>());need(name.size()>=1&&name.size()<=64);for(auto ch:name)need(ch.unicode()>=32&&ch.unicode()!=127&&!(ch.unicode()>=0x202a&&ch.unicode()<=0x202e)&&!(ch.unicode()>=0x2066&&ch.unicode()<=0x2069));return name;
 }catch(...){return {};}}
};
