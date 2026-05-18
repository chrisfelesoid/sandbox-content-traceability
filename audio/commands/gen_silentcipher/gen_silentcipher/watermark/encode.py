from pathlib import Path
from typing import Any

import silentcipher

REQUIRED_BYTES = 5


def validate_body_length(body_bytes: bytes, force: bool) -> None:
    if not force and len(body_bytes) != REQUIRED_BYTES:
        raise ValueError(
            f"body must be exactly {REQUIRED_BYTES} bytes, got {len(body_bytes)}. "
            "Use force_body_length to bypass this check."
        )


def encode_file(
    model: Any,
    in_path: Path,
    out_path: Path,
    message_list: list[int],
    sdr: float | None,
) -> dict:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    return model.encode(str(in_path), str(out_path), message_list, message_sdr=sdr)


def run_encode(
    input_path: Path,
    output_path: Path,
    body_bytes: bytes,
    model_type: str,
    device: str,
    ckpt_path: str | None,
    config_path: str | None,
    sdr: float | None,
) -> list[dict]:
    get_model_kwargs: dict = {"model_type": model_type, "device": device}
    if ckpt_path is not None:
        get_model_kwargs["ckpt_path"] = ckpt_path
    if config_path is not None:
        get_model_kwargs["config_path"] = config_path
    model = silentcipher.get_model(**get_model_kwargs)

    input_is_dir = input_path.is_dir()
    if not input_is_dir:
        result = encode_file(model, input_path, output_path, list(body_bytes), sdr)
        return [result]
    else:
        output_path.mkdir(parents=True, exist_ok=True)
        all_results: list[dict] = []
        for wav_file in sorted(input_path.rglob("*.wav")):
            out_file = output_path / wav_file.relative_to(input_path)
            try:
                result = encode_file(model, wav_file, out_file, list(body_bytes), sdr)
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
