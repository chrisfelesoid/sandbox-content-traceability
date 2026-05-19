from itertools import groupby


def _group_keys(records: list[dict]) -> list[str]:
    if not records:
        return []
    first = records[0]
    if "transformation" in first:
        return ["tool", "transformation"]
    elif "scenario" in first:
        return ["tool", "file", "scenario", "detect_speed"]
    else:
        return ["tool", "file"]


def compute_summary(records: list[dict]) -> list[dict]:
    if not records:
        return []

    key_fields = _group_keys(records)
    includes_file = "file" in key_fields

    def sort_key(r: dict) -> tuple:
        return tuple(str(r.get(k, "")) for k in key_fields)

    def group_fn(r: dict) -> tuple:
        return tuple(r.get(k) for k in key_fields)

    sorted_records = sorted(records, key=sort_key)
    summaries = []

    for key, group_iter in groupby(sorted_records, key=group_fn):
        group = list(group_iter)
        entry: dict = dict(zip(key_fields, key))

        if includes_file:
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

            entry.update(
                {
                    "survival_iterations": survival,
                    "first_failure_iteration": first_failure,
                    "mean_score": mean_score,
                }
            )
        else:
            successful_r = [r for r in group if r.get("status")]
            scores = [r["score"] for r in successful_r if r.get("score") is not None]
            mean_score = sum(scores) / len(scores) if scores else None

            entry.update(
                {
                    "success_count": len(successful_r),
                    "total_count": len(group),
                    "mean_score": mean_score,
                }
            )

        summaries.append(entry)

    return summaries
