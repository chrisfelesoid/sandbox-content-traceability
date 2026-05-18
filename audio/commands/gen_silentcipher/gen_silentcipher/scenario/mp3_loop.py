import os
import shutil
import tempfile
from pathlib import Path

from common.ffmpeg import ffmpeg

from gen_silentcipher.watermark.decode import run_decode


def run(
    watermarked_wav: Path,
    source_wav: Path,
    iter_dir: Path,
    decode_cfg: dict,
    scenario_cfg: dict,
) -> list[dict]:
    records = []

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        watermarked = tmp_path / "watermarked.wav"
        temp_mp3 = tmp_path / "temp.mp3"
        bitrates = sorted(scenario_cfg["bitrates"], reverse=True)

        shutil.copy2(watermarked_wav, watermarked)

        for i, bitrate in enumerate(bitrates, 1):
            ffmpeg(
                os.getcwd(),
                "-i",
                str(watermarked),
                "-b:a",
                f"{bitrate}k",
                str(temp_mp3),
            )
            ffmpeg(os.getcwd(), "-i", str(temp_mp3), str(watermarked))

            iter_wav = iter_dir / f"iter_{i:03d}.wav"
            iter_wav.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(watermarked, iter_wav)

            results = run_decode(
                input_path=watermarked,
                model_type=decode_cfg["model_type"],
                device=decode_cfg["device"],
                ckpt_path=decode_cfg.get("ckpt_path"),
                config_path=decode_cfg.get("config_path"),
                phase_shift_decoding=decode_cfg.get("phase_shift_decoding", False),
                parity_bits=decode_cfg["parity_bits"],
                threshold=decode_cfg["threshold"],
            )
            result = results[0]

            records.append(
                {
                    "tool": "silentcipher",
                    "file": str(source_wav),
                    "bitrate_kbps": bitrate,
                    "iteration": i,
                    "status": result["status"],
                    "score": result["score"],
                    "time_taken": result["time_taken"],
                    "cause": result["cause"],
                }
            )

            if not result["status"]:
                break

    return records
