from pathlib import Path


def validate_io_paths(input_path: Path, output_path: Path) -> None:
    """Raises ValueError if input and output path types are incompatible."""
    input_is_dir = input_path.is_dir()
    if input_is_dir and output_path.exists() and not output_path.is_dir():
        raise ValueError("INPUT is a directory but OUTPUT is an existing file")
    if not input_is_dir and output_path.exists() and output_path.is_dir():
        raise ValueError("INPUT is a file but OUTPUT is a directory")
