import argparse
import json
import sys
from pathlib import Path

import yaml

from common import check_parity, parse_body, validate_io_paths
from gen_audioseal.watermark.encode import (
    run_encode,
    to_message_tensor,
    validate_body_length,
)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Embed audio watermark using AudioSeal"
    )
    parser.add_argument("--config-path", default="./config.yaml", help="config file")
    args = parser.parse_args()

    with open(args.config_path, "r") as file:
        cfg = yaml.safe_load(file.read())

    try:
        body_bytes = parse_body(cfg["body"], cfg["body_type"])
        validate_body_length(body_bytes)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

    message = to_message_tensor(body_bytes)

    encode_cfg = cfg["encode"]

    if encode_cfg["parity_bits"]:
        if not check_parity(body_bytes, encode_cfg["parity_bits"]):
            print("body parity check error", file=sys.stderr)
            sys.exit(1)

    input_path = Path(encode_cfg["input"]).resolve()
    output_path = Path(encode_cfg["output"]).resolve()
    generator_path = Path(encode_cfg["generator_path"]).resolve()

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
            message=message,
            generator_path=str(generator_path),
            device=encode_cfg["device"],
            alpha=encode_cfg["alpha"],
            preserve=encode_cfg["preserve"],
            chunk=encode_cfg["chunk"],
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
