# The Bride of Nachtfels

Ein Abend **D&D light für den Englischunterricht**. Drei Schülerinnen und Schüler spielen
Vampirjäger, eine Lehrperson führt. Ein Schloss in den Bergen, eine verschwundene Frau,
drei Entscheidungen — und möglichst viel gesprochenes Englisch.

Gebaut für **Vierzehnjährige ohne jedes Vorwissen**: kein Regelwerk, keine Rüstungsklasse,
keine Zauberplätze, keine Absprachen darüber, ob ein Angriff trifft. Die Spielerblätter
würfeln selbst, entscheiden selbst und schreiben jedem den englischen Satz hin, den er
sagen soll. Fällt eine Figur auf 0, würfelt sie einmal ihr Schicksal: eine 20 macht sie
stärker, eine 1 macht ihren Schaden unberechenbar, alles dazwischen gibt eine Narbe. Die
Spielleitung wird Satz für Satz geführt und muss nichts vorbereiten.

Alles läuft in einer einzelnen HTML-Datei je Person. Kein Server, kein Build-Schritt zum
Spielen, kein Konto, keine Daten verlassen das Gerät.

---

## Die vier Seiten

| Datei | Für wen | Was darauf steht |
|---|---|---|
| `dungeon_master.html` | Spielleitung | Zwölf Seiten Ablauf, Gefahrenbarometer, Lebenspunkte, Kampf-Tracker |
| `spieler_magier.html` | The Arcanist, 18 HP | Fireball · Magic Hand · Arcane Darts |
| `spieler_krieger.html` | The Blade, 30 HP | Sword Strike · Shield Bash · Reckless Charge |
| `spieler_heiler.html` | The Lightbearer, 24 HP | Healing Light · Circle of Light · Radiant Strike |

Dazu drei Word-Dateien in `helferblatt/`, alle zum Ausdrucken:

| Datei | Für wen | Was drin ist |
|---|---|---|
| `Nachtfels_Helfer-Blatt.docx` | jeder Schüler | Satzanfänge und Vokabeln, neun Szenen einzeln zugeordnet |
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
3. Die Konsole führt durch zwölf Seiten:
   **gelb umrandet** = wörtlich vorlesen, **grün** = das sollen die Schüler jetzt tun,
   **grau** = nur für die Spielleitung. Unten steht immer, wann es weitergeht.
4. Etwa drei Stunden. Gut teilbar in zwei Doppelstunden — der Schnitt liegt beim Aufstieg.

## Wie es aufgebaut ist

**Nur drei Dinge werden mitgeführt**, und alle drei ausschliesslich auf dem Bildschirm der
Spielleitung: das Gefahrenbarometer (0–10), die Lebenspunkte, und ein einziges Wissensstück,
das die Gruppe im Wirtshaus aufschnappen kann — den Namen *Anneke*. Die Schüler müssen nichts
notieren.

Intern ist die Konsole eine kleine Zustandsmaschine mit einer einzigen Quelle der Wahrheit
(`Z`): Gefahr, vier Entscheidungen (Weg, Tür, Wahl im Turm, Ausgang des Finales), ein Wissen,
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

**Der Abend passt sich an.** Erreicht das Gefahrenbarometer 8, lädt jeder Kampfknopf einen
Gegner mehr, und die Konsole schiebt einmal einen Zwischenakt vor den nächsten Akt: eine
Patrouille aus drei Wachen und einem Wachhund — gerade noch zu schaffen, mit Rückzugsregel.
Sinkt die Gefahr vorher wieder unter 8, wird die Patrouille abgeblasen. Die Spielleitung muss
dafür nichts tun; der Prüfstand testet beides auf allen Pfaden.

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
`dungeon_master.html` — zwölf Objekte mit Blöcken vom Typ `vorlesen`, `sagen`, `aufgabe`,
`personen`, `fa` (Frage/Antwort), `tun`, `optionen`, `kampf`, `wenn`. Wer eine Szene ändern
oder eine eigene schreiben will, arbeitet dort und braucht kein Werkzeug.

## Lizenz

Noch keine gewählt. Ohne Lizenzdatei gilt vollständiges Urheberrecht — wer das Material
weitergeben möchte, legt am besten eine `LICENSE` dazu (für Unterrichtsmaterial ist
CC BY-NC-SA 4.0 üblich).
