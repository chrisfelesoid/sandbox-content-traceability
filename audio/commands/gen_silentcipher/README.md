# silentcipher command

Embeds and decodes inaudible watermarks in audio files using [SilentCipher](https://github.com/sony/silentcipher).

## encode.py

Embed a watermark into audio files.

### Usage

```
uv run encode.py [OPTIONS] INPUT OUTPUT
```

`INPUT` and `OUTPUT` accept either a file path or a directory path.
Only the following two combinations are valid:

| INPUT | OUTPUT | Behavior |
|---|---|---|
| File | File | Process one file and save |
| Directory | Directory | Recursively process all `*.wav` files and save |

In directory mode, the subdirectory structure under `INPUT` is reproduced under `OUTPUT`.
`OUTPUT` is created automatically if it does not exist.

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `--body TEXT` | str | (required) | Data to embed |
| `--body-type {hex,text,bit}` | str | `text` | How to interpret the body (see below) |
| `--model-type {44.1k,16k}` | str | `44.1k` | Model to use |
| `--ckpt-path PATH` | str | Model default | Path to model checkpoint directory |
| `--config-path PATH` | str | Model default | Path to `hparams.yaml` |
| `--device {cpu,cuda}` | str | `cuda` | Inference device |
| `--sdr FLOAT` | float | Model default | Signal-to-Distortion Ratio in dB |
| `--force-body-length` | flag | `false` | Skip the 5-byte body length check |

### Body Format (`--body-type`)

By default the body must decode to **exactly 5 bytes (40 bits)**.
Pass `--force-body-length` to skip this validation and forward the raw bytes to the model.

### `hex` (default)

Interpreted as a hex string (case-insensitive).
Requires **exactly 10 characters** (5 bytes) by default.

```
--body-type hex --body 0400000001
```

### `text`

Encoded as UTF-8 bytes.
Requires **exactly 5 bytes** by default (no null-padding is applied).

```
--body-type text --body "hello"
```

### `bit`

Interpreted as a binary string containing only `0` and `1`.
Requires **exactly 40 characters** by default.

```
--body-type bit --body 0000010000000000000000000000000000000001
```

### Output

#### File mode

Prints one JSON line on success:

```json
{"status": true, "sdr": "45.23", "time_taken": 3.14, "time_taken_per_second": 0.78}
```

#### Directory mode

Prints one JSON line per file (JSONL), with `input` and `output` paths included:

```jsonl
{"status": true, "input": "input/a.wav", "output": "output/a.wav", "sdr": "45.23", "time_taken": 3.14, "time_taken_per_second": 0.78}
{"status": false, "input": "input/sub/b.wav", "output": "output/sub/b.wav", "error": "..."}
```

Processing continues even if individual files fail.
Exits with code 1 if any file failed.

### Error Handling

- `INPUT` does not exist → error to stderr, exit code 1
- `INPUT` and `OUTPUT` types mismatch (file vs. directory) → error to stderr, exit code 1
- Invalid body length → error to stderr, exit code 1
- `INPUT` / `OUTPUT` not provided → argparse error to stderr, exit code 2
- Model not downloaded → downloaded automatically from the Hugging Face Hub

---

## decode.py

Decode a watermark from audio files.

### Usage

```
uv run decode.py [OPTIONS] INPUT
```

`INPUT` accepts either a file path or a directory path.

| INPUT | Behavior |
|---|---|
| File | Decode one file and print result |
| Directory | Recursively decode all `*.wav` files and print results |

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `--model-type {44.1k,16k}` | str | `44.1k` | Model to use |
| `--ckpt-path PATH` | str | Model default | Path to model checkpoint directory |
| `--config-path PATH` | str | Model default | Path to `hparams.yaml` |
| `--device {cpu,cuda}` | str | `cuda` | Inference device |
| `--phase-shift-decoding` | flag | `false` | Enable phase shift decoding |

### Output

#### File mode

Prints one JSON line on success:

```json
{"status": true, "messages": [[4, 0, 0, 0, 1]], "confidences": [0.98], "time_taken": 1.23, "time_taken_per_second": 0.31}
```

#### Directory mode

Prints one JSON line per file (JSONL), with `input` path included:

```jsonl
{"status": true, "input": "input/a.wav", "messages": [[4, 0, 0, 0, 1]], "confidences": [0.98], "time_taken": 1.23, "time_taken_per_second": 0.31}
{"status": false, "input": "input/sub/b.wav", "error": "..."}
```

`messages` is a list of decoded byte arrays (one per channel).
`confidences` is a list of confidence scores in `[0.0, 1.0]` (one per channel).

Processing continues even if individual files fail.
Exits with code 1 if any file failed.

### Error Handling

- `INPUT` does not exist → error to stderr, exit code 1
- `INPUT` not provided → argparse error to stderr, exit code 2
- Model not downloaded → downloaded automatically from the Hugging Face Hub
