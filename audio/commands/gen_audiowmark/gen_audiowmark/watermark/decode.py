import json
import subprocess
import tempfile
import time
import wave
from pathlib import Path

from common import check_parity, parse_body


def get_duration(path: Path) -> float:
    with wave.open(str(path)) as f:
        return f.getnframes() / f.getframerate()


def decode_file(
    in_path: Path,
    key: str | None,
    detect_speed: bool,
    detect_speed_patient: bool,
    parity_bits: int,
    threshold: float,
) -> dict:
    duration = get_duration(in_path)

    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        tmp_path = Path(tmp.name)

    try:
        cmd = ["audiowmark", "get", "--json", str(tmp_path)]
        if key is not None:
            cmd += ["--key", key]
        if detect_speed_patient:
            cmd.append("--detect-speed-patient")
        elif detect_speed:
            cmd.append("--detect-speed")
        cmd.append(str(in_path))

        start = time.time()
        proc = subprocess.run(cmd, capture_output=True, text=True)
        time_taken = time.time() - start

        if proc.returncode != 0:
            raise RuntimeError(
                proc.stderr.strip() or f"audiowmark exited with code {proc.returncode}"
            )

        matches = json.loads(tmp_path.read_text())
    finally:
        tmp_path.unlink(missing_ok=True)

    check_matches = []
    for match in matches["matches"]:
        ok = True
        cause = ""
        if parity_bits > 0:
            body = parse_body(match["bits"], "hex")
            if not check_parity(body, parity_bits):
                ok = False
                cause = "parity check error"
        if match["quality"] < threshold:
            ok = False
            cause = "insufficient probability"
        check_matches.append({**match, "status": ok, "cause": cause})

    best = max(
        (m for m in check_matches if m["status"]),
        key=lambda m: m["quality"],
        default=None,
    )

    if best is None:
        worst = max(check_matches, key=lambda m: m["quality"], default=None)
        cause = worst["cause"] if worst is not None else ""
    else:
        cause = ""

    return {
        "status": best is not None,
        "cause": cause,
        "message": best["bits"] if best is not None else "",
        "score": best["quality"] if best is not None else 0.0,
        "time_taken": time_taken,
        "time_taken_per_second": time_taken / duration,
        "input": str(in_path),
        "matches": check_matches,
    }


def run_decode(
    input_path: Path,
    key: str | None,
    detect_speed: bool,
    detect_speed_patient: bool,
    parity_bits: int,
    threshold: float,
) -> list[dict]:
    input_is_dir = input_path.is_dir()
    if not input_is_dir:
        result = decode_file(
            input_path,
            key,
            detect_speed,
            detect_speed_patient,
            parity_bits,
            threshold,
        )
        return [result]
    else:
        all_results: list[dict] = []
        for wav_file in sorted(input_path.rglob("*.wav")):
            try:
                result = decode_file(
                    wav_file,
                    key,
                    detect_speed,
                    detect_speed_patient,
                    parity_bits,
                    threshold,
                )
            except Exception as e:
                result = {"status": False, "input": str(wav_file), "error": str(e)}
            all_results.append(result)
        return all_results
