import os
import tempfile
import wave
from pathlib import Path

from common.ffmpeg import ffmpeg

from gen_silentcipher.watermark.decode import run_decode

MAX_ITERATIONS = 100


def _get_duration_ms(path: Path) -> float:
    with wave.open(str(path)) as f:
        return f.getnframes() / f.getframerate() * 1000


def _trim_head(input_wav: Path, output_wav: Path, step_ms: int) -> None:
    output_wav.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg(
        os.getcwd(),
        "-i",
        str(input_wav),
        "-ss",
        str(step_ms / 1000),
        str(output_wav),
    )


def _trim_tail(input_wav: Path, output_wav: Path, new_duration_s: float) -> None:
    output_wav.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg(
        os.getcwd(),
        "-i",
        str(input_wav),
        "-t",
        str(new_duration_s),
        str(output_wav),
    )


def _cut_segment(
    input_wav: Path,
    output_left: Path,
    output_right: Path,
    step_ms: float,
    duration_ms: float,
) -> None:
    output_left.parent.mkdir(parents=True, exist_ok=True)
    output_right.parent.mkdir(parents=True, exist_ok=True)
    center_ms = duration_ms / 2
    left_end_s = (center_ms - step_ms / 2) / 1000
    right_start_s = (center_ms + step_ms / 2) / 1000
    ffmpeg(
        os.getcwd(),
        "-i",
        str(input_wav),
        "-t",
        str(left_end_s),
        str(output_left),
    )
    ffmpeg(
        os.getcwd(),
        "-ss",
        str(right_start_s),
        "-i",
        str(input_wav),
        str(output_right),
    )


def _concat_segments(segments: list[Path], output_wav: Path) -> None:
    output_wav.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        for seg in segments:
            f.write(f"file '{seg.resolve()}'\n")
        list_path = Path(f.name)
    try:
        ffmpeg(
            os.getcwd(),
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(list_path),
            "-c",
            "copy",
            str(output_wav),
        )
    finally:
        list_path.unlink(missing_ok=True)


def _decode(path: Path, decode_cfg: dict) -> dict:
    results = run_decode(
        input_path=path,
        model_type=decode_cfg["model_type"],
        device=decode_cfg["device"],
        ckpt_path=decode_cfg.get("ckpt_path"),
        config_path=decode_cfg.get("config_path"),
        phase_shift_decoding=decode_cfg.get("phase_shift_decoding", False),
        parity_bits=decode_cfg["parity_bits"],
        threshold=decode_cfg["threshold"],
    )
    return results[0]


def _run_head_trim(
    watermarked_wav: Path,
    iter_dir: Path,
    decode_cfg: dict,
    step_ms: int,
    max_iterations: int,
    source_wav: Path,
) -> list[dict]:
    records = []
    scenario_dir = iter_dir / "head_trim"
    current = watermarked_wav

    for i in range(1, max_iterations + 1):
        trimmed = scenario_dir / f"iter_{i:03d}.wav"
        _trim_head(current, trimmed, step_ms)
        remaining_ms = int(round(_get_duration_ms(trimmed)))
        if remaining_ms < step_ms:
            break
        result = _decode(trimmed, decode_cfg)
        records.append(
            {
                "tool": "silentcipher",
                "file": str(source_wav),
                "scenario": "head_trim",
                "step_ms": step_ms,
                "iteration": i,
                "remaining_ms": remaining_ms,
                "status": result["status"],
                "score": result["score"],
                "time_taken": result["time_taken"],
            }
        )
        if not result["status"]:
            break
        current = trimmed

    return records


def _run_tail_trim(
    watermarked_wav: Path,
    iter_dir: Path,
    decode_cfg: dict,
    step_ms: int,
    max_iterations: int,
    source_wav: Path,
) -> list[dict]:
    records = []
    scenario_dir = iter_dir / "tail_trim"
    current = watermarked_wav

    for i in range(1, max_iterations + 1):
        duration_ms = _get_duration_ms(current)
        new_duration_s = (duration_ms - step_ms) / 1000
        trimmed = scenario_dir / f"iter_{i:03d}.wav"
        _trim_tail(current, trimmed, new_duration_s)
        remaining_ms = int(round(_get_duration_ms(trimmed)))
        if remaining_ms < step_ms:
            break
        result = _decode(trimmed, decode_cfg)
        records.append(
            {
                "tool": "silentcipher",
                "file": str(source_wav),
                "scenario": "tail_trim",
                "step_ms": step_ms,
                "iteration": i,
                "remaining_ms": remaining_ms,
                "status": result["status"],
                "score": result["score"],
                "time_taken": result["time_taken"],
            }
        )
        if not result["status"]:
            break
        current = trimmed

    return records


def _run_recursive_cut(
    watermarked_wav: Path,
    iter_dir: Path,
    decode_cfg: dict,
    step_ms: int,
    max_iterations: int,
    source_wav: Path,
) -> list[dict]:
    records = []
    scenario_dir = iter_dir / "recursive_cut"
    segs_dir = scenario_dir / "segs"
    segs_dir.mkdir(parents=True, exist_ok=True)

    segments = [watermarked_wav]

    for i in range(1, max_iterations + 1):
        new_segments: list[Path] = []
        any_cut = False

        for seg in segments:
            dur_ms = _get_duration_ms(seg)
            if dur_ms > step_ms:
                any_cut = True
                j = len(new_segments)
                left = segs_dir / f"iter_{i:03d}_seg_{j:04d}.wav"
                right = segs_dir / f"iter_{i:03d}_seg_{j + 1:04d}.wav"
                _cut_segment(seg, left, right, step_ms, dur_ms)
                new_segments.append(left)
                new_segments.append(right)
            else:
                new_segments.append(seg)

        if not any_cut:
            break

        segments = new_segments

        trimmed = scenario_dir / f"iter_{i:03d}.wav"
        _concat_segments(segments, trimmed)
        remaining_ms = int(round(_get_duration_ms(trimmed)))
        result = _decode(trimmed, decode_cfg)
        records.append(
            {
                "tool": "silentcipher",
                "file": str(source_wav),
                "scenario": "recursive_cut",
                "step_ms": step_ms,
                "iteration": i,
                "remaining_ms": remaining_ms,
                "status": result["status"],
                "score": result["score"],
                "time_taken": result["time_taken"],
            }
        )
        if not result["status"]:
            break

    return records


def run(
    watermarked_wav: Path,
    source_wav: Path,
    iter_dir: Path,
    decode_cfg: dict,
    scenario_cfg: dict,
) -> list[dict]:
    step_ms = scenario_cfg.get("step_ms", 500)
    max_iterations = scenario_cfg.get("max_iterations", MAX_ITERATIONS)

    records = []
    records.extend(
        _run_head_trim(
            watermarked_wav, iter_dir, decode_cfg, step_ms, max_iterations, source_wav
        )
    )
    records.extend(
        _run_tail_trim(
            watermarked_wav, iter_dir, decode_cfg, step_ms, max_iterations, source_wav
        )
    )
    records.extend(
        _run_recursive_cut(
            watermarked_wav, iter_dir, decode_cfg, step_ms, max_iterations, source_wav
        )
    )
    return records
