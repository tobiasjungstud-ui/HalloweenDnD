#!/usr/bin/env node
/* Erzeugt den druckbaren Lesetext aus den Daten der DM-Konsole.
   node quelle/lesetext.js              → Nachtfels_Lesetext_DM.docx      (alles, DM-Kästen grau)
   node quelle/lesetext.js --schueler   → Nachtfels_Lesetext_Schueler.docx (nur Vorlesetext, DM-Sätze, Aufgaben)
   Vokabeln werden beim ersten Vorkommen je Szene direkt im Text übersetzt: fog [Nebel]. */
"use strict";
const fs=require("fs"), path=require("path"), vm=require("vm");
const d=require("docx");
const {Document,Packer,Paragraph,TextRun,HeadingLevel,AlignmentType,ShadingType,BorderStyle,PageBreak}=d;

/* ---- Konsole laden, ohne Browser ---- */
const el=()=>({innerHTML:"",textContent:"",className:"",hidden:false,disabled:false,value:"",style:{},dataset:{},classList:{toggle(){},add(){},remove(){}},querySelector(){return null;},setAttribute(){},getAttribute(){return null;}});
global.document={getElementById:el,addEventListener(){}}; global.window={scrollTo(){}}; global.confirm=()=>true; console.warn=()=>{};
const html=fs.readFileSync(path.join(__dirname,"..","dungeon_master.html"),"utf8");
vm.runInThisContext(/<script>([\s\S]*)<\/script>/.exec(html)[1]);
vm.runInThisContext("globalThis.T={KAPITEL:KAPITEL.concat([PATROUILLE]),ENTSCHEIDUNGEN,WISSEN,BESTIARIUM,liste,STIMMEN}");

const schueler=process.argv.includes("--schueler");

/* ---- Glossar: Englisch → Deutsch, nur schwerere Wörter ---- */
const GLOSSAR={
 "carriage":"Kutsche","pine trees":"Kiefern","fog":"Nebel","damp":"feucht, klamm","coats":"Mäntel","level with":"auf gleicher Höhe mit",
 "slow down":"langsamer werden","rumour":"Gerücht","valley":"Tal","disappear":"verschwinden","schedule":"Zeitplan","medicine":"Heilmittel",
 "bell tower":"Glockenturm","mud":"Schlamm","downhill":"bergab","bare rock":"nackter Fels","lit":"erleuchtet","tavern":"Wirtshaus","sign":"Schild",
 "far too quiet":"viel zu still","fireplace":"Kamin","carved":"eingeritzt","board":"Brett","pale":"blass, hell","grinning":"grinsend",
 "bottle":"Flasche","boots":"Stiefel","arrangement":"Abmachung","hunting map":"Jagdkarte","ridge":"Bergkamm","silver mine":"Silberbergwerk",
 "straight through":"mitten durch","rock":"Fels","forest":"Wald","gallows":"Galgen","rope":"Seil","wolves":"Wölfe","ponies":"Ponys","side by side":"nebeneinander",
 "black water":"schwarzes Wasser","mist":"Dunst, Nebel","path":"Pfad","pulls at":"zieht an","bog":"Sumpf","livery":"Dienstkleidung","lamps":"Laternen",
 "gate":"Tor","courtyard":"Innenhof","black stone":"schwarzer Stein","mine entrance":"Stolleneingang","dead tree":"toter Baum","sweet and heavy":"süss und schwer",
 "tools":"Werkzeuge","child’s shoe":"Kinderschuh","neatly":"ordentlich","rotten":"morsch","cellar":"Keller","barrels":"Fässer","wet stone":"nasser Stein",
 "stair":"Treppe","guard":"Wache","guests":"Gäste","unloading":"ausladen","boxes":"Kisten","fountain":"Brunnen","frozen":"gefroren","weak tea":"dünner Tee",
 "chapel":"Kapelle","bookshelves":"Bücherregale","onions":"Zwiebeln","hot fat":"heisses Fett","raven":"Rabe",
 "candles":"Kerzen","burnt down":"heruntergebrannt","saint":"Heiliger","altar":"Altar","stone font":"steinernes Taufbecken","anger":"Wut",
 "suit":"Anzug","ladder":"Leiter","teeth":"Zähne","corridor":"Gang, Korridor","windows":"Fenster","mirror":"Spiegel","backwards":"rückwärts",
 "chalk":"Kreide","handwriting":"Handschrift","humming":"summen","knife":"Messer","narrow":"schmal","armchair":"Sessel","tied up":"gefesselt",
 "hurt":"verletzt","late":"spät","screams":"schreit","study":"Arbeitszimmer","desk":"Schreibtisch","signatures":"Unterschriften","burns":"brennt",
 "doorway":"Türrahmen","tired":"müde","frightening":"beängstigend","stairwell":"Treppenhaus","second chair":"zweiter Stuhl","cup of tea":"Tasse Tee",
 "brought":"gebracht","bag packed":"gepackte Tasche","pass":"Pass (Bergübergang)","daylight":"Tageslicht","expecting":"erwarten","sunrise":"Sonnenaufgang",
 "offer":"Angebot","contract":"Vertrag","promise":"versprechen","scar":"Narbe","ice cellar":"Eiskeller","liar":"Lügner","taught":"beigebracht",
 "deal":"Abmachung","plague":"Pest","starves":"verhungert","cold rooms":"Kühlräume","letter":"Brief","carry":"tragen","welcome":"willkommen heissen",
 "outwards":"nach aussen","broken outwards":"nach aussen aufgebrochen","properly":"richtig, ordentlich","belongs to":"gehört zu","comfortable":"bequem",
 "frost":"Frost","chimney":"Schornstein","loaves":"Brotlaibe","valley closes":"das Tal ist abgeschnitten","slot":"Schlitz","basket":"Korb","to knock":"anklopfen",
 "goes out":"erlischt","turns south":"biegt nach Süden","allowed":"erlaubt","awake":"wach"
};
const glossarSchluessel=Object.keys(GLOSSAR).sort((a,b)=>b.length-a.length);

/* Text → Runs mit Glossen (erstes Vorkommen je Szene) */
function glossiere(text, gesehen, groesse){
  const runs=[]; let rest=text;
  const muster=new RegExp("\\b("+glossarSchluessel.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")\\b","i");
  while(rest.length){
    const m=muster.exec(rest);
    if(!m){ runs.push(new TextRun({text:rest,font:"Georgia",size:groesse})); break; }
    const wort=m[1], schl=glossarSchluessel.find(k=>k.toLowerCase()===wort.toLowerCase());
    runs.push(new TextRun({text:rest.slice(0,m.index+wort.length),font:"Georgia",size:groesse}));
    if(!gesehen.has(schl)){ gesehen.add(schl); runs.push(new TextRun({text:" ["+GLOSSAR[schl]+"]",font:"Georgia",size:groesse-4,color:"7A5A1A"})); }
    rest=rest.slice(m.index+wort.length);
  }
  return runs;
}
const ohneHtml=t=>t.replace(/<br\s*\/?>/g," ").replace(/<\/p>\s*<p>/g," — ").replace(/<[^>]+>/g,"").replace(/&quot;/g,'"');

/* ---- Bausteine ---- */
const grau="F2F2F2", gelb="FFF6DD", gruen="EAF4EC";
const rand={style:BorderStyle.SINGLE,size:6,color:"C8B27A",space:4};
function kasten(zeilenRuns, farbe, randfarbe){
  return zeilenRuns.map((r,i)=>new Paragraph({shading:{type:ShadingType.CLEAR,fill:farbe,color:"auto"},
    border:{left:{style:BorderStyle.SINGLE,size:18,color:randfarbe,space:8}}, indent:{left:120}, spacing:{after:i===zeilenRuns.length-1?140:40}, children:r}));
}
const etikett=(t,farbe)=>[new TextRun({text:t+"  ",font:"Georgia",size:16,bold:true,color:farbe})];
const FLAG_NAMEN={weg_a:"Weg A · Strasse",weg_b:"Weg B · Stollen",weg_c:"Weg C · Kutsche",bibliothek:"Tür A · Bibliothek",kapelle:"Tür B · Kapelle",kueche:"Tür C · Küche",
  e3_raus:"Wahl A · hinaustragen",e3_buch:"Wahl B · Buch verbrennen",e3_pakt:"Wahl C · Angebot",ausgang_tot:"Vaskir tot",ausgang_vertrag:"neuer Vertrag",ausgang_flucht:"entkommen",anneke:"Name Anneke bekannt"};
function bedingung(b){
  const t=[];
  T.liste(b.nur).forEach(f=>t.push(FLAG_NAMEN[f]||f)); T.liste(b.alle).forEach(f=>t.push(FLAG_NAMEN[f]||f));
  T.liste(b.nicht).forEach(f=>t.push("nicht: "+(FLAG_NAMEN[f]||f)));
  if(b.gefahrVon!==undefined) t.push("Gefahr "+b.gefahrVon+"–"+b.gefahrBis);
  return t.length?"▸ Nur bei: "+t.join(", "):"";
}

const kinder=[
  new Paragraph({spacing:{after:60},children:[new TextRun({text:"THE BRIDE OF NACHTFELS",font:"Georgia",size:22,bold:true,color:"7A5A1A"})]}),
  new Paragraph({spacing:{after:100},children:[new TextRun({text:schueler?"Lesetext":"Lesetext — Ausgabe für die Spielleitung",font:"Georgia",size:44,bold:true})]}),
  new Paragraph({spacing:{after:260},border:{bottom:{style:BorderStyle.SINGLE,size:8,color:"444444",space:8}},children:[new TextRun({
    text:schueler?"Alles, was vorgelesen wird — zum Mitlesen. Schwierige Wörter stehen direkt dahinter in Klammern übersetzt. Gelb: das fragt dich der DM. Grün: das sollst du tun."
                 :"Der ganze Text, mit Vokabeln in Klammern. Gelb: was du wörtlich sagst. Grün: was die Schüler tun sollen. Grau: nur für dich — Tipps, Antworten, Regie. Abschnitte mit „Nur bei“ gelten nur auf dem entsprechenden Weg.",
    font:"Georgia",size:21,italics:true,color:"444444"})]})
];

T.KAPITEL.forEach((k,i)=>{
  if(i===0 && schueler) return;
  const gesehen=new Set();
  kinder.push(new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:400,after:60},pageBreakBefore:i>0,
    children:[new TextRun({text:k.n+" · "+k.titel,font:"Georgia",size:32,bold:true,color:"1A1A1A"})]}));
  const ziel=k.bloecke.find(b=>b.t==="ziel");
  if(ziel && !schueler) kinder.push(new Paragraph({spacing:{after:160},children:[new TextRun({text:"Ziel: ",font:"Georgia",size:19,bold:true,color:"7A5A1A"}),new TextRun({text:ohneHtml(ziel.text)+"  ("+ziel.zeit+")",font:"Georgia",size:19,italics:true,color:"444444"})]}));
  let letzteBedingung="";
  k.bloecke.forEach(b=>{
    if(b.t==="ziel"||b.t==="weiter") return;
    const bed=bedingung(b);
    const sichtbarFuerSchueler=["vorlesen","sagen","aufgabe"].includes(b.t);
    if(schueler && !sichtbarFuerSchueler) return;
    if(bed && bed!==letzteBedingung){ kinder.push(new Paragraph({spacing:{before:120,after:60},children:[new TextRun({text:bed,font:"Georgia",size:17,bold:true,color:"7A5A1A"})]})); }
    if(bed) letzteBedingung=bed; else letzteBedingung="";
    switch(b.t){
      case "vorlesen":
        if(b.titel) kinder.push(new Paragraph({spacing:{before:100,after:40},children:[new TextRun({text:b.titel,font:"Georgia",size:19,bold:true,color:"555555"}),
          ...(!schueler&&b.spricht?[new TextRun({text:"   "+b.spricht.toUpperCase()+" ("+T.STIMMEN[b.spricht]+")",font:"Georgia",size:17,color:"8A6A2C"})]:[])]}));
        b.text.forEach(t=>kinder.push(new Paragraph({spacing:{after:110,line:320},children:glossiere(t,gesehen,22)}))); break;
      case "sagen":
        kinder.push(...kasten(b.text.map((t,j)=>[...(j===0?etikett((b.wer?b.wer.toUpperCase()+(!schueler&&T.STIMMEN[b.wer]?" ("+T.STIMMEN[b.wer]+")":""):"DM")+":","8A6A2C"):[]),...glossiere(t,gesehen,21).map(r=>{r.root; return r;})]),gelb,"D9A441")); break;
      case "aufgabe":
        kinder.push(...kasten([[...etikett("GESPRÄCHSAUFFORDERUNG — DAS SAGST DU DEN SCHÜLERN:","3A5A4C"),...glossiere("“"+(b.sag||b.text)+"”",gesehen,19)],
          ...((!schueler&&b.hinweis)?[[new TextRun({text:ohneHtml(b.hinweis)+(b.blatt?"  →  "+b.blatt:""),font:"Georgia",size:17,color:"555555"})]]:(b.blatt?[[new TextRun({text:"→  "+b.blatt,font:"Georgia",size:17,color:"555555"})]]:[]))],gruen,"74B094")); break;
      case "regie":
        kinder.push(...kasten([[...etikett((b.titel?b.titel.toUpperCase():"HINTERGRUND")+" (NUR DM):","555555"),new TextRun({text:ohneHtml(b.text),font:"Georgia",size:18,color:"333333"})]],grau,"BFBFBF")); break;
      case "fa":
        kinder.push(...kasten([[...etikett(("MÖGLICHE ANTWORTEN"+(b.wer?" · CHARAKTER: "+b.wer.toUpperCase():b.titel?" · "+b.titel.toUpperCase():""))+" (NUR DM)","555555")],
          ...b.paare.map(p=>[new TextRun({text:p[0]+"  ",font:"Georgia",size:18,bold:true,color:"333333"}),new TextRun({text:ohneHtml(p[1]),font:"Georgia",size:18,italics:true,color:"333333"})])],grau,"BFBFBF")); break;
      case "personen":
        kinder.push(...kasten([[...etikett("WEN MAN ANSPRECHEN KANN (NUR DM)","555555")],
          ...b.leute.flatMap(l=>[[new TextRun({text:l.name+" — "+l.wer+". ",font:"Georgia",size:18,bold:true}),new TextRun({text:l.spielt,font:"Georgia",size:18,color:"333333"})],
            ...(l.fragen ? l.fragen.map(f=>[new TextRun({text:f[0]+"  ",font:"Georgia",size:18,bold:true,color:"333333"}),new TextRun({text:ohneHtml(f[1]),font:"Georgia",size:18,italics:true,color:"333333"})])
                         : [[new TextRun({text:l.sagt.map(s=>"„"+s+"“").join("  ·  "),font:"Georgia",size:18,italics:true})]]),
            [new TextRun({text:"Notfalls: "+ohneHtml(l.notfalls),font:"Georgia",size:17,color:"555555"})]]),
          ...(b.sonst?[[new TextRun({text:ohneHtml(b.sonst),font:"Georgia",size:17,color:"555555"})]]:[])],grau,"BFBFBF")); break;
      case "tun":
        kinder.push(...kasten([[...etikett("KNOPF (NUR DM):","555555"),new TextRun({text:ohneHtml(b.text)+"  →  "+b.beschriftung,font:"Georgia",size:18,color:"333333"})]],grau,"BFBFBF")); break;
      case "wenn":
        kinder.push(...kasten([[...etikett(b.titel.toUpperCase()+" (NUR DM):","555555"),new TextRun({text:ohneHtml(b.text),font:"Georgia",size:18,color:"333333"})]],grau,"BFBFBF")); break;
      case "kampf":
        kinder.push(...kasten([[...etikett("KAMPF (NUR DM): "+b.titel,"8A2C2C"),new TextRun({text:" "+ohneHtml(b.text)+"  "+b.gegner.map(g=>T.BESTIARIUM[g].name+" "+T.BESTIARIUM[g].hp+" HP").join(", "),font:"Georgia",size:18,color:"333333"})]],grau,"BFBFBF")); break;
      case "optionen":
        kinder.push(...kasten([[...etikett((b.titel||"DIE DREI KARTEN")+" (NUR DM)","555555")],
          ...b.optionen.map(o=>[new TextRun({text:o.b+" · "+o.name+"  ",font:"Georgia",size:18,bold:true}),new TextRun({text:ohneHtml(o.was)+(o.pro?"  + "+ohneHtml(o.pro.join(" ")):"")+(o.con?"  − "+ohneHtml(o.con.join(" ")):"")+"  [Gefahr "+(o.wirkung.gefahr>0?"+"+o.wirkung.gefahr:"±0")+"]",font:"Georgia",size:18,color:"333333"})])],grau,"BFBFBF")); break;
    }
  });
  if(!schueler && (k.verlauf||[]).length){
    kinder.push(...kasten([[...etikett("WENN … DANN (NUR DM)","555555")],
      ...k.verlauf.map(r=>[new TextRun({text:(bedingung(r)?bedingung(r).replace("▸ ","")+" — ":"")+r.wenn+"  →  ",font:"Georgia",size:17,bold:true,color:"333333"}),
        new TextRun({text:r.dann,font:"Georgia",size:17,color:"333333"})])],grau,"BFBFBF"));
  }
  if(!schueler && (k.chancen||[]).length){
    kinder.push(...kasten([[...etikett("OPTIONAL · GELEGENHEITEN FÜR EINZELNE FIGUREN (NUR DM) — nur, falls ein Spieler von selbst darauf kommt","555555")],
      ...k.chancen.map(c=>[new TextRun({text:c.wer+" · "+c.talent+"  ",font:"Georgia",size:17,bold:true,color:"333333"}),
        new TextRun({text:(bedingung(c)?bedingung(c).replace("▸ ","")+" — ":"")+"vorgelesen: “"+c.cue+"” — "+c.text+"  → "+c.folge,font:"Georgia",size:17,color:"333333"})])],grau,"BFBFBF"));
  }
});

const doc=new Document({sections:[{properties:{page:{margin:{top:1134,bottom:1134,left:1134,right:1134}}},children:kinder}]});
const ziel=path.join(__dirname,"..","helferblatt",schueler?"Nachtfels_Lesetext_Schueler.docx":"Nachtfels_Lesetext_DM.docx");
Packer.toBuffer(doc).then(b=>{fs.writeFileSync(ziel,b);console.log("geschrieben:",path.basename(ziel),b.length,"Bytes");});
