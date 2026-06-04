import { parseSaveStatus } from "../lib/phases.js";

import SaveStatusBadge from "./ui/SaveStatusBadge.jsx";



export default function DraftEditor({

  selectedFile,

  content,

  saveStatus,

  onChange,

}) {

  if (!selectedFile) {

    return (

      <div className="editor-placeholder animate-enter">

        <p>Select a chapter from the document tree, or open <strong>Brief &amp; Outline</strong> to review the plan.</p>

      </div>

    );

  }



  const saveBadgeStatus = parseSaveStatus(saveStatus);



  return (

    <div className="draft-editor">

      <div className="draft-editor-header">

        <span className="draft-file-name">{selectedFile}</span>

        <SaveStatusBadge status={saveBadgeStatus} />

      </div>

      <textarea

        className="markdown-editor"

        value={content}

        onChange={(e) => onChange(e.target.value)}

        aria-label={`Edit ${selectedFile}`}

      />

    </div>

  );

}

