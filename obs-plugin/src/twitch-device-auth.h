#pragma once
#include <QObject>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QTimer>
#include <QElapsedTimer>
#include <QUrlQuery>
#include <QRegularExpression>
#include <functional>

inline bool twitchActivationUrl(const QUrl &url){return url.scheme()=="https"&&url.host()=="www.twitch.tv"&&url.path()=="/activate"&&url.userInfo().isEmpty()&&(url.port()==-1||url.port()==443);}
inline bool twitchChatToken(const QString &token){return QRegularExpression("^[A-Za-z0-9]{10,2048}$").match(token).hasMatch();}

// Twitch's documented device flow: credentials never enter proof storage.
class TwitchDeviceAuth final:public QObject {
    QNetworkAccessManager network;QTimer poll;QElapsedTimer age;
    QString device;int ttl=0,interval=5000,generation=0;bool active=false;
    std::function<void(QString,QString)> display;
    std::function<void(QByteArray)> complete;
    std::function<void(QString)> failure;
    static constexpr auto client="dohpa93i266ysl246z4b82zy9as97r";
    void fail(const QString &message){cancel();failure(message);}
    void post(const QString &endpoint,const QUrlQuery &form,std::function<void(int,QJsonObject)> callback){
        QNetworkRequest r{QUrl("https://id.twitch.tv/oauth2/"+endpoint)};
        r.setHeader(QNetworkRequest::ContentTypeHeader,"application/x-www-form-urlencoded");r.setTransferTimeout(10000);
        r.setAttribute(QNetworkRequest::RedirectPolicyAttribute,QNetworkRequest::ManualRedirectPolicy);
        auto reply=network.post(r,form.toString(QUrl::FullyEncoded).toUtf8());const auto version=generation;
        reply->setReadBufferSize(32769);
        connect(reply,&QNetworkReply::readyRead,this,[reply]{if(reply->bytesAvailable()>32768)reply->abort();});
        connect(reply,&QNetworkReply::finished,this,[this,reply,version,callback]{
            const auto code=reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
            const auto body=reply->readAll();const bool ok=reply->error()==QNetworkReply::NoError || code==400;
            reply->deleteLater();if(!active||version!=generation)return;
            if(body.size()>32768||!ok){fail("Twitch sign-in could not connect. Please try again.");return;}
            callback(code,QJsonDocument::fromJson(body).object());
        });
    }
    void exchange(){
        if(!active)return;if(age.elapsed()>=ttl){fail("Sign-in timed out. Please try again.");return;}
        QUrlQuery form;form.addQueryItem("client_id",client);form.addQueryItem("device_code",device);form.addQueryItem("scopes","chat:read");form.addQueryItem("grant_type","urn:ietf:params:oauth:grant-type:device_code");
        post("token",form,[this](int code,QJsonObject data){
            if(code==200){const auto value=data["access_token"].toString().toLatin1();
                if(!twitchChatToken(QString::fromLatin1(value))||!data["scope"].toArray().contains("chat:read")){fail("Twitch did not grant chat access.");return;}
                cancel();complete(value);return;
            }
            const auto message=data["message"].toString(data["error"].toString());
            if(code==400&&(message=="authorization_pending"||message=="slow_down")){if(message=="slow_down")interval=qMin(interval+5000,60000);poll.start(interval);return;}
            fail("Twitch sign-in was declined or expired. Please try again.");
        });
    }
public:
    TwitchDeviceAuth(QObject *parent,std::function<void(QString,QString)> show,std::function<void(QByteArray)> done,std::function<void(QString)> error):QObject(parent),display(std::move(show)),complete(std::move(done)),failure(std::move(error)){
        poll.setSingleShot(true);connect(&poll,&QTimer::timeout,this,[this]{exchange();});
    }
    void cancel(){active=false;++generation;poll.stop();device.clear();}
    void start(){
        cancel();active=true;QUrlQuery form;form.addQueryItem("client_id",client);form.addQueryItem("scopes","chat:read");
        post("device",form,[this](int code,QJsonObject data){
            const QUrl url(data["verification_uri"].toString());const auto userCode=data["user_code"].toString();
            device=data["device_code"].toString();const int seconds=data["expires_in"].toInt(),step=data["interval"].toInt();
            if(code!=200||!twitchActivationUrl(url)||device.size()<10||device.size()>2048||!QRegularExpression("^[A-Za-z0-9-]{4,32}$").match(userCode).hasMatch()||seconds<1||seconds>3600||step<1||step>60){fail("Twitch sign-in is unavailable. Check the CLAPPA app registration.");return;}
            ttl=seconds*1000;interval=qMax(5000,step*1000);age.start();display(userCode,url.toString());poll.start(interval);
        });
    }
};
