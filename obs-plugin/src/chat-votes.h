#pragma once
#include <QString>
#include <QHash>
#include <QRegularExpression>
#include <QStringList>

struct ChatCommand {
    QString prefix,command,trailing;
    QStringList params;
    bool server()const{return prefix=="tmi.twitch.tv";}
};
inline ChatCommand parseChatCommand(QString line){
    ChatCommand out;
    if(line.size()>8192||line.contains('\r')||line.contains('\n'))return out;
    if(line.startsWith('@')){auto end=line.indexOf(' ');if(end<0)return out;line=line.mid(end+1);}
    if(line.startsWith(':')){auto end=line.indexOf(' ');if(end<0)return out;out.prefix=line.mid(1,end-1);line=line.mid(end+1);}
    auto end=line.indexOf(" :");
    if(end>=0){out.trailing=line.mid(end+2);line=line.left(end);}
    auto fields=line.split(' ',Qt::SkipEmptyParts);if(fields.isEmpty())return out;
    out.command=fields.takeFirst();out.params=fields;return out;
}

// Only authenticated Twitch user IDs count; message text is never retained.
class ChatVotes {
    QHash<QString,qint64> voters, messages;
    qint64 coolingUntil=0;
public:
    void clear(){voters.clear();messages.clear();coolingUntil=0;}
    bool ingest(const QString &line,const QString &channel,qint64 now){
        if(line.size()>8192||now<coolingUntil||!line.startsWith('@'))return false;
        auto end=line.indexOf(' ');if(end<0)return false;
        QHash<QString,QString> tags;
        for(const auto &tag:line.mid(1,end-1).split(';')){auto eq=tag.indexOf('=');if(eq>0)tags.insert(tag.left(eq),tag.mid(eq+1));}
        auto rest=line.mid(end+1);
        if(!rest.startsWith(':'))return false;
        auto prefixEnd=rest.indexOf(' ');if(prefixEnd<0)return false;
        rest=rest.mid(prefixEnd+1);
        const auto expected="PRIVMSG #"+channel+" :";
        if(!rest.startsWith(expected)||!rest.mid(expected.size()).contains(QString::fromUtf8("\xF0\x9F\x8E\xAC")))return false;
        // Shared-chat relays do not count as viewers of the selected room.
        if(!tags.value("source-room-id").isEmpty()&&tags.value("source-room-id")!=tags.value("room-id"))return false;
        const auto uid=tags.value("user-id"),id=tags.value("id");
        if(!QRegularExpression("^[0-9]{1,25}$").match(uid).hasMatch()||id.isEmpty()||id.size()>100)return false;
        for(auto i=voters.begin();i!=voters.end();)if(now-i.value()>15000)i=voters.erase(i);else ++i;
        for(auto i=messages.begin();i!=messages.end();)if(now-i.value()>120000)i=messages.erase(i);else ++i;
        if(messages.contains(id))return false;
        if(messages.size()>=4096)messages.erase(messages.begin());
        messages.insert(id,now);
        if(!voters.contains(uid))voters.insert(uid,now);
        if(voters.size()<3)return false;
        voters.clear();coolingUntil=now+120000;return true;
    }
};
