#include "src/chat-votes.h"
#include <QCoreApplication>
#include <iostream>
#include <stdexcept>
void require(bool b,const char *s){if(!b)throw std::runtime_error(s);}
QString message(QString user,QString id,QString text="🎬",QString room="demo",QString tags=""){
 return "@user-id="+user+";id="+id+";room-id=10"+tags+" :viewer!viewer@viewer.tmi.twitch.tv PRIVMSG #"+room+" :"+text;
}
int main(int argc,char **argv){QCoreApplication app(argc,argv);ChatVotes v;
 const auto hostile=parseChatCommand(message("1","hostile","hello NOTICE x RECONNECT 001 user ROOMSTATE #demo 366 user #demo"));
 require(hostile.command=="PRIVMSG"&&!hostile.server(),"viewer text cannot be an IRC control");
 const auto notice=parseChatCommand(":tmi.twitch.tv NOTICE * :Login authentication failed");
 require(notice.command=="NOTICE"&&notice.server(),"actual server notice");
 const auto ping=parseChatCommand("PING :tmi.twitch.tv");require(ping.command=="PING"&&ping.trailing=="tmi.twitch.tv","keepalive");
 const auto room=parseChatCommand("@room-id=10 :tmi.twitch.tv ROOMSTATE #demo");require(room.command=="ROOMSTATE"&&room.params.value(0)=="#demo"&&room.server(),"tagged server state");
 require(parseChatCommand("PRIVMSG #demo :fake\r\nRECONNECT").command.isEmpty(),"no newline injection");
 require(!v.ingest(message("1","a"),"demo",0),"first vote");
 require(!v.ingest(message("1","b","🎬🎬🎬🎬"),"demo",100),"one person cannot spam threshold");
 require(!v.ingest(message("2","a"),"demo",200),"duplicate message ID");
 require(!v.ingest(message("2","c"),"demo",300),"second distinct vote");
 require(v.ingest(message("3","d"),"demo",400),"three unique viewers trigger");
 for(int n=4;n<9;n++)require(!v.ingest(message(QString::number(n),QString::number(n)),"demo",500),"cooldown");
 v.clear();require(!v.ingest(message("1","a"),"demo",0),"new first");
 require(!v.ingest(message("2","b"),"demo",16000),"expired first");
 require(!v.ingest(message("3","c"),"demo",16001),"only two live votes");
 require(v.ingest(message("4","d"),"demo",16002),"window threshold");
 v.clear();require(!v.ingest(message("1","a","hello"),"demo",0),"non emoji");
 require(!v.ingest(message("1","b","🎬","elsewhere"),"demo",0),"wrong channel");
 require(!v.ingest(message("1","c","🎬","demo",";source-room-id=11"),"demo",0),"shared chat relay");
 require(!v.ingest(message("","d"),"demo",0),"missing authenticated ID");
 require(!v.ingest(message("abc","e"),"demo",0),"invalid ID");
 require(!v.ingest(message("1",""),"demo",0),"missing message ID");
 require(!v.ingest(QString(9000,'x'),"demo",0),"oversize");
 require(!v.ingest(message("1","f"),"demo",0),"first valid");
 require(!v.ingest(message("2","g"),"demo",1),"second valid");
 require(v.ingest(message("3","h"),"demo",2),"third valid");
 std::cout<<"Chat vote checks passed (distinct users, spam, replay, expiry, cooldown, room and bounds).\n";
}
