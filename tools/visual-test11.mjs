import fs from 'node:fs';let f='obs-plugin/src/plugin.cpp',s=fs.readFileSync(f,'utf8');
s=s.replace('const auto now=QDateTime::currentMSecsSinceEpoch();if(paths.empty()', 'auto now=QDateTime::currentMSecsSinceEpoch();if(paths.empty()');
s=s.replace('t->start=now;t->until=until;', 'now=QDateTime::currentMSecsSinceEpoch();t->start=now;t->until=until;');
s=s.replace('if(age<.31){double u=age/.31;double ease=u*u*(3-2*u);y=(BoardArt::Height+53)*(1-ease)-3;}else if(age<.42)y=-3*(1-(age-.31)/.11);','if(age<.38){double u=age/.38;double ease=1-std::pow(1-u,3);y=(BoardArt::Height+53)*(1-ease)-3;}else if(age<.49)y=-3*(1-(age-.38)/.11);');
s=s.replace('if(age>.12&&age<.34)angle=2.7*std::sin((age-.12)/.22*3.14159265);','if(age>.07&&age<.40)angle=2.6*std::sin((age-.07)/.33*3.14159265);');
s=s.replace('QImage im(BoardArt::Width*3,BoardArt::Height*3,QImage::Format_ARGB32_Premultiplied)','QImage im(BoardArt::Width,BoardArt::Height,QImage::Format_ARGB32_Premultiplied)').replace('p.scale(3,3);p.translate(0,y);','p.translate(0,y);');
fs.writeFileSync(f,s);
f='android/app/src/main/java/org/clappa/app/ClappaBoard.kt';s=fs.readFileSync(f,'utf8');
s=s.replace('p.textSize=9f;p.color=0xffeeeade.toInt();p.typeface=android.graphics.Typeface.create("sans-serif-medium",0);c.drawText("LOCAL",0f,23f,p);c.drawText("GMT",0f,48f,p)\n  val scale=minOf(.59f,(w-47)/480f);digitalClock(c,p,BoardClock.local(time),47f,10f,scale);digitalClock(c,p,BoardClock.gmt(time),47f,35f,scale);c.restore()',`p.color=0xffeeeade.toInt();p.typeface=android.graphics.Typeface.create("sans-serif-medium",0)
  val local=BoardClock.local(time);val gmt=BoardClock.gmt(time)
  p.textSize=9f;c.drawText("LOCAL",0f,15f,p);c.drawText("GMT",0f,43f,p);p.textSize=8f;c.drawText(local.take(10).replace(':','-'),0f,26f,p);c.drawText(gmt.take(10).replace(':','-'),0f,54f,p)
  val scale=minOf(.64f,(w-65)/270f);digitalClock(c,p,local.drop(11),65f,7f,scale);digitalClock(c,p,gmt.drop(11),65f,35f,scale);c.restore()`);
fs.writeFileSync(f,s);
f='android/app/build.gradle.kts';s=fs.readFileSync(f,'utf8').replace('versionCode = 12; versionName = "0.3.0-test10"','versionCode = 13; versionName = "0.3.0-test11"');fs.writeFileSync(f,s);
