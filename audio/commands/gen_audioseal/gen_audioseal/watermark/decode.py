import time
from pathlib import Path
from typing import Any

import torch
import torchaudio
from audioseal import AudioSeal

from common import check_parity, parse_body

NBITS = 16


def message_tensor_to_hex(message: torch.Tensor) -> str:
    bits = message.squeeze(0).tolist()
    byte_values = [
        sum(int(bits[i * 8 + j]) << (7 - j) for j in range(8))
        for i in range(len(bits) // 8)
    ]
    return bytes(byte_values).hex()


def _iter_chunks(waveform_16k: torch.Tensor, chunk_ms: int):
    if chunk_ms <= 0:
        yield waveform_16k
        return
    chunk_frames = chunk_ms * 16  # 16000 Hz / 1000 ms
    total = waveform_16k.shape[-1]
    for start in range(0, total, chunk_frames):
        yield waveform_16k[..., start : start + chunk_frames]


def decode_file(
    model: Any,
    in_path: Path,
    device: str,
    chunk_ms: int,
    parity_bits: int,
    threshold: float,
) -> dict:
    waveform, sample_rate = torchaudio.load(str(in_path))
    duration = waveform.shape[-1] / sample_rate

    start = time.time()
    with torch.no_grad():
        waveform_16k = torchaudio.transforms.Resample(sample_rate, 16000)(waveform)
        detect_probs = []
        messages = []
        for chunk in _iter_chunks(waveform_16k, chunk_ms):
            x = chunk.unsqueeze(1).to(device)  # channels x 1 x frames_16k
            dp, msg = model.detect_watermark(x)  # channels, channels x NBITS
            detect_probs.append(dp.mean().item())
            messages.append(msg.float().mean(dim=0))  # NBITS
        detect_prob = torch.tensor(detect_probs).mean()
        message = (
            torch.stack(messages).mean(dim=0, keepdim=True).round().int()
        )  # 1 x NBITS
    time_taken = time.time() - start

    hex_body = message_tensor_to_hex(message)
    status = True
    cause = ""

    if parity_bits > 0:
        hex = parse_body(hex_body, "hex")
        if not check_parity(hex, parity_bits):
            status = False
            cause = "parity mismatch"

    if detect_prob.item() < threshold:
        status = False
        cause = "insufficient probability"

    return {
        "status": status,
        "cause": cause,
        "message": hex_body,
        "score": detect_prob.item(),
        "time_taken": time_taken,
        "time_taken_per_second": time_taken / duration,
        "input": str(in_path),
    }


def run_decode(
    input_path: Path,
    detector_path: str | None,
    device: str,
    chunk: int,
    parity_bits: int,
    threshold: float,
) -> list[dict]:
    input_is_dir = input_path.is_dir()
    model_path = (
        detector_path if detector_path is not None else "audioseal_detector_16bits"
    )
    model = AudioSeal.load_detector(model_path, nbits=NBITS, device=device)
    model.eval()

    if not input_is_dir:
        result = decode_file(model, input_path, device, chunk, parity_bits, threshold)
        return [result]
    else:
        all_results: list[dict] = []
        for wav_file in sorted(input_path.rglob("*.wav")):
            try:
                result = decode_file(
                    model, wav_file, device, chunk, parity_bits, threshold
                )
            except Exception as e:
                result = {"status": False, "input": str(wav_file), "error": str(e)}
            all_results.append(result)
        return all_results
