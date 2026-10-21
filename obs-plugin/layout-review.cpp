#include "src/board-art.h"
#include <QApplication>
#include <QDir>
int main(int argc,char **argv){QApplication app(argc,argv);if(argc!=3)return 1;QDir().mkpath(argv[2]);QImage original(argv[1]);if(original.isNull())return 2;
 const int pw=std::min(original.width(),int(original.height()*.75));const int ph=std::min(original.height(),int(pw/ .75));QImage portrait=original.copy((original.width()-pw)/2,(original.height()-ph)/2,pw,ph);
 QImage qr(876,876,QImage::Format_RGB32);qr.fill(Qt::white);
 const QList<QImage> layouts={BoardArt::mountedPhotos(portrait),BoardArt::dualPhoto(portrait,portrait),BoardArt::dualPhoto(original,original),BoardArt::dualPhoto(portrait,original)};
 int i=0;for(const auto &photo:layouts){auto image=BoardArt::proof(photo,qr,1790800000000LL,"Show yourself and your setup!",true);QPainter p(&image);p.scale(3,3);p.translate(12,40);BoardArt::bar(p);BoardArt::bracket(p);p.end();if(!image.save(QString(argv[2])+QString("/photo-layout-%1.png").arg(i++)))return 3;}
 return 0;}
