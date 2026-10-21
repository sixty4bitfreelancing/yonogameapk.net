"""Import the supplied app collection (DOCX + image set) into typed site data.

Usage:
    python scripts/import_collection.py [--docx PATH] [--images DIR_OR_ZIP]

Re-running is safe: every output is regenerated deterministically and keyed by a
stable slug, so entries are never duplicated. Manual research belongs in
src/data/app-overrides.ts, which this script never touches.

Requires Python 3.10+. Pillow is optional; without it images are copied unresized.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import shutil
import sys
import tempfile
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    Image = None

ROOT = Path(__file__).resolve().parent.parent
RULES_PATH = ROOT / "scripts" / "import-rules.json"
OUT_TS = ROOT / "src" / "data" / "imported-apps.generated.ts"
OUT_CONTENT = ROOT / "src" / "data" / "app-content.generated.ts"
OUT_IMAGE_MAP = ROOT / "src" / "data" / "image-map.json"
OUT_IMAGES = ROOT / "public" / "images" / "apps"
OUT_BANNERS = ROOT / "public" / "images" / "banners"
BANNERS_SRC = ROOT / "source-assets" / "app-banners"
MAX_BANNER_WIDTH = 1600
OUT_REPORT = ROOT / "docs" / "import-report.md"
OUT_CSV = ROOT / "docs" / "app-inventory.csv"

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
REL = "{http://schemas.openxmlformats.org/package/2006/relationships}"
IMAGE_EXTS = {".webp", ".png", ".jpg", ".jpeg", ".gif", ".avif", ".ico"}
MAX_IMAGE_SIDE = 256

CATEGORY_PATTERNS = [
    ("rummy", "is a rummy-labelled name"),
    ("slots", "is a slots-labelled name"),
    ("spin", "is a spin-themed label"),
    ("bingo", "is a bingo-labelled name"),
    ("collection", "reads as a collection or directory label"),
    ("general", "is a game or app label"),
]


# --------------------------------------------------------------------------- helpers


def norm_key(value: str) -> str:
    """Matching key: case-insensitive, ignoring spaces, underscores and hyphens."""
    return re.sub(r"[\s_\-]+", "", value.strip().lower())


def image_key(stem: str) -> str:
    key = norm_key(stem)
    if re.search(r"[\s_\-]logo$", stem.strip(), re.IGNORECASE):
        key = key[: -len("logo")]
    return key


def slugify(value: str) -> str:
    return re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9]+", "-", value.lower())).strip("-")


def tokens(value: str) -> list[str]:
    return [t for t in re.split(r"[^a-z0-9]+", value.lower()) if t]


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_if_changed(path: Path, data: bytes) -> bool:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.read_bytes() == data:
        return False
    path.write_bytes(data)
    return True


def rel(path: Path) -> str:
    try:
        return path.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


# --------------------------------------------------------------------------- inputs


def resolve_images(arg: str | None, tmp: Path) -> tuple[Path, str]:
    candidates = [Path(arg)] if arg else [
        ROOT / "source-assets" / "app-images",
        ROOT / "allnewyonoapps-images",
        ROOT / "allnewyonoapps-images.zip",
        ROOT.parent / "yonogames img" / "allnewyonoapps-images.zip",
    ]
    for cand in candidates:
        if cand.is_dir():
            return cand, f"directory {rel(cand)}"
        if cand.is_file() and cand.suffix.lower() == ".zip":
            return safe_extract(cand, tmp), f"zip archive {rel(cand)}"
    sys.exit(f"Image source not found. Tried: {', '.join(str(c) for c in candidates)}")


def safe_extract(archive: Path, dest: Path) -> Path:
    dest = dest / "images"
    dest.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as zf:
        for info in zf.infolist():
            if info.is_dir():
                continue
            name = Path(info.filename).name
            target = (dest / name).resolve()
            if target.parent != dest.resolve() or name.startswith("."):
                print(f"  skipping unsafe zip entry: {info.filename}")
                continue
            if Path(name).suffix.lower() not in IMAGE_EXTS:
                print(f"  skipping non-image zip entry: {info.filename}")
                continue
            target.write_bytes(zf.read(info))
    return dest


def parse_docx(path: Path) -> dict:
    with zipfile.ZipFile(path) as zf:
        document = zf.read("word/document.xml")
        rels_xml = zf.read("word/_rels/document.xml.rels")
        core = zf.read("docProps/core.xml").decode("utf8") if "docProps/core.xml" in zf.namelist() else ""

    rels = {
        r.get("Id"): {"target": r.get("Target"), "mode": r.get("TargetMode"), "type": r.get("Type", "").rsplit("/", 1)[-1]}
        for r in ET.fromstring(rels_xml).iter(REL + "Relationship")
    }
    root = ET.fromstring(document)
    body = root.find(W + "body")

    paragraphs: list[dict] = []
    hyperlinks: list[dict] = []
    tables = 0
    for el in body:
        tag = el.tag.replace(W, "")
        if tag == "tbl":
            tables += 1
            for p in el.iter(W + "p"):
                paragraphs.append(paragraph_record(p, rels, hyperlinks, in_table=True))
        elif tag == "p":
            paragraphs.append(paragraph_record(el, rels, hyperlinks, in_table=False))

    instr = "".join(t.text or "" for t in root.iter(W + "instrText"))
    for m in re.finditer(r'HYPERLINK\s+"([^"]+)"', instr):
        hyperlinks.append({"target": m.group(1), "text": None, "via": "field code"})

    created = re.search(r"<dcterms:created[^>]*>([^<]+)<", core)
    return {
        "paragraphs": [p for p in paragraphs if p["text"].strip()],
        "hyperlinks": hyperlinks,
        "relationships": rels,
        "tables": tables,
        "created": created.group(1) if created else None,
        "sha256": sha256(path.read_bytes()),
    }


def paragraph_record(p, rels: dict, hyperlinks: list, in_table: bool) -> dict:
    style_el = p.find(f"{W}pPr/{W}pStyle")
    text = "".join(t.text or "" for t in p.iter(W + "t"))
    for h in p.iter(W + "hyperlink"):
        rid = h.get(R + "id")
        anchor = h.get(W + "anchor")
        target = rels.get(rid, {}).get("target") if rid else f"#{anchor}"
        hyperlinks.append({"target": target, "text": "".join(t.text or "" for t in h.iter(W + "t")), "via": "w:hyperlink"})
    return {"style": style_el.get(W + "val") if style_el is not None else "", "text": text, "table": in_table}


def split_document(doc: dict) -> dict:
    entries: list[dict] = []
    intro: dict[str, list[str]] = defaultdict(list)
    current_h1 = None
    entry = None
    section = None
    for p in doc["paragraphs"]:
        style, text = p["style"], p["text"].strip()
        if style == "Heading1":
            m = re.match(r"^(\d{3})\s+(.+)$", text)
            if m:
                entry = {"number": m.group(1), "label": m.group(2).strip(), "sections": {}}
                entries.append(entry)
                current_h1 = None
            else:
                entry = None
                current_h1 = text
            section = None
            continue
        if entry is not None:
            if style == "Heading2":
                section = text
                entry["sections"][section] = ""
            elif section:
                entry["sections"][section] = (entry["sections"][section] + " " + text).strip()
        elif current_h1:
            intro[current_h1].append(text)
    return {"entries": entries, "intro": intro}


# --------------------------------------------------------------------------- reconciliation


HOW_TO_SECTIONS = ("How to play", "How to get started", "How to use it")
UNDERSTANDING_SECTIONS = ("Understanding play", "Understanding results", "Playing guidance", "Understanding the mode", "Choosing a mode")


def pick_section(sections: dict, names: tuple[str, ...]) -> tuple[str | None, str | None]:
    for name in names:
        if sections.get(name):
            return name, sections[name]
    return None, None


def parse_faqs(text: str | None) -> list[dict]:
    """Split the document's run-on FAQ paragraph into question/answer pairs."""
    if not text:
        return []
    sentences = re.split(r"(?<=[.?!])\s+(?=[A-Z0-9“\"])", text.strip())
    faqs: list[dict] = []
    for sentence in sentences:
        if sentence.endswith("?"):
            faqs.append({"question": sentence, "answer": ""})
        elif faqs:
            faqs[-1]["answer"] = (faqs[-1]["answer"] + " " + sentence).strip()
    return [f for f in faqs if f["answer"]]


def entry_content(entry: dict, label: str, name: str) -> dict:
    sections = entry["sections"]
    how_heading, how_to = pick_section(sections, HOW_TO_SECTIONS)
    und_heading, understanding = pick_section(sections, UNDERSTANDING_SECTIONS)

    def fix(text):
        return text.replace(label, name) if text and label != name else text

    return {
        "documentEntry": entry["number"],
        "whatIsIt": fix(sections.get("What is it")),
        "clarification": fix(sections.get("Name specific clarification")),
        "howToSection": how_heading,
        "howTo": fix(how_to),
        "features": fix(sections.get("Features to check")),
        "understandingSection": und_heading,
        "understanding": fix(understanding),
        "faqs": [{"question": fix(f["question"]), "answer": fix(f["answer"])} for f in parse_faqs(sections.get("FAQs"))],
        "similarNames": [],
    }


def classify(entry: dict) -> tuple[str, str]:
    what = entry["sections"].get("What is it", "")
    for category, phrase in CATEGORY_PATTERNS:
        if phrase in what:
            return category, phrase
    return "general", "(no category phrase found)"


def build(doc_path: Path, images_dir: Path, images_desc: str, rules: dict, banners_dir: Path | None) -> None:
    doc = parse_docx(doc_path)
    parts = split_document(doc)
    entries = parts["entries"]
    if not entries:
        sys.exit("No numbered entries were found in the DOCX; nothing imported.")

    image_files = sorted(
        (p for p in images_dir.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS),
        key=lambda p: p.name.lower(),
    )
    utility = rules.get("utilityAssets", {})
    rejected = rules.get("rejectedImages", {})
    overrides = rules.get("imageOverrides", {})
    display_names = rules.get("displayNames", {})
    alias_rules = rules.get("aliases", {})
    excluded_categories = rules.get("excludedCategories", {})
    image_set = rules.get("imageSet", {})
    alt_template = image_set.get("altTemplate", "{name} app icon")

    banner_files = sorted(
        (p for p in banners_dir.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS),
        key=lambda p: p.name.lower(),
    ) if banners_dir and banners_dir.is_dir() else []
    banner_by_key = {image_key(p.stem): p for p in banner_files}
    used_banners: set[str] = set()

    image_hash = {p.name: sha256(p.read_bytes()) for p in image_files}
    by_key: dict[str, list[Path]] = defaultdict(list)
    for p in image_files:
        if p.name in utility:
            continue
        by_key[image_key(p.stem)].append(p)

    # Images whose bytes are shared by several files cannot identify one app.
    hash_groups: dict[str, list[str]] = defaultdict(list)
    for name, digest in image_hash.items():
        if name not in utility:
            hash_groups[digest].append(name)
    shared_images = {n: grp for grp in hash_groups.values() if len(grp) > 1 for n in grp}

    records: list[dict] = []
    contents: dict[str, dict] = {}
    image_map: dict[str, dict] = {}
    used_images: set[str] = set()
    slugs_seen: dict[str, str] = {}
    multi_candidates: list[tuple[str, list[str]]] = []

    for entry in entries:
        label = entry["label"]
        rule = display_names.get(label)
        name = rule["name"] if rule else label
        slug = slugify(name)
        if slug in slugs_seen:
            sys.exit(f"Slug collision: '{name}' and '{slugs_seen[slug]}' both map to '{slug}'. Add a displayNames rule.")
        slugs_seen[slug] = name

        category, phrase = classify(entry)
        doc_ref = f"{doc_path.name}, entry {entry['number']} “{label}”"

        # ---- image matching
        image_file, image_status, image_note, match_method = None, "missing", None, None
        if label in overrides:
            cand = images_dir / overrides[label]["file"]
            if cand.exists():
                image_file, image_status, match_method = cand, "matched-manual", "manual rule"
                image_note = overrides[label]["reason"]
        else:
            cands = by_key.get(norm_key(label), [])
            if len(cands) > 1:
                multi_candidates.append((label, [c.name for c in cands]))
            if cands:
                image_file, image_status, match_method = cands[0], "matched", "normalised name"
        if image_file is not None:
            used_images.add(image_file.name)
            if image_file.name in rejected:
                image_status, image_note = "rejected", rejected[image_file.name]
            elif image_file.name in shared_images:
                others = [n for n in shared_images[image_file.name] if n != image_file.name]
                image_status = "rejected"
                image_note = f"Identical file bytes to {', '.join(others)}; a shared generic icon cannot identify this app."

        aliases = []
        if norm_key(label) != norm_key(name):
            aliases.append(label)
        for extra in alias_rules.get(label, {}).get("aliases", []):
            if extra not in aliases:
                aliases.append(extra)
        if image_file is not None and image_status != "rejected":
            known = {norm_key(name), norm_key(label)}
            if image_key(image_file.stem) not in known:
                aliases.append(re.sub(r"[-_]+", " ", image_file.stem).strip())

        exclusion = excluded_categories.get(category)
        image = None
        provenance: dict[str, dict] = {
            "name": {"origin": "supplied-document", "reference": f"{doc_ref}, entry heading"
                     + (f"; displayed as “{name}” ({rule['reason']})" if rule else "")},
            "category": {"origin": "supplied-document", "reference": f"{doc_ref}, “What is it” section",
                         "note": "Category is inferred from the wording of the name, as the document states; not a confirmed catalogue."},
        }
        if image_file is not None and image_status in {"matched", "matched-manual"} and not exclusion:
            out_name, dims = process_image(image_file, slug)
            image = {"src": f"/images/apps/{out_name}", "width": dims[0], "height": dims[1],
                     "alt": alt_template.format(name=name)}
            provenance["image"] = {"origin": "local-image", "reference": f"{images_desc}: {image_file.name}",
                                   "note": " ".join(filter(None, [image_set.get("provenanceNote"),
                                                                  f"Matched by {match_method}."]))}
            image_map[slug] = {
                "sourceFile": image_file.name,
                "sourceSha256": image_hash[image_file.name],
                "output": image["src"],
                "width": dims[0],
                "height": dims[1],
                "matchMethod": match_method,
            }
        banner = None
        banner_file = banner_by_key.get(norm_key(label))
        if banner_file is not None:
            used_banners.add(banner_file.name)
            if not exclusion:
                out_name, dims = process_banner(banner_file, slug)
                banner = {"src": f"/images/banners/{out_name}", "width": dims[0], "height": dims[1],
                          "alt": f"{name} APK banner"}
                provenance["banner"] = {"origin": "local-image", "reference": f"{rel(banners_dir)}: {banner_file.name}",
                                        "note": "Yono Game APK banner showing the app name; not official app artwork."}

        contents[slug] = entry_content(entry, label, name)
        clarification = contents[slug]["clarification"]
        notes = [clarification] if clarification else []
        if notes:
            provenance["notes"] = {"origin": "supplied-document", "reference": f"{doc_ref}, “Name specific clarification” section"}
        if aliases:
            provenance["aliases"] = {"origin": "supplied-document" if label in aliases else "local-image",
                                     "reference": f"{doc_ref} / image filename"}

        records.append({
            "id": slug,
            "slug": slug,
            "name": name,
            "aliases": aliases,
            "category": category,
            "image": image,
            "banner": banner,
            "summary": None,
            "developer": None,
            "sourceUrl": None,
            "downloadUrl": None,
            "version": None,
            "addedAt": None,
            "checkedAt": None,
            "screenshots": [],
            "notes": notes,
            "publicationStatus": "excluded" if exclusion else "listed",
            "provenance": provenance,
            "importRecord": {
                "documentEntry": entry["number"],
                "documentLabel": label,
                "categoryEvidence": phrase,
                "imageFile": image_file.name if image_file is not None else None,
                "imageStatus": image_status,
                "imageNote": image_note,
                "exclusionReason": exclusion,
            },
        })

    prune_images({r["image"]["src"].rsplit("/", 1)[-1] for r in records if r["image"]})
    prune_dir(OUT_BANNERS, {r["banner"]["src"].rsplit("/", 1)[-1] for r in records if r["banner"]})
    unmatched_banners = [p.name for p in banner_files if p.name not in used_banners]

    unmatched_images = [p.name for p in image_files if p.name not in used_images and p.name not in utility]
    similar = similar_names([r["name"] for r in records])
    duplicate_hashes = [grp for grp in hash_groups.values() if len(grp) > 1]
    slug_of = {r["name"]: r["slug"] for r in records}
    for a, b, why in similar:
        contents[slug_of[a]]["similarNames"].append({"name": b, "slug": slug_of[b], "reason": why})
        contents[slug_of[b]]["similarNames"].append({"name": a, "slug": slug_of[a], "reason": why})

    write_ts(records)
    write_content_ts(contents)
    write_if_changed(OUT_IMAGE_MAP, (json.dumps(image_map, indent=2, ensure_ascii=False) + "\n").encode("utf8"))
    write_csv(records)
    write_report(doc_path, doc, parts, images_desc, image_files, records, utility, unmatched_images,
                 similar, duplicate_hashes, multi_candidates, rules, banner_files, unmatched_banners)

    listed = sum(r["publicationStatus"] == "listed" for r in records)
    print(f"Entries imported: {len(records)} (listed {listed}, excluded {len(records) - listed})")
    print(f"Images: {len(image_files)} files, {len(image_map)} used as app icons")
    print(f"Wrote {rel(OUT_TS)}, {rel(OUT_IMAGE_MAP)}, {rel(OUT_REPORT)}, {rel(OUT_CSV)}")


def process_image(src: Path, slug: str) -> tuple[str, tuple[int, int]]:
    """Writes <slug>-<content hash>.webp so a changed image always gets a new, uncached URL."""
    if Image is None:
        data = src.read_bytes()
        out_name = f"{slug}-{sha256(data)[:8]}{src.suffix.lower()}"
        write_if_changed(OUT_IMAGES / out_name, data)
        return out_name, (0, 0)
    with Image.open(src) as im:
        im = im.convert("RGBA")
        if max(im.size) > MAX_IMAGE_SIDE:
            im.thumbnail((MAX_IMAGE_SIDE, MAX_IMAGE_SIDE), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=85, method=6)
        data = buf.getvalue()
        out_name = f"{slug}-{sha256(data)[:8]}.webp"
        write_if_changed(OUT_IMAGES / out_name, data)
        return out_name, im.size


def process_banner(src: Path, slug: str) -> tuple[str, tuple[int, int]]:
    """Resizes a banner to at most MAX_BANNER_WIDTH wide and writes <slug>-<content hash>.webp."""
    if Image is None:
        data = src.read_bytes()
        out_name = f"{slug}-{sha256(data)[:8]}{src.suffix.lower()}"
        write_if_changed(OUT_BANNERS / out_name, data)
        return out_name, (0, 0)
    with Image.open(src) as im:
        im = im.convert("RGB")
        if im.width > MAX_BANNER_WIDTH:
            im = im.resize((MAX_BANNER_WIDTH, round(im.height * MAX_BANNER_WIDTH / im.width)), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=80, method=6)
        data = buf.getvalue()
        out_name = f"{slug}-{sha256(data)[:8]}.webp"
        write_if_changed(OUT_BANNERS / out_name, data)
        return out_name, im.size


def prune_dir(directory: Path, keep: set[str]) -> None:
    if not directory.exists():
        return
    for p in directory.iterdir():
        if p.is_file() and p.name not in keep:
            p.unlink()


def prune_images(keep: set[str]) -> None:
    prune_dir(OUT_IMAGES, keep)


def one_edit_apart(a: str, b: str) -> bool:
    """True when two strings differ by exactly one substitution, insertion or deletion."""
    if a == b or abs(len(a) - len(b)) > 1:
        return False
    if len(a) == len(b):
        return sum(x != y for x, y in zip(a, b)) == 1
    short, long_ = (a, b) if len(a) < len(b) else (b, a)
    return any(long_[:i] + long_[i + 1:] == short for i in range(len(long_)))


def similar_names(names: list[str]) -> list[tuple[str, str, str]]:
    found = []
    for i, a in enumerate(names):
        ta = tokens(a)
        for b in names[i + 1:]:
            tb = tokens(b)
            ka, kb = norm_key(a), norm_key(b)
            if ka == kb:
                found.append((a, b, "identical after normalisation"))
            elif min(len(ka), len(kb)) >= 6 and one_edit_apart(ka, kb) and ka.rstrip("s") != kb.rstrip("s"):
                found.append((a, b, "differs by one letter"))
            elif sorted(ta) == sorted(tb):
                found.append((a, b, "same words in a different order"))
            elif [t.rstrip("s") for t in ta] == [t.rstrip("s") for t in tb]:
                found.append((a, b, "singular/plural variant"))
            elif abs(len(ta) - len(tb)) == 1 and (set(ta) < set(tb) or set(tb) < set(ta)):
                found.append((a, b, "one name adds a single word to the other"))
    return found


# --------------------------------------------------------------------------- outputs


def write_ts(records: list[dict]) -> None:
    body = json.dumps(records, indent=2, ensure_ascii=False)
    ts = (
        "// Generated by scripts/import_collection.py. Do not edit by hand: manual research belongs in app-overrides.ts.\n"
        'import type { ImportedApp } from "./types";\n\n'
        f"export const importedApps: ImportedApp[] = {body};\n"
    )
    write_if_changed(OUT_TS, ts.encode("utf8"))


def write_content_ts(contents: dict[str, dict]) -> None:
    body = json.dumps(contents, indent=2, ensure_ascii=False)
    ts = (
        "// Generated by scripts/import_collection.py from the supplied DOCX. Do not edit by hand.\n"
        'import type { AppDocContent } from "./types";\n\n'
        f"export const appContent: Record<string, AppDocContent> = {body};\n"
    )
    write_if_changed(OUT_CONTENT, ts.encode("utf8"))


def write_csv(records: list[dict]) -> None:
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n")
    w.writerow(["entry", "document_label", "name", "slug", "category", "image_file", "image_status",
                "image_note", "aliases", "publication_status", "detail_page", "download_url", "checked_at",
                "exclusion_reason"])
    for r in records:
        ir = r["importRecord"]
        w.writerow([ir["documentEntry"], ir["documentLabel"], r["name"], r["slug"], r["category"],
                    ir["imageFile"] or "", ir["imageStatus"], ir["imageNote"] or "", "; ".join(r["aliases"]),
                    r["publicationStatus"], "no", r["downloadUrl"] or "", r["checkedAt"] or "",
                    ir["exclusionReason"] or ""])
    write_if_changed(OUT_CSV, buf.getvalue().encode("utf-8-sig"))


def write_report(doc_path, doc, parts, images_desc, image_files, records, utility, unmatched_images,
                 similar, duplicate_hashes, multi_candidates, rules, banner_files, unmatched_banners) -> None:
    by_status = defaultdict(list)
    for r in records:
        by_status[r["importRecord"]["imageStatus"]].append(r)
    cats = defaultdict(lambda: {"listed": 0, "excluded": 0})
    for r in records:
        cats[r["category"]][r["publicationStatus"]] += 1
    listed = [r for r in records if r["publicationStatus"] == "listed"]
    urls = sorted({u for p in doc["paragraphs"] for u in re.findall(r"https?://\S+", p["text"])})
    external_rels = [v for v in doc["relationships"].values() if v["mode"] == "External"]

    L: list[str] = []
    a = L.append
    a("# Import report")
    a("")
    a("Generated by `scripts/import_collection.py`. Re-running the script regenerates this file.")
    a("")
    a("## Inputs")
    a("")
    a(f"- Document: `{doc_path.name}` (SHA-256 `{doc['sha256'][:16]}…`, created {doc['created'] or 'unknown'})")
    a(f"- Images: {images_desc} — {len(image_files)} files")
    if rules.get("imageSet", {}).get("description"):
        a(f"- Image set: {rules['imageSet']['description']}")
    a(f"- Document structure: {len(doc['paragraphs'])} non-empty paragraphs, {doc['tables']} tables, "
      f"{len(parts['entries'])} numbered entries")
    a("")
    a("The document describes itself as unverified: product identity, publisher, download links, bonuses and "
      "certifications are not authenticated, and categories are inferred from names. Its per-entry text is "
      "templated guidance rather than product facts, so no summary, developer, version or date was imported.")
    a("")
    a("## Summary")
    a("")
    a("| Measure | Count |")
    a("| --- | ---: |")
    a(f"| Document entries | {len(records)} |")
    a(f"| Image files supplied | {len(image_files)} |")
    a(f"| Utility / third-party identity assets excluded | {len(utility)} |")
    a(f"| Entries matched to an image file (any method) | {sum(1 for r in records if r['importRecord']['imageFile'])} |")
    a(f"| …of which matched by a manual rule | {sum(1 for r in records if r['importRecord']['documentLabel'] in rules.get('imageOverrides', {}))} |")
    a(f"| Matched images held back (wrong artwork or shared file) | {len(by_status['rejected'])} |")
    a(f"| Listed entries using a local icon | {sum(1 for r in listed if r['image'])} |")
    a(f"| Listed entries shown with a neutral placeholder | {sum(1 for r in listed if not r['image'])} |")
    a(f"| Images without a matching entry | {len(unmatched_images)} |")
    a(f"| Banner files supplied | {len(banner_files)} |")
    a(f"| Listed entries with a page banner | {sum(1 for r in listed if r['banner'])} |")
    a(f"| Banners without a matching entry | {len(unmatched_banners)} |")
    a(f"| Exact duplicate entries | {sum(1 for s in similar if s[2] == 'identical after normalisation')} |")
    a(f"| Similar-name pairs kept separate | {sum(1 for s in similar if s[2] != 'identical after normalisation')} |")
    a(f"| Directory listings (public) | {len(listed)} |")
    a(f"| Excluded from the public directory | {len(records) - len(listed)} |")
    a(f"| App pages (one per listed entry) | {len(listed)} |")
    a("")
    a("## Hyperlinks")
    a("")
    a(f"- `w:hyperlink` elements: {sum(1 for h in doc['hyperlinks'] if h['via'] == 'w:hyperlink')}")
    a(f"- HYPERLINK field codes: {sum(1 for h in doc['hyperlinks'] if h['via'] == 'field code')}")
    a(f"- External relationships in `document.xml.rels`: {len(external_rels)}")
    a("")
    a("The document contains no hyperlink targets. These URLs appear as plain text in its *Source notes* "
      "section; the document describes them as background or third-party discovery context, so none were "
      "imported as an app source or download destination:")
    a("")
    for u in urls:
        a(f"- {u}")
    a("")
    a("No entry has a download URL. Download buttons stay disabled site-wide until one is added and checked.")
    a("")
    a("## Category assignment")
    a("")
    a("| Category | Listed | Excluded | Evidence |")
    a("| --- | ---: | ---: | --- |")
    for cat, phrase in CATEGORY_PATTERNS:
        if cat in cats:
            a(f"| {cat} | {cats[cat]['listed']} | {cats[cat]['excluded']} | “{phrase}” |")
    a("")
    a("## Excluded and unresolved records")
    a("")
    for line in parts["intro"].get("Coverage and exclusions", []):
        a(f"- Document: {line}")
    for name, reason in sorted(utility.items(), key=lambda kv: kv[0].lower()):
        a(f"- Image `{name}`: {reason}")
    for r in records:
        if r["publicationStatus"] == "excluded":
            a(f"- Entry {r['importRecord']['documentEntry']} **{r['name']}**: {r['importRecord']['exclusionReason']}")
    a("")
    a("## Name and image conflicts")
    a("")
    for label, rule in rules.get("displayNames", {}).items():
        if norm_key(label) != norm_key(rule["name"]):
            a(f"- **{label} → {rule['name']}**: {rule['reason']}")
    for label, rule in rules.get("aliases", {}).items():
        a(f"- **{label}** (also listed as {', '.join(rule['aliases'])}): {rule['reason']}")
    coverage = " ".join(parts["intro"].get("Coverage and exclusions", []))
    for name in utility:
        stem = Path(name).stem
        if stem.isdigit() and stem not in coverage:
            listed_numbers = sorted(set(re.findall(r"\b\d{5,}\b", coverage)))
            a(f"- Numeric image `{name}` does not match the document's unresolved record(s) "
              f"{', '.join(f'`{n}`' for n in listed_numbers) or '(none)'}. Excluded either way: {utility[name]}")
    for r in by_status["rejected"]:
        a(f"- **{r['name']}** (`{r['importRecord']['imageFile']}`): {r['importRecord']['imageNote']}")
    for label, files in multi_candidates:
        a(f"- **{label}** matched several images: {', '.join(files)}; the first was used.")
    a("")
    a("## Listed entries without a usable icon")
    a("")
    for r in listed:
        if not r["image"]:
            status = r["importRecord"]["imageStatus"]
            a(f"- {r['name']} — {'no image file supplied' if status == 'missing' else 'image held back (see conflicts)'}")
    a("")
    a("## Images without a matching entry")
    a("")
    if unmatched_images:
        for n in unmatched_images:
            a(f"- `{n}`")
    else:
        a("None. Every non-utility image matched a document entry.")
    a("")
    a("## Page banners")
    a("")
    missing_banners = [r["name"] for r in listed if not r["banner"]]
    a(f"- Listed entries without a banner: {', '.join(missing_banners) if missing_banners else 'none'}")
    a(f"- Banner files without a matching entry: {', '.join(f'`{n}`' for n in unmatched_banners) if unmatched_banners else 'none'}")
    a("")
    a("## Duplicate files and similar names")
    a("")
    for grp in duplicate_hashes:
        a(f"- Byte-identical images: {', '.join(f'`{n}`' for n in grp)}")
    a("")
    a("Similar names below are kept as separate entries because nothing in the inputs shows they are the same app:")
    a("")
    for x, y, why in similar:
        a(f"- {x} / {y} — {why}")
    a("")
    a("## Missing information requiring manual research")
    a("")
    a("Every entry lacks the following fields; none were present in the supplied document:")
    a("")
    for field in ("summary", "developer", "sourceUrl", "downloadUrl", "version", "addedAt", "checkedAt", "screenshots"):
        missing = sum(1 for r in records if not r[field])
        a(f"- `{field}`: missing for {missing} of {len(records)} entries")
    a("")
    a("## Publication decisions")
    a("")
    a(f"- {len(listed)} entries appear as basic listings on the homepage directory and, where applicable, the rummy and slots category pages.")
    a(f"- {len(listed)} app pages are published and indexable (owner decision, 21 October 2026), built from each entry's "
      "document text plus general installation and safety guidance. Every page states that the app has not been "
      "independently checked. Developer, version and download details appear only after an independent check "
      "(`checkedAt` plus a developer or source URL; see README).")
    a("- `/new-yono-games/` stays unpublished: no entry has a genuine `addedAt` date.")
    a("- Spin, bingo and other entries are filterable on the homepage but have no category page.")
    a("")
    write_if_changed(OUT_REPORT, ("\n".join(L)).encode("utf8"))


# --------------------------------------------------------------------------- main


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--docx", default=str(ROOT / "complete_game_app_collection.docx"))
    parser.add_argument("--images", default=None, help="Image directory or ZIP archive")
    parser.add_argument("--banners", default=str(BANNERS_SRC), help="Directory of 16:9 page banners named like the images")
    args = parser.parse_args()

    doc_path = Path(args.docx)
    if not doc_path.is_file():
        sys.exit(f"DOCX not found: {doc_path}")
    if Image is None:
        print("Pillow not installed: images will be copied without resizing (pip install pillow).")
    rules = json.loads(RULES_PATH.read_text(encoding="utf8"))
    tmp = Path(tempfile.mkdtemp(prefix="yono-import-"))
    try:
        images_dir, images_desc = resolve_images(args.images, tmp)
        build(doc_path, images_dir, images_desc, rules, Path(args.banners))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
