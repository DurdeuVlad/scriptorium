import { useCallback, useState } from "react";
import { API_BASE } from "../config.js";

export function useProject() {
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [audience, setAudience] = useState("");
  const [domain, setDomain] = useState("technical-docs");
  const [brief, setBrief] = useState(null);
  const [outline, setOutline] = useState(null);
  const [manuscript, setManuscript] = useState({});
  const [artifactMeta, setArtifactMeta] = useState([]);
  const [editorialMemo, setEditorialMemo] = useState([]);
  const [agencySettings, setAgencySettings] = useState(null);
  const [activeStylePack, setActiveStylePack] = useState("");

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`);
      const data = await res.json();
      setProjects(data);
      return data;
    } catch (e) {
      console.error("fetchProjects failed:", e);
      return [];
    }
  }, []);

  const syncArtifactsFromDisk = useCallback(async (projectId, snapshotManuscript = {}) => {
    if (!projectId) return snapshotManuscript;
    try {
      const listRes = await fetch(`${API_BASE}/projects/${projectId}/artifacts`);
      if (!listRes.ok) return snapshotManuscript;
      const list = await listRes.json();
      setArtifactMeta(list);

      const merged = { ...snapshotManuscript };
      await Promise.all(
        list.map(async (item) => {
          const res = await fetch(
            `${API_BASE}/projects/${projectId}/artifacts/${item.id}`
          );
          if (!res.ok) return;
          const data = await res.json();
          merged[item.id] = data.content;
        })
      );
      setManuscript(merged);
      return merged;
    } catch (e) {
      console.error("syncArtifactsFromDisk failed:", e);
      return snapshotManuscript;
    }
  }, []);

  const persistArtifact = useCallback(async (projectId, artifactId, content) => {
    if (!projectId || !artifactId || artifactId === "plan") return true;
    try {
      const res = await fetch(
        `${API_BASE}/projects/${projectId}/artifacts/${artifactId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
      return res.ok;
    } catch (e) {
      console.error("persistArtifact failed:", e);
      return false;
    }
  }, []);

  const persistPlan = useCallback(async (projectId, planPayload) => {
    if (!projectId) return false;
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planPayload),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.brief != null) setBrief(data.brief);
      if (data.outline != null) setOutline(data.outline);
      if (data.agency_settings != null) setAgencySettings(data.agency_settings);
      if (data.active_style_pack != null) setActiveStylePack(data.active_style_pack);
      return true;
    } catch (e) {
      console.error("persistPlan failed:", e);
      return false;
    }
  }, []);

  const resetProjectState = useCallback(() => {
    setActiveProjectId(null);
    setManuscript({});
    setArtifactMeta([]);
    setEditorialMemo([]);
    setBrief(null);
    setOutline(null);
    setAgencySettings(null);
    setActiveStylePack("");
    setPrompt("");
    setAudience("");
    setDomain("technical-docs");
  }, []);

  return {
    projects,
    setProjects,
    activeProjectId,
    setActiveProjectId,
    prompt,
    setPrompt,
    audience,
    setAudience,
    domain,
    setDomain,
    brief,
    setBrief,
    outline,
    setOutline,
    manuscript,
    setManuscript,
    artifactMeta,
    setArtifactMeta,
    editorialMemo,
    setEditorialMemo,
    agencySettings,
    setAgencySettings,
    activeStylePack,
    setActiveStylePack,
    fetchProjects,
    syncArtifactsFromDisk,
    persistArtifact,
    persistPlan,
    resetProjectState,
  };
}
