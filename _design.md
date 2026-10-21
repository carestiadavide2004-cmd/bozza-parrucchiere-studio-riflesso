# Design — Studio Riflesso

**Tipo:** parrucchiere donna / uomo (template misto) · **Zona:** Pescara · **Stato:** bozza demo

## Direzione
"Davanti allo specchio": spot cinematografico di un marchio di lusso. Nero caldo, avorio, luce champagne; video a tutto schermo, titoli Bodoni enormi con il loro riflesso.

## Font
- Titoli: Bodoni Moda (opsz) — 400, corsivo 400 per citazioni e kicker
- Testo: Jost — 400, 500

## Palette
| Ruolo | Hex |
|---|---|
| Sfondo scuro | #0E0C0A |
| Sfondo chiaro | #F3ECE1 |
| Testo | #1C1814 |
| Testo secondario | #5F564C |
| Accento Donna (champagne) | #D6B57E / leggibile #7A5B2B |
| Accento Uomo (rame) | #C77B4D / leggibile #8A4622 |

## Firma visiva
Lo specchio ad arco: la foto di "Chi siamo" parte come specchio ad arco e si allarga a tutto schermo scorrendo. Il titolo hero ha il suo riflesso capovolto.

## Animazioni
Livello 3 senza librerie: intro logo con lama di luce (una volta per visita), parole che salgono, tendine sulle foto, parallasse leggera, contatori, nastro. Solo transform/opacity/clip-path. Movimento ridotto: solo dissolvenze brevi.

## Regole da non violare
- Passaggi scuro/chiaro sempre sfumati (classi from-dark / from-light).
- Kicker in corsivo serif, mai etichette tutte maiuscole sopra i titoli.
- Foto 4:5 con raggio 6px; la barra in basso non si anima mai.
