import { useRef, useEffect, useCallback, useState } from "react";
import type { SnippetData } from "../types";

interface SnippetOverlayProps {
  snippet: SnippetData;
  verificationMode: boolean;
  globalOpacity: number;
  zoom: number;
  onUpdate: (snippet: SnippetData) => void;
  onDelete: (id: string) => void;
}

type ResizeDir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const MIN_SIZE = 20;

function getResizeFlags(dir: ResizeDir) {
  return {
    left: dir === "nw" || dir === "w" || dir === "sw",
    right: dir === "ne" || dir === "e" || dir === "se",
    top: dir === "nw" || dir === "n" || dir === "ne",
    bottom: dir === "sw" || dir === "s" || dir === "se",
  };
}

const HANDLES: Array<{
  dir: ResizeDir;
  top?: string;
  left?: string;
  bottom?: string;
  right?: string;
  cursor: string;
}> = [
  { dir: "nw", top: "0", left: "0", cursor: "nwse-resize" },
  { dir: "n", top: "0", left: "50%", cursor: "ns-resize" },
  { dir: "ne", top: "0", right: "0", cursor: "nesw-resize" },
  { dir: "e", top: "50%", right: "0", cursor: "ew-resize" },
  { dir: "se", bottom: "0", right: "0", cursor: "nwse-resize" },
  { dir: "s", bottom: "0", left: "50%", cursor: "ns-resize" },
  { dir: "sw", bottom: "0", left: "0", cursor: "nesw-resize" },
  { dir: "w", top: "50%", left: "0", cursor: "ew-resize" },
];

export default function SnippetOverlay({
  snippet,
  verificationMode,
  globalOpacity,
  zoom,
  onUpdate,
  onDelete,
}: SnippetOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImage(img);
    img.src = snippet.imageDataUrl;
  }, [snippet.imageDataUrl]);

  // Render colorized snippet for normal mode (dark pixels -> red, rest transparent)
  useEffect(() => {
    if (!image || !canvasRef.current || verificationMode) return;

    const canvas = canvasRef.current;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;

    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (lum < 128) {
        d[i] = 255;
        d[i + 1] = 0;
        d[i + 2] = 0;
        d[i + 3] = 255;
      } else {
        d[i + 3] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [image, verificationMode]);

  // Drag handler
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (snippet.locked || e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      const startX = e.clientX;
      const startY = e.clientY;
      const origX = snippet.x;
      const origY = snippet.y;

      const handleMove = (me: MouseEvent) => {
        const dx = (me.clientX - startX) / zoom;
        const dy = (me.clientY - startY) / zoom;
        onUpdate({ ...snippet, x: origX + dx, y: origY + dy });
      };

      const handleUp = () => {
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [snippet, zoom, onUpdate]
  );

  // Resize handler
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, dir: ResizeDir) => {
      if (snippet.locked || e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      const flags = getResizeFlags(dir);
      const startX = e.clientX;
      const startY = e.clientY;
      const origX = snippet.x;
      const origY = snippet.y;
      const origW = snippet.width;
      const origH = snippet.height;

      const handleMove = (me: MouseEvent) => {
        const dx = (me.clientX - startX) / zoom;
        const dy = (me.clientY - startY) / zoom;

        let newX = origX;
        let newY = origY;
        let newW = origW;
        let newH = origH;

        if (flags.left) {
          newX = origX + dx;
          newW = origW - dx;
        }
        if (flags.right) {
          newW = origW + dx;
        }
        if (flags.top) {
          newY = origY + dy;
          newH = origH - dy;
        }
        if (flags.bottom) {
          newH = origH + dy;
        }

        if (newW < MIN_SIZE) {
          if (flags.left) newX = origX + origW - MIN_SIZE;
          newW = MIN_SIZE;
        }
        if (newH < MIN_SIZE) {
          if (flags.top) newY = origY + origH - MIN_SIZE;
          newH = MIN_SIZE;
        }

        onUpdate({
          ...snippet,
          x: newX,
          y: newY,
          width: newW,
          height: newH,
        });
      };

      const handleUp = () => {
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [snippet, zoom, onUpdate]
  );

  const inverseScale = 1 / zoom;

  const classNames = [
    "snippet-overlay",
    snippet.locked ? "locked" : "unlocked",
    verificationMode ? "verification" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classNames}
      style={{
        left: snippet.x,
        top: snippet.y,
        width: snippet.width,
        height: snippet.height,
      }}
      onMouseDown={handleDragStart}
    >
      {/* Visible canvas in normal mode */}
      {!verificationMode && (
        <canvas
          ref={canvasRef}
          className="snippet-canvas"
          style={{ opacity: globalOpacity }}
        />
      )}

      {/* Border frame */}
      <div className="snippet-frame" />

      {/* Resize handles */}
      {!snippet.locked &&
        HANDLES.map((h) => (
          <div
            key={h.dir}
            className="resize-handle"
            style={{
              top: h.top,
              left: h.left,
              bottom: h.bottom,
              right: h.right,
              cursor: h.cursor,
              transform: `translate(-50%, -50%) scale(${inverseScale})`,
              transformOrigin: "center",
            }}
            onMouseDown={(e) => handleResizeStart(e, h.dir)}
          />
        ))}

      {/* Controls */}
      <div
        className="snippet-controls"
        style={{
          top: -2,
          right: -2,
          transform: `scale(${inverseScale})`,
          transformOrigin: "top right",
        }}
      >
        <button
          className={`snippet-btn lock-btn${snippet.locked ? " is-locked" : ""}`}
          title={snippet.locked ? "Entsperren" : "Sperren"}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ ...snippet, locked: !snippet.locked });
          }}
        >
          {snippet.locked ? "\u{1F512}" : "\u{1F513}"}
        </button>
        <button
          className="snippet-btn delete-btn"
          title="Entfernen"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(snippet.id);
          }}
        >
          \u00D7
        </button>
      </div>

      {/* Name label */}
      <div
        className="snippet-name"
        style={{
          transform: `scale(${inverseScale})`,
          transformOrigin: "bottom left",
        }}
      >
        {snippet.name}
      </div>
    </div>
  );
}
