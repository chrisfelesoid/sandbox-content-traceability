import argparse
import json
import sys
from pathlib import Path

import yaml

from common import check_parity, parse_body, validate_io_paths
from gen_silentcipher.watermark.encode import run_encode, validate_body_length


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Embed audio watermark using SilentCipher"
    )
    parser.add_argument("--config-path", default="./config.yaml", help="config file")
    args = parser.parse_args()

    with open(args.config_path, "r") as file:
        config = yaml.safe_load(file.read())

    try:
        body_bytes = parse_body(config["body"], config["body_type"])
        validate_body_length(body_bytes, config.get("force_body_length", False))
    except ValueError as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

    if config.get("parity_bits"):
        if not check_parity(body_bytes, config["parity_bits"]):
            print("body parity check error", file=sys.stderr)
            sys.exit(1)

    encode_cfg = config["encode"]
    input_path = Path(encode_cfg["input"]).resolve()
    output_path = Path(encode_cfg["output"]).resolve()

    if encode_cfg["parity_bits"]:
        if not check_parity(body_bytes, encode_cfg["parity_bits"]):
            print("body parity check error", file=sys.stderr)
            sys.exit(1)

    if not input_path.exists():
        print(f"input path does not exist: {input_path}", file=sys.stderr)
        sys.exit(1)

    try:
        validate_io_paths(input_path, output_path)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

    try:
        results = run_encode(
            input_path=input_path,
            output_path=output_path,
            body_bytes=body_bytes,
            model_type=encode_cfg["model_type"],
            device=encode_cfg["device"],
            ckpt_path=encode_cfg.get("ckpt_path"),
            config_path=encode_cfg.get("config_path"),
            sdr=encode_cfg.get("sdr"),
        )
    except Exception as e:
        print(json.dumps({"status": False, "error": str(e)}))
        sys.exit(1)
    for result in results:
        print(json.dumps(result))
    if any(not r.get("status") for r in results):
        sys.exit(1)


if __name__ == "__main__":
    main()
