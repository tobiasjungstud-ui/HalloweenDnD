#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Rechnet nach, wie ein Kampf ausgeht — nach genau den Regeln, die im Paket stehen.

Spieler (Spielerblatt): ein w20, Treffer ab der Zielzahl des Angriffs, natürliche 1
verfehlt immer, natürliche 20 verdoppelt die Würfel. Schaden aus den Würfeln des
Blattes. Gegner (Konsole): trifft mit 65 % — `Math.random()>=0.65` verfehlt — und
würfelt seinen Schaden. Im Kampf heilt niemand ausser mit dem eigenen Trank.

  python3 quelle/kampf_sim.py

Wozu: Damit eine Zahl wie „drei Vampire Spawn sind ein Gleichstand“ nachgerechnet
ist und nicht geraten. Wer Werte im BESTIARIUM ändert, kann hier nachsehen, was er
damit angerichtet hat.
"""
import random, re

def wuerfle(f, krit=False):
    m = re.match(r"(\d+)d(\d+)(?:\+(\d+))?$", f)
    n, s, b = int(m.group(1)), int(m.group(2)), int(m.group(3) or 0)
    if krit: n *= 2
    return sum(random.randint(1, s) for _ in range(n)) + b

# Name, Lebenspunkte, Zielzahl und Würfel der verlässlichsten Attacke
GRUPPE = [("Arcanist",    18,  9, "2d8+2"),    # Fireball
          ("Blade",       30,  7, "1d10+4"),   # Sword Strike
          ("Lightbearer", 24,  7, "1d10+4")]   # Radiant Strike

def spieler_schaden(ab, dmg):
    augen = random.randint(1, 20)
    if augen == 1 or augen < ab: return 0
    return wuerfle(dmg, augen == 20)

def kampf(feinde_vorlage, fokus=True, traenke=0):
    """feinde_vorlage: [(Lebenspunkte, Schadenswürfel), …]"""
    helden = [[hp, ab, d, traenke] for _, hp, ab, d in GRUPPE]
    feinde = [[hp, d] for hp, d in feinde_vorlage]
    for runde in range(1, 401):
        for h in helden:
            if h[0] <= 0:
                if h[3] > 0: h[3] -= 1; h[0] = 10      # eigener Heiltrank
                continue
            ziele = [i for i, f in enumerate(feinde) if f[0] > 0]
            if not ziele: return True, runde
            i = ziele[0] if fokus else random.choice(ziele)
            feinde[i][0] -= spieler_schaden(h[1], h[2])
        if all(f[0] <= 0 for f in feinde): return True, runde
        for f in feinde:
            if f[0] <= 0: continue
            ziele = [h for h in helden if h[0] > 0]
            if not ziele: return False, runde
            if random.random() < 0.65: random.choice(ziele)[0] -= wuerfle(f[1])
        if all(h[0] <= 0 and h[3] == 0 for h in helden): return False, runde
    return True, 400

def probe(feinde, n=40000, **kw):
    gewonnen = runden = 0
    for _ in range(n):
        g, r = kampf(feinde, **kw); gewonnen += g; runden += r
    return gewonnen / n * 100, runden / n

SPAWN  = (30, "2d6+5")     # Vampire Spawn
VASKIR = (55, "2d6+2")     # Count Vaskir, Claws

def zeile(text, feinde, **kw):
    q, r = probe(feinde, **kw)
    print("  %-34s %5.1f %%   Ø %.1f Runden" % (text, q, r))

if __name__ == "__main__":
    print("Vampire Spawn — 30 HP, Claws 2d6+5")
    print("(ohne Tränke, ohne Talente, Schaden auf je einen Gegner gebündelt)\n")
    for n_ in (1, 2, 3, 4):
        zeile("%d Spawn" % n_, [SPAWN] * n_)
    print()
    zeile("3 Spawn, Schaden verteilt", [SPAWN] * 3, fokus=False)
    zeile("3 Spawn, jede Figur mit Trank", [SPAWN] * 3, traenke=1)
    print("\n  Vaskir zahlt 6 Lebenspunkte je Spawn:")
    for n_ in (0, 1, 2, 3):
        zeile("Vaskir %2d HP + %d Spawn" % (55 - 6 * n_, n_),
              [(55 - 6 * n_, "2d6+2")] + [SPAWN] * n_, n=20000)
    print("\n  Zum Vergleich, je drei Stück des Bestehenden:")
    for name, hp, dmg in [("Wolf", 14, "1d6+2"), ("Castle Guard", 9, "1d6+1"),
                          ("Thrall", 9, "1d4+1"), ("Anneke", 22, "1d6+3")]:
        zeile("3 × %s" % name, [(hp, dmg)] * 3, n=20000)
