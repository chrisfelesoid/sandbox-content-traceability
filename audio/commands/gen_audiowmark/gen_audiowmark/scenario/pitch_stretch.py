import os
import wave
from pathlib import Path

from common.ffmpeg import ffmpeg

from gen_audiowmark.watermark.decode import run_decode

PITCH_SEMITONES = [-4, -2, -1, 1, 2, 4]
TIME_SPEED_RATIOS = [0.75, 0.9, 0.95, 1.05, 1.1, 1.25]


def _get_sample_rate(path: Path) -> int:
    with wave.open(str(path)) as f:
        return f.getframerate()


def _apply_pitch_shift(input_wav: Path, output_wav: Path, semitones: float) -> None:
    sr = _get_sample_rate(input_wav)
    new_rate = int(sr * (2 ** (semitones / 12)))
    output_wav.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg(
        os.getcwd(),
        "-i",
        str(input_wav),
        "-af",
        f"asetrate={new_rate},aresample={sr}",
        str(output_wav),
    )


def _apply_time_stretch(input_wav: Path, output_wav: Path, speed_ratio: float) -> None:
    output_wav.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg(
        os.getcwd(),
        "-i",
        str(input_wav),
        "-af",
        f"atempo={speed_ratio}",
        str(output_wav),
    )


def _decode(
    output_wav: Path,
    decode_cfg: dict,
    detect_speed: bool,
) -> dict:
    results = run_decode(
        input_path=output_wav,
        key=decode_cfg["key"],
        detect_speed=detect_speed,
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
    semitones_list = scenario_cfg.get("pitch_shift", {}).get(
        "semitones", PITCH_SEMITONES
    )
    speed_ratios = scenario_cfg.get("time_stretch", {}).get(
        "speed_ratios", TIME_SPEED_RATIOS
    )

    for semitones in semitones_list:
        output_wav = iter_dir / "pitch_shift" / f"{int(semitones)}st.wav"
        _apply_pitch_shift(watermarked_wav, output_wav, semitones)

        for detect_speed in (False, True):
            result = _decode(output_wav, decode_cfg, detect_speed)
            records.append(
                {
                    "tool": "audiowmark",
                    "file": str(source_wav),
                    "scenario": "pitch_shift",
                    "semitones": float(semitones),
                    "speed_ratio": None,
                    "detect_speed": detect_speed,
                    "status": result["status"],
                    "score": result["score"],
                    "cause": result["cause"],
                    "time_taken": result["time_taken"],
                }
            )

    for speed_ratio in speed_ratios:
        output_wav = iter_dir / "time_stretch" / f"{speed_ratio}x.wav"
        _apply_time_stretch(watermarked_wav, output_wav, speed_ratio)

        for detect_speed in (False, True):
            result = _decode(output_wav, decode_cfg, detect_speed)
            records.append(
                {
                    "tool": "audiowmark",
                    "file": str(source_wav),
                    "scenario": "time_stretch",
                    "semitones": None,
                    "speed_ratio": float(speed_ratio),
                    "detect_speed": detect_speed,
                    "status": result["status"],
                    "score": result["score"],
                    "cause": result["cause"],
                    "time_taken": result["time_taken"],
                }
            )

    return records
