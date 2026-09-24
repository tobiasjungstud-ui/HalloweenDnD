#!/usr/bin/env node
/* Prüfstand für dungeon_master.html
   Lädt das Skript der Seite unverändert, ersetzt das DOM durch Attrappen und spielt
   jede erreichbare Zustandsklasse von der ersten bis zur letzten Seite durch. Jede Abweichung ist ein Befund.
   Seiten werden über ihren Titel gefunden, Entscheidungen über den Ort ihres Optionen-Blocks —
   so läuft derselbe Prüfstand über V1 (dreizehn Seiten) und V2 (elf).                          */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");

/* ---------- DOM-Attrappe ---------- */
const elemente = {};
function el(id){
  if(!elemente[id]){
    const e = { id, innerHTML:"", textContent:"", className:"", hidden:false, disabled:false, value:"",
      style:{}, dataset:{}, onclick:null, merkmale:{}, querySelector(){ return null; },
      setAttribute(n,v){ this.merkmale[n] = String(v); },
      getAttribute(n){ return n in this.merkmale ? this.merkmale[n] : null; } };
    const klassen = () => e.className ? e.className.split(/\s+/).filter(Boolean) : [];
    e.classList = {
      contains(k){ return klassen().includes(k); },
      add(k){ const l=klassen(); if(!l.includes(k)){ l.push(k); e.className = l.join(" "); } },
      remove(k){ e.className = klassen().filter(x=>x!==k).join(" "); },
      toggle(k,an){ if(an===undefined ? this.contains(k) : !an) this.remove(k); else this.add(k); }
    };
    elemente[id] = e;
  }
  return elemente[id];
}
global.document = { getElementById: el, addEventListener(){}, };
global.window = { scrollTo(){}, matchMedia(){ return {matches:false}; } };
global.confirm = () => true;
const warnungen = []; const echtWarn = console.warn; console.warn = (...a)=>warnungen.push(a);

/* ---------- Seite laden ---------- */
const dateiArg = process.argv.indexOf("--datei"); const DATEI = dateiArg>=0 ? process.argv[dateiArg+1] : "dungeon_master.html";
const html = fs.readFileSync(path.join(__dirname, "..", DATEI), "utf8");
const js = /<script>([\s\S]*)<\/script>/.exec(html)[1];
vm.runInThisContext(js, {filename:"dungeon_master.html"});
vm.runInThisContext(`globalThis.T = { Z:()=>Z, setZ:z=>{Z=z;}, KAPITEL, ENTSCHEIDUNGEN, WISSEN, BESTIARIUM, ORT, PATROUILLE,
  frischerZustand, waehle, setzeWissen, tunAusfuehren, geheZu, gilt, hat, sichtbarerVerlauf, ortAufloesen, sichtbareBloecke, sichtbareChancen, pruefeStory, finaleLaden, liste, alles,
  ladeKampf, patrouilleFertig, setzeGefahr,
  oeffneKampf: typeof oeffneKampf==="function" ? oeffneKampf : null, schliesseKampf: typeof schliesseKampf==="function" ? schliesseKampf : null,
  kampfVorbei: typeof kampfVorbei==="function" ? kampfVorbei : null,
  STIMMEN: typeof STIMMEN!=="undefined" ? STIMMEN : null,
  schalteStimmen: typeof schalteStimmen==="function" ? schalteStimmen : null,
  stimmenAn: ()=>typeof ZEIGE_STIMMEN!=="undefined" && ZEIGE_STIMMEN,
  TALENTE: typeof TALENTE!=="undefined" ? TALENTE : null,
  karten: typeof karten==="function" ? karten : null,
  blockAnker: typeof blockAnker==="function" ? blockAnker : null,
  hilfeVerteilen: typeof hilfeVerteilen==="function" ? hilfeVerteilen : null,
  vorleseLauf: typeof vorleseLauf==="function" ? vorleseLauf : null,
  stelleWeiche: typeof stelleWeiche==="function" ? stelleWeiche : (()=>{}),
  BILDER: typeof BILDER!=="undefined" ? BILDER : null,
  notstoppWaehle: typeof notstoppWaehle==="function" ? notstoppWaehle : null,
  notstoppZumMorgen: typeof notstoppZumMorgen==="function" ? notstoppZumMorgen : null,
  notstoppOeffnen: typeof notstoppOeffnen==="function" ? notstoppOeffnen : null,
  zeichneUhr: typeof zeichneUhr==="function" ? zeichneUhr : null,
  uhrLage: typeof uhrLage==="function" ? uhrLage : null,
  uhrSchalte: typeof uhrSchalte==="function" ? uhrSchalte : null,
  rueckgaengig: typeof rueckgaengig==="function" ? rueckgaengig : null,
  verlaufLaenge: ()=>typeof VERLAUF!=="undefined" ? VERLAUF.length : 0,
  verlaufLeeren: ()=>{ if(typeof VERLAUF!=="undefined") VERLAUF.length=0; },
  ladeGegner: typeof ladeGegner==="function" ? ladeGegner : null }`);
console.warn = echtWarn;

/* ---------- Hilfen ---------- */
const NEU = html.includes('id="aktionen"');   /* V2 nach dem Usability-Umbau */
const befunde = [];
let gepruefteZusicherungen = 0;
function pruefe(bedingung, text){ gepruefteZusicherungen++; if(!bedingung) befunde.push(text); }
const K = T.KAPITEL;
function text(){ return el("bloecke").innerHTML; }
function optIdx(entId, flagge){ const b=K.flatMap(k=>k.bloecke).find(b=>b.t==="optionen"&&b.id===entId); return b.optionen.findIndex(o=>o.flagge===flagge); }
function frisch(){ T.setZ(T.frischerZustand()); T.alles(); }
/* Wo steht was — nach Titel und nach Entscheidung, nicht nach Nummer */
function seite(...titel){ for(const t of titel){ const i=K.findIndex(k=>k.titel===t); if(i>=0) return i; } throw new Error("Seite nicht gefunden: "+titel.join(" / ")); }
function entSeite(id){ return K.findIndex(k=>k.bloecke.some(b=>b.t==="optionen"&&b.id===id)); }
const S={ inn:seite("The Inn"), berg:seite("Up the Mountain"), hof:seite("The Courtyard"), tuer:seite("What You Find"),
          finale:seite("Count Vaskir"), epilog:seite("Six O’Clock"), ende:seite("What Happens Now","Six O’Clock"),
          e1:entSeite("e1"), e2:entSeite("e2"), e3:entSeite("e3"), e4:entSeite("e4"), e5:entSeite("e5") };
const HAT_TAM_BITTE = K.some(k=>k.bloecke.some(b=>b.t==="weiche"&&b.id==="tam_bitte"));

/* ---------- 1 · Statische Selbstprüfung ---------- */
const statisch = T.pruefeStory();
pruefe(statisch.length===0, "pruefeStory: "+statisch.join(" | "));
pruefe(warnungen.length===0, "Konsole beim Laden: "+JSON.stringify(warnungen));

/* ---------- 2 · Erreichbare Pfade aufzählen ---------- */
const WEGE=["weg_a","weg_b","weg_c"], TUEREN=["bibliothek","kapelle","kueche"], WAHLEN=["e3_raus","e3_buch","e3_pakt"], AUSGAENGE=["ausgang_tot","ausgang_vertrag","ausgang_flucht"], DANACH=["weiter_jagd","weiter_dorf","weiter_schloss"];
const GRUPPEN=[WEGE,TUEREN,WAHLEN,AUSGAENGE,DANACH];
const GEFAHR = {weg_a:2,weg_b:0,weg_c:4, bibliothek:1,kapelle:2,kueche:0, e3_raus:3,e3_buch:2,e3_pakt:0};
const pfade=[];
for(const weg of WEGE) for(const anneke of [false,true]) for(const tuer of TUEREN) for(const wahl of WAHLEN)
  for(const scheitert of (wahl==="e3_pakt"?[false,true]:[false])) for(const ausgang of AUSGAENGE)
   for(const wache of (weg==="weg_c"?[false]:[false,true]))
    for(const danach of DANACH)
     for(const tam of ((HAT_TAM_BITTE && tuer==="kueche")?["offen","zugesagt","abgelehnt"]:["offen"]))
      pfade.push({weg,anneke,tuer,wahl,scheitert,ausgang,wache,danach,tam});

const gesehen = new Map();  /* Block → in wie vielen Pfaden sichtbar */
K.forEach((k,i)=>k.bloecke.forEach((b,j)=>{ if(b.t!=="ziel"&&b.t!=="weiter") gesehen.set(i+"/"+j,0); }));
const gesehenChancen = new Map();  /* Gelegenheit → in wie vielen Pfaden sichtbar (bei Gefahr wie gespielt) */
K.forEach((k,i)=>(k.chancen||[]).forEach((c,j)=>gesehenChancen.set(i+"/"+j,0)));

function erwarteteGefahr(p){
  let g = GEFAHR[p.weg] + (p.wache?1:0) + (p.tuer==="kapelle"&&p.anneke ? 1 : GEFAHR[p.tuer]) + GEFAHR[p.wahl] + (p.scheitert?4:0);
  return Math.max(0,Math.min(10,g));
}

function spiele(p, protokoll){
  frisch();
  const Z=T.Z();
  const spur=[]; let patrouilleErlebt=false;
  for(let i=0;i<K.length;i++){
    T.geheZu(i);
    const k=K[i];
    /* Handlungen an der richtigen Stelle */
    if(i===S.inn && p.anneke) T.tunAusfuehren("w_anneke");
    if(i===S.e1) T.waehle("e1", optIdx("e1",p.weg));
    if(i===S.berg && p.weg==="weg_b") T.tunAusfuehren("stollen_luft");
    if(i===S.berg && p.wache) T.tunAusfuehren(p.weg==="weg_a"?"tor_kampf":"keller_kampf");
    if(i===S.berg){ T.geheZu(S.berg); const wachen=T.Z().gegner.filter(g=>g.k==="wache").length;
      pruefe(wachen===(p.wache?(p.weg==="weg_a"?2:1):0), `Pfad ${JSON.stringify(p)}: ${wachen} Wachen geladen`); }
    if(i===S.e2) T.waehle("e2", optIdx("e2",p.tuer));
    if(i===S.tuer && p.tuer==="kueche" && p.tam!=="offen") T.stelleWeiche("tam_bitte", p.tam);
    if(i===S.e3) T.waehle("e3", optIdx("e3",p.wahl));
    if(i===S.e4){ if(p.scheitert) T.tunAusfuehren("pakt_scheitert"); T.tunAusfuehren("finale_laden"); T.waehle("e4", optIdx("e4",p.ausgang)); }
    if(i===S.e5) T.waehle("e5", optIdx("e5",p.danach));
    T.geheZu(i); /* neu zeichnen nach Handlungen */
    if(T.Z().imZwischenakt){
      const Zp=T.Z(), wo0=`Pfad ${JSON.stringify(p)} Schritt ${i}`;
      pruefe(Zp.gefahr>=8 && Zp.patrouille.status==="steht_bevor" && Zp.patrouille.vor<=i, wo0+": Zwischenakt ohne Grund");
      pruefe(text().includes("The Patrol")||text().includes("Boots."), wo0+": Zwischenakt zeigt nicht die Patrouille");
      const vorher=Zp.gegner.length; T.ladeKampf(["wache","wache","wache","hund"], null);
      pruefe(Zp.gegner.filter(g=>g.k==="wache").length>=3 && Zp.gegner.some(g=>g.k==="hund"), wo0+": Patrouille lädt nicht 3 Wachen + Hund");
      T.patrouilleFertig(); patrouilleErlebt=true;
      pruefe(!T.Z().imZwischenakt && T.Z().patrouille.status==="erledigt" && T.Z().schritt===i, wo0+": nach der Patrouille nicht am Ziel");
    }
    /* Weichen: beide Fälle durchspielen, damit kein Zweig unbesucht bleibt */
    T.sichtbareBloecke(k).filter(b=>b.t==="weiche").forEach(w=>{
      const woW=`Pfad ${JSON.stringify(p)} Schritt ${i} (${k.titel}) Weiche ${w.id}`;
      const offen=T.sichtbareBloecke(k).filter(b=>b.weiche).length;
      pruefe(offen===0, woW+": vor der Wahl ist schon ein Zweig sichtbar");
      w.optionen.forEach(o=>{
        T.stelleWeiche(w.id, o.k);
        const jetzt=T.sichtbareBloecke(k).filter(b=>b.weiche);
        /* Ein Festhalten hat seinen Text auf einer späteren Seite — das prüft der Epilog-Abschnitt */
        pruefe(jetzt.length>0 || w.art==="festhalten", woW+": Fall „"+o.k+"“ zeigt keinen Text");
        jetzt.forEach(b=>{
          pruefe(T.liste(b.weiche).some(sp=>sp===w.id+"="+o.k), woW+": fremder Zweig sichtbar bei „"+o.k+"“");
          gesehen.set(i+"/"+k.bloecke.indexOf(b), gesehen.get(i+"/"+k.bloecke.indexOf(b))+1);
        });
        T.stelleWeiche(w.id, o.k);   /* zurücknehmen */
      });
      pruefe(T.sichtbareBloecke(k).filter(b=>b.weiche).length===0, woW+": Wahl lässt sich nicht aufheben");
    });
    /* Die Schleife hat die Weiche wieder aufgehoben — den Stand dieses Pfads neu setzen */
    if(i===S.tuer && p.tuer==="kueche" && p.tam!=="offen" && (T.Z().weichen||{}).tam_bitte!==p.tam) T.stelleWeiche("tam_bitte", p.tam);
    const sichtbar=T.sichtbareBloecke(k);
    sichtbar.forEach(b=>{ const j=k.bloecke.indexOf(b); gesehen.set(i+"/"+j, gesehen.get(i+"/"+j)+1); });
    const wo=`Pfad ${JSON.stringify(p)} Schritt ${i} (${k.titel})`;
    /* Zweite Ebene: Gelegenheiten — leise, nie auf Entscheidungsseiten, nie mehr als die Szene selbst */
    const chancen=T.sichtbareChancen(k);
    chancen.forEach(c=>{ const j=k.chancen.indexOf(c); gesehenChancen.set(i+"/"+j, gesehenChancen.get(i+"/"+j)+1); });
    pruefe(k.art!=="ent" || chancen.length===0, wo+": Gelegenheiten auf einer Entscheidungsseite");
    pruefe(chancen.length<=3, wo+`: ${chancen.length} Gelegenheiten sichtbar — mehr als drei lenken ab`);
    pruefe(chancen.length<=sichtbar.length, wo+": mehr Gelegenheiten als Szenenblöcke");
    /* V1 hatte dafür eine eigene Leiste; in V2 stehen Regeln und Stärken als Kästen im Regiebuch */
    const st=NEU?el("talente").innerHTML:el("staerken").innerHTML, vl=NEU?text():el("verlauf").innerHTML;
    pruefe((k.verlauf||[]).filter(T.gilt).every(r=>vl.includes(r.wenn)&&vl.includes(r.dann)), wo+": Wenn-dann-Spalte unvollständig");
    for(const gruppe of GRUPPEN) (k.verlauf||[]).filter(T.gilt).forEach(r=>{
      const nur=T.liste(r.nur).filter(f=>gruppe.includes(f));
      pruefe(nur.length===0 || nur.some(T.hat), wo+": Regel „"+r.wenn+"“ sichtbar, obwohl ihr Zweig nicht gewählt ist"); });
    pruefe((k.verlauf||[]).filter(T.gilt).length<=8, wo+": mehr als acht Regeln in der mittleren Spalte");
    if(!NEU) pruefe(!text().includes('class="staerke'), wo+": Gelegenheiten stehen noch in der Hauptspalte");
    pruefe(["Magic Hand","Strength","Healing Touch"].every(t=>st.includes(t)), wo+": Stärken-Abschnitt nennt nicht alle drei Talente");
    const gz=NEU?text():st;
    chancen.forEach(c=>pruefe(gz.includes(c.text) && gz.includes(c.folge) && gz.includes(c.cue), wo+": Gelegenheit fehlt rechts: "+c.wer+" · "+c.talent));
    const gelb=sichtbar.filter(b=>b.t==="vorlesen"||b.t==="sagen").flatMap(b=>b.text);
    chancen.forEach(c=>pruefe(gelb.some(t=>t.includes(c.cue)), wo+": Ankündigung „"+c.cue+"“ wird auf diesem Pfad nicht vorgelesen"));
    if(!NEU){
      const leerZeilen=(st.match(/staerke leer/g)||[]).length, belegt=new Set(chancen.map(c=>c.wer)).size;
      pruefe(leerZeilen===3-belegt, wo+`: ${leerZeilen} leere Stärken-Zeilen bei ${belegt} belegten Figuren`);
    } else {
    /* Die Übersicht nennt jede Figur mit ihrem Talent und sagt, ob die Szene eine Gelegenheit hat */
    const ohneFiguren=T.Z().gruppe.filter(x=>!chancen.some(c=>c.wer===x.rolle)).map(x=>x.rolle);
    pruefe((st.match(/tz leer/g)||[]).length===ohneFiguren.length, wo+": Zeile „hier nichts vorbereitet“ stimmt nicht mit den Figuren ohne Gelegenheit überein");
    pruefe((st.match(/tz da/g)||[]).length===3-ohneFiguren.length, wo+": Zeile „Gelegenheit in dieser Szene“ stimmt nicht");
    ohneFiguren.forEach(r=>pruefe(st.includes(r), wo+": Figur ohne Gelegenheit wird rechts nicht genannt: "+r));
    /* Gefahrenkarte steht auf jeder Seite rechts neben dem Ziel */
    pruefe(el("gefahrsaeule")!==null, wo+": Gefahrenbalken fehlt");
    /* Anker: jede Regel mit „bei“ landet im Fach ihres Blocks, nicht im Sammelfach oben */
    const bl=T.karten(sichtbar), faecher=T.hilfeVerteilen(k, bl).map(f=>f.vor+f.nach);
    (k.verlauf||[]).filter(T.gilt).forEach(r=>{
      if(!r.bei) return;
      const j=bl.findIndex(b=>T.blockAnker(b)===r.bei);
      if(j<0) return;
      pruefe(faecher[j].includes(r.wenn), wo+": Regel „"+r.wenn+"“ steht nicht beim Anker "+r.bei);
    });
    /* Aufeinanderfolgende Vorlesetexte: eine Randnotiz, innen Titellinien */
    const lauf=T.vorleseLauf(bl);
    const eigene = bl.filter((b,j)=>(b.t==="vorlesen"||b.t==="gruppe") && (!lauf[j] || lauf[j].erste)).length;
    pruefe((text().match(/class="marg vorlesen[^"]*">Vorlesen/g)||[]).length===eigene,
      wo+": Zahl der Randnotizen „Vorlesen“ passt nicht zu den Läufen");
    bl.forEach((b,j)=>{
      if(!lauf[j]) return;
      if(b.titel) pruefe(text().includes('<div class="teiltitel"><span>'+b.titel+'</span>'),
        wo+": Titellinie fehlt für „"+b.titel+"“");
      pruefe(!text().includes('<div class="marg vorlesen verbund'+(lauf[j].erste?" erste":"")+'">Vorlesen<small>'),
        wo+": verbundener Vorlesetext trägt noch einen Untertitel am Rand");
    });
    /* Stärken stehen im Fach des Blocks, in dem ihr angekündigter Satz vorgelesen wird */
    chancen.forEach(c=>{
      const j=bl.findIndex(b=>(T.blockAnker(b), (b.text?[].concat(b.text).join(" "):"")+(b.rede?b.rede.map(x=>x.t).join(" "):"")).includes(c.cue));
      if(j<0) return;
      pruefe(faecher[j].includes(c.cue), wo+": Stärke „"+c.talent+"“ steht nicht neben ihrer Ankündigung");
    });
    /* Knöpfe der Szene erscheinen auch in der Aktionsleiste */
    const akt=el("aktionen").innerHTML;
    sichtbar.filter(b=>b.t==="tun").forEach(b=>pruefe(akt.includes('data-tun="'+b.id+'"'), wo+": Knopf fehlt in der Aktionsleiste: "+b.id));
    sichtbar.filter(b=>b.t==="kampf"&&!b.ohneKnopf).forEach(b=>pruefe(akt.includes('data-laden="'+b.gegner.join(",")+'"'), wo+": Kampfknopf fehlt in der Aktionsleiste"));
    const wB=k.bloecke.find(b=>b.t==="weiter");
    pruefe(!wB || akt.includes(wB.text), wo+": „Weiter, wenn“ fehlt in der Aktionsleiste");
    const zB=k.bloecke.find(b=>b.t==="ziel");
    pruefe(!zB || el("zielband").innerHTML.includes(zB.text), wo+": Ziel fehlt neben dem Titel");
    pruefe(!zB || !zB.zeit || el("zielband").innerHTML.includes(zB.zeit), wo+": Zeitangabe fehlt neben dem Titel");
    pruefe(!text().includes('class="marg ziel"'), wo+": Ziel steht noch im Raster der Blöcke");
    /* Szenenbild: sichtbar genau dann, wenn diese Szene auf diesem Weg eines hat.
       Hängt es an einer noch offenen Flagge, bleibt die Fläche leer.            */
    if(T.BILDER){
      const bl=el("szenenbild"), soll = k.bild ? T.ortAufloesen(k.bild) : null;
      pruefe(bl.classList.contains("da") === !!(soll && T.BILDER[soll]),
        wo+": Szenenbild "+(soll?"fehlt":"steht da, obwohl die Szene keines hat"));
      pruefe(!soll || !T.BILDER[soll] || bl.getAttribute("data-bild")===soll,
        wo+": falsches Szenenbild — erwartet "+soll);
      pruefe(!k.bild || typeof k.bild!=="string" || !!T.BILDER[k.bild],
        wo+": Bild "+k.bild+" steht nicht in BILDER");
      pruefe(el("bildzeigen").hidden === !(soll && T.BILDER[soll]),
        wo+": der Knopf „zeigen“ steht "+(soll?"nicht da":"da, obwohl es nichts zu zeigen gibt"));
    }
    }
    for(const gruppe of GRUPPEN) chancen.forEach(c=>{
      const nur=T.liste(c.nur).filter(f=>gruppe.includes(f));
      pruefe(nur.length===0 || nur.some(T.hat), wo+": Gelegenheit "+c.wer+" sichtbar, obwohl ihr Zweig ("+nur+") nicht gewählt ist");
    });
    if(i===S.finale){ const heilerin=chancen.some(c=>c.wer==="Lightbearer");
      pruefe(heilerin===(T.Z().gefahr>=4 && p.wahl!=="e3_buch"), wo+": Thrall-Gelegenheit widerspricht dem Thrall-Lader"); }

    /* Orientierung: nie eine leere Seite, nie ein „geh zurück“ auf einem gültigen Pfad */
    pruefe(!text().includes("hinweisfehlt"), wo+": Seite verlangt eine Vorentscheidung, die auf diesem Pfad längst da sein sollte");
    if(k.art!=="info") pruefe(sichtbar.length>0, wo+": keine sichtbaren Blöcke");
    /* Ort auflösbar */
    if(k.ort){ const o=T.ortAufloesen(k.ort); pruefe(o!==null, wo+": Ort nicht bestimmbar"); }
    /* Übergang: Austritt des Vorgängers = Eintritt hier */
    if(i>=2 && K[i-1].nach && k.ort){
      const nach=T.ortAufloesen(K[i-1].nach), ort=T.ortAufloesen(k.ort);
      pruefe(nach===ort, wo+`: Ortsbruch — vorher endet bei „${nach}“, hier beginnt es bei „${ort}“`);
    }
    /* Übergangsblöcke mit „von“: genau einer sichtbar, und er passt zum Eintrittsort */
    const vonBloecke=k.bloecke.filter(b=>b.von!==undefined);
    if(vonBloecke.length){ const sv=sichtbar.filter(b=>b.von!==undefined);
      pruefe(sv.length===1, wo+`: ${sv.length} Übergangsblöcke sichtbar statt 1`);
      if(sv.length===1) pruefe(sv[0].von===T.ortAufloesen(k.ort), wo+": Übergangsblock beschreibt einen anderen Ort als den Eintrittsort"); }
    /* Ausschliesslichkeit je Entscheidungsgruppe */
    /* Ein sichtbarer Block, der an einen Zweig gebunden ist, muss den gewählten Zweig einschliessen
       (nur: mindestens einer gesetzt; alle: jeder gesetzt). Ein Block darf für zwei Türen gelten. */
    for(const gruppe of GRUPPEN) sichtbar.forEach(b=>{
      const nur=T.liste(b.nur).filter(f=>gruppe.includes(f)), alle=T.liste(b.alle).filter(f=>gruppe.includes(f));
      pruefe(nur.length===0 || nur.some(T.hat), wo+": Block „"+(b.titel||b.t)+"“ sichtbar, obwohl sein Zweig ("+nur+") nicht gewählt ist");
      pruefe(alle.every(T.hat), wo+": Block „"+(b.titel||b.t)+"“ sichtbar, obwohl nicht alle Flaggen gesetzt sind");
    });
    /* Gefahrenbänder: genau eins */
    const baender=sichtbar.filter(b=>b.t==="wenn"&&b.gefahrVon!==undefined&&b.nur===undefined&&b.nicht===undefined);
    const alleBaender=k.bloecke.filter(b=>b.t==="wenn"&&b.gefahrVon!==undefined&&b.nur===undefined&&b.nicht===undefined);
    if(alleBaender.length===3) pruefe(baender.length===1, wo+`: ${baender.length} Gefahrenbänder sichtbar`);
    spur.push({schritt:i, titel:k.titel, ort:T.ortAufloesen(k.ort), gefahr:T.Z().gefahr, hp:T.Z().gruppe.map(h=>h.hp).join("/"),
      flaggen:Object.keys(T.Z().flaggen).join(","), wissen:Object.keys(T.Z().wissen).join(",")||"–", bloecke:sichtbar.length,
      ziel:(k.bloecke.find(b=>b.t==="ziel")||{}).text, gegner:T.Z().gegner.map(g=>g.name+" "+g.hp).join(", ")});
  }
  /* Endzustand */
  const Zend=T.Z(), wo=`Pfad ${JSON.stringify(p)}`;
  const gefahrNachE3 = Math.min(10, GEFAHR[p.weg]+(p.wache?1:0)+(p.tuer==="kapelle"&&p.anneke?1:GEFAHR[p.tuer])+GEFAHR[p.wahl]);
  pruefe(patrouilleErlebt===(gefahrNachE3>=8), wo+`: Patrouille ${patrouilleErlebt?"kam":"kam nicht"}, Gefahr nach E3 war ${gefahrNachE3}`);
  pruefe(Zend.gefahr===erwarteteGefahr(p), wo+`: Gefahr ${Zend.gefahr}, erwartet ${erwarteteGefahr(p)}`);
  const hpSoll = p.weg==="weg_b" ? T.KAPITEL && [16,28,22] : [18,30,24];
  pruefe(Zend.gruppe.map(h=>h.hp).join()===hpSoll.join(), wo+`: HP ${Zend.gruppe.map(h=>h.hp)} statt ${hpSoll}`);
  const vaskir=Zend.gegner.find(g=>g.k==="vaskir"), thralls=Zend.gegner.filter(g=>g.k==="thrall").length;
  pruefe(vaskir && vaskir.hp===(Zend.gefahr<=3?40:55), wo+": Vaskir-HP passen nicht zum Barometer");
  pruefe(thralls===((Zend.gefahr>=4&&p.wahl!=="e3_buch")?2:0), wo+`: ${thralls} Thralls geladen`);
  /* Epilog-Karten */
  T.geheZu(S.epilog); const s11=T.sichtbareBloecke(K[S.epilog]).map(b=>b.titel||b.t);
  pruefe(s11.filter(t=>["Ein neuer Vertrag","Der Graf ist tot","Er ist entkommen"].includes(t)).length===1, wo+": Epilog zeigt nicht genau einen Ausgang");
  const annekeKarten=s11.filter(t=>/Anneke|Mädchen aus der Kapelle/.test(t)).length;
  pruefe(annekeKarten===((p.tuer==="kapelle"||p.wahl==="e3_buch")?1:0), wo+`: ${annekeKarten} Anneke-Karten im Epilog`);
  const tamKarten=s11.filter(t=>t.startsWith("Tam"));
  pruefe(tamKarten.length===(p.tuer==="kueche"?1:0), wo+`: ${tamKarten.length} Tam-Karten im Epilog`);
  if(HAT_TAM_BITTE && p.tuer==="kueche") pruefe(tamKarten[0].includes({offen:"nichts gesagt",zugesagt:"versprochen",abgelehnt:"Nein"}[p.tam||"offen"]), wo+": Tam-Karte passt nicht zum Festgehaltenen: "+tamKarten[0]);
  pruefe(s11.includes("Bellamys Brief")===(p.tuer==="bibliothek"), wo+": Bellamy-Karte passt nicht zur Tür");
  pruefe(s11.includes("Mirela auf dem Weg hinunter")===(p.wahl==="e3_raus"&&p.ausgang==="ausgang_flucht"), wo+": Mirela-Karte passt nicht");
  pruefe(s11.includes("Das Blutbuch brannte")===(p.wahl==="e3_buch"), wo+": Blutbuch-Karte passt nicht");
  /* Schlussseite: genau ein Schlusstext, und er gehört zur getroffenen Wahl */
  T.geheZu(S.ende); const s12=T.sichtbareBloecke(K[S.ende]).map(b=>b.titel||b.t);
  const SCHLUSS={weiter_jagd:"Schluss · Die nächste Jagd", weiter_dorf:"Schluss · Der Winter", weiter_schloss:"Schluss · Nachtfels"};
  pruefe(s12.filter(t=>Object.values(SCHLUSS).includes(t)).length===1, wo+": Schlussseite zeigt nicht genau einen Schlusstext");
  pruefe(s12.includes(SCHLUSS[p.danach]), wo+": Schlusstext passt nicht zur letzten Wahl");
  pruefe(s12.includes("Sie bleiben, und der Vertrag ist tot")===(p.danach==="weiter_dorf"&&p.ausgang==="ausgang_tot"), wo+": Winter-Notiz falsch");
  pruefe(s12.includes("Sie ziehen ein, und er lebt noch")===(p.danach==="weiter_schloss"&&p.ausgang==="ausgang_flucht"), wo+": Schloss-Notiz falsch");
  pruefe(Zend.gefahr===erwarteteGefahr(p), wo+": die letzte Entscheidung hat die Gefahr verändert");
  /* NPC-Kontinuität an drei Stellen */
  T.geheZu(S.hof); const s5=T.sichtbareBloecke(K[S.hof]);
  pruefe(s5.some(b=>b.nur==="weg_c")===(p.weg==="weg_c"), wo+": Corvin im Hof, obwohl nicht mit der Kutsche gekommen (oder umgekehrt)");
  T.geheZu(S.tuer); const s7=T.sichtbareBloecke(K[S.tuer]);
  pruefe(s7.some(b=>b.t==="kampf")===(p.tuer==="kapelle"&&!p.anneke), wo+": Anneke-Kampf sichtbar/unsichtbar falsch");
  T.geheZu(S.finale); const s10=T.sichtbareBloecke(K[S.finale]);
  pruefe(s10.some(b=>b.id==="pakt_scheitert")===(p.wahl==="e3_pakt"), wo+": Verhandlungsknopf falsch sichtbar");
  pruefe(s10.some(b=>b.titel==="Zwei Thralls kommen dazu")===(Zend.gefahr>=4&&p.wahl!=="e3_buch"), wo+": Thrall-Karte widerspricht dem Lader");
  pruefe(s10.some(b=>b.titel==="Keine Thralls")===(Zend.gefahr>=4&&p.wahl==="e3_buch"), wo+": Keine-Thralls-Karte falsch");
  return spur;
}

const gefahrWerte=new Set();
pfade.forEach(p=>{ spiele(p); gefahrWerte.add(T.Z().gefahr); });

/* ---------- 3 · Erreichbarkeit jedes Blocks ---------- */
gesehen.forEach((n,key)=>{ const [i,j]=key.split("/").map(Number); const b=K[i].bloecke[j];
  if(b.notstopp) return;   /* nur über den Notstopp erreichbar — den spielt Abschnitt 6a für jeden Fall durch */
  pruefe(n>0, `Unerreichbar: Schritt ${i} Block ${j} (${b.t}${b.titel?" · "+b.titel:""}${b.id?" · "+b.id:""})`); });

gesehenChancen.forEach((n,key)=>{ const [i,j]=key.split("/").map(Number); const c=K[i].chancen[j];
  pruefe(n>0, `Unerreichbare Gelegenheit: Schritt ${i} · ${c.wer} · ${c.talent}`); });
/* Gelegenheiten dürfen nur an Flaggen hängen, die vor ihrer Szene gesetzt werden */
K.forEach((k,i)=>(k.chancen||[]).forEach(c=>T.liste(c.nur).concat(T.liste(c.alle),T.liste(c.nicht)).forEach(f=>{
  const ent=Object.keys(T.ENTSCHEIDUNGEN).find(id=>T.ENTSCHEIDUNGEN[id].flaggen.includes(f));
  if(ent){ const idx=K.findIndex(kk=>kk.bloecke.some(b=>b.t==="optionen"&&b.id===ent)); pruefe(idx<i, `Schritt ${i}: Gelegenheit hängt an ${f}, das erst in Schritt ${idx} gewählt wird`); }
})));

/* ---------- 4 · Vorzeitiges Auslösen ---------- */
frisch();
T.waehle("e2",0); pruefe(T.Z().gewaehlt.e2===undefined, "e2 liess sich vor e1 wählen");
T.waehle("e3",0); pruefe(T.Z().gewaehlt.e3===undefined, "e3 liess sich vor e2 wählen");
T.waehle("e5",0); pruefe(T.Z().gewaehlt.e5===undefined, "e5 liess sich vor e4 wählen");
T.waehle("e4",0); pruefe(T.Z().gewaehlt.e4===undefined, "e4 liess sich vor e3 wählen");
T.geheZu(S.berg); pruefe(text().includes("hinweisfehlt"), "Aufstieg ohne e1 zeigt keinen Hinweis");
T.geheZu(S.finale); pruefe(text().includes("hinweisfehlt"), "Finale ohne e3 zeigt keinen Hinweis");
T.geheZu(S.epilog); pruefe(text().includes("hinweisfehlt"), "Epilog ohne e4 zeigt keinen Hinweis");
T.tunAusfuehren("stollen_luft"); pruefe(T.Z().gruppe[0].hp===18, "Stollen-Knopf wirkte ohne Weg B");
T.tunAusfuehren("pakt_scheitert"); pruefe(T.Z().gefahr===0, "Verhandlungsknopf wirkte ohne e3_pakt");

/* ---------- 5 · Doppeltes Auslösen ---------- */
frisch(); T.waehle("e1",optIdx("e1","weg_b")); T.tunAusfuehren("stollen_luft"); T.tunAusfuehren("stollen_luft");
pruefe(T.Z().gruppe.map(h=>h.hp).join()==="16,28,22", "Stollen-Knopf zog zweimal ab: "+T.Z().gruppe.map(h=>h.hp));
T.tunAusfuehren("w_anneke"); T.tunAusfuehren("w_anneke"); pruefe(!T.Z().wissen.anneke, "Wissen-Knopf ist kein Umschalter");

/* ---------- 6 · Umwählen nimmt Folgen zurück ---------- */
frisch(); T.waehle("e1",optIdx("e1","weg_b")); T.tunAusfuehren("stollen_luft"); T.waehle("e1",optIdx("e1","weg_a"));
pruefe(T.Z().gruppe.map(h=>h.hp).join()==="18,30,24", "Umwahl B→A gab die 2 HP nicht zurück");
pruefe(T.Z().gefahr===2 && !T.Z().flaggen.weg_b && T.Z().flaggen.weg_a && !T.Z().getan.stollen_luft, "Umwahl B→A: Zustand unsauber "+JSON.stringify({g:T.Z().gefahr,f:T.Z().flaggen,t:T.Z().getan}));
frisch(); T.waehle("e1",0); T.setzeWissen("anneke",true); T.waehle("e2",optIdx("e2","kapelle"));
pruefe(T.Z().gefahr===3, "Kapelle mit Anneke sollte +1 geben, ist "+T.Z().gefahr);
T.waehle("e2",optIdx("e2","kueche")); pruefe(T.Z().gefahr===2, "Umwahl Kapelle→Küche nahm die +1 nicht zurück");
T.waehle("e2",optIdx("e2","kapelle")); T.setzeWissen("anneke",false); pruefe(T.Z().gefahr===3, "Gespeicherte Wirkung darf sich beim Vergessen nicht ändern");
frisch(); T.waehle("e1",0); T.waehle("e2",0); T.waehle("e3",optIdx("e3","e3_pakt")); T.tunAusfuehren("pakt_scheitert");
pruefe(T.Z().gefahr===7, "pakt_scheitert: Gefahr "+T.Z().gefahr);
T.waehle("e3",optIdx("e3","e3_buch")); pruefe(T.Z().gefahr===5 && !T.Z().getan.pakt_scheitert, "Umwahl Pakt→Buch nahm die +4 nicht zurück: "+T.Z().gefahr);
/* Deckel: +4 über 10 hinaus wird beim Zurücknehmen nur um das tatsächlich Angewandte reduziert */
frisch(); T.waehle("e1",0); T.waehle("e2",optIdx("e2","kapelle")); T.waehle("e3",optIdx("e3","e3_raus"));
T.Z().gefahr=9; T.waehle("e3",optIdx("e3","e3_pakt")); /* 9−3=6 */ T.tunAusfuehren("pakt_scheitert"); /* 10, angewandt +4 */
pruefe(T.Z().gefahr===10, "Deckel bei 10 nicht eingehalten");
T.waehle("e3",optIdx("e3","e3_buch")); pruefe(T.Z().gefahr===8, "Rücknahme über dem Deckel falsch: "+T.Z().gefahr);

frisch(); T.waehle("e1",optIdx("e1","weg_b")); T.tunAusfuehren("keller_kampf");
pruefe(T.Z().gefahr===1 && T.Z().gegner.length===1, "keller_kampf lädt nicht richtig");
T.waehle("e1",optIdx("e1","weg_c"));
pruefe(T.Z().gefahr===4 && T.Z().gegner.length===0 && !T.Z().getan.keller_kampf, "Umwahl B→C nahm die Wache nicht zurück: "+JSON.stringify({g:T.Z().gefahr,n:T.Z().gegner.length}));

/* ---------- 6b · Patrouille und Verstärkung ---------- */
const AKT = K.findIndex((k,i)=>i>S.hof && k.art!=="ent");   /* der Akt, vor dem die Patrouille kommt */
frisch(); T.geheZu(S.hof); T.setzeGefahr(8,"Test");
pruefe(T.Z().patrouille.status==="steht_bevor" && T.Z().patrouille.vor===AKT, "Patrouille nicht vor dem nächsten Akt ("+AKT+") angesetzt: "+JSON.stringify(T.Z().patrouille));
if(AKT-1>S.hof){ T.geheZu(AKT-1); pruefe(!T.Z().imZwischenakt && T.Z().schritt===AKT-1, "Zwischenakt kam vor der Entscheidung statt vor dem Akt"); }
T.geheZu(AKT); pruefe(T.Z().imZwischenakt && T.Z().schritt===AKT-1, "Zwischenakt kam nicht vor dem nächsten Akt");
pruefe(text().includes("hinweisfehlt")===false, "Zwischenakt zeigt einen Vorentscheidungs-Hinweis");
el("zurueck").onclick(); pruefe(!T.Z().imZwischenakt && T.Z().schritt===AKT-1 && T.Z().patrouille.status==="steht_bevor", "Zurück aus dem Zwischenakt verliert die Patrouille");
T.geheZu(AKT); el("vor").onclick(); pruefe(T.Z().schritt===AKT && T.Z().patrouille.status==="erledigt" && !T.Z().imZwischenakt, "Weiter aus dem Zwischenakt landet nicht im nächsten Akt");
T.geheZu(AKT+1); pruefe(!T.Z().imZwischenakt, "Patrouille kam ein zweites Mal");
T.setzeGefahr(2,"Test"); pruefe(T.Z().patrouille.status==="erledigt", "Erledigte Patrouille wurde neu angesetzt");
frisch(); T.geheZu(S.hof); T.setzeGefahr(8,"Test"); T.setzeGefahr(-1,"Test");
pruefe(T.Z().patrouille.status==="keine", "Patrouille nicht abgeblasen, als Gefahr unter 8 fiel");
T.geheZu(AKT); pruefe(!T.Z().imZwischenakt, "abgeblasene Patrouille kam trotzdem");
frisch(); T.geheZu(S.finale); T.setzeGefahr(9,"Test"); pruefe(T.Z().patrouille.status==="keine", "Patrouille im Finale angesetzt (vor dem Epilog)");
frisch(); T.setzeGefahr(8,"Test"); const gel=T.ladeKampf(["wolf","wolf"],"wolf");
pruefe(T.Z().gegner.filter(g=>g.k==="wolf").length===3 && gel.length===3, "Verstärkung bei Gefahr 8 fehlt (Wölfe)");
frisch(); T.setzeGefahr(7,"Test"); T.ladeKampf(["wolf","wolf"],"wolf");
pruefe(T.Z().gegner.length===2, "Verstärkung kam schon bei Gefahr 7");
frisch(); T.setzeGefahr(8,"Test"); T.waehle("e1",optIdx("e1","weg_b")); T.tunAusfuehren("keller_kampf");
pruefe(T.Z().gegner.filter(g=>g.k==="wache").length===2, "Kellerwache ohne Verstärkung bei Gefahr 8: "+T.Z().gegner.length);
T.waehle("e1",optIdx("e1","weg_c")); pruefe(T.Z().gegner.length===0, "Umwahl nahm die verstärkte Wache nicht mit zurück: "+T.Z().gegner.length);

/* ---------- 6a · Uhr, Rückgängig, Notstopper (nur V2) ---------- */
if(T.uhrLage && T.rueckgaengig && T.notstoppZumMorgen){
  /* Uhr: das Soll wächst je Seite, „knapp“ heisst hinter dem Soll */
  frisch(); const Z0=T.Z(); Z0.uhr={rest:90*60000-30*60000, laeuft:false, stempel:0};   /* 30 Minuten gespielt */
  T.geheZu(S.inn); pruefe(T.uhrLage().knapp===true, "Uhr: 30 Minuten im Wirtshaus gelten nicht als knapp");
  T.geheZu(S.tuer); pruefe(T.uhrLage().knapp===false, "Uhr: 30 Minuten hinter der Tür gelten als knapp");
  pruefe(T.uhrLage().spaet===false, "Uhr: 60 Minuten Rest gelten als spät");
  Z0.uhr.rest=9*60000; pruefe(T.uhrLage().spaet===true, "Uhr: 9 Minuten Rest vor dem Finale gelten nicht als spät");
  T.geheZu(S.finale); pruefe(T.uhrLage().spaet===false, "Uhr: im Finale darf der Notstopp nicht mehr drängen");
  /* Rückgängig: eine Entscheidung zurücknehmen, Blättern zählt nicht */
  frisch(); T.verlaufLeeren(); const v0=T.verlaufLaenge();   /* der Stapel ist auf 20 gedeckelt — vorher leeren */
  T.geheZu(S.e1); T.geheZu(S.inn); pruefe(T.verlaufLaenge()===v0, "Blättern legt einen Rückgängig-Schritt an");
  T.waehle("e1", optIdx("e1","weg_a")); pruefe(T.verlaufLaenge()===v0+1, "Entscheidung legt keinen Rückgängig-Schritt an");
  pruefe(T.Z().gefahr===2 && T.Z().flaggen.weg_a===true, "Vorbedingung Rückgängig");
  T.rueckgaengig(); pruefe(T.Z().gefahr===0 && !T.Z().flaggen.weg_a && T.Z().gewaehlt.e1===undefined, "Rückgängig nimmt die Entscheidung nicht zurück: "+JSON.stringify({g:T.Z().gefahr,f:T.Z().flaggen}));
  pruefe(T.verlaufLaenge()===v0, "Rückgängig räumt den Schritt nicht ab");
  /* Notstopper: jeder der drei Wege führt in den Morgen und zeigt dort genau seinen Block */
  const ende=seite("Six O’Clock");
  for(const fall of ["tausch","vertrag","kampf"]){
    frisch(); T.waehle("e1",optIdx("e1","weg_b")); T.geheZu(S.hof); T.waehle("e2",optIdx("e2","kueche")); T.geheZu(S.tuer);
    T.Z().uhr={rest:9*60000, laeuft:true, stempel:Date.now()}; T.zeichneUhr();
    pruefe(T.Z().notstopp.gesehen===true, "Notstopp "+fall+": Uhr auf 9 Minuten hat den Grafen nicht gerufen");
    T.notstoppWaehle(fall);
    if(fall==="kampf"){ T.Z().gegner=[]; T.ladeGegner("vaskir",55); T.waehle("e3",optIdx("e3","e3_pakt")); T.waehle("e4",optIdx("e4","ausgang_tot")); }
    T.notstoppZumMorgen();
    const Zn=T.Z();
    pruefe(Zn.schritt===ende, "Notstopp "+fall+": landet nicht im Morgen, sondern in Schritt "+Zn.schritt);
    pruefe(Zn.gewaehlt.e3!==undefined && Zn.gewaehlt.e4!==undefined, "Notstopp "+fall+": e3/e4 nicht gesetzt");
    pruefe(!text().includes("hinweisfehlt"), "Notstopp "+fall+": der Morgen verlangt noch eine Entscheidung");
    const s=T.sichtbareBloecke(K[ende]);
    const ns=s.filter(b=>b.notstopp);
    pruefe(ns.length===1 && ns[0].notstopp===fall, "Notstopp "+fall+": Epilog zeigt "+ns.map(b=>b.notstopp).join(",")+" statt "+fall);
    ns.forEach(b=>gesehen.set(ende+"/"+K[ende].bloecke.indexOf(b), (gesehen.get(ende+"/"+K[ende].bloecke.indexOf(b))||0)+1));
    if(fall!=="kampf") pruefe(Zn.flaggen.ausgang_vertrag===true && Zn.flaggen.e3_pakt===true, "Notstopp "+fall+": Vertrag/Angebot nicht gesetzt");
  }
  /* Ohne Notstopp bleibt der Epilog frei davon */
  frisch(); T.waehle("e1",0); T.geheZu(S.hof); T.waehle("e2",0); T.geheZu(S.e3); T.waehle("e3",0); T.geheZu(S.e4); T.waehle("e4",0); T.geheZu(ende);
  pruefe(T.sichtbareBloecke(K[ende]).filter(b=>b.notstopp).length===0, "Notstopp-Block sichtbar ohne Notstopp");
}

/* ---------- 6b · Kampfbildschirm (nur V2) ---------- */
if(T.oeffneKampf){
  frisch(); pruefe(T.Z().kampfOffen===false && el("kampfmodus").hidden===true, "Kampfbildschirm ist beim Start offen");
  T.waehle("e1",optIdx("e1","weg_b")); T.tunAusfuehren("keller_kampf");
  pruefe(T.Z().kampfOffen===true && el("kampfmodus").hidden===false, "Laden aus der Szene öffnet den Kampfbildschirm nicht");
  pruefe(el("k-titel").textContent.length>0 || el("k-chance").innerHTML.includes("Gewinnchance"), "Kampf ohne Szenenkampf zeigt weder Titel noch Gewinnchance");
  T.schliesseKampf(); pruefe(!T.Z().kampfOffen && el("kampfmodus").hidden===true && T.Z().gegner.length===1, "Schliessen verliert den Kampf");
  T.oeffneKampf(); T.Z().gruppe[1].hp=4; T.kampfVorbei();
  pruefe(!T.Z().kampfOffen && T.Z().gegner.length===0 && T.Z().gruppe.every(h=>h.hp===h.max), "Kampf vorbei heilt nicht oder räumt nicht auf");
  pruefe(T.Z().gefahr===1, "Kampf vorbei hat die Gefahr verändert");
  frisch(); T.geheZu(4); T.waehle("e1",optIdx("e1","weg_a")); T.geheZu(4);
  pruefe(el("k-titel").textContent==="The wolves", "Kampftitel zeigt nicht den vorbereiteten Kampf der Szene: "+el("k-titel").textContent);
  pruefe(el("k-hinweis").innerHTML.includes("Zwei Wölfe"), "Kampfhinweis fehlt");
  pruefe(el("gruppe-kampf").innerHTML.includes("Arcanist"), "Gruppe fehlt im Reiter Charakter-Übersicht / Kampf");
  if(NEU) pruefe(!html.includes('id="gruppe"'), "Lebenspunkte stehen noch auf dem Hauptschirm");
  frisch(); T.waehle("e1",0); T.waehle("e2",0); T.waehle("e3",optIdx("e3","e3_pakt")); T.geheZu(10); T.tunAusfuehren("finale_laden");
  pruefe(T.Z().kampfOffen===true && T.Z().gegner.some(g=>g.k==="vaskir"), "Finale laden öffnet den Kampfbildschirm nicht");
  T.kampfVorbei(); pruefe(T.Z().gegner.length===0, "Finale: Kampf vorbei räumt nicht auf");
}

/* ---------- 6c · Stimmen (nur V2) ---------- */
if(T.STIMMEN){
  const sprechend = k => T.sichtbareBloecke(k).flatMap(b =>
    (b.t==="sagen" && b.wer) ? [b.wer] : (b.t==="vorlesen" && b.spricht) ? [b.spricht] : []);
  /* Schalter aus: keine Stimmangabe im Text */
  if(T.stimmenAn()) T.schalteStimmen();
  frisch(); T.waehle("e1",optIdx("e1","weg_a")); T.geheZu(1);
  pruefe(text().includes('class="wer"'), "Sprechermarke fehlt im Prolog");
  pruefe(!text().includes('class="st"'), "Stimmangabe erscheint, obwohl der Schalter aus ist");
  /* Schalter an: jede sichtbare Sprechermarke trägt ihre drei Wörter */
  T.schalteStimmen();
  pruefe(T.stimmenAn(), "Schalter liess sich nicht einschalten");
  for(const [i,weg,tuer] of [[1,"weg_a","bibliothek"],[4,"weg_c","bibliothek"],[7,"weg_a","bibliothek"],[7,"weg_a","kueche"],[8,"weg_a","kueche"],[10,"weg_a","kueche"]]){
    frisch(); T.schalteStimmen(); T.schalteStimmen();
    T.waehle("e1",optIdx("e1",weg)); T.waehle("e2",optIdx("e2",tuer));
    T.waehle("e3",optIdx("e3","e3_pakt")); T.geheZu(i);
    const k=T.KAPITEL[i], namen=[...new Set(sprechend(k))];
    namen.forEach(nm=>pruefe(text().includes(T.STIMMEN[nm]),
      `Schritt ${i} (${weg}/${tuer}): Stimme von ${nm} fehlt im Text`));
  }
  /* Personenkarten tragen die Stimme ihrer Figur */
  frisch(); T.geheZu(2);
  ["Greta","Old Pieter","Tobias"].forEach(nm=>pruefe(text().includes(T.STIMMEN[nm]), "Stimme fehlt in der Personenkarte: "+nm));
  /* Jede Figur, die spricht, hat eine Stimme */
  T.KAPITEL.concat([T.PATROUILLE]).forEach((k,i)=>k.bloecke.forEach(b=>{
    if(b.t==="sagen" && b.wer) pruefe(!!T.STIMMEN[b.wer], `Schritt ${i}: keine Stimme für ${b.wer}`);
    if(b.t==="vorlesen" && b.spricht) pruefe(!!T.STIMMEN[b.spricht], `Schritt ${i}: keine Stimme für ${b.spricht}`);
  }));
  T.schalteStimmen(); frisch();
}

/* ---------- 7 · Neue Runde ---------- */
frisch(); T.waehle("e1",0); T.setzeWissen("anneke",true); T.Z().gruppe[0].name="Vesper";
el("zuruecksetzen").onclick(); pruefe(T.Z().gefahr===0 && !T.Z().wissen.anneke && T.Z().gruppe[0].name==="Vesper" && !T.Z().gewaehlt.e1, "Neue Runde setzt nicht sauber zurück");

/* ---------- 8 · Sieben Durchläufe mit Spur ---------- */
const durchlaeufe = [
  ["Standard: Strasse, Bibliothek, Angebot, Vertrag",           {weg:"weg_a",anneke:true, tuer:"bibliothek",wahl:"e3_pakt",scheitert:false,ausgang:"ausgang_vertrag",danach:"weiter_jagd"}],
  ["Gegenteil: Stollen, Küche, hinaustragen, tot",              {weg:"weg_b",anneke:false,tuer:"kueche",    wahl:"e3_raus",scheitert:false,ausgang:"ausgang_tot",danach:"weiter_dorf"}],
  ["Wechselnd: Kutsche, Kapelle mit Namen, Buch, Flucht",       {weg:"weg_c",anneke:true, tuer:"kapelle",   wahl:"e3_buch",scheitert:false,ausgang:"ausgang_flucht",danach:"weiter_schloss"}],
  ["Alles entdeckt: Stollen, Kapelle mit Namen, Angebot, Vertrag",{weg:"weg_b",anneke:true, tuer:"kapelle", wahl:"e3_pakt",scheitert:false,ausgang:"ausgang_vertrag",danach:"weiter_jagd"}],
  ["Nichts entdeckt: Strasse, Kapelle ohne Namen, hinaustragen, Flucht",{weg:"weg_a",anneke:false,tuer:"kapelle",wahl:"e3_raus",scheitert:false,ausgang:"ausgang_flucht",danach:"weiter_dorf"}],
  ["Verhandlung scheitert: Kutsche, Küche, Angebot→Kampf, tot", {weg:"weg_c",anneke:false,tuer:"kueche",    wahl:"e3_pakt",scheitert:true, ausgang:"ausgang_tot",danach:"weiter_schloss"}],
  ["Sonderfall: Buch verbrannt, Kapelle nie betreten, Vertrag",   {weg:"weg_a",anneke:true, tuer:"bibliothek",wahl:"e3_buch",scheitert:false,ausgang:"ausgang_vertrag",danach:"weiter_jagd"}],
];
const spuren = durchlaeufe.map(([name,p])=>[name, spiele(p)]);

/* ---------- Bericht ---------- */
console.log("Pfade durchgespielt:", pfade.length, "· Zusicherungen geprüft:", gepruefteZusicherungen);
console.log("Erreichte Gefahrenwerte ohne Handeingriff:", [...gefahrWerte].sort((a,b)=>a-b).join(" "));
if(process.argv.includes("--spur")) spuren.forEach(([name,spur])=>{
  console.log("\n=== "+name+" ===");
  spur.forEach(s=>console.log(`${String(s.schritt).padStart(2)} ${s.titel.padEnd(18)} ORT ${String(s.ort||"–").padEnd(36)} G${s.gefahr} HP ${s.hp.padEnd(8)} FLAGS ${s.flaggen||"–"} | WISSEN ${s.wissen} | BLÖCKE ${s.bloecke}${s.gegner?" | GEGNER "+s.gegner:""}`));
});
if(befunde.length){ console.log("\nBEFUNDE ("+befunde.length+"):"); [...new Set(befunde)].slice(0,40).forEach(b=>console.log(" ✗ "+b)); process.exit(1); }
console.log("Keine Befunde.");
