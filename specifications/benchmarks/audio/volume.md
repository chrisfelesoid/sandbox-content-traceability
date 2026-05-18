# Benchmark: Volume Change

## Overview

Applies volume adjustment to a watermarked WAV file and checks whether decoding still succeeds.
Tests both amplification and attenuation to measure the volume range each tool's watermark can tolerate.

## Tools Under Test

| Tool | Benchmark script |
|---|---|
| audioseal | `audio/commands/gen_audioseal/gen_audioseal/benchmark.py` |
| audiowmark | `audio/commands/gen_audiowmark/gen_audiowmark/benchmark.py` |
| silentcipher | `audio/commands/silentcipher/gen_silentcipher/benchmark.py` |

Each script reads its own `config.yaml` in the same directory.

## Parameters

Volume levels to test: -20, -15, -10, -6, -3, +3, +6 dB

## Procedure

Per (file, tool, volume_db) combination:

1. Encode the watermark into all source WAV files → stored to `{watermarked_dir}` (from config)
2. Apply volume adjustment to `watermarked.wav` → `adjusted.wav` using ffmpeg (`volume` filter)
3. Run decode on `adjusted.wav`
4. Record the result (see Output Format)

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

JSONL, one record per (file, tool, volume_db):

```jsonl
{"tool": "silentcipher", "file": "a.wav", "volume_db": -10, "status": true, "score": 1.0, "time_taken": 1.12}
{"tool": "silentcipher", "file": "a.wav", "volume_db": -20, "status": false, "score": 0.0, "time_taken": 1.08}
{"tool": "audiowmark", "file": "a.wav", "volume_db": 6, "status": true, "score": 1.21, "cause": "", "time_taken": 0.89}
{"tool": "audioseal", "file": "a.wav", "volume_db": -10, "status": true, "score": 0.96, "cause": "", "time_taken": 0.63}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `tool` | str | `audioseal`, `audiowmark`, or `silentcipher` |
| `file` | str | Source WAV file path |
| `volume_db` | float | Volume adjustment in dB (negative = attenuation, positive = amplification) |
| `status` | bool | Whether decoding succeeded |
| `score` | float | Confidence score (audioseal: detect probability; audiowmark: best match quality; silentcipher: 1.0 / 0.0) |
| `cause` | str | Reason for failure when `status` is false; `""` on success (audioseal / audiowmark only) |
| `time_taken` | float | Decode time in seconds |

## Summary Metrics

Computed per (tool, file) via `common.benchmarks.summary.compute_summary`:

- **success_count**: number of volume levels where `status` is `true`
- **total_count**: total number of volume levels tested
- **mean_score**: average `score` over successful runs

## Output Files

Each tool writes to its own benchmark directory (configured in `config.yaml`):

| Path | Content |
|---|---|
| `audio/benchmark/{tool}/results/volume.jsonl` | Raw JSONL records |
| `audio/benchmark/{tool}/summary/volume.json` | Aggregated summary metrics |
| `audio/benchmark/{tool}/files/volume/{file_stem}/{volume_db}db.wav` | Adjusted WAV file |

## Dependencies

- `ffmpeg` — all audio operations (volume adjustment)
- `common` package — `common.benchmarks.summary`, `common.ffmpeg`
- `silentcipher` Python package — via `audio/commands/silentcipher/.venv`
- `audiowmark` CLI — available on PATH
- `audioseal` Python package — via `audio/commands/gen_audioseal/.venv`
