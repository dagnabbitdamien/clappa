#include "src/twitch-device-auth.h"
#include <QCoreApplication>
#include <iostream>
int main(int argc,char **argv){QCoreApplication app(argc,argv);
 if(!twitchActivationUrl(QUrl("https://www.twitch.tv/activate?device-code=TEST")))return 1;
 for(auto url:{"http://www.twitch.tv/activate","https://evil.invalid/activate","https://www.twitch.tv.evil.invalid/activate","https://user@www.twitch.tv/activate","https://www.twitch.tv:444/activate","https://www.twitch.tv/elsewhere"})if(twitchActivationUrl(QUrl(url)))return 2;
 if(!twitchChatToken("abcdefghij1234")||twitchChatToken("abc\r\nJOIN #other")||twitchChatToken("short")||twitchChatToken(QString(2049,'a')))return 3;
 bool callback=false;TwitchDeviceAuth auth(nullptr,[&](QString,QString){callback=true;},[&](QByteArray){callback=true;},[&](QString){callback=true;});auth.start();auth.cancel();QTimer::singleShot(100,&app,&QCoreApplication::quit);app.exec();if(callback)return 4;
 std::cout<<"PASS OAuth activation origin, token bounds/injection and cancelled callback checks\n";
}
