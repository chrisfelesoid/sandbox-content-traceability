import os
from pathlib import Path

from common.ffmpeg import ffmpeg

from gen_audiowmark.watermark.decode import run_decode

VOLUME_DBS = [-20, -15, -10, -6, -3, 3, 6]


def _apply_volume(input_wav: Path, output_wav: Path, volume_db: float) -> None:
    output_wav.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg(
        os.getcwd(),
        "-i",
        str(input_wav),
        "-af",
        f"volume={volume_db}dB",
        str(output_wav),
    )


def _decode(path: Path, decode_cfg: dict) -> dict:
    results = run_decode(
        input_path=path,
        key=decode_cfg["key"],
        detect_speed=False,
        detect_speed_patient=decode_cfg.get("detect_speed_patient", False),
        parity_bits=decode_cfg["parity_bits"],
        threshold=decode_cfg["threshold"],
    )
    return results[0]


def run(
    watermarked_wav: Path,
    source_wav: Path,
    iter_dir: Path,
    decode_cfg: dict,
    scenario_cfg: dict,
) -> list[dict]:
    records = []
    volume_dbs = scenario_cfg.get("volume_dbs", VOLUME_DBS)

    for volume_db in volume_dbs:
        out = iter_dir / f"{volume_db}db.wav"
        _apply_volume(watermarked_wav, out, volume_db)
        result = _decode(out, decode_cfg)
        records.append(
            {
                "tool": "audiowmark",
                "file": str(source_wav),
                "volume_db": volume_db,
                "status": result["status"],
                "score": result["score"],
                "cause": result["cause"],
                "time_taken": result["time_taken"],
            }
        )

    return records
