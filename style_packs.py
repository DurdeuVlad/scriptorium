"""
Style pack loading — built-in writing personalities + per-project custom voices.
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

STYLES_DIR = os.path.join(".writing-framework", "styles")
SEEDS_DIR = os.path.join("mcp", "guide-server", "seeds", "style-packs")

DOMAIN_DEFAULT_PACK = {
    "technical-docs": "technical-doc",
    "creative-book": "general-writing",
}

BUILTIN_PACK_IDS = [
    "general-writing",
    "technical-doc",
    "internal-memo",
    "lore-player-facing",
    "lore-dm",
    "card-flavor",
]


def _pack_path(pack_id: str) -> str:
    return os.path.join(STYLES_DIR, f"{pack_id}.md")


def list_builtin_style_packs() -> List[Dict[str, Any]]:
    packs = []
    for pack_id in BUILTIN_PACK_IDS:
        path = _pack_path(pack_id)
        if not os.path.isfile(path):
            continue
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        title = pack_id.replace("-", " ").title()
        m = re.search(r"^#\s+(.+)$", content, re.M)
        if m:
            title = m.group(1).strip()
        packs.append({
            "id": pack_id,
            "name": title,
            "kind": "builtin",
            "description": _first_paragraph(content),
        })
    return packs


def _first_paragraph(content: str) -> str:
    lines = []
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            if lines:
                break
            continue
        lines.append(line)
        if len(" ".join(lines)) > 120:
            break
    text = " ".join(lines)
    return text[:200] + ("…" if len(text) > 200 else "")


def load_style_pack_content(pack_id: str) -> Optional[str]:
    path = _pack_path(pack_id)
    if not os.path.isfile(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def summarize_style_pack(content: str, max_chars: int = 2000) -> str:
    """Truncate style pack for prompt injection."""
    if len(content) <= max_chars:
        return content
    return content[:max_chars] + "\n\n[Style pack truncated for prompt budget.]"


def default_style_pack_for_domain(domain: str) -> str:
    d = (domain or "technical-docs").lower()
    key = "creative-book" if "book" in d or "creative" in d else "technical-docs"
    return DOMAIN_DEFAULT_PACK.get(key, "general-writing")


def apply_style_pack(state_pack_id: Optional[str], domain: str) -> str:
    if state_pack_id and state_pack_id not in ("baseline", ""):
        if load_style_pack_content(state_pack_id):
            return state_pack_id
    return default_style_pack_for_domain(domain)


def style_prompt_block(pack_id: str) -> str:
    content = load_style_pack_content(pack_id)
    if not content:
        return ""
    summary = summarize_style_pack(content)
    return f"\n\n--- Writing voice (style pack: {pack_id}) ---\n{summary}\n--- End voice ---\n"


def custom_voices_dir(project_id: str) -> str:
    return os.path.join("projects", project_id, "voices")


def list_custom_voices(project_id: str) -> List[Dict[str, Any]]:
    base = custom_voices_dir(project_id)
    if not os.path.isdir(base):
        return []
    voices = []
    for name in sorted(os.listdir(base)):
        if not name.endswith(".json"):
            continue
        path = os.path.join(base, name)
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            voices.append({
                "id": data.get("id") or name[:-5],
                "name": data.get("name") or name[:-5],
                "kind": "custom",
                "description": data.get("description") or "",
            })
        except (json.JSONDecodeError, OSError):
            continue
    return voices


def get_custom_voice(project_id: str, voice_id: str) -> Optional[Dict[str, Any]]:
    path = os.path.join(custom_voices_dir(project_id), f"{voice_id}.json")
    if not os.path.isfile(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_custom_voice(project_id: str, voice: Dict[str, Any]) -> Dict[str, Any]:
    voice_id = voice.get("id") or re.sub(r"[^a-z0-9_-]", "-", voice.get("name", "custom").lower())
    voice["id"] = voice_id
    voice["kind"] = "custom"
    voice["updated_at"] = datetime.now(timezone.utc).isoformat()
    base = custom_voices_dir(project_id)
    os.makedirs(base, exist_ok=True)
    path = os.path.join(base, f"{voice_id}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(voice, f, indent=2)
    return voice


def delete_custom_voice(project_id: str, voice_id: str) -> bool:
    path = os.path.join(custom_voices_dir(project_id), f"{voice_id}.json")
    if os.path.isfile(path):
        os.remove(path)
        return True
    return False


def voice_prompt_block(project_id: str, pack_id: str) -> str:
    """Load prompt block for builtin or custom voice."""
    custom = get_custom_voice(project_id, pack_id)
    if custom:
        traits = custom.get("traits") or custom.get("body") or ""
        name = custom.get("name") or pack_id
        return f"\n\n--- Custom writing voice: {name} ---\n{traits}\n--- End voice ---\n"
    return style_prompt_block(pack_id)


def list_all_voices(project_id: Optional[str] = None) -> List[Dict[str, Any]]:
    voices = list_builtin_style_packs()
    if project_id:
        voices.extend(list_custom_voices(project_id))
    return voices
