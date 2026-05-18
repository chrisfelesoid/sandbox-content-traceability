import argparse
import json
import sys
from pathlib import Path

import yaml

from gen_silentcipher.watermark.decode import run_decode


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Decode audio watermark using SilentCipher"
    )
    parser.add_argument("--config-path", default="./config.yaml", help="config file")
    args = parser.parse_args()

    with open(args.config_path, "r") as file:
        config = yaml.safe_load(file.read())

    decode_cfg = config["decode"]
    input_path = Path(decode_cfg["input"]).resolve()

    if not input_path.exists():
        print(f"input path does not exist: {input_path}", file=sys.stderr)
        sys.exit(1)

    try:
        results = run_decode(
            input_path=input_path,
            model_type=decode_cfg["model_type"],
            device=decode_cfg["device"],
            ckpt_path=decode_cfg["ckpt_path"],
            config_path=decode_cfg["config_path"],
            phase_shift_decoding=decode_cfg["phase_shift_decoding"],
            parity_bits=decode_cfg["parity_bits"],
            threshold=decode_cfg["threshold"],
        )
    except Exception as e:
        print(json.dumps({"status": False, "error": str(e)}))
        sys.exit(1)
    for result in results:
        print(json.dumps(result))


if __name__ == "__main__":
    main()
