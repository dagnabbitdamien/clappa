#pragma once
#include <QDateTime>
#include <QDir>
#include <QFile>
#include <QFileInfo>
#include <QJsonDocument>
#include <QJsonObject>
#include <QSaveFile>
#include <QUrl>

// Convenience metadata only. Verification continues to use the signed proof.
namespace SessionSummary {
inline bool put(const QString &path,const QByteArray &bytes){QSaveFile f(path);return f.open(QIODevice::WriteOnly)&&f.write(bytes)==bytes.size()&&f.commit();}
inline QJsonObject read(const QString &path){QFile f(path);return f.open(QIODevice::ReadOnly)?QJsonDocument::fromJson(f.readAll()).object():QJsonObject();}
inline void index(const QString &root){
 QDir sessions(root+"/sessions");sessions.mkpath(".");
 QString html="<!doctype html><meta charset='utf-8'><title>CLAPPA recordings</title><style>body{font:16px system-ui;background:#24231f;color:#eeeade;margin:40px}a{color:#b6dec7}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:14px;border-bottom:1px solid #555}small{color:#bbb}</style><h1>CLAPPA recordings</h1><p>Open a session for its photographs and signed proof. These summaries help you find files; use the verifier to check integrity.</p><table><tr><th>Started / folder created</th><th>Recording</th><th>Duration</th><th>Files</th><th>Seal</th></tr>";
 for(const auto &dir:sessions.entryInfoList(QDir::Dirs|QDir::NoDotAndDotDot,QDir::Time)){
  auto m=read(dir.filePath()+"/session-info.json");auto time=m["started_local"].toString();
  if(time.isEmpty())time=dir.birthTime().toLocalTime().toString(Qt::ISODate)+" (folder created)";
  const auto base=QString::fromLatin1(QUrl::toPercentEncoding(dir.fileName()));
  const auto seconds=m["duration_seconds"].toDouble(-1);QString duration=seconds<0?"Not recorded":QString::number(qRound64(seconds)/60)+"m "+QString::number(qRound64(seconds)%60)+"s";
  const bool sealed=QFile::exists(dir.filePath()+"/proof/final-seal.json");
  html+="<tr><td>"+time.toHtmlEscaped()+"</td><td>"+m["recording_filename"].toString("Not recorded").toHtmlEscaped()+"</td><td>"+duration+"</td><td><a href='"+base+"/proof/'>Proof folder</a> · <a href='"+base+"/proof/images/'>Photos</a>";
  if(!m.isEmpty())html+=" · <a href='"+base+"/SESSION.txt'>Summary</a>";
  html+="</td><td>"+QString(sealed?"Present; not yet verified":"Not present")+"</td></tr>";
 }
 html+="</table><p><small>Duration is elapsed OBS session time. An older session may have no summary. Seal presence is not a verification result.</small></p>";put(sessions.filePath("Sessions.html"),html.toUtf8());
}
inline void write(const QString &root,const QString &id,const QString &recordingId,qint64 started,qint64 ended,qint64 duration,bool active,const QString &media){
 const auto folder=root+"/sessions/"+id;QDir().mkpath(folder);
 const auto local=QDateTime::fromMSecsSinceEpoch(started).toLocalTime().toString(Qt::ISODate);
 const bool sealed=QFile::exists(folder+"/proof/final-seal.json");
 QJsonObject data{{"description","CLAPPA recording session"},{"session_id",id},{"recording_id",recordingId},{"started_local",local},{"started_utc",QDateTime::fromMSecsSinceEpoch(started,Qt::UTC).toString(Qt::ISODate)},{"duration_seconds",duration/1000.0},{"duration_basis","Elapsed OBS session time"},{"recording_filename",QFileInfo(media).fileName()},{"recording_path",media},{"photos","proof/images"},{"proof","proof"},{"recording_active",active},{"final_seal_present",sealed},{"summary_is_signed",false}};
 if(ended)data["ended_utc"]=QDateTime::fromMSecsSinceEpoch(ended,Qt::UTC).toString(Qt::ISODate);
 const auto previous=read(folder+"/session-info.json");if(previous==data)return;
 put(folder+"/session-info.json",QJsonDocument(data).toJson());
 const auto text=QString("CLAPPA recording\n\nStarted: %1\nDuration: %2m %3s (elapsed OBS session time)\nRecording: %4\nPhotographs: proof/images\nSigned evidence: proof\nFinal seal: %5\n\nThis summary is for browsing, not verification. Use the verifier with the original recording and proof folder.\n").arg(local).arg(duration/60000).arg((duration/1000)%60).arg(media.isEmpty()?"Recording in progress":media).arg(sealed?"present (not verified)":"not present");
 put(folder+"/SESSION.txt",text.toUtf8());
 // The recording's own summary stays current. Avoid rescanning every previous
 // session on OBS's UI thread for each duration tick; Browse explicitly refreshes.
 if(previous.isEmpty()||previous["recording_active"]!=data["recording_active"]||previous["final_seal_present"]!=data["final_seal_present"]||previous["recording_path"]!=data["recording_path"])index(root);
}
}
