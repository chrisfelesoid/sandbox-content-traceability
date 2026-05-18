# Benchmark: Iterative Trim

## Overview

Measures how many times audio can be trimmed before decoding fails.
Three sub-scenarios cover different trimming strategies: removing from the head, removing from the tail,
and repeatedly excising the center of the current audio and rejoining the remaining segments.

## Tools Under Test

| Tool | Benchmark script |
|---|---|
| audioseal | `audio/commands/gen_audioseal/gen_audioseal/benchmark.py` |
| audiowmark | `audio/commands/gen_audiowmark/gen_audiowmark/benchmark.py` |
| silentcipher | `audio/commands/silentcipher/gen_silentcipher/benchmark.py` |

Each script reads its own `config.yaml` in the same directory.

## Sub-Scenarios

### head_trim

Remove `STEP_MS` milliseconds from the beginning of the file on each iteration.

```
Iteration 1: [----removed----][          remaining          ]
Iteration 2:                  [--removed--][   remaining    ]
Iteration 3:                               [-rm-][remaining ]
```

### tail_trim

Remove `STEP_MS` milliseconds from the end of the file on each iteration.

```
Iteration 1: [          remaining          ][----removed----]
Iteration 2: [   remaining    ][--removed--]
Iteration 3: [remaining ][-rm-]
```

### recursive_cut

Each iteration cuts the center of every segment that survived the previous iteration.
Cuts are always applied to the original audio's segments — not to the concatenated result —
so gaps accumulate at evenly distributed positions across the file.

Segments shorter than `STEP_MS` are left uncut and carried over as-is.

```
Iteration 1: [      A      ][---cut---][      B      ]
             → 2 segments: [A][B]

Iteration 2: cut center of A, cut center of B
             [  A_L  ][cut][  A_R  ]  [  B_L  ][cut][  B_R  ]
             → 4 segments: [A_L][A_R][B_L][B_R]

Iteration 3: cut center of each of the 4 segments
             → 8 segments
```

The number of gaps doubles each iteration: 1 → 3 → 7 → 15 → ...

## Parameters

| Parameter | Description | Default |
|---|---|---|
| `STEP_MS` | Milliseconds removed per iteration | configurable |
| `MAX_ITERATIONS` | Maximum number of iterations | 100 |

## Stop Conditions (per combination)

Stop whichever comes first:

1. Decode returns `status: false`
2. Remaining audio length < `STEP_MS`
3. Iteration count reaches `MAX_ITERATIONS`

## Procedure

Per (file, tool, sub-scenario) combination:

1. Encode the watermark into all source WAV files → stored to `{watermarked_dir}` (from config)
2. For **head_trim** and **tail_trim**:
  - Set `current.wav = watermarked.wav`
  - For each iteration `i = 1, 2, ..., MAX_ITERATIONS`:
    1. Remove `STEP_MS` from the head (or tail) of `current.wav` → `trimmed.wav` (using ffmpeg)
    2. If `trimmed.wav` duration < `STEP_MS`, stop
    3. Run decode on `trimmed.wav`
    4. Record the result (see Output Format)
    5. If `status: false`, stop
    6. Set `current.wav = trimmed.wav`
3. For **recursive_cut**:
  - Maintain a list of segments, initially `[watermarked.wav]`
  - For each iteration `i = 1, 2, ..., MAX_ITERATIONS`:
    1. For each segment longer than `STEP_MS`, cut its center `STEP_MS` using ffmpeg and replace it with the two halves
    2. If no segment was cut (all are shorter than `STEP_MS`), stop
    3. Concatenate all segments → `trimmed.wav` using ffmpeg
    4. Run decode on `trimmed.wav`
    5. Record the result (see Output Format)
    6. If `status: false`, stop

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
{"tool": "silentcipher", "file": "a.wav", "scenario": "head_trim", "step_ms": 500, "iteration": 1, "remaining_ms": 9500, "status": true, "score": 1.0, "time_taken": 1.10}
{"tool": "silentcipher", "file": "a.wav", "scenario": "head_trim", "step_ms": 500, "iteration": 5, "remaining_ms": 7500, "status": false, "score": 0.0, "time_taken": 1.05}
{"tool": "audioseal", "file": "a.wav", "scenario": "head_trim", "step_ms": 500, "iteration": 1, "remaining_ms": 9500, "status": true, "score": 0.94, "cause": "", "time_taken": 0.60}
{"tool": "audiowmark", "file": "a.wav", "scenario": "recursive_cut", "step_ms": 500, "iteration": 2, "remaining_ms": 8000, "status": false, "score": 0.0, "cause": "parity check error", "time_taken": 1.21}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `tool` | str | `audioseal`, `audiowmark`, or `silentcipher` |
| `file` | str | Source WAV file path |
| `scenario` | str | `head_trim`, `tail_trim`, or `recursive_cut` |
| `step_ms` | int | Milliseconds removed per iteration |
| `iteration` | int | Trim count |
| `remaining_ms` | int | Audio duration after trimming, in milliseconds |
| `status` | bool | Whether decoding succeeded |
| `score` | float | Confidence score (audioseal: detect probability; audiowmark: best match quality; silentcipher: 1.0 / 0.0) |
| `cause` | str | Reason for failure when `status` is false; `""` on success (audioseal / audiowmark only) |
| `time_taken` | float | Decode time in seconds |

## Summary Metrics

Computed per (tool, file, scenario) via `common.benchmarks.summary.compute_summary`:

- **survival_iterations**: largest `iteration` where `status` is `true` (0 if first iteration fails)
- **first_failure_iteration**: smallest `iteration` where `status` is `false` (`null` if never failed)
- **first_failure_remaining_ms**: `remaining_ms` at first failure (`null` if never failed)
- **mean_score**: average `score` over successful iterations

## Output Files

Each tool writes to its own benchmark directory (configured in `config.yaml`):

| Path | Content |
|---|---|
| `audio/benchmark/{tool}/results/trim.jsonl` | Raw JSONL records |
| `audio/benchmark/{tool}/summary/trim.json` | Aggregated summary metrics |
| `audio/benchmark/{tool}/files/trim/{file_stem}/{scenario}/iter_{iteration:03d}.wav` | Per-iteration WAV file |

## Dependencies

- `ffmpeg` — all audio operations (trimming, cutting, concatenation)
- `common` package — `common.benchmarks.summary`, `common.ffmpeg`
- `silentcipher` Python package — via `audio/commands/silentcipher/.venv`
- `audiowmark` CLI — available on PATH
- `audioseal` Python package — via `audio/commands/gen_audioseal/.venv`
