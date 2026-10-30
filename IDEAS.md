# Ideas & backlog

A running list of things to maybe add to Maus EQ. Nothing here is committed to —
it's a parking lot. Pull items up into a release when they earn it.

## Features

- **Play / pause button** — per-deck transport (play/pause) sent as a MIDI
  note/CC that rekordbox maps like any controller. Would add transport controls
  alongside the EQ/volume, each with a keyboard shortcut and MIDI mapping.

## Distribution / robustness (discussed, deferred)

- **Developer ID signing + notarization** — removes the Gatekeeper prompt for
  downloaders entirely (needs a $99/yr Apple Developer account).
- **Universal build** — add Intel (x64) so non-Apple-Silicon Macs can run it.
- **Helper respawn** — restart the `midiout` helper if it ever exits, so the app
  never silently goes quiet mid-set.
- **Two-way sync** — read EQ/volume back from rekordbox so the knobs reflect
  changes made elsewhere (needs a MIDI input + a feedback-capable mapping).

## Docs

- **Demo GIF** — a short clip of a bass swap / keyboard EQ in the README; sells
  the keyboard-EQ angle far better than the static screenshot.
