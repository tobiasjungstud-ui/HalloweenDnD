# The Bride of Nachtfels

Ein Abend **D&D light für den Englischunterricht**. Drei Schülerinnen und Schüler spielen
Vampirjäger, eine Lehrperson führt. Ein Schloss in den Bergen, eine verschwundene Frau,
drei Entscheidungen — und möglichst viel gesprochenes Englisch.

Gebaut für **Vierzehnjährige ohne jedes Vorwissen**: kein Regelwerk, keine Rüstungsklasse,
keine Zauberplätze, keine Absprachen darüber, ob ein Angriff trifft. Die Spielerblätter
würfeln selbst, entscheiden selbst und schreiben jedem den englischen Satz hin, den er
sagen soll. Jede Figur hat genau einen Heiltrank (+10 HP oder wieder auf die Beine); im Kampf
heilt sonst niemand, nach dem Kampf heilt die Lightbearer alle. Fällt eine Figur auf 0, würfelt
sie einmal ihr Schicksal: eine 20 macht sie stärker, eine 1 macht ihren Schaden unberechenbar,
alles dazwischen gibt eine Narbe. Die Spielleitung wird Satz für Satz geführt und muss nichts
vorbereiten.

Alles läuft in einer einzelnen HTML-Datei je Person. Kein Server, kein Build-Schritt zum
Spielen, kein Konto, keine Daten verlassen das Gerät.

---

## Die vier Seiten

| Datei | Für wen | Was darauf steht |
|---|---|---|
| `dungeon_master.html` | Spielleitung | **V2:** dreizehn Seiten Regiebuch — links die Randbeschriftung, in der Mitte der Text, rechts auf gleicher Höhe die Hilfe (Gefahr, Wenn-dann, Stärken); Lebenspunkte und Kampf im Reiter *Charakter-Übersicht / Kampf* |
| `dungeon_master_v1.html` | Spielleitung | **V1**, die frühere Darstellung (vier Farbbalken, drei Spalten, Kampf in der Seitenleiste) — gleiche Daten, gleiche Logik, weiterhin lauffähig |
| `spickzettel.html` | Spielleitung | Eine Seite: der DM-Bildschirm auf einen Blick — neun Bereiche, vier Randbeschriftungen, vier Handgriffe |
| `spieler_magier.html` | The Arcanist, 18 HP | Fireball · Magic Hand · Arcane Darts — Talent ausserhalb des Kampfs: *Magic Hand* |
| `spieler_krieger.html` | The Blade, 30 HP | Sword Strike · Shield Bash · Reckless Charge — Talent: *Strength* |
| `spieler_heiler.html` | The Lightbearer, 24 HP | Radiant Strike · Blinding Light · Judgement — Talent: *Healing Touch*; nach jedem Kampf heilt sie alle umsonst |

Dazu drei Word-Dateien in `helferblatt/`, alle zum Ausdrucken:

| Datei | Für wen | Was drin ist |
|---|---|---|
| `Nachtfels_Helfer-Blatt.docx` | jeder Schüler | Satzanfänge und Vokabeln, zehn Szenen einzeln zugeordnet |
| `Nachtfels_Lesetext_Schueler.docx` | schwächere Schüler | der ganze Vorlesetext zum Mitlesen, schwierige Wörter direkt im Text übersetzt — `fog [Nebel]`; gelb, was der DM fragt; grün, was zu tun ist |
| `Nachtfels_Lesetext_DM.docx` | Spielleitung | dasselbe plus alle grauen Kästen: Tipps, Antworten, Regie, Knöpfe, Kampfwerte — als Papier-Rückhalt neben dem Bildschirm |

Die beiden Lesetexte werden **aus der Konsole erzeugt** (`node quelle/lesetext.js`, mit
`--schueler` für die Schülerfassung) und sind damit immer auf demselben Stand wie der Bildschirm.

`index.html` ist die Startseite, die auf alles verlinkt.

## Ausprobieren

Herunterladen, entpacken, `index.html` im Browser öffnen. Das war alles — es gibt nichts zu
installieren.

## Über GitHub Pages verteilen

Damit jede Person ihren Link auf dem eigenen Gerät öffnen kann:

1. Repository bei GitHub anlegen und den Inhalt dieses Ordners hineinlegen.
2. **Settings → Pages → Source: „Deploy from a branch“**, Branch `main`, Ordner `/ (root)`.
3. Nach ein bis zwei Minuten liegt alles unter `https://<name>.github.io/<repo>/` —
   die Startseite verlinkt die vier Seiten.

## So läuft der Abend

1. Helfer-Blatt ausdrucken, drei Geräte bereitlegen, jedem seinen Link geben.
2. Die Spielleitung liest Seite 1 der Konsole. Fünf Minuten, mehr braucht es nicht.
3. Die Konsole führt durch dreizehn Seiten. Ganz oben eine schmale Leiste, die beim Scrollen
   stehen bleibt: Szene, Ort, Gefahr mit den Knöpfen −1 +1 +2, der Reiter *Charakter-Übersicht
   / Kampf*, das Blättern und die **Lage** (Weg, Tür, Wahl, die drei Talente, das Wissen, die
   Chronik). Darunter die Szene als Regiebuch: am linken Rand steht, was ein Absatz ist —
   **Vorlesen**, **Gesprächsaufforderung** (endet immer mit einer klaren Aufforderung),
   **Hintergrund** (auf einen Satz eingeklappt), **Mögliche Antworten** mit dem Namen der
   Figur darunter. Folgen mehrere Vorlesetexte aufeinander, stehen sie als **ein** Block
   da: die Randnotiz steht nur einmal, und im Text trennen goldene Linien mit dem Titel die
   Abschnitte (*——— Die Treppe ———*, *——— Das Turmzimmer ———*). Rechts daneben, **auf der Höhe der Stelle, zu der sie gehören**, stehen die
   Hilfen: **Wenn … dann** — was hier von der
   Antwort der Gruppe abhängt („alle würfeln 10 oder mehr → an den Wachen vorbei“) — und die
   **Stärken der Figuren** neben dem Absatz, der die Gelegenheit ankündigt. Steht daneben
   nichts, gibt es an dieser Stelle nichts zu beachten. Wo sich eine Szene gabelt, steht
   **Was ist passiert?** über zwei benannten Knöpfen („Ja — er führt euch“ / „Nein — ihr
   sucht selbst“); erst der Klick lässt den passenden Text darunter erscheinen, und nur
   diesen. Das **Ziel** der Szene steht oben
   neben dem Titel; ganz rechts läuft der **Gefahrenbalken** senkrecht über die ganze
   Seitenhöhe: eine Glasröhre, die sich von unten füllt — blau bis 3, gold bis 7, rot
   darüber —, mit Skala, Zeiger, der Zahl im gotischen Bogen und der Stufe daneben.
   Der ganze Streifen glüht in der Farbe der erreichten Stufe — und **er atmet**: Krone,
   Zahl, Schrift, Glasrand, Skalenstriche und die Lichtkante werden heller und dunkler, bis
   Gefahr 6 in einem langsamen Atem (4,5 s, mit steigender Gefahr auf 2,6 s beschleunigend),
   ab 7 in einem **Herzschlag** aus zwei Stössen und einer Pause — 3,0 s bei 7, 1,4 s bei 10 —,
   überlagert von einem Flackern aus drei Sinusschwingungen (±5 % bis ±15 %). Jede Erhöhung
   gibt einen kurzen Lichtstoss, jede Senkung fährt ruhig herunter; bei 10 sitzt ein Gebiss
   über der Krone. Das Modul `GefahrFX` zeichnet dafür nichts — es schreibt nur eine
   Lichtstärke nach `--fx-l`, aus der die CSS-Schatten und -Kanten ihren Schein rechnen, und
   steht bei „reduzierte Bewegung“ still. Der Schalter **Blut** in der
   Leiste füllt das Rohr statt mit einem Balken mit Blut — steigende Blasen, Perlen, die
   innen am Glas herunterlaufen, eine leuchtende Oberfläche. Reine Stimmung; am Wert ändert
   er nichts, und er merkt sich seinen Zustand. Ganz unten sammelt eine Aktionsleiste
   alle Knöpfe der Szene und die Bedingung zum Weiterblättern. Blättern geht auch mit den Pfeiltasten.
   Der Schalter **Stimmen** in der Leiste blendet hinter jedem Sprechernamen drei Wörter ein,
   wie die Figur klingt, etwa *Marek — tief, wortkarg, langsam*. Er merkt sich seinen Zustand.
4. **Charakter-Übersicht und Kampf sind ein eigener Bildschirm.** Dort — und nur dort —
   stehen die **Lebenspunkte**, damit sie beim Vorlesen nicht im Weg sind; auch Schaden
   ausserhalb eines Kampfs (Sumpf, schlechte Luft) wird dort eingetragen. Er öffnet sich,
   sobald ein Kampf geladen wird, oder jederzeit über den Knopf oben rechts (freier Kampf,
   Gegner von Hand). Links die Gruppe mit ihren Talenten, in der Mitte die Gegner mit
   Attacken, Werten und Verstärkung, rechts die Wenn-dann-Regeln dieser Szene, unten das
   Log. Jeder Gegner trägt zwei Zeilen: **wie er aussieht** (zum Vorlesen) und **wie du ihn
   führst** — wen er angreift, wann er aufgibt, was ihn stoppt. Ein Test lässt keinen
   Gegner ohne beides durch; „Kampf vorbei“ heilt alle und kehrt zur Szene zurück, „← Szene“ lässt den Kampf
   offen. Esc schliesst ihn.
5. Etwa drei Stunden. Gut teilbar in zwei Doppelstunden — der Schnitt liegt beim Aufstieg.

## Wie es aufgebaut ist

**Nur drei Dinge werden mitgeführt**, und alle drei ausschliesslich auf dem Bildschirm der
Spielleitung: das Gefahrenbarometer (0–10), die Lebenspunkte, und ein einziges Wissensstück,
das die Gruppe im Wirtshaus aufschnappen kann — den Namen *Anneke*. Die Schüler müssen nichts
notieren.

Intern ist die Konsole eine kleine Zustandsmaschine mit einer einzigen Quelle der Wahrheit
(`Z`): Gefahr, fünf Entscheidungen (Weg, Tür, Wahl im Turm, Ausgang des Finales und zuletzt,
wie es weitergeht), ein Wissen,
zwei einmalige Knöpfe. Jeder Schritt trägt seinen **Eintritts- und Austrittsort**; wo der Ort
von einer Entscheidung abhängt, gibt es je einen Übergangstext, und der Prüfstand kontrolliert,
dass Austritt und nächster Eintritt auf jedem Pfad zusammenpassen. Eine Entscheidung lässt sich
umwählen — Gefahr, Lebenspunkte und Wissen der alten Wahl werden dabei zurückgenommen.

Jede der drei Entscheidungen hat drei Optionen, die **alle zum selben nächsten Ort führen** —
unterschiedlich ist nur der Preis. Kein Handlungsstrang wird übersprungen, keine Gruppe
landet in einer Szene, die die andere nie sieht. Auf dem Bildschirm steht immer nur der Weg,
den die Gruppe tatsächlich gewählt hat; alles andere wird ausgeblendet.

Jeder Hinweis, den die Gruppe finden kann, ist an einen Satz gebunden, den eine Figur
wirklich ausspricht — und jede Person trägt eine Zeile **„Notfalls“**, falls niemand danach
fragt. Das Spiel kann nicht hängenbleiben.

**Was zuerst ins Auge fällt, ist das, was gesagt wird.** Der erste Vorlesesatz steht auf
jeder Seite rund 220 Pixel unter dem oberen Rand, vorher waren es je nach Szene 500 bis 770.
Der Hintergrund steht weiterhin vollständig da, aber als eingeklappte Zeile. Regeln, die
auf das Verhalten der Gruppe reagieren, stehen nicht mehr gesammelt in einer Leiste, sondern
**neben der Stelle, an der sie gebraucht werden**: „Sumpf: ein Wurf unter 10 → −1 HP“ steht
neben dem Sumpf, „Wachen: alle würfeln 10 oder mehr → vorbei“ neben den Wachen. Dieselbe
Spalte trägt, jeweils neben dem Absatz, der sie ankündigt, die
**Stärken der Figuren**:
eine Gelegenheit für *diese* Figur —
der Arcanist mit *Magic Hand*, der Blade mit *Strength*, die Lightbearer mit *Healing Touch*. Sie sind als Möglichkeit
formuliert, nie als Lösung, und jede Szene funktioniert ohne sie.

Was die Schüler nicht hören, können sie nicht nutzen. Deshalb ist **jede Gelegenheit im
gelben Vorlesetext angekündigt** — ein Satz, den die Spielleitung liest und dann wartet:
Tam hält die verbrannte Hand an die Brust; Marek hat die rechte Hand verbunden; der kleinere
Wolf hat ein Fangeisen am Bein; die zweite Tasse steht ausser Reichweite. Die Zeile rechts
zeigt genau diesen Satz und, aufgeklappt, die Folge. Ob ein Spieler darauf eingeht, ist seine
Sache: Wer den Küchenjungen heilt, bekommt sein Vertrauen und einen Satz mehr — wer es nicht
tut, bekommt trotzdem Tams Frage. Und wer es verdirbt (Tam anlügt, Bellamy beleidigt), hat
keinen Führer mehr und sucht den Spiegel selbst: ein Wurf, schlimmstenfalls Gefahr +1. Die
Geschichte bleibt nie stehen.

Der Prüfstand kontrolliert, dass jede Ankündigung auf jedem Pfad, auf dem die Gelegenheit
gilt, wirklich im vorgelesenen Text steht, dass das Talent zur Figur passt, dass keine
Gelegenheit auf einer Entscheidungsseite steht, nie mehr als drei zugleich sichtbar sind,
keine an einer späteren Entscheidung hängt und jede auf mindestens einem Pfad erreichbar ist.

**Der Abend passt sich an.** Erreicht das Gefahrenbarometer 8, lädt jeder Kampfknopf einen
Gegner mehr, und die Konsole schiebt einmal einen Zwischenakt vor den nächsten Akt: eine
Patrouille aus drei Wachen und einem Wachhund — gerade noch zu schaffen, mit Rückzugsregel.
Sinkt die Gefahr vorher wieder unter 8, wird die Patrouille abgeblasen. Die Spielleitung muss
dafür nichts tun; der Prüfstand testet beides auf allen Pfaden.

## V1 und V2

`dungeon_master_v1.html` ist die frühere Darstellung, unverändert und lauffähig. V2
(`dungeon_master.html`) ist eine Neufassung der Darstellung: gleiche Daten, gleicher
Zustand, gleiche Logik, gleicher Prüfstand. Beide Fassungen laufen durch dieselbe Prüfung:

```bash
node quelle/pruefe_dm.js                                  # V2
node quelle/pruefe_dm.js --datei dungeon_master_v1.html   # V1
```

Was V2 zusätzlich prüft: Der Kampfbildschirm ist beim Start zu, öffnet sich beim Laden
eines Kampfs, bleibt beim Schliessen erhalten, und „Kampf vorbei“ heilt alle, entfernt die
Gegner und lässt die Gefahr unverändert.

## Die Spielerblätter ändern

Die drei Blätter werden aus einer gemeinsamen Vorlage erzeugt, damit sie nicht auseinanderlaufen:

```bash
python3 quelle/bauen.py
```

Das liest `quelle/vorlage_spieler.html` (Aufbau, Gestaltung, Würfellogik und die drei
gezeichneten Porträts) und schreibt die drei fertigen Dateien in die Wurzel. Die Werte der
Klassen — Lebenspunkte, Aktionen, Trefferchancen, Signaturfarbe — stehen im Objekt `KLASSEN`
ganz oben im `<script>` der Vorlage.

Die Storylogik hat einen Prüfstand, der das echte Skript der Konsole lädt und alle 216
Entscheidungspfade von Anfang bis Ende durchspielt — Ortskontinuität, Sichtbarkeit, Gefahr,
Lebenspunkte, Gegner, Epilogkarten, Umwählen, vorzeitiges und doppeltes Auslösen:

```bash
node quelle/pruefe_dm.js          # „Keine Befunde.“ oder eine Liste
node quelle/pruefe_dm.js --spur   # dazu sieben Durchläufe Schritt für Schritt
```

Wer an `KAPITEL` etwas ändert, lässt ihn danach laufen. Die Seite selbst prüft ihre Daten
beim Laden ebenfalls (`pruefeStory`) und meldet Unstimmigkeiten in der Browser-Konsole.

Das Helfer-Blatt entsteht aus `helferblatt/helferblatt.js`:

```bash
npm install docx
node helferblatt/helferblatt.js
```

Die Geschichte selbst steht als Datenstruktur `KAPITEL` im `<script>` von
`dungeon_master.html` — dreizehn Objekte mit Blöcken vom Typ `vorlesen`, `sagen`, `aufgabe`,
`personen`, `fa` (Frage/Antwort), `tun`, `optionen`, `kampf`, `wenn`. Wer eine Szene ändern
oder eine eigene schreiben will, arbeitet dort und braucht kein Werkzeug.

## Lizenz

Noch keine gewählt. Ohne Lizenzdatei gilt vollständiges Urheberrecht — wer das Material
weitergeben möchte, legt am besten eine `LICENSE` dazu (für Unterrichtsmaterial ist
CC BY-NC-SA 4.0 üblich).
