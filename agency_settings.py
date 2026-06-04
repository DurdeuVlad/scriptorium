"""
Agency settings — structured controls for word counts, chapters, and subsections.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple


DEFAULT_AGENCY_SETTINGS: Dict[str, Any] = {
    "target_word_count": None,
    "target_chapter_count": None,
    "min_chapters": None,
    "max_chapters": None,
    "max_subsection_depth": 1,
    "target_subsections_per_chapter": None,
    "words_per_chapter": None,
}


def default_agency_settings(domain: str = "technical-docs") -> Dict[str, Any]:
    """Return sensible defaults based on writing mode."""
    d = domain.lower()
    if "book" in d or "creative" in d:
        return {
            **DEFAULT_AGENCY_SETTINGS,
            "target_word_count": 80000,
            "target_chapter_count": 12,
            "min_chapters": 8,
            "max_chapters": 14,
            "max_subsection_depth": 2,
            "target_subsections_per_chapter": 3,
            "words_per_chapter": 6000,
        }
    return {
        **DEFAULT_AGENCY_SETTINGS,
        "target_word_count": 8000,
        "target_chapter_count": 6,
        "min_chapters": 4,
        "max_chapters": 8,
        "max_subsection_depth": 1,
        "target_subsections_per_chapter": None,
        "words_per_chapter": 1200,
    }


def merge_agency_settings(
    existing: Optional[Dict[str, Any]],
    patch: Optional[Dict[str, Any]],
    domain: str = "technical-docs",
) -> Dict[str, Any]:
    base = {**default_agency_settings(domain), **(existing or {})}
    if not patch:
        return base
    for key in DEFAULT_AGENCY_SETTINGS:
        if key in patch and patch[key] is not None:
            val = patch[key]
            if key in (
                "target_word_count",
                "target_chapter_count",
                "min_chapters",
                "max_chapters",
                "max_subsection_depth",
                "target_subsections_per_chapter",
                "words_per_chapter",
            ):
                try:
                    base[key] = int(val)
                except (TypeError, ValueError):
                    pass
            else:
                base[key] = val
    return base


def _section_id(section: Dict[str, Any]) -> str:
    return section.get("id") or section.get("section_id") or ""


def _subsections(section: Dict[str, Any]) -> List[Dict[str, Any]]:
    return list(section.get("subsections") or [])


def count_top_level_sections(outline: Optional[Dict[str, Any]]) -> int:
    if not outline:
        return 0
    return len(outline.get("sections") or [])


def count_all_draft_units(outline: Optional[Dict[str, Any]], max_depth: int = 2) -> int:
    """Count sections that would receive drafts (chapters + subsections)."""
    if not outline:
        return 0
    total = 0

    def walk(sections: List[Dict[str, Any]], depth: int) -> None:
        nonlocal total
        for sec in sections:
            total += 1
            if depth < max_depth:
                walk(_subsections(sec), depth + 1)

    walk(outline.get("sections") or [], 1)
    return total


def validate_outline_against_settings(
    outline: Optional[Dict[str, Any]],
    settings: Optional[Dict[str, Any]],
) -> Tuple[bool, str]:
    """Return (ok, error_message)."""
    if not outline or not outline.get("sections"):
        return True, ""
    settings = settings or {}
    sections = outline.get("sections") or []
    count = len(sections)
    min_c = settings.get("min_chapters")
    max_c = settings.get("max_chapters")
    target = settings.get("target_chapter_count")
    max_depth = int(settings.get("max_subsection_depth") or 1)
    target_subs = settings.get("target_subsections_per_chapter")

    if min_c is not None and count < int(min_c):
        return False, f"Outline has {count} chapters but minimum is {min_c}."
    if max_c is not None and count > int(max_c):
        return False, f"Outline has {count} chapters but maximum is {max_c}."
    if target is not None and count != int(target):
        return False, f"Outline has {count} chapters but target is {target}."

    if target_subs is not None and max_depth > 1:
        for sec in sections:
            subs = _subsections(sec)
            sid = _section_id(sec) or sec.get("title", "?")
            if subs and len(subs) < int(target_subs):
                return False, (
                    f"Chapter '{sid}' has {len(subs)} subsections "
                    f"but target is {target_subs}."
                )

    def check_depth(sections_list: List[Dict[str, Any]], depth: int) -> Optional[str]:
        for sec in sections_list:
            subs = _subsections(sec)
            if subs and depth > max_depth:
                return f"Subsections exceed max depth {max_depth} at '{_section_id(sec)}'."
            if subs:
                err = check_depth(subs, depth + 1)
                if err:
                    return err
        return None

    depth_err = check_depth(sections, 1)
    if depth_err:
        return False, depth_err

    return True, ""


def outline_hint_from_settings(settings: Optional[Dict[str, Any]], domain: str = "technical-docs") -> str:
    """Build LLM prompt hint for outline generation."""
    settings = merge_agency_settings(settings, None, domain)
    parts = []
    target = settings.get("target_chapter_count")
    min_c = settings.get("min_chapters")
    max_c = settings.get("max_chapters")
    if target:
        parts.append(f"exactly {target} top-level chapters")
    elif min_c and max_c:
        parts.append(f"{min_c} to {max_c} top-level chapters")
    elif min_c:
        parts.append(f"at least {min_c} top-level chapters")
    elif max_c:
        parts.append(f"up to {max_c} top-level chapters")

    max_depth = int(settings.get("max_subsection_depth") or 1)
    target_subs = settings.get("target_subsections_per_chapter")
    if max_depth > 1:
        if target_subs:
            parts.append(
                f"each chapter should have about {target_subs} subsections "
                f"(nested under 'subsections' array, max depth {max_depth})"
            )
        else:
            parts.append(
                f"include nested subsections where appropriate (max depth {max_depth})"
            )

    words_total = settings.get("target_word_count")
    words_ch = settings.get("words_per_chapter")
    if words_ch:
        parts.append(f"aim for ~{words_ch} words per chapter")
    elif words_total and target:
        parts.append(f"total manuscript ~{words_total} words")

    if not parts:
        return (
            "4 to 8 sections for a substantial article or guide"
            if "book" not in domain and "creative" not in domain
            else "8 to 14 chapters suitable for a long-form book"
        )
    return "; ".join(parts)


def iter_draft_units(
    outline: Optional[Dict[str, Any]],
    max_depth: int = 2,
) -> List[Dict[str, Any]]:
    """Flatten outline into draftable units with composite keys."""
    if not outline:
        return []
    units: List[Dict[str, Any]] = []

    def walk(sections: List[Dict[str, Any]], depth: int, parent_key: str = "") -> None:
        for sec in sections:
            sid = _section_id(sec) or f"section_{len(units) + 1:02d}"
            key = f"{parent_key}__{sid}" if parent_key else sid
            title = sec.get("title") or sid
            goal = sec.get("goal") or sec.get("purpose") or ""
            units.append({
                "key": key,
                "id": sid,
                "title": title,
                "goal": goal,
                "depth": depth,
                "parent_key": parent_key or None,
            })
            subs = _subsections(sec)
            if subs and depth < max_depth:
                walk(subs, depth + 1, key)

    walk(outline.get("sections") or [], 1)
    return units


def parse_structure_from_text(text: str) -> Dict[str, Any]:
    """Heuristic extraction of numeric structure from user text."""
    import re

    patch: Dict[str, Any] = {}
    t = text.lower()

    m = re.search(r"(\d+)\s*(?:k|000)?\s*words?", t)
    if m:
        n = int(m.group(1))
        if "k" in t[m.start() : m.end()] or n < 500:
            n *= 1000
        patch["target_word_count"] = n

    m = re.search(r"(\d+)\s*(?:chapters?|sections?)", t)
    if not m:
        m = re.search(r"chapter\s+count\s+(?:to\s+)?(\d+)", t)
    if m:
        patch["target_chapter_count"] = int(m.group(1))
        patch["min_chapters"] = int(m.group(1))
        patch["max_chapters"] = int(m.group(1))

    m = re.search(r"(\d+)\s*(?:sub(?:-)?sections?|subchapters?)", t)
    if m:
        patch["target_subsections_per_chapter"] = int(m.group(1))
        patch["max_subsection_depth"] = 2

    m = re.search(r"(\d+)\s*(?:words?\s*(?:per|each)\s*chapter)", t)
    if m:
        patch["words_per_chapter"] = int(m.group(1))

    return patch
