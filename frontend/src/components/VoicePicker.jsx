import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../config.js";

export default function VoicePicker({
  projectId,
  activeVoice,
  editable,
  onSelect,
  onCustomSaved,
}) {
  const [voices, setVoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customTraits, setCustomTraits] = useState("");
  const [customDesc, setCustomDesc] = useState("");

  const load = useCallback(async () => {
    const url = projectId
      ? `${API_BASE}/projects/${projectId}/voices`
      : `${API_BASE}/style-packs`;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setVoices(data.voices || []);
    } catch (e) {
      console.error("VoicePicker load failed:", e);
    }
  }, [projectId]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const handleCreate = async () => {
    if (!projectId || !customName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/voices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customName.trim(),
          description: customDesc.trim(),
          traits: customTraits.trim(),
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setShowForm(false);
      setCustomName("");
      setCustomTraits("");
      setCustomDesc("");
      await load();
      if (data.voice?.id) {
        onSelect?.(data.voice.id);
        onCustomSaved?.(data.voice);
      }
    } catch (e) {
      console.error("create voice failed:", e);
    }
  };

  const handleDelete = async (voiceId, kind) => {
    if (kind !== "custom" || !projectId) return;
    if (!window.confirm("Remove this custom voice?")) return;
    try {
      await fetch(`${API_BASE}/projects/${projectId}/voices/${voiceId}`, {
        method: "DELETE",
      });
      await load();
      if (activeVoice === voiceId) onSelect?.("");
    } catch (e) {
      console.error("delete voice failed:", e);
    }
  };

  return (
    <div className="voice-picker" id="voice-picker">
      <h4>Writing voice</h4>
      <ul className="voice-list">
        {voices.map((v) => (
          <li key={v.id} className={`voice-item${activeVoice === v.id ? " active" : ""}`}>
            <label className="voice-option">
              <input
                type="radio"
                name="active-voice"
                checked={activeVoice === v.id}
                disabled={!editable}
                onChange={() => onSelect?.(v.id)}
              />
              <span className="voice-name">{v.name}</span>
              {v.kind === "custom" && (
                <span className="voice-badge">Custom</span>
              )}
            </label>
            {v.description && <p className="voice-desc">{v.description}</p>}
            {editable && v.kind === "custom" && (
              <button
                type="button"
                className="btn-ghost btn-sm danger"
                onClick={() => handleDelete(v.id, v.kind)}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      {editable && projectId && (
        <>
          {!showForm ? (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setShowForm(true)}
            >
              + Custom voice
            </button>
          ) : (
            <div className="voice-custom-form">
              <input
                placeholder="Voice name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              <input
                placeholder="Short description"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
              />
              <textarea
                rows={3}
                placeholder="Voice traits, rhythm, word choice…"
                value={customTraits}
                onChange={(e) => setCustomTraits(e.target.value)}
              />
              <div className="voice-form-actions">
                <button type="button" className="btn-primary btn-sm" onClick={handleCreate}>
                  Save voice
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
