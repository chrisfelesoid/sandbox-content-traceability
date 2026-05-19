from pathlib import Path

from common.audio import add_noise_at_snr, apply_mp3, apply_resample

from gen_audiowmark.watermark.decode import run_decode

MP3_BITRATES = [32, 64, 96, 128, 192, 320]
RESAMPLE_RATES = [8000, 16000, 22050, 44100]
NOISE_SNRS = [10, 20, 30, 40]


def _decode(path: Path, decode_cfg: dict) -> dict:
    results = run_decode(
        input_path=path,
        key=decode_cfg["key"],
        detect_speed=decode_cfg.get("detect_speed", False),
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
    bitrates = scenario_cfg.get("mp3", {}).get("bitrates_kbps", MP3_BITRATES)
    sample_rates = scenario_cfg.get("resample", {}).get("sample_rates", RESAMPLE_RATES)
    snr_dbs = scenario_cfg.get("noise", {}).get("snr_db", NOISE_SNRS)

    for bitrate in bitrates:
        out = iter_dir / "mp3" / f"{bitrate}kbps.wav"
        apply_mp3(watermarked_wav, out, bitrate)
        result = _decode(out, decode_cfg)
        records.append(
            {
                "tool": "audiowmark",
                "file": str(source_wav),
                "transformation": "mp3",
                "bitrate_kbps": bitrate,
                "sample_rate": None,
                "snr_db": None,
                "status": result["status"],
                "score": result["score"],
                "cause": result["cause"],
                "time_taken": result["time_taken"],
            }
        )

    for sr in sample_rates:
        out = iter_dir / "resample" / f"{sr}hz.wav"
        apply_resample(watermarked_wav, out, sr)
        result = _decode(out, decode_cfg)
        records.append(
            {
                "tool": "audiowmark",
                "file": str(source_wav),
                "transformation": "resample",
                "bitrate_kbps": None,
                "sample_rate": sr,
                "snr_db": None,
                "status": result["status"],
                "score": result["score"],
                "cause": result["cause"],
                "time_taken": result["time_taken"],
            }
        )

    for snr in snr_dbs:
        out = iter_dir / "noise" / f"{snr:g}db.wav"
        add_noise_at_snr(watermarked_wav, out, snr)
        result = _decode(out, decode_cfg)
        records.append(
            {
                "tool": "audiowmark",
                "file": str(source_wav),
                "transformation": "noise",
                "bitrate_kbps": None,
                "sample_rate": None,
                "snr_db": snr,
                "status": result["status"],
                "score": result["score"],
                "cause": result["cause"],
                "time_taken": result["time_taken"],
            }
        )

    return records
