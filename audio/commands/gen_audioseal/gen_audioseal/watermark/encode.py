import time
from pathlib import Path
from typing import Any

import torch
import torchaudio
from audioseal import AudioSeal

NBITS = 16
REQUIRED_BYTES = NBITS // 8


def validate_body_length(body_bytes: bytes) -> None:
    if len(body_bytes) != REQUIRED_BYTES:
        raise ValueError(
            f"body must be exactly {REQUIRED_BYTES} bytes ({NBITS} bits), got {len(body_bytes)}"
        )


def to_message_tensor(body_bytes: bytes) -> torch.Tensor:
    bits = [(byte >> (7 - i)) & 1 for byte in body_bytes for i in range(8)]
    return torch.tensor(bits, dtype=torch.int32).unsqueeze(0)  # 1 x NBITS


def _iter_chunks(waveform_16k: torch.Tensor, chunk_ms: int):
    if chunk_ms <= 0:
        yield waveform_16k
        return
    chunk_frames = chunk_ms * 16  # 16000 Hz / 1000 ms
    total = waveform_16k.shape[-1]
    for start in range(0, total, chunk_frames):
        yield waveform_16k[..., start : start + chunk_frames]


def encode_file(
    model: Any,
    in_path: Path,
    out_path: Path,
    message: torch.Tensor,
    alpha: float,
    device: str,
    preserve: str,
    chunk_ms: int,
) -> dict:
    out_path.parent.mkdir(parents=True, exist_ok=True)

    waveform, sample_rate = torchaudio.load(str(in_path))
    duration = waveform.shape[-1] / sample_rate

    msg = message.to(device)

    start = time.time()
    with torch.no_grad():
        waveform_16k = torchaudio.transforms.Resample(sample_rate, 16000)(waveform)
        out_chunks = []
        for chunk in _iter_chunks(waveform_16k, chunk_ms):
            x = chunk.unsqueeze(1).to(device)  # channels x 1 x frames_16k
            if preserve == "original":
                out_chunks.append(model.get_watermark(x, message=msg).squeeze(1).cpu())
            else:
                out_chunks.append(model(x, message=msg, alpha=alpha).squeeze(1).cpu())
        out_16k = torch.cat(out_chunks, dim=-1)

        if preserve == "original":
            watermark = torchaudio.transforms.Resample(16000, sample_rate)(out_16k)[
                ..., : waveform.shape[-1]
            ]
            watermarked = waveform + alpha * watermark
        else:
            watermarked = torchaudio.transforms.Resample(16000, sample_rate)(out_16k)[
                ..., : waveform.shape[-1]
            ]
    time_taken = time.time() - start

    torchaudio.save(str(out_path), watermarked, sample_rate)

    return {
        "status": True,
        "time_taken": time_taken,
        "time_taken_per_second": time_taken / duration,
    }


def run_encode(
    input_path: Path,
    output_path: Path,
    message: torch.Tensor,
    generator_path: str | None,
    device: str,
    alpha: float,
    preserve: str,
    chunk: int,
) -> list[dict]:
    model_path = generator_path if generator_path is not None else "audioseal_wm_16bits"
    model = AudioSeal.load_generator(model_path, nbits=NBITS, device=device)
    model.eval()
    input_is_dir = input_path.is_dir()

    if not input_is_dir:
        result = encode_file(
            model, input_path, output_path, message, alpha, device, preserve, chunk
        )
        return [result]
    else:
        output_path.mkdir(parents=True, exist_ok=True)
        all_results: list[dict] = []
        for wav_file in sorted(input_path.rglob("*.wav")):
            out_file = output_path / wav_file.relative_to(input_path)
            try:
                result = encode_file(
                    model, wav_file, out_file, message, alpha, device, preserve, chunk
                )
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
