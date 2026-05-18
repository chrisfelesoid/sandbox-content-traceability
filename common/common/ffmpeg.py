import subprocess
from pathlib import Path


def ffmpeg(cwd: Path, *args: str) -> None:
    return subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", *args],
        cwd=cwd,
        check=True,
    )
