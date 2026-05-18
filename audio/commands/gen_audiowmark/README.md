# audiowmark command

Embeds and decodes inaudible watermarks in audio files using [audiowmark](https://uplex.de/audiowmark/).

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
| `--key PATH` | str | `None` | Path to watermarking key file |
| `--strength FLOAT` | float | audiowmark default (10) | Watermark strength |

### Body Format (`--body-type`)

The body must decode to **exactly 16 bytes (128 bits)**.

#### `hex`

Interpreted as a hex string (case-insensitive).
Requires **exactly 32 characters** (16 bytes).

```
--body-type hex --body 04000000010000000000000000000001
```

#### `text`

Encoded as UTF-8 bytes.
Requires **exactly 16 bytes** (no null-padding is applied).

```
--body-type text --body "0123456789abcdef"
```

#### `bit`

Interpreted as a binary string containing only `0` and `1`.
Requires **exactly 128 characters**.

```
--body-type bit --body 00000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001
```

### Output

#### File mode

Prints one JSON line on success:

```json
{"status": true, "time_taken": 3.14, "time_taken_per_second": 0.78}
```

#### Directory mode

Prints one JSON line per file (JSONL), with `input` and `output` paths included:

```jsonl
{"status": true, "input": "input/a.wav", "output": "output/a.wav", "time_taken": 3.14, "time_taken_per_second": 0.78}
{"status": false, "input": "input/sub/b.wav", "output": "output/sub/b.wav", "error": "..."}
```

Processing continues even if individual files fail.
Exits with code 1 if any file failed.

### Error Handling

- `INPUT` does not exist → error to stderr, exit code 1
- `INPUT` and `OUTPUT` types mismatch (file vs. directory) → error to stderr, exit code 1
- Invalid body length → error to stderr, exit code 1
- `INPUT` / `OUTPUT` not provided → argparse error to stderr, exit code 2
- audiowmark non-zero exit → error message from stderr, exit code 1

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
| `--key PATH` | str | `None` | Path to watermarking key file |
| `--detect-speed` | flag | `false` | Detect and correct replay speed difference |
| `--detect-speed-patient` | flag | `false` | Slower, more accurate speed detection (implies `--detect-speed`) |

### Output

#### File mode

Prints one JSON line on success:

```json
{"status": true, "matches": [{"message": "04000000010000000000000000000001", "quality": 1.23}], "time_taken": 1.23, "time_taken_per_second": 0.31}
```

#### Directory mode

Prints one JSON line per file (JSONL), with `input` path included:

```jsonl
{"status": true, "input": "input/a.wav", "matches": [{"message": "04000000010000000000000000000001", "quality": 1.23}], "time_taken": 1.23, "time_taken_per_second": 0.31}
{"status": false, "input": "input/sub/b.wav", "error": "..."}
```

`matches` is the raw JSON output from `audiowmark get --json`, containing one entry per detected pattern.

Processing continues even if individual files fail.
Exits with code 1 if any file failed.

### Error Handling

- `INPUT` does not exist → error to stderr, exit code 1
- `INPUT` not provided → argparse error to stderr, exit code 2
- audiowmark non-zero exit → error message from stderr, exit code 1
