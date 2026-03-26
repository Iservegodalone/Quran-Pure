import { useRef } from "react";

interface ToolbarProps {
  onPdfUpload: (file: File) => void;
  onSnippetUpload: (files: FileList) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  verificationMode: boolean;
  onToggleVerification: () => void;
  globalOpacity: number;
  onOpacityChange: (opacity: number) => void;
  onSave: () => void;
  onLoad: (file: File) => void;
  hasPdf: boolean;
}

export default function Toolbar({
  onPdfUpload,
  onSnippetUpload,
  currentPage,
  totalPages,
  onPageChange,
  verificationMode,
  onToggleVerification,
  globalOpacity,
  onOpacityChange,
  onSave,
  onLoad,
  hasPdf,
}: ToolbarProps) {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const snippetInputRef = useRef<HTMLInputElement>(null);
  const loadInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="toolbar">
      {/* File operations */}
      <div className="toolbar-group">
        <button onClick={() => pdfInputRef.current?.click()}>PDF laden</button>
        <input
          ref={pdfInputRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.[0]) onPdfUpload(e.target.files[0]);
            e.target.value = "";
          }}
        />

        <button
          onClick={() => snippetInputRef.current?.click()}
          disabled={!hasPdf}
        >
          Schnipsel
        </button>
        <input
          ref={snippetInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.length) onSnippetUpload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Page navigation */}
      {totalPages > 0 && (
        <div className="toolbar-group">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            &#9664;
          </button>
          <span className="page-info">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            &#9654;
          </button>
        </div>
      )}

      {/* Verification toggle */}
      <div className="toolbar-group">
        <label className="toggle-label" onClick={onToggleVerification}>
          <div
            className={`toggle-switch${verificationMode ? " active" : ""}`}
          />
          Verifikation
        </label>
      </div>

      {/* Opacity slider */}
      <div className="toolbar-group">
        <div className="opacity-group">
          <span>Transparenz</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={globalOpacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          />
          <span className="opacity-value">
            {Math.round(globalOpacity * 100)}%
          </span>
        </div>
      </div>

      {/* Save / Load */}
      <div className="toolbar-group">
        <button onClick={onSave} disabled={!hasPdf}>
          Speichern
        </button>
        <button onClick={() => loadInputRef.current?.click()}>Laden</button>
        <input
          ref={loadInputRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.[0]) onLoad(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
