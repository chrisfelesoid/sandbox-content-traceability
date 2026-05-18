def compute_summary(records: list[dict]) -> list[dict]:
    summary = []
    successful = [r for r in records if r["status"]]
    failed = [r for r in records if not r["status"]]
    tool = records[0]["tool"] if records else ""
    file = records[0]["file"] if records else ""

    survival = max((r["iteration"] for r in successful), default=0)
    first_failure = min((r["iteration"] for r in failed), default=None)
    scores = [r["score"] for r in successful if r.get("score") is not None]
    mean_score = sum(scores) / len(scores) if scores else None

    summary.append(
        {
            "tool": tool,
            "file": file,
            "survival_iterations": survival,
            "first_failure_iteration": first_failure,
            "mean_score": mean_score,
        }
    )

    return summary
