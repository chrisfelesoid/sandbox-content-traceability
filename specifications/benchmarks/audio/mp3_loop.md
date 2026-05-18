# Benchmark: Iterative MP3 Conversion

## Overview

Measures how many WAV → MP3 → WAV round-trips a watermarked file can survive before decoding fails.
Benchmarks are run per tool and per input file, iterating through bitrates from highest to lowest.

## Tools Under Test

| Tool | Benchmark script |
|---|---|
| audioseal | `audio/commands/gen_audioseal/gen_audioseal/benchmark.py` |
| audiowmark | `audio/commands/gen_audiowmark/gen_audiowmark/benchmark.py` |
| silentcipher | `audio/commands/silentcipher/gen_silentcipher/benchmark.py` |

Each script reads its own `config.yaml` in the same directory.

## Procedure

Per (file, tool) combination:

1. Encode the watermark into all source WAV files → stored to `{watermarked_dir}` (from config)
2. For each iteration `i = 1, 2, ...` over bitrates in descending order:
  1. Convert `watermarked.wav` → `temp.mp3` at the current bitrate (using ffmpeg)
  2. Convert `temp.mp3` → `watermarked.wav`
  3. Save `watermarked.wav` as `iter_{i:03d}.wav`
  4. Run decode on `watermarked.wav`
  5. Record the result (see Output Format)
  6. If decoding fails (`status: false`), stop

**MP3 bitrates (descending):** 128, 96, 64, 48, 32 kbps

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

JSONL, one record per iteration:

```jsonl
{"tool": "audioseal", "file": "a.wav", "bitrate_kbps": 128, "iteration": 1, "status": true, "score": 0.95, "cause": "", "time_taken": 0.61}
{"tool": "audiowmark", "file": "a.wav", "bitrate_kbps": 96, "iteration": 2, "status": false, "score": 0.0, "cause": "parity check error", "time_taken": 1.23}
{"tool": "silentcipher", "file": "a.wav", "bitrate_kbps": 64, "iteration": 3, "status": true, "score": 1.0, "time_taken": 1.19}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `tool` | str | `audioseal`, `audiowmark`, or `silentcipher` |
| `file` | str | Source WAV file path |
| `bitrate_kbps` | int | MP3 bitrate used in this iteration (kbps) |
| `iteration` | int | Round-trip count (1-indexed, corresponds to bitrate position in descending order) |
| `status` | bool | Whether decoding succeeded |
| `score` | float | Confidence score (audioseal: detect probability; audiowmark: best match quality; silentcipher: 1.0 / 0.0) |
| `cause` | str | Reason for failure when `status` is false; `""` on success (audioseal / audiowmark only) |
| `time_taken` | float | Decode time in seconds |

## Summary Metrics

Computed per (tool, file) via `common.benchmarks.summary.compute_summary`:

- **survival_iterations**: largest `iteration` where `status` is `true` (0 if first iteration fails)
- **first_failure_iteration**: smallest `iteration` where `status` is `false` (`null` if all iterations succeeded)
- **mean_score**: average `score` over successful iterations

## Output Files

Each tool writes to its own benchmark directory (configured in `config.yaml`):

| Path | Content |
|---|---|
| `audio/benchmark/{tool}/results/mp3_loop.jsonl` | Raw JSONL records |
| `audio/benchmark/{tool}/summary/mp3_loop.json` | Aggregated summary metrics |
| `audio/benchmark/{tool}/files/mp3_loop/{file_stem}/iter_{iteration:03d}.wav` | Per-iteration WAV file |

## Dependencies

- `ffmpeg` — all audio operations (WAV / MP3 conversion)
- `common` package — `common.benchmarks.summary`, `common.ffmpeg`
- `silentcipher` Python package — via `audio/commands/silentcipher/.venv`
- `audiowmark` CLI — available on PATH
- `audioseal` Python package — via `audio/commands/gen_audioseal/.venv`
