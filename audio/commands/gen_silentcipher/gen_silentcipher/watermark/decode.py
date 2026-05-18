import time
from pathlib import Path
from typing import Any

import silentcipher
import soundfile as sf

from common import check_parity, parse_body


def decode_file(
    model: Any,
    in_path: Path,
    phase_shift_decoding: bool,
    parity_bits: int,
    threshold: float,
) -> dict:
    info = sf.info(str(in_path))
    start = time.time()
    results = model.decode(str(in_path), phase_shift_decoding)
    time_taken = time.time() - start
    if not isinstance(results, list):
        results = [results]

    check_results = []
    for result in results:
        ok = True
        cause = ""
        message = ""
        confidence = 0.0
        if result["status"]:
            message = result["messages"][0] if result["messages"] else ""
            message = "".join([f"{x:02x}" for x in message])
            confidence = result["confidences"][0] if result["confidences"] else 0.0
            if parity_bits > 0:
                body = parse_body(message, "hex")
                if not check_parity(body, parity_bits):
                    ok = False
                    cause = "parity check error"
            if confidence < threshold:
                ok = False
                cause = "insufficient probability"
        else:
            ok = False
            cause = result["error"]
        check_results.append(
            {
                **result,
                "message": message,
                "confidence": confidence,
                "status": ok,
                "cause": cause,
            }
        )

    best = max(
        (m for m in check_results if m["status"]),
        key=lambda m: m["confidence"],
        default=None,
    )

    if best is None:
        worst = max(check_results, key=lambda m: m["confidence"], default=None)
        final_cause = worst["cause"] if worst is not None else ""
    else:
        final_cause = ""

    return {
        "status": best is not None,
        "cause": final_cause,
        "message": best["message"] if best is not None else "",
        "score": best["confidence"] if best is not None else 0.0,
        "time_taken": time_taken,
        "time_taken_per_second": time_taken / info.duration,
        "input": str(in_path),
        "results": results,
    }


def run_decode(
    input_path: Path,
    model_type: str,
    device: str,
    ckpt_path: str | None,
    config_path: str | None,
    phase_shift_decoding: bool,
    parity_bits: int,
    threshold: float,
) -> list[dict]:
    get_model_kwargs: dict = {"model_type": model_type, "device": device}
    if ckpt_path is not None:
        get_model_kwargs["ckpt_path"] = ckpt_path
    if config_path is not None:
        get_model_kwargs["config_path"] = config_path
    model = silentcipher.get_model(**get_model_kwargs)

    input_is_dir = input_path.is_dir()
    if not input_is_dir:
        result = decode_file(
            model, input_path, phase_shift_decoding, parity_bits, threshold
        )
        return [result]
    else:
        all_results: list[dict] = []
        for wav_file in sorted(input_path.rglob("*.wav")):
            try:
                result = decode_file(
                    model, wav_file, phase_shift_decoding, parity_bits, threshold
                )
            except Exception as e:
                result = {"status": False, "input": str(wav_file), "error": str(e)}
            all_results.append(result)
        return all_results
