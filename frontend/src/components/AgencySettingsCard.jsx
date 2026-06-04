export default function AgencySettingsCard({
  agencySettings,
  editable,
  onChange,
}) {
  const ag = agencySettings || {};
  const set = (field, raw) => {
    const val = raw === "" ? null : Number(raw);
    onChange?.({ ...ag, [field]: Number.isFinite(val) ? val : null });
  };

  return (
    <div className="agency-settings-card" id="agency-settings-card">
      <h4>Structure</h4>
      <div className="agency-settings-grid">
        <label>
          Chapters
          <input
            type="number"
            min={1}
            max={99}
            value={ag.target_chapter_count ?? ""}
            disabled={!editable}
            onChange={(e) => set("target_chapter_count", e.target.value)}
          />
        </label>
        <label>
          Total words
          <input
            type="number"
            min={500}
            step={500}
            value={ag.target_word_count ?? ""}
            disabled={!editable}
            onChange={(e) => set("target_word_count", e.target.value)}
          />
        </label>
        <label>
          Words / chapter
          <input
            type="number"
            min={100}
            step={100}
            value={ag.words_per_chapter ?? ""}
            disabled={!editable}
            onChange={(e) => set("words_per_chapter", e.target.value)}
          />
        </label>
        <label>
          Subsections / chapter
          <input
            type="number"
            min={0}
            max={20}
            value={ag.target_subsections_per_chapter ?? ""}
            disabled={!editable}
            onChange={(e) => set("target_subsections_per_chapter", e.target.value)}
          />
        </label>
        <label>
          Max depth
          <select
            value={ag.max_subsection_depth ?? 1}
            disabled={!editable}
            onChange={(e) =>
              onChange?.({ ...ag, max_subsection_depth: Number(e.target.value) })
            }
          >
            <option value={1}>Chapters only</option>
            <option value={2}>Chapters + subsections</option>
            <option value={3}>3 levels</option>
          </select>
        </label>
      </div>
    </div>
  );
}
