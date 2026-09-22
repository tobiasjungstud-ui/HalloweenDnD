const fs = require("fs");
const d = require("docx");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow,
        TableCell, WidthType, ShadingType, BorderStyle, LevelFormat, PageBreak } = d;

const BREITE = 9638;            // A4 abzüglich 2 cm Rand je Seite
const SPALTE = [5100, 4538];

const grau = "F2F2F2";
const linie = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };

function titel(text){
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing:{ before:360, after:120 },
    border:{ bottom:{ style: BorderStyle.SINGLE, size: 8, color: "444444", space: 6 } },
    children:[ new TextRun({ text, font:"Georgia", size:30, bold:true, color:"1A1A1A" }) ] });
}
function auftrag(text){
  return new Paragraph({ spacing:{ after:140 },
    children:[ new TextRun({ text:"What you do:  ", font:"Georgia", size:20, bold:true, color:"7A5A1A" }),
               new TextRun({ text, font:"Georgia", size:20, italics:true, color:"333333" }) ] });
}
function zwischen(text){
  return new Paragraph({ spacing:{ before:180, after:80 },
    children:[ new TextRun({ text, font:"Georgia", size:20, bold:true, color:"1A1A1A" }) ] });
}
function satz(text){
  return new Paragraph({ numbering:{ reference:"striche", level:0 }, spacing:{ after:60 },
    children:[ new TextRun({ text, font:"Georgia", size:22 }) ] });
}
function zelle(text, kopf){
  return new TableCell({ width:{ size: kopf===undefined?SPALTE[0]:SPALTE[kopf], type: WidthType.DXA },
    shading: kopf!==undefined ? undefined : undefined,
    margins:{ top:60, bottom:60, left:110, right:110 },
    children:[ new Paragraph({ children:[ new TextRun({ text, font:"Georgia", size:20 }) ] }) ] });
}
function vokabeln(paare){
  const kopfzeile = new TableRow({ tableHeader:true, children:[
    ["English","Deutsch"].map((t,i)=> new TableCell({
      width:{ size:SPALTE[i], type:WidthType.DXA },
      shading:{ type:ShadingType.CLEAR, fill:grau, color:"auto" },
      margins:{ top:60, bottom:60, left:110, right:110 },
      children:[ new Paragraph({ children:[ new TextRun({ text:t, font:"Georgia", size:18, bold:true, color:"555555" }) ] }) ] }))
  ].flat() });
  const zeilen = paare.map(p => new TableRow({ children: p.map((t,i)=> new TableCell({
    width:{ size:SPALTE[i], type:WidthType.DXA },
    margins:{ top:50, bottom:50, left:110, right:110 },
    children:[ new Paragraph({ children:[ new TextRun({ text:t, font:"Georgia", size:20,
      bold:i===0, color:i===0?"1A1A1A":"444444" }) ] }) ] })) }));
  return new Table({ columnWidths:SPALTE, width:{ size:BREITE, type:WidthType.DXA },
    borders:{ top:linie, bottom:linie, left:linie, right:linie, insideHorizontal:linie, insideVertical:linie },
    rows:[kopfzeile, ...zeilen] });
}

const TEILE = [
 { nr:"Teil 1", ort:"In the carriage", was:"Marek, the driver, asks who you are. Answer him — at least two or three sentences each.",
   saetze:[
     "My name is … and I am a mage / a fighter / a healer.",
     "We are vampire hunters. We are not famous — not yet.",
     "I hunt vampires because …",
     "The thing I am really good at is …",
     "We heard a rumour that …",
     "We came here to find out if it is true."],
   vok:[["a vampire hunter","ein Vampirjäger / eine Vampirjägerin"],["a rumour","ein Gerücht"],
        ["to disappear","verschwinden"],["fog","Nebel"],["damp","feucht, klamm"],
        ["to be afraid of something","vor etwas Angst haben"],["a valley","ein Tal"]] },

 { nr:"Teil 2", ort:"In the inn", was:"Three people in the room will answer you. Everyone asks at least one question — and one follow-up question.",
   saetze:[
     "Excuse me — can I ask you something?",
     "What happened to Mirela?",
     "Why is nobody looking for her?",
     "What happened twenty years ago?",
     "Who wrote that name on the board?",
     "Are you telling me everything?",
     "I don't think that is true."],
   vok:[["an innkeeper","ein Wirt / eine Wirtin"],["a gravedigger","ein Totengräber"],
        ["a board","ein Brett, eine Tafel"],["carved","eingeritzt"],["an arrangement","eine Abmachung"],
        ["to bury somebody","jemanden begraben"],["It is her turn.","Sie ist an der Reihe."],
        ["to pack a bag","eine Tasche packen"]] },

 { nr:"Teil 3", ort:"Making a decision", was:"Say which way you want to take — and why. One full sentence each, before the group votes.",
   saetze:[
     "I think we should take the … because …",
     "That is too dangerous, because …",
     "What if we … instead?",
     "I agree with … / I don't agree, because …",
     "Let's vote."],
   vok:[["a road","eine Strasse"],["a mine","ein Bergwerk"],["a coach","eine Kutsche"],
        ["to be seen","gesehen werden"],["dangerous — safe","gefährlich — sicher"],
        ["to decide","sich entscheiden"],["to agree","zustimmen"]] },

 { nr:"Teil 4", ort:"On the way up", was:"In the cellar: convince the guard that you are guests — one calm sentence each. In the swamp: talk while you roll.",
   saetze:[
     "Good evening. We are guests of the Count.",
     "He is expecting us. We came a long way.",
     "Please — could you take us to him?",
     "I'm stuck! Give me your hand!",
     "Careful — the ground is soft here."],
   vok:[["a guard","eine Wache"],["a guest","ein Gast"],["to expect somebody","jemanden erwarten"],
        ["a cellar","ein Keller"],["a swamp, a bog","ein Sumpf"],["to be stuck","feststecken"],["to sneak","schleichen"]] },

 { nr:"Teil 5", ort:"The courtyard", was:"The raven repeats every sentence it hears. Say one whole sentence to it — slowly and clearly.",
   saetze:[
     "Hello. Can you understand me?",
     "Where is the woman?",
     "Who taught you to speak?",
     "Say: the Count is a liar."],
   vok:[["a raven","ein Rabe"],["a courtyard","ein Innenhof"],["a fountain","ein Brunnen"],
        ["a chapel","eine Kapelle"],["a library","eine Bibliothek"],["to repeat","wiederholen"],
        ["a liar","ein Lügner"]] },

 { nr:"Teil 6", ort:"Behind the door", was:"In the library: tell Bellamy three true things about yourself. In the kitchen: answer Tam's question honestly.",
   saetze:[
     "The thing I regret most is …",
     "I have never told anyone that …",
     "If I don't come back tonight, somebody should know that …",
     "Yes, I promise. We will …",
     "I can't promise that, because …"],
   vok:[["to promise","versprechen"],["to regret something","etwas bereuen"],
        ["true — to lie","wahr — lügen"],["to trust somebody","jemandem vertrauen"],
        ["a favour","ein Gefallen"]] },

 { nr:"Teil 7", ort:"The tower", was:"Mirela does not want to be rescued, and she has good reasons. Give her a real argument — then listen to her answer.",
   saetze:[
     "You don't have to do this, because …",
     "Have you thought about what happens to …?",
     "What if we … instead?",
     "I understand, but …",
     "That is not fair to you.",
     "Don't tell me you are brave. Tell me your plan."],
   vok:[["a deal, a pact","ein Pakt"],["to sign","unterschreiben"],["to volunteer","sich freiwillig melden"],
        ["instead of","anstelle von"],["to protect","beschützen"],["It is not worth it.","Das ist es nicht wert."],
        ["to change your mind","es sich anders überlegen"]] },

 { nr:"Teil 8", ort:"The Count", was:"Before every attack, say one sentence to him. He always answers — politely.",
   saetze:[
     "What do you actually want?",
     "Let her go, and we leave. That is the offer.",
     "You said they were brought to you. That is not the same as innocent.",
     "I am not afraid of you.",
     "Stop. We can make you a better offer."],
   vok:[["to offer something","etwas anbieten"],["to let somebody go","jemanden gehen lassen"],
        ["innocent","unschuldig"],["to give up","aufgeben"],["a promise","ein Versprechen"],
        ["forever","für immer"]] },

 { nr:"Teil 9", ort:"Afterwards", was:"Three questions for the whole group. Everybody answers.",
   saetze:[
     "What would you do differently?",
     "Was the village wrong? Four hundred years of safety for twenty lives.",
     "What do you tell Tobias?",
     "The best moment for me was …"],
   vok:[["differently","anders"],["wrong — right","falsch — richtig"],["safety","Sicherheit"],
        ["a life, lives","ein Leben, Leben"],["to be worth it","es wert sein"]] },

 { nr:"Teil 10", ort:"What happens now", was:"The evening is over, and the coach is waiting. Say what you want to do next — and why. You don't all have to agree.",
   saetze:[
     "I want to … because …",
     "I think we should stay here until the winter is over.",
     "There is another valley. We're not finished.",
     "I'd rather live up there, in the castle.",
     "I'm not going with you. I'm staying — and here's why.",
     "What about Lene? What about Tobias?",
     "Ask me again in the spring."],
   vok:[["to stay behind","zurückbleiben"],["to move in","einziehen"],["to protect somebody","jemanden beschützen"],
        ["on the road","unterwegs"],["to make up your mind","sich entscheiden"],["to owe somebody something","jemandem etwas schulden"],
        ["for good","für immer"],["It's up to you.","Das liegt bei dir."]] }
];

const kinder = [
  new Paragraph({ spacing:{ after:60 },
    children:[ new TextRun({ text:"THE BRIDE OF NACHTFELS", font:"Georgia", size:22, bold:true,
      color:"7A5A1A", characterSpacing:60 }) ] }),
  new Paragraph({ spacing:{ after:100 },
    children:[ new TextRun({ text:"Helfer-Blatt", font:"Georgia", size:48, bold:true }) ] }),
  new Paragraph({ spacing:{ after:300 },
    border:{ bottom:{ style: BorderStyle.SINGLE, size: 8, color: "444444", space: 8 } },
    children:[ new TextRun({ text:"Alles, was du heute Abend auf Englisch sagen musst — nach Szenen geordnet. Leg es neben dich. Du darfst jederzeit abschreiben.",
      font:"Georgia", size:22, italics:true, color:"444444" }) ] }),

  titel("Immer nützlich"),
  new Paragraph({ spacing:{ after:100 }, children:[ new TextRun({
    text:"Diese Sätze gelten den ganzen Abend. Wenn dir ein Wort fehlt — frag auf Englisch danach. Niemand lacht.",
    font:"Georgia", size:20, italics:true, color:"555555" }) ] }),
  ...[ "How do you say … in English?", "What does … mean?", "Sorry, can you say that again?",
       "I don't understand.", "Whose turn is it? — It's my turn.", "Can I ask you something?",
       "Wait — I want to try something." ].map(satz),

  zwischen("In a fight"),
  ...[ "I attack the wolf with my sword.", "I hit for 9 damage.", "I missed.",
       "Critical hit! I hit for 18 damage!", "I heal you for 7 hit points.",
       "How many hit points do you have left?", "I'm down — somebody help me!",
       "I roll for my fate.", "I rolled a nine.", "I drink my potion!", "The fight is over — I heal everyone." ].map(satz),

  zwischen("Your talent — outside of fights"),
  ...[ "Can I use my Magic Hand to …?  (Arcanist)", "I'm strong enough to … — let me try.  (Blade)",
       "Wait — let me look at that wound.  (Lightbearer)", "What happened to your hand?", "Can I try something first?" ].map(satz),

  new Paragraph({ children:[ new PageBreak() ] })
];

TEILE.forEach((t, i) => {
  kinder.push(titel(t.nr + " · " + t.ort));
  kinder.push(auftrag(t.was));
  kinder.push(zwischen("Sentence starters"));
  t.saetze.forEach(s => kinder.push(satz(s)));
  kinder.push(zwischen("Words you might need"));
  kinder.push(vokabeln(t.vok));
  if (i === 4 || i === 7) kinder.push(new Paragraph({ children:[ new PageBreak() ] }));
});

const doc = new Document({
  numbering:{ config:[{ reference:"striche", levels:[{ level:0, format: LevelFormat.BULLET, text:"–",
    alignment: AlignmentType.LEFT, style:{ paragraph:{ indent:{ left:340, hanging:230 } } } }] }] },
  sections:[{ properties:{ page:{ margin:{ top:1134, bottom:1134, left:1134, right:1134 } } }, children: kinder }]
});

Packer.toBuffer(doc).then(b => { fs.writeFileSync("Nachtfels_Helfer-Blatt.docx", b); console.log("geschrieben:", b.length, "Bytes"); });
