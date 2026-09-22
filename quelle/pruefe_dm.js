#!/usr/bin/env node
/* Prüfstand für dungeon_master.html
   Lädt das Skript der Seite unverändert, ersetzt das DOM durch Attrappen und spielt
   jede erreichbare Zustandsklasse von Schritt 0 bis 11 durch. Jede Abweichung ist ein Befund. */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");

/* ---------- DOM-Attrappe ---------- */
const elemente = {};
function el(id){
  if(!elemente[id]) elemente[id] = { id, innerHTML:"", textContent:"", className:"", hidden:false, disabled:false, value:"",
    style:{}, dataset:{}, onclick:null, classList:{ toggle(){}, add(){}, remove(){} }, querySelector(){ return null; } };
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
  kampfVorbei: typeof kampfVorbei==="function" ? kampfVorbei : null }`);
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
     pfade.push({weg,anneke,tuer,wahl,scheitert,ausgang,wache,danach});

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
    if(i===2 && p.anneke) T.tunAusfuehren("w_anneke");
    if(i===3) T.waehle("e1", optIdx("e1",p.weg));
    if(i===4 && p.weg==="weg_b") T.tunAusfuehren("stollen_luft");
    if(i===4 && p.wache) T.tunAusfuehren(p.weg==="weg_a"?"tor_kampf":"keller_kampf");
    if(i===4){ T.geheZu(4); const wachen=T.Z().gegner.filter(g=>g.k==="wache").length;
      pruefe(wachen===(p.wache?(p.weg==="weg_a"?2:1):0), `Pfad ${JSON.stringify(p)}: ${wachen} Wachen geladen`); }
    if(i===6) T.waehle("e2", optIdx("e2",p.tuer));
    if(i===9) T.waehle("e3", optIdx("e3",p.wahl));
    if(i===10){ if(p.scheitert) T.tunAusfuehren("pakt_scheitert"); T.tunAusfuehren("finale_laden"); T.waehle("e4", optIdx("e4",p.ausgang)); }
    if(i===12) T.waehle("e5", optIdx("e5",p.danach));
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
    const sichtbar=T.sichtbareBloecke(k);
    sichtbar.forEach(b=>{ const j=k.bloecke.indexOf(b); gesehen.set(i+"/"+j, gesehen.get(i+"/"+j)+1); });
    const wo=`Pfad ${JSON.stringify(p)} Schritt ${i} (${k.titel})`;
    /* Zweite Ebene: Gelegenheiten — leise, nie auf Entscheidungsseiten, nie mehr als die Szene selbst */
    const chancen=T.sichtbareChancen(k);
    chancen.forEach(c=>{ const j=k.chancen.indexOf(c); gesehenChancen.set(i+"/"+j, gesehenChancen.get(i+"/"+j)+1); });
    pruefe(k.art!=="ent" || chancen.length===0, wo+": Gelegenheiten auf einer Entscheidungsseite");
    pruefe(chancen.length<=3, wo+`: ${chancen.length} Gelegenheiten sichtbar — mehr als drei lenken ab`);
    pruefe(chancen.length<=sichtbar.length, wo+": mehr Gelegenheiten als Szenenblöcke");
    const st=el("staerken").innerHTML, vl=el("verlauf").innerHTML;
    pruefe((k.verlauf||[]).filter(T.gilt).every(r=>vl.includes(r.wenn)&&vl.includes(r.dann)), wo+": Wenn-dann-Spalte unvollständig");
    for(const gruppe of GRUPPEN) (k.verlauf||[]).filter(T.gilt).forEach(r=>{
      const nur=T.liste(r.nur).filter(f=>gruppe.includes(f));
      pruefe(nur.length===0 || nur.some(T.hat), wo+": Regel „"+r.wenn+"“ sichtbar, obwohl ihr Zweig nicht gewählt ist"); });
    pruefe((k.verlauf||[]).filter(T.gilt).length<=8, wo+": mehr als acht Regeln in der mittleren Spalte");
    pruefe(!text().includes('class="staerke'), wo+": Gelegenheiten stehen noch in der Hauptspalte");
    pruefe(["Magic Hand","Strength","Healing Touch"].every(t=>st.includes(t)), wo+": Stärken-Abschnitt nennt nicht alle drei Talente");
    chancen.forEach(c=>pruefe(st.includes(c.text) && st.includes(c.folge) && st.includes(c.cue), wo+": Gelegenheit fehlt rechts: "+c.wer+" · "+c.talent));
    const gelb=sichtbar.filter(b=>b.t==="vorlesen"||b.t==="sagen").flatMap(b=>b.text);
    chancen.forEach(c=>pruefe(gelb.some(t=>t.includes(c.cue)), wo+": Ankündigung „"+c.cue+"“ wird auf diesem Pfad nicht vorgelesen"));
    if(!NEU){
      const leerZeilen=(st.match(/staerke leer/g)||[]).length, belegt=new Set(chancen.map(c=>c.wer)).size;
      pruefe(leerZeilen===3-belegt, wo+`: ${leerZeilen} leere Stärken-Zeilen bei ${belegt} belegten Figuren`);
    } else {
    /* Figuren ohne Gelegenheit stehen in einer gesammelten Zeile, mit Namen und Talent */
    const ohneFiguren=T.Z().gruppe.filter(x=>!chancen.some(c=>c.wer===x.rolle)).map(x=>x.rolle);
    pruefe((st.match(/staerke leer/g)||[]).length===(ohneFiguren.length?1:0), wo+": Sammelzeile für Figuren ohne Gelegenheit fehlt oder ist doppelt");
    ohneFiguren.forEach(r=>pruefe(st.includes(r), wo+": Figur ohne Gelegenheit wird rechts nicht genannt: "+r));
    /* Knöpfe der Szene erscheinen auch in der Aktionsleiste */
    const akt=el("aktionen").innerHTML;
    sichtbar.filter(b=>b.t==="tun").forEach(b=>pruefe(akt.includes('data-tun="'+b.id+'"'), wo+": Knopf fehlt in der Aktionsleiste: "+b.id));
    sichtbar.filter(b=>b.t==="kampf"&&!b.ohneKnopf).forEach(b=>pruefe(akt.includes('data-laden="'+b.gegner.join(",")+'"'), wo+": Kampfknopf fehlt in der Aktionsleiste"));
    const wB=k.bloecke.find(b=>b.t==="weiter");
    pruefe(!wB || akt.includes(wB.text), wo+": „Weiter, wenn“ fehlt in der Aktionsleiste");
    const zB=k.bloecke.find(b=>b.t==="ziel");
    pruefe(!zB || el("zielzeile").innerHTML.includes(zB.text), wo+": Ziel fehlt in der Titelzeile");
    }
    for(const gruppe of GRUPPEN) chancen.forEach(c=>{
      const nur=T.liste(c.nur).filter(f=>gruppe.includes(f));
      pruefe(nur.length===0 || nur.some(T.hat), wo+": Gelegenheit "+c.wer+" sichtbar, obwohl ihr Zweig ("+nur+") nicht gewählt ist");
    });
    if(i===10){ const heilerin=chancen.some(c=>c.wer==="Lightbearer");
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
  T.geheZu(11); const s11=T.sichtbareBloecke(K[11]).map(b=>b.titel||b.t);
  pruefe(s11.filter(t=>["Ein neuer Vertrag","Der Graf ist tot","Er ist entkommen"].includes(t)).length===1, wo+": Epilog zeigt nicht genau einen Ausgang");
  const annekeKarten=s11.filter(t=>/Anneke|Mädchen aus der Kapelle/.test(t)).length;
  pruefe(annekeKarten===((p.tuer==="kapelle"||p.wahl==="e3_buch")?1:0), wo+`: ${annekeKarten} Anneke-Karten im Epilog`);
  pruefe(s11.includes("Tam")===(p.tuer==="kueche"), wo+": Tam-Karte passt nicht zur Tür");
  pruefe(s11.includes("Bellamys Brief")===(p.tuer==="bibliothek"), wo+": Bellamy-Karte passt nicht zur Tür");
  pruefe(s11.includes("Mirela auf dem Weg hinunter")===(p.wahl==="e3_raus"&&p.ausgang==="ausgang_flucht"), wo+": Mirela-Karte passt nicht");
  pruefe(s11.includes("Das Blutbuch brannte")===(p.wahl==="e3_buch"), wo+": Blutbuch-Karte passt nicht");
  /* Schlussseite: genau ein Schlusstext, und er gehört zur getroffenen Wahl */
  T.geheZu(12); const s12=T.sichtbareBloecke(K[12]).map(b=>b.titel||b.t);
  const SCHLUSS={weiter_jagd:"Schluss · Die nächste Jagd", weiter_dorf:"Schluss · Der Winter", weiter_schloss:"Schluss · Nachtfels"};
  pruefe(s12.filter(t=>Object.values(SCHLUSS).includes(t)).length===1, wo+": Schlussseite zeigt nicht genau einen Schlusstext");
  pruefe(s12.includes(SCHLUSS[p.danach]), wo+": Schlusstext passt nicht zur letzten Wahl");
  pruefe(s12.includes("Sie bleiben, und der Vertrag ist tot")===(p.danach==="weiter_dorf"&&p.ausgang==="ausgang_tot"), wo+": Winter-Notiz falsch");
  pruefe(s12.includes("Sie ziehen ein, und er lebt noch")===(p.danach==="weiter_schloss"&&p.ausgang==="ausgang_flucht"), wo+": Schloss-Notiz falsch");
  pruefe(Zend.gefahr===erwarteteGefahr(p), wo+": die letzte Entscheidung hat die Gefahr verändert");
  /* NPC-Kontinuität an drei Stellen */
  T.geheZu(5); const s5=T.sichtbareBloecke(K[5]);
  pruefe(s5.some(b=>b.nur==="weg_c")===(p.weg==="weg_c"), wo+": Corvin im Hof, obwohl nicht mit der Kutsche gekommen (oder umgekehrt)");
  T.geheZu(7); const s7=T.sichtbareBloecke(K[7]);
  pruefe(s7.some(b=>b.t==="kampf")===(p.tuer==="kapelle"&&!p.anneke), wo+": Anneke-Kampf sichtbar/unsichtbar falsch");
  T.geheZu(10); const s10=T.sichtbareBloecke(K[10]);
  pruefe(s10.some(b=>b.id==="pakt_scheitert")===(p.wahl==="e3_pakt"), wo+": Verhandlungsknopf falsch sichtbar");
  pruefe(s10.some(b=>b.titel==="Zwei Thralls kommen dazu")===(Zend.gefahr>=4&&p.wahl!=="e3_buch"), wo+": Thrall-Karte widerspricht dem Lader");
  pruefe(s10.some(b=>b.titel==="Keine Thralls")===(Zend.gefahr>=4&&p.wahl==="e3_buch"), wo+": Keine-Thralls-Karte falsch");
  return spur;
}

const gefahrWerte=new Set();
pfade.forEach(p=>{ spiele(p); gefahrWerte.add(T.Z().gefahr); });

/* ---------- 3 · Erreichbarkeit jedes Blocks ---------- */
gesehen.forEach((n,key)=>{ const [i,j]=key.split("/").map(Number); const b=K[i].bloecke[j];
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
T.geheZu(4); pruefe(text().includes("hinweisfehlt"), "Schritt 4 ohne e1 zeigt keinen Hinweis");
T.geheZu(10); pruefe(text().includes("hinweisfehlt"), "Finale ohne e3 zeigt keinen Hinweis");
T.geheZu(11); pruefe(text().includes("hinweisfehlt"), "Epilog ohne e4 zeigt keinen Hinweis");
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
frisch(); T.geheZu(5); T.setzeGefahr(8,"Test");
pruefe(T.Z().patrouille.status==="steht_bevor" && T.Z().patrouille.vor===7, "Patrouille nicht vor dem nächsten Akt (7) angesetzt: "+JSON.stringify(T.Z().patrouille));
T.geheZu(6); pruefe(!T.Z().imZwischenakt && T.Z().schritt===6, "Zwischenakt kam vor der Entscheidung statt vor dem Akt");
T.geheZu(7); pruefe(T.Z().imZwischenakt && T.Z().schritt===6, "Zwischenakt kam nicht vor Schritt 7");
pruefe(text().includes("hinweisfehlt")===false, "Zwischenakt zeigt einen Vorentscheidungs-Hinweis");
el("zurueck").onclick(); pruefe(!T.Z().imZwischenakt && T.Z().schritt===6 && T.Z().patrouille.status==="steht_bevor", "Zurück aus dem Zwischenakt verliert die Patrouille");
T.geheZu(7); el("vor").onclick(); pruefe(T.Z().schritt===7 && T.Z().patrouille.status==="erledigt" && !T.Z().imZwischenakt, "Weiter aus dem Zwischenakt landet nicht in Schritt 7");
T.geheZu(8); pruefe(!T.Z().imZwischenakt, "Patrouille kam ein zweites Mal");
T.setzeGefahr(2,"Test"); pruefe(T.Z().patrouille.status==="erledigt", "Erledigte Patrouille wurde neu angesetzt");
frisch(); T.geheZu(5); T.setzeGefahr(8,"Test"); T.setzeGefahr(-1,"Test");
pruefe(T.Z().patrouille.status==="keine", "Patrouille nicht abgeblasen, als Gefahr unter 8 fiel");
T.geheZu(7); pruefe(!T.Z().imZwischenakt, "abgeblasene Patrouille kam trotzdem");
frisch(); T.geheZu(10); T.setzeGefahr(9,"Test"); pruefe(T.Z().patrouille.status==="keine", "Patrouille im Finale angesetzt (vor dem Epilog)");
frisch(); T.setzeGefahr(8,"Test"); const gel=T.ladeKampf(["wolf","wolf"],"wolf");
pruefe(T.Z().gegner.filter(g=>g.k==="wolf").length===3 && gel.length===3, "Verstärkung bei Gefahr 8 fehlt (Wölfe)");
frisch(); T.setzeGefahr(7,"Test"); T.ladeKampf(["wolf","wolf"],"wolf");
pruefe(T.Z().gegner.length===2, "Verstärkung kam schon bei Gefahr 7");
frisch(); T.setzeGefahr(8,"Test"); T.waehle("e1",optIdx("e1","weg_b")); T.tunAusfuehren("keller_kampf");
pruefe(T.Z().gegner.filter(g=>g.k==="wache").length===2, "Kellerwache ohne Verstärkung bei Gefahr 8: "+T.Z().gegner.length);
T.waehle("e1",optIdx("e1","weg_c")); pruefe(T.Z().gegner.length===0, "Umwahl nahm die verstärkte Wache nicht mit zurück: "+T.Z().gegner.length);

/* ---------- 6b · Kampfbildschirm (nur V2) ---------- */
if(T.oeffneKampf){
  frisch(); pruefe(T.Z().kampfOffen===false && el("kampfmodus").hidden===true, "Kampfbildschirm ist beim Start offen");
  T.waehle("e1",optIdx("e1","weg_b")); T.tunAusfuehren("keller_kampf");
  pruefe(T.Z().kampfOffen===true && el("kampfmodus").hidden===false, "Laden aus der Szene öffnet den Kampfbildschirm nicht");
  pruefe(el("k-titel").textContent==="Freier Kampf" || el("k-titel").textContent.length>0, "Kampftitel leer");
  T.schliesseKampf(); pruefe(!T.Z().kampfOffen && el("kampfmodus").hidden===true && T.Z().gegner.length===1, "Schliessen verliert den Kampf");
  T.oeffneKampf(); T.Z().gruppe[1].hp=4; T.kampfVorbei();
  pruefe(!T.Z().kampfOffen && T.Z().gegner.length===0 && T.Z().gruppe.every(h=>h.hp===h.max), "Kampf vorbei heilt nicht oder räumt nicht auf");
  pruefe(T.Z().gefahr===1, "Kampf vorbei hat die Gefahr verändert");
  frisch(); T.geheZu(4); T.waehle("e1",optIdx("e1","weg_a")); T.geheZu(4);
  pruefe(el("k-titel").textContent==="The wolves", "Kampftitel zeigt nicht den vorbereiteten Kampf der Szene: "+el("k-titel").textContent);
  pruefe(el("k-hinweis").innerHTML.includes("Zwei Wölfe"), "Kampfhinweis fehlt");
  pruefe(el("gruppe-kampf").innerHTML.includes("Arcanist") && el("gruppe").innerHTML.includes("Arcanist"), "Gruppe fehlt in Szene oder Kampfbildschirm");
  frisch(); T.waehle("e1",0); T.waehle("e2",0); T.waehle("e3",optIdx("e3","e3_pakt")); T.geheZu(10); T.tunAusfuehren("finale_laden");
  pruefe(T.Z().kampfOffen===true && T.Z().gegner.some(g=>g.k==="vaskir"), "Finale laden öffnet den Kampfbildschirm nicht");
  T.kampfVorbei(); pruefe(T.Z().gegner.length===0, "Finale: Kampf vorbei räumt nicht auf");
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
