
# Maus EQ

**Keyboard-mappable DJ EQ.** A dual-channel MIDI EQ + volume controller you can
drive **entirely from the keyboard** — bind each EQ band (highs / mids / lows)
and each channel's volume to a **hotkey** and boost, cut, or kill hands-free when
your controller is out of reach. Prefer the mouse? Hold a knob to ramp it; hit a
button to reset or kill.

It outputs **MIDI directly** over its own virtual port (`Maus EQ`), so it maps
into **rekordbox / Traktor** like any controller. Two channels, three EQ bands
each (HIGH / MID / LOW) plus channel volume. macOS only (CoreMIDI).

<img width="500" alt="Screenshot 2026-10-29 at 12 09 28" src="https://github.com/user-attachments/assets/a844a98d-efbb-4cef-bfc3-49c9a2cdfea5" />

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

- **Keyboard (the main event):** every EQ band — and each channel's volume — is
  bound to a key. Tap to step by a fixed amount (5), hold to auto-repeat. Map the
  controls once in your DJ software and mix the EQ entirely from the keyboard.
  See the [mapping](#keyboard--midi-mapping-value-0127-centre-64) below.
- **Hold** a knob (press and keep the mouse button down) to ramp it in that
  direction; release to stop. The ramp rate is the **STEP** slider in settings.
- **RESET** jumps the band to centre (64); **MIN** kills it to 0.

## Scene macros

Whole-mix actions in the scene bar — each with a keyboard shortcut:

- **BASS SWAP** (`B`) — kill the bass on one deck and bring it up on the other;
  press again to swap back. The button shows which deck currently holds the bass.
- **EQ RESET** (`R`) — return every EQ band on both decks to centre (volume left
  untouched).
- **PREP 1 / PREP 2** (`3` / `4`) — prep a deck for an incoming track: kill its
  bass and dip mids/highs below neutral (LOW 0, MID 48, HIGH 48). Tune via the
  `PREP_LOW/MID/HIGH` constants in `renderer/app.js`.

## Keyboard & MIDI mapping (value 0–127, centre 64)

| Channel (MIDI ch) | Band | CC | Down | Up |
| ----------------- | ---- | -- | ---- | -- |
| CH 1 (ch 1) | VOL  | 7  | `1` | `2` |
| CH 1 (ch 1) | HIGH | 16 | `q` | `w` |
| CH 1 (ch 1) | MID  | 17 | `a` | `s` |
| CH 1 (ch 1) | LOW  | 18 | `y` | `x` |
| CH 2 (ch 2) | VOL  | 7  | `9` | `0` |
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
