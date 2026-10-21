import java.nio.*;
import java.nio.file.*;
import org.clappa.app.*;
class RiffPreview {
 public static void main(String[] args) throws Exception {
  byte[] strike=Files.readAllBytes(Path.of("android/app/src/main/assets/audio/clapper.pcm"));
  for(int n=1;n<=2;n++){
   byte[] seed=Cadence.INSTANCE.seed("review-session","review-identity","review-challenge-1",1789362000000L);
   var phrase=Cadence.INSTANCE.pattern(seed);String bits=phrase.getFirst();int hits=(int)bits.chars().filter(c->c=='1').count();
   var pitches=Cadence.INSTANCE.pitches(seed,hits);
   short[] pcm=RiffAudio.INSTANCE.render(strike,bits,n==1?125:111,pitches);
   ByteBuffer wav=ByteBuffer.allocate(44+pcm.length*2).order(ByteOrder.LITTLE_ENDIAN);
   wav.put("RIFF".getBytes()).putInt(36+pcm.length*2).put("WAVEfmt ".getBytes()).putInt(16).putShort((short)1).putShort((short)1).putInt(44100).putInt(88200).putShort((short)2).putShort((short)16).put("data".getBytes()).putInt(pcm.length*2);
   for(short s:pcm)wav.putShort(s);
   Files.write(Path.of("docs/review8/riff-"+(n==1?120:135)+".wav"),wav.array());
   System.out.println(n+": "+bits+", slot="+(n==1?125:111)+"ms, semitones="+pitches);
  }
 }
}
