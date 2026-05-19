from itertools import groupby


def compute_summary(records: list[dict]) -> list[dict]:
    if not records:
        return []

    def sort_key(r: dict) -> tuple:
        return (
            r.get("tool", ""),
            r.get("file", ""),
            r.get("scenario", ""),
            str(r.get("detect_speed", "")),
        )

    def group_key(r: dict) -> tuple:
        return (
            r.get("tool", ""),
            r.get("file", ""),
            r.get("scenario", ""),
            r.get("detect_speed"),
        )

    sorted_records = sorted(records, key=sort_key)
    summaries = []

    for key, group_iter in groupby(sorted_records, key=group_key):
        tool, file, scenario, detect_speed = key
        group = list(group_iter)

        if "iteration" in group[0]:
            indexed = [(r["iteration"], r) for r in group]
        else:
            indexed = [(i + 1, r) for i, r in enumerate(group)]

        successful = [(idx, r) for idx, r in indexed if r.get("status")]
        failed = [(idx, r) for idx, r in indexed if not r.get("status")]

        survival = max((idx for idx, _ in successful), default=0)
        first_failure = min((idx for idx, _ in failed), default=None)
        scores = [r["score"] for _, r in successful if r.get("score") is not None]
        mean_score = sum(scores) / len(scores) if scores else None

        entry: dict = {
            "tool": tool,
            "file": file,
            "survival_iterations": survival,
            "first_failure_iteration": first_failure,
            "mean_score": mean_score,
        }
        if scenario:
            entry["scenario"] = scenario
        if detect_speed is not None:
            entry["detect_speed"] = detect_speed

        summaries.append(entry)

    return summaries
