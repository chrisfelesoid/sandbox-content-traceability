import subprocess
import time
import wave
from pathlib import Path

REQUIRED_BYTES = 16  # 128 bits


def validate_body_length(body_bytes: bytes) -> None:
    if len(body_bytes) != REQUIRED_BYTES:
        raise ValueError(
            f"body must be exactly {REQUIRED_BYTES} bytes (128 bits), got {len(body_bytes)}"
        )


def get_duration(path: Path) -> float:
    with wave.open(str(path)) as f:
        return f.getnframes() / f.getframerate()


def encode_file(
    in_path: Path,
    out_path: Path,
    message_hex: str,
    key: str | None,
    strength: float | None,
) -> dict:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    duration = get_duration(in_path)

    cmd = ["audiowmark", "add"]
    if key is not None:
        cmd += ["--key", key]
    if strength is not None:
        cmd += ["--strength", str(strength)]
    cmd += [str(in_path), str(out_path), message_hex]

    start = time.time()
    result = subprocess.run(cmd, capture_output=True, text=True)
    time_taken = time.time() - start

    if result.returncode != 0:
        raise RuntimeError(
            result.stderr.strip() or f"audiowmark exited with code {result.returncode}"
        )

    return {
        "status": True,
        "time_taken": time_taken,
        "time_taken_per_second": time_taken / duration,
    }


def run_encode(
    input_path: Path,
    output_path: Path,
    message_hex: str,
    key: str | None,
    strength: float | None,
) -> list[dict]:
    input_is_dir = input_path.is_dir()
    if not input_is_dir:
        result = encode_file(input_path, output_path, message_hex, key, strength)
        return [result]
    else:
        output_path.mkdir(parents=True, exist_ok=True)
        all_results: list[dict] = []
        for wav_file in sorted(input_path.rglob("*.wav")):
            out_file = output_path / wav_file.relative_to(input_path)
            try:
                result = encode_file(wav_file, out_file, message_hex, key, strength)
                result["input"] = str(wav_file)
                result["output"] = str(out_file)
            except Exception as e:
                result = {
                    "status": False,
                    "input": str(wav_file),
                    "output": str(out_file),
                    "error": str(e),
                }
            all_results.append(result)
        return all_results
