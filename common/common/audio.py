import array
import math
import os
import random
import tempfile
import wave
from pathlib import Path

from common.ffmpeg import ffmpeg


def add_noise_at_snr(
    input_wav: Path, output_wav: Path, snr_db: float, seed: int = 42
) -> None:
    with wave.open(str(input_wav)) as wf:
        params = wf.getparams()
        sampwidth = params.sampwidth
        n_channels = params.nchannels
        n_frames = params.nframes
        raw = wf.readframes(n_frames)

    n_samples = n_frames * n_channels

    if sampwidth == 2:
        typecode, max_val = "h", 32768.0
        int_min, int_max = -32768, 32767
    elif sampwidth == 4:
        typecode, max_val = "i", 2147483648.0
        int_min, int_max = -2147483648, 2147483647
    else:
        raise ValueError(f"Unsupported sample width: {sampwidth} bytes")

    samples = array.array(typecode)
    samples.frombytes(raw)

    rms = math.sqrt(sum(s * s for s in samples) / n_samples) / max_val
    if rms == 0.0:
        output_wav.parent.mkdir(parents=True, exist_ok=True)
        output_wav.write_bytes(input_wav.read_bytes())
        return

    noise_std = rms / (10 ** (snr_db / 20.0)) * max_val

    rng = random.Random(seed)
    out = array.array(typecode)
    for s in samples:
        noisy = s + rng.gauss(0.0, noise_std)
        out.append(max(int_min, min(int_max, round(noisy))))

    output_wav.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output_wav), "w") as wf_out:
        wf_out.setparams(params)
        wf_out.writeframes(out.tobytes())


def apply_mp3(input_wav: Path, output_wav: Path, bitrate_kbps: int) -> None:
    output_wav.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        tmp_mp3 = Path(tmp) / "temp.mp3"
        ffmpeg(
            os.getcwd(), "-i", str(input_wav), "-b:a", f"{bitrate_kbps}k", str(tmp_mp3)
        )
        ffmpeg(os.getcwd(), "-i", str(tmp_mp3), str(output_wav))


def apply_resample(input_wav: Path, output_wav: Path, sample_rate: int) -> None:
    output_wav.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg(os.getcwd(), "-i", str(input_wav), "-ar", str(sample_rate), str(output_wav))
