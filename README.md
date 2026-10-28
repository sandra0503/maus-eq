# Maus EQ

A mouse-driven, dual-channel MIDI EQ for **quickly blending sounds when your
controller is out of reach**. Hover a knob to turn it, hit a button to kill or
reset — no hands on hardware required.

It outputs **MIDI directly** over its own virtual port (`Maus EQ`) — no extra
software, no keystroke injection, no Accessibility permission. Two channels,
three EQ bands each (HIGH / MID / LOW), every band a **down** knob and an **up**
knob sharing one value. macOS only (CoreMIDI).

## Architecture

```
mouse / keyboard → Electron UI → IPC → midiout (Swift, CoreMIDI virtual source)
                                            → MIDI CC on port "Maus EQ"
                                            → rekordbox / Traktor (MIDI-mapped)
```

`native/midiout` creates a CoreMIDI virtual source and emits Control Change
messages. Values are **absolute** and tracked in-app, so up/down stay in sync,
reset is exact, and nothing drifts.

## Interaction

- **Hover** a knob to turn it — no mouse movement needed; it ramps steadily
  while the pointer is over it.
- **RESET** jumps the band to centre (64); **MIN** kills it to 0.
- **Keyboard:** each mapped key steps its band; hold to auto-repeat.

## Mapping (value 0–127, centre 64)

| Channel (MIDI ch) | Band | CC | Down | Up |
| ----------------- | ---- | -- | ---- | -- |
| CH 1 (ch 1) | VOL  | 7  | `1` | `2` |
| CH 1 (ch 1) | HIGH | 16 | `q` | `w` |
| CH 1 (ch 1) | MID  | 17 | `a` | `s` |
| CH 1 (ch 1) | LOW  | 18 | `y` | `x` |
| CH 2 (ch 2) | VOL  | 7  | `0` | `9` |
| CH 2 (ch 2) | HIGH | 16 | `o` | `p` |
| CH 2 (ch 2) | MID  | 17 | `k` | `l` |
| CH 2 (ch 2) | LOW  | 18 | `n` | `m` |

Volume uses the standard MIDI Channel Volume CC (7) and starts at full; its
buttons are **MAX / MIDDLE / MIN** (EQ bands use **RESET / MIDDLE / MIN**).

Edit `renderer/app.js` (`CHANNELS`, and the tuning constants `STEP`, `TICK_MS`)
to taste.

## Run

```bash
npm install     # compiles native/midiout via postinstall
npm start
```

## Connect to rekordbox

1. rekordbox → **Preferences → Controller / MIDI** → enable **Maus EQ**.
2. Use rekordbox **MIDI learn**: select a deck's EQ knob, then turn the matching
   control here — it binds to that CC.
3. Repeat for all six bands across the two decks.

## Rebuild the helper

```bash
npm run build:helper
```
