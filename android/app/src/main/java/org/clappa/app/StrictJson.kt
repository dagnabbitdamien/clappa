package org.clappa.app

import org.json.JSONObject
import org.json.JSONArray

/** Reject duplicate keys, floating numbers, trailing input and excessive nesting. */
internal object StrictJson {
 fun parse(text:String):JSONObject {
  require(text.length<=131072);var at=0
  fun ws(){while(at<text.length&&text[at] in " \t\r\n")at++}
  fun quoted():String {require(text[at++]=='"');val out=StringBuilder()
   while(at<text.length){val c=text[at++];require(c.code>=32)
    if(c=='"'){val s=out.toString();var i=0;while(i<s.length){val v=s[i++];if(v.isHighSurrogate()){require(i<s.length&&s[i].isLowSurrogate());i++}else require(!v.isLowSurrogate())};return s}
    if(c!='\\')out.append(c) else{require(at<text.length);when(val e=text[at++]){'"','\\','/'->out.append(e);'b'->out.append('\b');'f'->out.append('\u000c');'n'->out.append('\n');'r'->out.append('\r');'t'->out.append('\t');'u'->{require(at+4<=text.length);val h=text.substring(at,at+4);require(h.matches(Regex("[0-9a-fA-F]{4}")));out.append(h.toInt(16).toChar());at+=4};else->error("Invalid JSON escape")}}
   };error("Unclosed string")}
  fun value(depth:Int):Any {require(depth<24);ws();require(at<text.length)
   return when(text[at]){
    '{'->{at++;val o=JSONObject();val seen=mutableSetOf<String>();ws();if(at<text.length&&text[at]=='}'){at++;o}else{while(true){ws();require(at<text.length&&text[at]=='"');val k=quoted();require(seen.add(k)){"Duplicate JSON field"};ws();require(text.getOrNull(at++)==':');o.put(k,value(depth+1));ws();val end=text.getOrNull(at++);if(end=='}')break;require(end==',')};o}}
    '['->{at++;val a=JSONArray();ws();if(text.getOrNull(at)==']'){at++;a}else{while(true){require(a.length()<1000);a.put(value(depth+1));ws();val end=text.getOrNull(at++);if(end==']')break;require(end==',')};a}}
    '"'->quoted()
    else->{val start=at;while(at<text.length&&text[at] !in ",]} \t\r\n")at++;val s=text.substring(start,at);when(s){"true"->true;"false"->false;"null"->JSONObject.NULL;else->{require(s.matches(Regex("-?(0|[1-9][0-9]*)")));s.toLong().also{require(it in -9007199254740991L..9007199254740991L)}}}}
   }
  }
  val v=value(0);ws();require(at==text.length&&v is JSONObject);return v
 }
}
