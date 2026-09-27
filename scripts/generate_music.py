"""Render the original Nyangnyang Restaurant scene themes.

Requires NumPy and ffmpeg for asset authoring only. No downloaded samples or
third-party composition is used. Run from the repository root.
"""

from pathlib import Path
import subprocess
import sys
import tempfile
import wave

import numpy as np

RATE = 22050
OUT = Path(__file__).resolve().parents[1] / "public" / "game"
FREQUENCIES = {name: 440 * 2 ** ((semitone - 69) / 12) for name, semitone in {
    "C3": 48, "D3": 50, "E3": 52, "F3": 53, "G3": 55, "A3": 57,
    "B3": 59, "C4": 60, "D4": 62, "E4": 64, "F4": 65, "G4": 67,
    "A4": 69, "B4": 71, "C5": 72, "D5": 74, "E5": 76, "G5": 79,
}.items()}

MELODIES = {
    "restaurant": [
        "E4 - G4 A4 | G4 - E4 - | D4 - E4 G4 | E4 - C4 -",
        "E4 - G4 C5 | B4 - A4 - | G4 E4 D4 - | C4 - - -",
        "F4 - A4 C5 | A4 - G4 - | E4 G4 A4 - | G4 - E4 -",
        "D4 - F4 A4 | G4 F4 E4 - | G4 E4 D4 - | C4 - - -",
    ],
    "mart": [
        "G4 B4 D5 - | B4 G4 E4 - | A4 C5 E5 - | C5 A4 G4 -",
        "G4 C5 D5 C5 | B4 - G4 - | A4 G4 E4 G4 | D4 - - -",
        "A4 C5 E5 G5 | E5 C5 A4 - | B4 D5 G5 D5 | B4 G4 E4 -",
        "G4 B4 D5 E5 | D5 B4 A4 G4 | C5 A4 G4 E4 | D4 - - -",
    ],
    "kitchen": [
        "C4 E4 G4 - | E4 G4 A4 - | G4 E4 D4 E4 | C4 - - -",
        "E4 G4 C5 - | B4 G4 E4 - | F4 A4 G4 E4 | D4 - - -",
        "C4 E4 G4 C5 | A4 G4 E4 - | F4 A4 C5 A4 | G4 - E4 -",
        "D4 F4 A4 - | G4 E4 D4 - | E4 G4 E4 D4 | C4 - - -",
    ],
    "minigame": [
        "G4 C5 E5 C5 | A4 C5 E5 - | G4 B4 D5 B4 | G4 - - -",
        "A4 C5 E5 G5 | E5 C5 A4 - | G4 B4 D5 G5 | E5 D5 C5 -",
        "C5 E5 G5 E5 | C5 A4 G4 - | A4 C5 E5 C5 | G4 - - -",
        "G4 B4 D5 G5 | E5 D5 C5 A4 | G4 E4 D4 G4 | C5 - - -",
    ],
    "wardrobe": [
        "C5 - G4 - | A4 - E4 - | F4 - A4 - | G4 - - -",
        "E4 - G4 - | C5 - B4 - | A4 - G4 - | E4 - - -",
        "F4 - A4 - | C5 - A4 - | G4 - E4 - | D4 - - -",
        "E4 - G4 - | A4 - G4 - | E4 - D4 - | C4 - - -",
    ],
}
CHORDS = [
    ("C3", "E4", "G4"), ("A3", "C4", "E4"),
    ("F3", "A4", "C5"), ("G3", "B4", "D5"),
    ("C3", "E4", "G4"), ("A3", "C4", "E4"),
    ("F3", "A4", "C5"), ("G3", "B4", "D5"),
]


def instrument(note: str, seconds: float, kind: str) -> np.ndarray:
    count = max(1, int(seconds * RATE))
    time = np.arange(count, dtype=np.float32) / RATE
    frequency = FREQUENCIES[note]
    if kind == "bell":
        waveforms = sum(np.sin(2 * np.pi * frequency * n * time) * weight
                        for n, weight in [(1, 1), (2, .22), (3, .10), (4, .04)])
        envelope = (1 - np.exp(-time * 180)) * np.exp(-time * 2.6)
    elif kind == "guitar":
        waveforms = sum(np.sin(2 * np.pi * frequency * n * time + n * .13) * weight
                        for n, weight in [(1, 1), (2, .38), (3, .17), (4, .09), (5, .04)])
        envelope = (1 - np.exp(-time * 210)) * np.exp(-time * 3.4)
    elif kind == "bass":
        waveforms = np.sin(2 * np.pi * frequency * time) + .18 * np.sin(4 * np.pi * frequency * time)
        envelope = (1 - np.exp(-time * 70)) * np.exp(-time * 2.4)
    else:
        waveforms = np.sin(2 * np.pi * frequency * time) + .12 * np.sin(4 * np.pi * frequency * time)
        envelope = (1 - np.exp(-time * 9)) * np.minimum(1, (seconds - time) * 4)
    return (waveforms * envelope).astype(np.float32)


def add(track: np.ndarray, start: float, sound: np.ndarray, volume: float):
    offset = int(start * RATE)
    end = min(len(track), offset + len(sound))
    if end > offset:
        track[offset:end] += sound[:end - offset] * volume


def render(scene: str):
    tempo = {"restaurant": 88, "mart": 101, "kitchen": 94, "minigame": 108, "wardrobe": 79}
    beat = 60 / tempo[scene]
    length = 32 * 4 * beat
    track = np.zeros(int(length * RATE), dtype=np.float32)
    rng = np.random.default_rng(20260927 + list(tempo).index(scene))
    measures = [bar.strip().split() for group in MELODIES[scene] for bar in group.split("|")]
    assert len(measures) == 16 and all(len(bar) == 4 for bar in measures)
    for bar in range(32):
        group = bar % 16
        section = bar // 16
        chord = CHORDS[bar % 8]
        for beat_index in range(4):
            at = (bar * 4 + beat_index) * beat
            note = measures[group][beat_index]
            if note != "-":
                # A quieter second statement leaves room for cooking sounds.
                add(track, at, instrument(note, beat * 1.6, "bell" if scene in ("restaurant", "wardrobe") else "guitar"), .105 if section == 0 else .079)
            if beat_index in (0, 2):
                add(track, at, instrument(chord[0], beat * 1.6, "bass"), .095 if scene in ("restaurant", "wardrobe") else .11)
            if beat_index in (1, 3):
                for j, chord_note in enumerate(chord[1:]):
                    add(track, at + j * .045, instrument(chord_note, beat * 1.7, "guitar"), .028)
            if scene in ("mart", "minigame") or (scene != "wardrobe" and beat_index in (1, 3)):
                noise = rng.normal(0, 1, int(RATE * .09)).astype(np.float32)
                decay = np.exp(-np.arange(len(noise)) / RATE * (48 if scene in ("mart", "minigame") else 60))
                add(track, at, noise * decay, .006 if scene in ("mart", "minigame") else .003)
        if section and bar % 4 == 3:
            add(track, (bar * 4 + 3.5) * beat, instrument(chord[1], beat * .5, "bell"), .032)
    # Short room echoes give the plucks a softer tail without obscuring speech.
    dry = track.copy()
    for seconds, level in ((.13, .13), (.29, .08), (.47, .05)):
        delay = int(seconds * RATE)
        track[delay:] += dry[:-delay] * level
    fade = int(.3 * RATE)
    track[:fade] *= np.linspace(0, 1, fade, dtype=np.float32)
    track[-fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    peak = max(.01, float(np.max(np.abs(track))))
    track = np.clip(track * (.72 / peak), -.95, .95)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp:
        source = Path(temp.name)
    try:
        with wave.open(str(source), "wb") as handle:
            handle.setnchannels(1)
            handle.setsampwidth(2)
            handle.setframerate(RATE)
            handle.writeframes((track * 32767).astype("<i2").tobytes())
        target = OUT / f"music-{scene}.mp3"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
                        "-codec:a", "libmp3lame", "-q:a", "4", str(target)], check=True)
        print(f"{target}: {length:.1f}s, {target.stat().st_size:,} bytes")
    finally:
        source.unlink(missing_ok=True)


if __name__ == "__main__":
    for name in (sys.argv[1:] or MELODIES.keys()):
        render(name)
