# Benchmark: Single-Pass Degradation

## Overview

Applies a single transformation to a watermarked WAV file and checks whether decoding still succeeds.
Used to measure the minimum degradation level at which each tool's watermark breaks.

## Tools Under Test

| Tool | Benchmark script |
|---|---|
| audioseal | `audio/commands/gen_audioseal/gen_audioseal/benchmark.py` |
| audiowmark | `audio/commands/gen_audiowmark/gen_audiowmark/benchmark.py` |
| silentcipher | `audio/commands/silentcipher/gen_silentcipher/benchmark.py` |

Each script reads its own `config.yaml` in the same directory.

## Transformations

| Scenario | Parameters |
|---|---|
| MP3 conversion | bitrates: 32, 64, 96, 128, 192, 320 kbps |
| Resampling | target rates: 8000, 16000, 22050, 44100 Hz |
| White noise addition | SNR: 10, 20, 30, 40 dB |

## Procedure

Per (file, tool, transformation, parameter) combination:

1. Encode the watermark into all source WAV files → stored to `{watermarked_dir}` (from config)
2. Apply the transformation to `watermarked.wav` → `degraded.wav` (using ffmpeg)
3. Run decode on `degraded.wav`
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

JSONL, one record per (file, tool, transformation, parameter):

```jsonl
{"tool": "audiowmark", "file": "a.wav", "transformation": "mp3", "bitrate_kbps": 64, "status": true, "score": 1.12, "cause": "", "time_taken": 0.85}
{"tool": "audiowmark", "file": "a.wav", "transformation": "resample", "sample_rate": 16000, "status": false, "score": 0.0, "cause": "insufficient probability", "time_taken": 0.71}
{"tool": "silentcipher", "file": "a.wav", "transformation": "noise", "snr_db": 20, "status": true, "score": 1.0, "time_taken": 1.05}
{"tool": "audioseal", "file": "a.wav", "transformation": "mp3", "bitrate_kbps": 64, "status": true, "score": 0.97, "cause": "", "time_taken": 0.62}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `tool` | str | `audioseal`, `audiowmark`, or `silentcipher` |
| `file` | str | Source WAV file path |
| `transformation` | str | `mp3`, `resample`, or `noise` |
| `bitrate_kbps` | int \| null | MP3 bitrate in kbps (`mp3` only) |
| `sample_rate` | int \| null | Target sample rate in Hz (`resample` only) |
| `snr_db` | float \| null | Signal-to-noise ratio in dB (`noise` only) |
| `status` | bool | Whether decoding succeeded |
| `score` | float | Confidence score (audioseal: detect probability; audiowmark: best match quality; silentcipher: 1.0 / 0.0) |
| `cause` | str | Reason for failure when `status` is false; `""` on success (audioseal / audiowmark only) |
| `time_taken` | float | Decode time in seconds |

## Summary Metrics

Computed per (tool, transformation) via `common.benchmarks.summary.compute_summary`:

- **success_count**: number of parameters where `status` is `true`
- **total_count**: total number of parameters tested
- **mean_score**: average `score` over successful runs

## Output Files

Each tool writes to its own benchmark directory (configured in `config.yaml`):

| Path | Content |
|---|---|
| `audio/benchmark/{tool}/results/single_pass.jsonl` | Raw JSONL records |
| `audio/benchmark/{tool}/summary/single_pass.json` | Aggregated summary metrics |
| `audio/benchmark/{tool}/files/single_pass/{file_stem}/mp3/{bitrate_kbps}kbps.wav` | Degraded WAV (MP3 scenario) |
| `audio/benchmark/{tool}/files/single_pass/{file_stem}/resample/{sample_rate}hz.wav` | Degraded WAV (resample scenario) |
| `audio/benchmark/{tool}/files/single_pass/{file_stem}/noise/{snr_db}db.wav` | Degraded WAV (noise scenario) |

## Dependencies

- `ffmpeg` — all audio operations (format conversion, resampling, noise addition)
- `common` package — `common.benchmarks.summary`, `common.ffmpeg`
- `silentcipher` Python package — via `audio/commands/silentcipher/.venv`
- `audiowmark` CLI — available on PATH
- `audioseal` Python package — via `audio/commands/gen_audioseal/.venv`
