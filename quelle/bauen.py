#!/usr/bin/env python3
"""Baut aus vorlage_spieler.html die drei Spielerblätter.

Je Klasse wird das passende Porträt eingesetzt, die Signaturfarbe, der Titel
und die Rolle. Die drei <template>-Blöcke mit den Porträts fallen dabei weg —
in der fertigen Datei steht nur noch das eine, das dazugehört.
"""
import pathlib
import re

HIER = pathlib.Path(__file__).parent          # quelle/
ZIEL = HIER.parent                            # Wurzel des Repos
VORLAGE = (HIER / "vorlage_spieler.html").read_text(encoding="utf-8")

KLASSEN = {
    "magier":  dict(datei="spieler_magier.html",  titel="Nachtfels Arcanist",
                    farbe="#8f86e0", rolle="The <em>Arcanist</em>", platte="Arcanist · Level 3", nachkampf="After the fight: healed by the Lightbearer → full",
                    talent="<b>Magic Hand</b> — works outside fights too. Fetch, tip over, lift or light something from far away. Say what it should do; the DM decides whether you roll."),
    "krieger": dict(datei="spieler_krieger.html", titel="Nachtfels Blade",
                    farbe="#c8763c", rolle="The <em>Blade</em>", platte="Blade · Level 3", nachkampf="After the fight: healed by the Lightbearer → full",
                    talent="<b>Strength</b> — lift, hold, carry or break what nobody else can, or stand in front of somebody. No dice: say what you do; the DM decides."),
    "heiler":  dict(datei="spieler_heiler.html",  titel="Nachtfels Lightbearer",
                    farbe="#6fae9a", rolle="The <em>Lightbearer</em>", platte="Lightbearer · Level 3", nachkampf="After the fight: I heal everyone → full",
                    talent="<b>Healing Touch</b> — close a wound or calm somebody who is hurt, friend or stranger. No dice: say what you do; the DM decides. Sometimes a healed stranger talks."),
}

PORTRAET = re.compile(r'<template id="p-(\w+)">(.*?)</template>\n?', re.S)
portraets = {m.group(1): m.group(2).strip() for m in PORTRAET.finditer(VORLAGE)}
fehlend = set(KLASSEN) - set(portraets)
if fehlend:
    raise SystemExit(f"Porträt fehlt für: {', '.join(sorted(fehlend))}")

rumpf = PORTRAET.sub("", VORLAGE)

for kennung, k in KLASSEN.items():
    seite = (rumpf
             .replace("<!--__PORTRAET__-->", portraets[kennung])
             .replace("__TITEL__", k["titel"])
             .replace("__FARBE__", k["farbe"])
             .replace("__ROLLE__", k["rolle"])
             .replace("__KLASSENNAME__", k["platte"])
             .replace("__NACHKAMPF__", k["nachkampf"])
             .replace("__TALENT__", k["talent"])
             .replace("__ID__", kennung))
    offen = re.findall(r"__[A-ZÄÖÜ]+__", seite)
    if offen:
        raise SystemExit(f"{k['datei']}: Platzhalter nicht ersetzt: {sorted(set(offen))}")
    (ZIEL / k["datei"]).write_text(seite, encoding="utf-8")
    print(f"{k['datei']:26} {len(seite.encode('utf-8')):>7} Bytes")
