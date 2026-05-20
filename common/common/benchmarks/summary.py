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
    has_scenario_key = "scenario" in key_fields

    def sort_key(r: dict) -> tuple:
        return tuple(str(r.get(k, "")) for k in key_fields)

    def group_fn(r: dict) -> tuple:
        return tuple(r.get(k) for k in key_fields)

    sorted_records = sorted(records, key=sort_key)
    summaries = []

    for key, group_iter in groupby(sorted_records, key=group_fn):
        group = list(group_iter)
        entry: dict = dict(zip(key_fields, key))

        use_iteration_metrics = has_scenario_key or "iteration" in group[0]

        if includes_file and use_iteration_metrics:
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

            if "remaining_ms" in group[0]:
                if first_failure is not None:
                    ffr = [r for idx, r in indexed if idx == first_failure]
                    ffr_ms = ffr[0].get("remaining_ms") if ffr else None
                else:
                    ffr_ms = None
                entry["first_failure_remaining_ms"] = ffr_ms
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
