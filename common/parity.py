import argparse
import sys

from common.body import parse_body

from common.parity import add_parity, check_parity


def main() -> None:
    parser = argparse.ArgumentParser(description="Check or add parity bits of a body")
    parser.add_argument("-b", "--body", required=True, help="body to process")
    parser.add_argument(
        "-t",
        "--body-type",
        choices=["hex", "text", "bit"],
        default="text",
    )
    parser.add_argument(
        "-p",
        "--parity-bits",
        type=int,
        required=True,
        help="number of lower bits used as parity bits",
    )
    parser.add_argument(
        "-a",
        "--add",
        action="store_true",
        help="add parity bits instead of checking (outputs hex string)",
    )
    args = parser.parse_args()

    try:
        body = parse_body(args.body, args.body_type)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

    if args.add:
        try:
            result = add_parity(body, args.parity_bits)
        except ValueError as e:
            print(str(e), file=sys.stderr)
            sys.exit(1)
        print(result.hex())
        sys.exit(0)

    try:
        ok = check_parity(body, args.parity_bits)
    except ValueError as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

    print("true" if ok else "false")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
