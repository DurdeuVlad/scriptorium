/** Build nav tree from flat manuscript keys and nested outline. */
export function buildChapterTree(outline, manuscriptKeys) {
  const sections = outline?.sections || [];
  const keys = new Set(manuscriptKeys.filter((k) => k !== "final_manuscript"));

  if (sections.length === 0) {
    return keys.size
      ? [...keys].sort().map((key) => ({
          key,
          label: key,
          depth: 1,
          children: [],
        }))
      : [];
  }

  const nodes = [];

  function walk(sectionList, depth, parentKey) {
    for (const sec of sectionList) {
      const id = sec.id || sec.section_id;
      const compositeKey = parentKey ? `${parentKey}__${id}` : id;
      const childSubs = sec.subsections || [];
      const hasDraft =
        keys.has(compositeKey) ||
        keys.has(id) ||
        [...keys].some((k) => k.startsWith(`${compositeKey}__`) || k.startsWith(`${id}__`));

      const node = {
        key: keys.has(compositeKey) ? compositeKey : keys.has(id) ? id : compositeKey,
        label: sec.title || id,
        depth,
        children: [],
        hasDraft,
      };

      if (childSubs.length) {
        walk(childSubs, depth + 1, compositeKey);
        for (const sub of childSubs) {
          const sid = sub.id || sub.section_id;
          const subKey = `${compositeKey}__${sid}`;
          node.children.push({
            key: keys.has(subKey) ? subKey : sid,
            label: sub.title || sid,
            depth: depth + 1,
            children: [],
            hasDraft: keys.has(subKey) || keys.has(sid),
          });
        }
      }

      if (hasDraft || node.children.length) {
        nodes.push(node);
      }
    }
  }

  walk(sections, 1, "");
  return nodes;
}

export function flattenSections(sections, depth = 1) {
  const out = [];
  for (const sec of sections || []) {
    out.push({ ...sec, depth });
    if (sec.subsections?.length && depth < 4) {
      out.push(...flattenSections(sec.subsections, depth + 1));
    }
  }
  return out;
}

export function emptySection(index, depth = 1) {
  return {
    id: `section_${String(index + 1).padStart(2, "0")}`,
    title: depth > 1 ? "New subsection" : "New section",
    goal: "",
    subsections: [],
  };
}

export function updateSectionAt(sections, path, field, value) {
  const next = sections.map((s) => ({ ...s, subsections: [...(s.subsections || [])] }));
  const [topIdx, ...rest] = path;
  if (rest.length === 0) {
    next[topIdx] = { ...next[topIdx], [field]: value };
    return next;
  }
  let parent = next[topIdx];
  for (let i = 0; i < rest.length - 1; i++) {
    parent = parent.subsections[rest[i]];
  }
  const leafIdx = rest[rest.length - 1];
  parent.subsections[leafIdx] = { ...parent.subsections[leafIdx], [field]: value };
  return next;
}

export function countTopLevel(sections) {
  return (sections || []).length;
}
