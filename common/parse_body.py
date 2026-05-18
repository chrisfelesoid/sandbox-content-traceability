import argparse
import sys

from common.body import parse_body


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert body to bytes")
    parser.add_argument("-b", "--body", required=True, help="body to convert")
    parser.add_argument(
        "-t",
        "--body-type",
        choices=["hex", "text", "bit"],
        default="text",
    )
    parser.add_argument(
        "-o",
        "--output-type",
        choices=["hex", "int"],
        default="hex",
    )
    args = parser.parse_args()

    try:
        result = parse_body(args.body, args.body_type)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

    if args.output_type == "hex":
        print(result.hex())
    else:
        print(", ".join(str(b) for b in result))


if __name__ == "__main__":
    main()
