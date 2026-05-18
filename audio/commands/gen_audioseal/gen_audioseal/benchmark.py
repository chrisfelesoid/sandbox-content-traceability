import argparse
import importlib
import json
import sys
from pathlib import Path

import yaml
from common.benchmarks.summary import compute_summary

from gen_audioseal.encode import (
    parse_body,
    run_encode,
    to_message_tensor,
    validate_body_length,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark using AudioSeal")
    parser.add_argument("--config-path", default="./config.yaml", help="config file")
    args = parser.parse_args()

    with open(args.config_path, "r") as file:
        cfg = yaml.safe_load(file.read())

    bench_cfg = cfg["benchmark"]

    try:
        body_bytes = parse_body(cfg["body"], cfg["body_type"])
        validate_body_length(body_bytes)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

    message = to_message_tensor(body_bytes)

    tool = "audioseal"
    source_dir = Path(bench_cfg["source_dir"]).resolve()
    watermarked_dir = Path(bench_cfg["watermarked_dir"]).resolve()
    output_dir = Path(bench_cfg["benchmark_dir"]).resolve()

    for scenario in bench_cfg["scenarios"]:
        name = scenario["name"]
        results_file = output_dir / "results" / f"{name}.jsonl"
        summary_file = output_dir / "summary" / f"{name}.json"
        files_dir = output_dir / "files" / name

        results_file.parent.mkdir(parents=True, exist_ok=True)
        summary_file.parent.mkdir(parents=True, exist_ok=True)
        watermarked_dir.mkdir(parents=True, exist_ok=True)

        all_records: list[dict] = []

        with results_file.open("w") as out:
            wav_files = sorted(source_dir.glob("*.wav"))
            if not wav_files:
                print(f"no .wav files found in {source_dir}", file=sys.stderr)
                sys.exit(1)

            print(f"[{tool}] encoding ...", file=sys.stderr)
            encode_cfg = cfg["encode"]
            run_encode(
                source_dir,
                watermarked_dir,
                message,
                encode_cfg["generator_path"],
                encode_cfg["device"],
                encode_cfg["alpha"],
                encode_cfg["preserve"],
                encode_cfg["chunk"],
            )

            for wav_file in wav_files:
                watermarked_wav = watermarked_dir / wav_file.name

                iter_dir = files_dir / wav_file.stem

                mod_scenario = importlib.import_module(f"gen_audioseal.scenario.{name}")

                records = mod_scenario.run(
                    watermarked_wav, wav_file, iter_dir, cfg["decode"], scenario
                )

                for rec in records:
                    out.write(json.dumps(rec) + "\n")
                    out.flush()
                all_records.extend(records)

        summary = compute_summary(all_records)
        summary_file.write_text(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
