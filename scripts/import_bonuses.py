"""Import sign-up bonus and minimum-withdrawal claims from game-bonuses.xlsx.

Usage: python scripts/import_bonuses.py [--xlsx PATH]

Requires openpyxl (pip install openpyxl). Re-running regenerates the outputs; nothing is appended.
Outputs:
  src/data/bonuses.generated.ts  - claims keyed by app slug
  docs/bonus-import-report.md    - matches, unmatched rows and skipped rows
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit("openpyxl is required: pip install openpyxl")

ROOT = Path(__file__).resolve().parent.parent
RULES = ROOT / "scripts" / "bonus-rules.json"
APPS_TS = ROOT / "src" / "data" / "imported-apps.generated.ts"
OUT_TS = ROOT / "src" / "data" / "bonuses.generated.ts"
OUT_REPORT = ROOT / "docs" / "bonus-import-report.md"


def key(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def load_apps() -> list[dict]:
    text = APPS_TS.read_text(encoding="utf8")
    return json.loads(text[text.index("= [") + 2 : text.rindex("]") + 1])


def number(value) -> float | None:
    if value is None or str(value).strip() == "":
        return None
    return float(str(value).replace(",", "").replace("₹", "").strip())


def parse_sheet(path: Path) -> tuple[str, str, list[dict]]:
    """Columns are found by header name. Required: Game. Optional: Sign-up bonus (INR),
    Minimum withdrawal (INR), Rating, Rating count, Rating source (URL of the page showing the rating)."""
    ws = openpyxl.load_workbook(path, data_only=True).worksheets[0]
    rows = [r for r in ws.iter_rows(values_only=True) if any(c is not None for c in r)]
    source_line = next((str(r[0]) for r in rows if r[0] and str(r[0]).startswith("Source:")), "")
    url = re.search(r"https?://\S+", source_line)
    date = re.search(r"(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})", source_line)
    if not url or not date:
        sys.exit(f"Couldn't read the source URL and check date from: {source_line!r}")
    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    checked = f"{date.group(3)}-{months.index(date.group(2)) + 1:02d}-{int(date.group(1)):02d}"
    header = next(i for i, r in enumerate(rows) if r[0] == "Game")
    columns = {str(c).strip().lower(): i for i, c in enumerate(rows[header]) if c is not None}

    def col(row, *names):
        for name in names:
            if name in columns and columns[name] < len(row):
                return row[columns[name]]
        return None

    data = []
    for r in rows[header + 1 :]:
        if r[0] is None:
            continue
        bonus = number(col(r, "sign-up bonus (inr)", "signup bonus (inr)", "sign-up bonus"))
        withdrawal = number(col(r, "minimum withdrawal (inr)", "minimum withdrawal"))
        rating = number(col(r, "rating"))
        count = number(col(r, "rating count", "ratings count"))
        rating_source = col(r, "rating source")
        data.append({
            "name": str(r[0]).strip(),
            "bonus": int(bonus) if bonus is not None else None,
            "withdrawal": int(withdrawal) if withdrawal is not None else None,
            "rating": rating,
            "count": int(count) if count is not None else None,
            "ratingSource": str(rating_source).strip() if rating_source else None,
        })
    return url.group(0), checked, data


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--xlsx", default=str(ROOT / "game-bonuses.xlsx"))
    args = parser.parse_args()

    rules = json.loads(RULES.read_text(encoding="utf8"))
    source, checked, rows = parse_sheet(Path(args.xlsx))
    apps = load_apps()
    by_key: dict[str, dict] = {}
    for app in apps:
        for name in [app["name"], *app["aliases"]]:
            by_key.setdefault(key(name), app)

    bonuses: dict[str, dict] = {}
    matched, excluded, unmatched, skipped, duplicates, bad_ratings = [], [], [], [], [], []
    for row in rows:
        name, bonus, withdrawal = row["name"], row["bonus"], row["withdrawal"]
        if name in rules["skip"]:
            skipped.append((name, rules["skip"][name]))
            continue
        mapped = rules["nameMap"].get(name)
        app = next((a for a in apps if a["slug"] == mapped["slug"]), None) if mapped else by_key.get(key(name))
        if app is None:
            unmatched.append(name)
            continue
        if app["publicationStatus"] == "excluded":
            excluded.append((name, app["name"]))
            continue
        if app["slug"] in bonuses:
            duplicates.append((name, app["name"]))
            continue
        rating = None
        if row["rating"] is not None:
            source_ok = bool(row["ratingSource"]) and re.match(r"^https?://", row["ratingSource"])
            if not source_ok or not 0 < row["rating"] <= 5:
                bad_ratings.append((name, "rating needs a value from 0-5 and a Rating source URL"))
            else:
                rating = {"value": round(row["rating"], 1), "count": row["count"], "source": row["ratingSource"]}
        bonuses[app["slug"]] = {"signupBonus": bonus, "minWithdrawal": withdrawal, "sheetName": name, "rating": rating}
        matched.append((name, app["name"], bonus, withdrawal, "manual rule" if mapped else "normalised name"))

    payload = {"source": source, "checkedAt": checked, "apps": dict(sorted(bonuses.items()))}
    ts = (
        "// Generated by scripts/import_bonuses.py from game-bonuses.xlsx. Do not edit by hand.\n"
        'import type { BonusData } from "./types";\n\n'
        f"export const bonusData: BonusData = {json.dumps(payload, indent=2, ensure_ascii=False)};\n"
    )
    OUT_TS.write_text(ts, encoding="utf8")

    listed = [a for a in apps if a["publicationStatus"] != "excluded"]
    without = [a["name"] for a in listed if a["slug"] not in bonuses]
    lines = [
        "# Bonus import report",
        "",
        f"Source: {source}, checked {checked}. Figures are that website's claims, not confirmed by the operators or by us.",
        "",
        f"- Spreadsheet rows: {len(rows)}",
        f"- Matched to directory apps: {len(matched)}",
        f"- Rows for excluded collection labels: {len(excluded)}",
        f"- Rows with no directory app: {len(unmatched)}",
        f"- Rows skipped by rule: {len(skipped)}",
        f"- Listed apps without bonus data: {len(without)}",
        f"- Apps with a sourced rating: {sum(1 for b in bonuses.values() if b['rating'])}",        "",
        "## Matched",
        "",
        "| Spreadsheet name | Directory app | Sign-up bonus (₹) | Min. withdrawal (₹) | Match |",
        "| --- | --- | ---: | ---: | --- |",
        *[f"| {n} | {a} | {b} | {w} | {m} |" for n, a, b, w, m in matched],
        "",
        "## Not imported",
        "",
        *[f"- {n}: no matching directory app" for n in unmatched],
        *[f"- {n}: matches excluded collection label '{a}'" for n, a in excluded],
        *[f"- {n}: {why}" for n, why in skipped],
        *[f"- {n}: duplicate of an earlier row for {a}" for n, a in duplicates],
        *[f"- {n}: rating not imported ({why})" for n, why in bad_ratings],
        "",
        "## Listed apps without bonus data",
        "",
        ", ".join(without) if without else "None.",
        "",
    ]
    OUT_REPORT.write_text("\n".join(lines), encoding="utf8")
    print(f"Matched {len(matched)} of {len(rows)} rows; {len(without)} listed apps without data. Wrote {OUT_TS.relative_to(ROOT)} and {OUT_REPORT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
