# Benchmark: Pitch Shift and Time Stretch

## Overview

Applies pitch shift or time stretch to a watermarked WAV file and checks whether decoding still succeeds.
Simulates real-world attacks such as playback speed changes or audio editing.
For audiowmark, results are recorded with and without `--detect-speed` to measure its effectiveness.

## Tools Under Test

| Tool | Benchmark script |
|---|---|
| audioseal | `audio/commands/gen_audioseal/gen_audioseal/benchmark.py` |
| audiowmark | `audio/commands/gen_audiowmark/gen_audiowmark/benchmark.py` |
| silentcipher | `audio/commands/silentcipher/gen_silentcipher/benchmark.py` |

Each script reads its own `config.yaml` in the same directory.

## Sub-Scenarios

### pitch_shift

Change pitch without altering playback duration using ffmpeg (`asetrate` + `aresample` filters).

**Semitones to test:** -4, -2, -1, +1, +2, +4

### time_stretch

Change playback speed (and duration) without altering pitch using ffmpeg (`atempo` filter).

**Speed ratios to test:** 0.75, 0.9, 0.95, 1.05, 1.1, 1.25

## Procedure

Per (file, tool, sub-scenario, parameter) combination:

1. Encode the watermark into all source WAV files → stored to `{watermarked_dir}` (from config)
2. Apply the transformation to `watermarked.wav` → `transformed.wav` using ffmpeg
3. Save `transformed.wav` as the iteration file
4. Run decode on `transformed.wav`
  - For audiowmark: run twice — once with `detect_speed: false`, once with `detect_speed: true`
5. Record the result (see Output Format)

## Inputs

Each tool's parameters are configured in its `config.yaml`. Defaults:

| Parameter | audioseal | audiowmark | silentcipher |
|---|---|---|---|
| Body | `"5445"` (hex) | `"04d7a16944914b4e8f58842a9ee5d557"` (hex) | `"04d7a16944"` (hex) |
| Parity bits | 2 | 2 | 0 |
| Model / key | `../../models/audioseal/generator_base.pth` | `./key/test.key` | `44.1k` model |
| Device | cuda | — | cuda |

Source WAV files: `audio/datasets/source/` (all `*.wav` files)

## Output Format

JSONL, one record per (file, tool, sub-scenario, parameter):

```jsonl
{"tool": "audioseal", "file": "a.wav", "scenario": "pitch_shift", "semitones": -2, "detect_speed": null, "status": true, "score": 0.93, "cause": "", "time_taken": 0.65}
{"tool": "audiowmark", "file": "a.wav", "scenario": "time_stretch", "speed_ratio": 1.1, "detect_speed": false, "status": false, "score": 0.0, "cause": "insufficient probability", "time_taken": 0.82}
{"tool": "audiowmark", "file": "a.wav", "scenario": "time_stretch", "speed_ratio": 1.1, "detect_speed": true, "status": true, "score": 1.05, "cause": "", "time_taken": 3.41}
{"tool": "silentcipher", "file": "a.wav", "scenario": "pitch_shift", "semitones": -2, "detect_speed": null, "status": true, "score": 1.0, "time_taken": 1.15}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `tool` | str | `audioseal`, `audiowmark`, or `silentcipher` |
| `file` | str | Source WAV file path |
| `scenario` | str | `pitch_shift` or `time_stretch` |
| `semitones` | float \| null | Pitch shift amount in semitones (`pitch_shift` only) |
| `speed_ratio` | float \| null | Playback speed ratio (`time_stretch` only) |
| `detect_speed` | bool \| null | Whether `--detect-speed` was used; `null` for audioseal and silentcipher |
| `status` | bool | Whether decoding succeeded |
| `score` | float | Confidence score (audioseal: detect probability; audiowmark: best match quality; silentcipher: 1.0 / 0.0) |
| `cause` | str | Reason for failure when `status` is false; `""` on success (audioseal / audiowmark only) |
| `time_taken` | float | Decode time in seconds |

## Summary Metrics

Computed per (tool, file, scenario) via `common.benchmarks.summary.compute_summary`:

- **survival_iterations**: largest iteration index where `status` is `true` (0 if first fails)
- **first_failure_iteration**: smallest iteration index where `status` is `false` (`null` if all succeeded)
- **mean_score**: average `score` over successful iterations

## Output Files

Each tool writes to its own benchmark directory (configured in `config.yaml`):

| Path | Content |
|---|---|
| `audio/benchmark/{tool}/results/pitch_stretch.jsonl` | Raw JSONL records |
| `audio/benchmark/{tool}/summary/pitch_stretch.json` | Aggregated summary metrics |
| `audio/benchmark/{tool}/files/pitch_stretch/{file_stem}/pitch_shift/{semitones}st.wav` | Transformed WAV (pitch shift) |
| `audio/benchmark/{tool}/files/pitch_stretch/{file_stem}/time_stretch/{speed_ratio}x.wav` | Transformed WAV (time stretch) |

## Dependencies

- `ffmpeg` — all audio operations (pitch shift, time stretch)
- `common` package — `common.benchmarks.summary`, `common.ffmpeg`
- `silentcipher` Python package — via `audio/commands/silentcipher/.venv`
- `audiowmark` CLI — available on PATH
- `audioseal` Python package — via `audio/commands/gen_audioseal/.venv`
