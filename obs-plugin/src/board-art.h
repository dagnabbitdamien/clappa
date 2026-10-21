#pragma once
#include <QPainter>
#include <QDateTime>
#include <QPainterPath>
#include <cmath>

// Two 32-unit jaws: mirror the lower stripe about their contact edge.
namespace BoardArt {
inline constexpr int Width=872, Height=480, BoardWidth=848, BoardHeight=440;
inline void digital(QPainter &p, const QString &s, double x, double y, double scale) {
 p.save();p.translate(x,y);p.scale(scale,scale);p.setPen(Qt::NoPen);p.setBrush(QColor("#eeeade"));
 const int masks[]={119,36,93,109,46,107,123,37,127,111};
 const QRectF segments[]={{4,0,12,3.4},{0,4,3.4,10},{17,4,3.4,10},{4,14.5,12,3.5},{0,18.5,3.4,10},{17,18.5,3.4,10},{4,29,12,3.4}};
 for(auto ch:s){if(ch.isDigit()){p.setBrush(QColor(0,0,0,38));p.drawRoundedRect(QRectF(-1,-1,22.4,34.4),1,1);p.setBrush(QColor("#eeeade"));int m=masks[ch.digitValue()];for(int i=0;i<7;i++)if(m&(1<<i))p.drawRoundedRect(segments[i],1,1);p.translate(24,0);}else{if(ch==':'){p.drawEllipse(QRectF(2,9,3,3));p.drawEllipse(QRectF(2,22,3,3));}p.translate(9,0);}}p.restore();
}
inline void jaw(QPainter &p,bool fixed) {
 p.save();p.setClipRect(QRectF(0,fixed?32:0,848,32));
 p.fillRect(QRectF(0,fixed?32:0,848,32),QColor(fixed?"#d8d4c9":"#eeeade"));p.setBrush(QColor("#171715"));p.setPen(Qt::NoPen);
 for(int x=-80;x<880;x+=80) {
  if(fixed)p.drawPolygon(QPolygonF({{double(x+32),32},{double(x+72),32},{double(x+40),64},{double(x),64}}));
  else p.drawPolygon(QPolygonF({{double(x),0},{double(x+40),0},{double(x+72),32},{double(x+32),32}}));
 }
 if(fixed){QLinearGradient contact(0,32,0,39);contact.setColorAt(0,QColor(0,0,0,105));contact.setColorAt(1,Qt::transparent);p.fillRect(QRectF(0,32,848,7),contact);}
 else {p.fillRect(QRectF(0,0,848,1),QColor(255,255,255,65));p.fillRect(QRectF(0,30.5,848,1.5),QColor(0,0,0,70));}
 p.restore();
}
inline void bar(QPainter &p,double angle=0) {
 p.save();p.translate(14,16);p.rotate(-angle);p.translate(-14,-16);jaw(p,false);p.restore();
}
inline void bracket(QPainter &p) {
 p.setPen(QPen(QColor("#a7a79f"),1));p.setBrush(QColor("#777970"));
 p.drawPolygon(QPolygonF({{0,0},{23,0},{46,59},{42,64},{0,64}}));
 for(auto v:{QPointF(14,16),QPointF(11,52),QPointF(33,52)}){p.setBrush(QColor("#d2d2c8"));p.drawEllipse(v,4,4);p.drawLine(v+QPointF(-2,0),v+QPointF(2,0));}
}
inline void tail(QPainter &p,bool frontOnly=false){
 // One continuous silhouette; depth comes from board occlusion, not erased pixels.
 QPainterPath shape;shape.moveTo(25,459);shape.cubicTo(28,415,12,396,-17,382);
 if(frontOnly)shape.lineTo(-14,337);
 else {
  // Broad brush, soft irregular lobes, and a tapered return behind the slate.
  shape.cubicTo(-51,369,-77,352,-80,321);shape.cubicTo(-85,320,-85,316,-83,310);
  shape.cubicTo(-86,283,-70,261,-47,256);shape.cubicTo(-46,250,-41,252,-36,252);
  shape.cubicTo(-12,248,10,263,13,282);shape.cubicTo(17,299,7,317,-5,319);
  shape.cubicTo(0,304,-7,292,-19,294);shape.cubicTo(-39,297,-39,324,-14,337);
 }
 shape.cubicTo(14,352,47,366,57,395);shape.cubicTo(65,417,64,444,61,459);shape.closeSubpath();
 p.save();p.setPen(Qt::NoPen);
 // Sample only opaque interior paper from the approved tail resource. The
 // explicit silhouette supplies every edge, so its old matte is never drawn.
 p.setClipPath(shape,Qt::IntersectClip);p.fillPath(shape,QColor("#554635"));p.drawImage(QRectF(-90,246,160,220),QImage(":/clappa/obs-tail.png").copy(60,160,90,100));
 QLinearGradient shade(-65,275,60,445);shade.setColorAt(0,QColor(0,0,0,0));shade.setColorAt(1,QColor(0,0,0,70));p.setBrush(shade);p.drawPath(shape);p.restore();
}
// The preview is a transparent arrangement of individually mounted prints.
// Every print keeps its source aspect ratio; the source canvas stays stable in OBS.
inline QImage mountedPhotos(const QImage &front,const QImage &rear=QImage()){
 QImage image(1476,876,QImage::Format_ARGB32_Premultiplied);image.fill(Qt::transparent);
 QPainter p(&image);p.setRenderHint(QPainter::SmoothPixmapTransform);p.setRenderHint(QPainter::Antialiasing);
 const bool dual=!rear.isNull();const double gap=30,available=dual?1446:1476;
 const double r1=double(front.width())/front.height(),r2=dual?double(rear.width())/rear.height():0;
 const double h=std::min(810.,(available-(dual?48:24))/(r1+r2));
 const double total=h*(r1+r2)+(dual?48+gap:24);double x=(1476-total)/2;
 for(const auto &photo:dual?QList<QImage>{front,rear}:QList<QImage>{front}){
  const double w=h*photo.width()/photo.height(),y=(876-h-36)/2;
  QRectF frame(x,y,w+24,h+36),picture(x+12,y+12,w,h);
  p.fillRect(frame.translated(5,8),QColor(0,0,0,90));p.fillRect(frame,QColor("#f5f0e5"));p.drawImage(picture,photo);
  p.save();p.translate(frame.center().x(),y+6);p.rotate(x<738?-5:5);p.fillRect(QRectF(-50,-18,100,36),QColor("#c7b991"));p.restore();
  x+=w+24+gap;
 }
 return image;
}
inline void drawPhoto(QPainter &p,const QImage &photo){
 p.save();p.setRenderHint(QPainter::SmoothPixmapTransform);p.drawImage(QRectF(10,76,504,299),photo);p.restore();
}
inline QImage dualPhoto(const QImage &front,const QImage &rear){return mountedPhotos(front,rear);}
inline QImage proof(const QImage &photo,const QImage &qr,qint64 at,const QString &prompt,bool fresh=false,const QString &twitchName={}) {
 QImage im(Width*3,Height*3,QImage::Format_ARGB32_Premultiplied);im.fill(Qt::transparent);QPainter p(&im);p.setRenderHint(QPainter::Antialiasing);p.setRenderHint(QPainter::TextAntialiasing);p.scale(3,3);p.translate(12,40);
 p.fillRect(QRectF(0,32,848,408),QColor("#2d2c27"));
 p.setPen(QPen(QColor(255,255,255,25),1));p.drawLine(1,65,1,438);p.drawLine(1,438,846,438);
 jaw(p,true);

 drawPhoto(p,photo);

 p.setPen(QColor("#f2eee4"));QFont caption("Arial");caption.setPixelSize(prompt.size()>32?16:18);caption.setWeight(QFont::DemiBold);p.setFont(caption);const int captionWidth=twitchName.isEmpty()?600:520;p.drawText(QRectF(16,380,captionWidth,26),Qt::AlignLeft|Qt::AlignVCenter,QFontMetrics(caption).elidedText(prompt,Qt::ElideRight,captionWidth));
 const double side=qr.width()/3.;const QRectF square(682-side/2,226-side/2,side,side);auto mount=square.adjusted(-5,-5,5,5);
 p.fillRect(mount.translated(3,4),QColor(0,0,0,80));p.setPen(QPen(QColor("#858780"),1));p.setBrush(QColor("#44443d"));p.drawRoundedRect(mount,5,5);
 p.setRenderHint(QPainter::SmoothPixmapTransform,false);p.drawImage(square,qr);
 p.setPen(QPen(QColor("#88887f"),1));p.setBrush(QColor("#c3c3b8"));for(auto v:{mount.topLeft()+QPointF(3,3),mount.topRight()+QPointF(-3,3),mount.bottomLeft()+QPointF(3,-3),mount.bottomRight()+QPointF(-3,-3)})p.drawEllipse(v,1.8,1.8);
 p.setPen(QColor("#f2eee4"));QFont logo("Arial");logo.setPixelSize(24);logo.setBold(true);logo.setItalic(true);p.setFont(logo);p.drawText(QRectF(717,402,111,32),Qt::AlignRight|Qt::AlignVCenter,"CLAPPA");
 if(!twitchName.isEmpty()){QFont account("Arial");account.setPixelSize(16);account.setBold(true);p.setFont(account);p.setPen(QColor("#eeeade"));const auto label=QFontMetrics(account).elidedText(twitchName,Qt::ElideRight,232);const auto width=QFontMetrics(account).horizontalAdvance(label);p.save();p.setRenderHint(QPainter::SmoothPixmapTransform);p.drawImage(QRectF(802-width-26,383,18,18),QImage(":/clappa/glitch_flat_white.png"));p.restore();p.drawText(QRectF(802-width,380,width,25),Qt::AlignVCenter,label);p.setPen(QColor("#a5d6aa"));p.drawText(QRectF(810,380,22,25),Qt::AlignVCenter,"✓");}
 auto stamp=QDateTime::fromMSecsSinceEpoch(at,Qt::UTC);
 p.setPen(QColor("#f2eee4"));
 QFont label("Arial");label.setPixelSize(15);label.setBold(true);p.setFont(label);p.drawText(QRectF(16,408,112,28),Qt::AlignVCenter,fresh?"No earlier than":"Captured at");
 digital(p,stamp.toString("HH:mm:ss"),132,408,.76);
 label.setPixelSize(14);label.setBold(false);p.setFont(label);p.drawText(QRectF(278,408,325,28),Qt::AlignVCenter,stamp.toString("'GMT · 'dd MMM yyyy")+(fresh?" · Quicknet":" · phone time"));
 // Bar and bracket are rendered separately by the source so the hinge can move.
 return im;
}
inline QImage arming(const QImage &qr,const QString &digest,qint64 target){
 QImage im(Width*3,Height*3,QImage::Format_ARGB32_Premultiplied);im.fill(Qt::transparent);QPainter p(&im);p.setRenderHint(QPainter::Antialiasing);p.setRenderHint(QPainter::TextAntialiasing);p.scale(3,3);p.translate(12,40);p.fillRect(QRectF(0,32,848,408),QColor("#2d2c27"));jaw(p,true);
 p.setPen(QColor("#eeeade"));QFont font("Arial");font.setPixelSize(31);font.setBold(true);p.setFont(font);p.drawText(QRectF(24,130,490,50),"Challenge locked");font.setPixelSize(19);font.setBold(false);p.setFont(font);p.drawText(QRectF(24,192,490,40),"Waiting for the fresh beacon…");font.setPixelSize(15);p.setFont(font);p.drawText(QRectF(24,247,480,40),"Stream commitment · "+digest);
 p.drawText(QRectF(24,389,640,34),"Quicknet pulse · "+QDateTime::fromMSecsSinceEpoch(target,Qt::UTC).toString("HH:mm:ss 'GMT'"));p.drawImage(QRectF(536,80,292,292),qr);
 font.setPixelSize(24);font.setBold(true);font.setItalic(true);p.setFont(font);p.drawText(QRectF(717,402,111,32),Qt::AlignRight|Qt::AlignVCenter,"CLAPPA");return im;
}
}

