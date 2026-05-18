# Command Specification: encode.py / decode.py

Common specification for `encode.py` and `decode.py` scripts under `audio/commands/<tool>/`.

## encode.py

### Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `INPUT` | positional | yes | — | Input `.wav` file or directory |
| `OUTPUT` | positional | yes | — | Output `.wav` file or directory |
| `--body` | string | yes | — | Message to embed |
| `--body-type` | `hex` \| `text` \| `bit` | no | `text` | Encoding of `--body` |

Tool-specific arguments (model paths, strength, device, etc.) are defined per tool.

### Body Parsing

`--body` is parsed according to `--body-type`:

| `--body-type` | Parsing |
|---|---|
| `text` | UTF-8 encode |
| `hex` | Decode hex string to bytes |
| `bit` | Binary string of `0`/`1`; length must be a multiple of 8 |

After parsing, the byte length is validated against each tool's required length. Validation failure exits with code 1 and prints an error to stderr.

#### Required body lengths

| Tool | Bytes | Bits |
|---|---|---|
| audiowmark | 16 | 128 |
| audioseal | 2 | 16 |
| silentcipher | 5 | 40 |

### Input/Output Validation

- If `INPUT` does not exist: print error to stderr, exit 1.
- If `INPUT` is a directory and `OUTPUT` is an existing file: print error to stderr, exit 1.
- If `INPUT` is a file and `OUTPUT` is an existing directory: print error to stderr, exit 1.

### Directory Processing

When `INPUT` is a directory:

- Recursively finds all `.wav` files (`rglob("*.wav")`), processed in sorted order.
- Output file path mirrors the input relative path under `OUTPUT`.
- Parent directories of each output file are created automatically.
- Processing continues even if individual files fail.
- Exits with code 1 if any file encountered an error.

### JSON Output

One JSON object per line written to stdout.

**Single file mode:**

```json
{"status": true, "time_taken": 1.23, "time_taken_per_second": 0.05}
```

**Directory mode** (adds `input` and `output` fields):

```json
{"status": true, "input": "/path/to/in.wav", "output": "/path/to/out.wav", "time_taken": 1.23, "time_taken_per_second": 0.05}
```

**On error:**

```json
{"status": false, "error": "error message"}
```

In directory mode, the error object also includes `input` and `output` fields.

---

## decode.py

### Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `INPUT` | positional | yes | — | Input `.wav` file or directory |

Tool-specific arguments (model paths, device, etc.) are defined per tool.

### Input Validation

- If `INPUT` does not exist: print error to stderr, exit 1.

### Directory Processing

Same rules as encode.py except:

- No `OUTPUT` argument; decoded results are written to stdout only.
- Directory mode adds an `input` field but no `output` field.

### JSON Output

One JSON object per line written to stdout.

**Single file mode:**

```json
{"status": true, "time_taken": 1.23, "time_taken_per_second": 0.05, ...}
```

**Directory mode** (adds `input` field):

```json
{"status": true, "input": "/path/to/in.wav", "time_taken": 1.23, "time_taken_per_second": 0.05, ...}
```

**On error:**

```json
{"status": false, "error": "error message"}
```

In directory mode, the error object also includes an `input` field.

#### Tool-specific decode output fields

| Tool | Additional fields |
|---|---|
| audiowmark | `matches` (array of match objects from audiowmark) |
| audioseal | `message` (hex string), `detect_prob` (float 0–1) |
| silentcipher | `channels` (array of per-channel result objects) |

---

## Common Exit Codes

| Code | Meaning |
|---|---|
| 0 | All files processed successfully |
| 1 | One or more files failed, or argument validation error |
