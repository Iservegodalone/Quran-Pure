import {
  useRef,
  useEffect,
  useCallback,
  useState,
} from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { SnippetData } from "../types";
import SnippetOverlay from "./SnippetOverlay";

interface WorkspaceProps {
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  snippets: SnippetData[];
  verificationMode: boolean;
  globalOpacity: number;
  zoom: number;
  panX: number;
  panY: number;
  onZoomPan: (zoom: number, panX: number, panY: number) => void;
  onPan: (panX: number, panY: number) => void;
  onSnippetUpdate: (snippet: SnippetData) => void;
  onSnippetDelete: (id: string) => void;
}

const PDF_SCALE = 1.5;
const DARK_THRESHOLD = 128;

// Image cache for snippet images
const imageCache = new Map<string, HTMLImageElement>();

function loadImage(id: string, dataUrl: string): Promise<HTMLImageElement | null> {
  const cached = imageCache.get(id);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(id, img);
      resolve(img);
    };
    img.onerror = () => {
      console.error("Failed to load snippet image:", id);
      resolve(null);
    };
    img.src = dataUrl;
  });
}

function pruneImageCache(activeIds: Set<string>) {
  for (const id of imageCache.keys()) {
    if (!activeIds.has(id)) {
      imageCache.delete(id);
    }
  }
}

export default function Workspace({
  pdfDoc,
  currentPage,
  snippets,
  verificationMode,
  globalOpacity,
  zoom,
  panX,
  panY,
  onZoomPan,
  onPan,
  onSnippetUpdate,
  onSnippetDelete,
}: WorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfOffscreenRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfSize, setPdfSize] = useState({ width: 0, height: 0 });
  const [pdfRenderCount, setPdfRenderCount] = useState(0);

  // Render PDF page to offscreen canvas
  useEffect(() => {
    if (!pdfDoc) {
      pdfOffscreenRef.current = null;
      setPdfSize({ width: 0, height: 0 });
      return;
    }

    let cancelled = false;

    pdfDoc
      .getPage(currentPage)
      .then((page) => {
        if (cancelled) return;

        const viewport = page.getViewport({ scale: PDF_SCALE });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d")!;

        return page.render({ canvasContext: ctx, viewport }).promise.then(() => {
          if (cancelled) return;
          pdfOffscreenRef.current = canvas;
          setPdfSize({ width: canvas.width, height: canvas.height });
          setPdfRenderCount((c) => c + 1);
        });
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Page render error:", err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, currentPage]);

  // Update display canvas: normal PDF view or verification composite
  useEffect(() => {
    // Prune stale cache entries
    pruneImageCache(new Set(snippets.map((s) => s.id)));

    const offscreen = pdfOffscreenRef.current;
    const display = displayCanvasRef.current;
    if (!offscreen || !display) return;

    if (!verificationMode) {
      // Normal mode: just copy PDF to display
      display.width = offscreen.width;
      display.height = offscreen.height;
      display.getContext("2d")!.drawImage(offscreen, 0, 0);
      return;
    }

    // Verification mode: composite
    let cancelled = false;

    const renderComposite = async () => {
      // Load all snippet images (skip failed ones)
      const loaded = await Promise.all(
        snippets.map(async (s) => ({
          snippet: s,
          img: await loadImage(s.id, s.imageDataUrl),
        }))
      );
      const entries = loaded.filter(
        (e): e is { snippet: SnippetData; img: HTMLImageElement } =>
          e.img !== null
      );

      if (cancelled || !displayCanvasRef.current) return;

      const w = offscreen.width;
      const h = offscreen.height;

      display.width = w;
      display.height = h;

      // If no snippets, just show blue-colorized PDF
      const pdfCtx = offscreen.getContext("2d")!;
      const pdfImageData = pdfCtx.getImageData(0, 0, w, h);

      // Draw all snippets to a temp canvas
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext("2d")!;

      for (const { snippet: s, img } of entries) {
        tempCtx.drawImage(img, s.x, s.y, s.width, s.height);
      }

      const snImageData = tempCtx.getImageData(0, 0, w, h);

      // Pixel-by-pixel comparison
      const outCtx = display.getContext("2d")!;
      const outData = outCtx.createImageData(w, h);
      const pd = pdfImageData.data;
      const sd = snImageData.data;
      const od = outData.data;

      for (let i = 0; i < pd.length; i += 4) {
        const pLum =
          0.299 * pd[i] + 0.587 * pd[i + 1] + 0.114 * pd[i + 2];
        const pDark = pLum < DARK_THRESHOLD;

        const sAlpha = sd[i + 3];
        const sLum =
          0.299 * sd[i] + 0.587 * sd[i + 1] + 0.114 * sd[i + 2];
        const sDark = sAlpha > 10 && sLum < DARK_THRESHOLD;

        if (pDark && sDark) {
          // Purple - match
          od[i] = 128;
          od[i + 1] = 0;
          od[i + 2] = 128;
          od[i + 3] = 255;
        } else if (pDark) {
          // Blue - only in PDF
          od[i] = 0;
          od[i + 1] = 0;
          od[i + 2] = 255;
          od[i + 3] = 255;
        } else if (sDark) {
          // Red - only in snippet
          od[i] = 255;
          od[i + 1] = 0;
          od[i + 2] = 0;
          od[i + 3] = 255;
        } else {
          // White background
          od[i] = 255;
          od[i + 1] = 255;
          od[i + 2] = 255;
          od[i + 3] = 255;
        }
      }

      outCtx.putImageData(outData, 0, 0);
    };

    renderComposite();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationMode, snippets, pdfRenderCount]);

  // Wheel zoom (centered on cursor)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newZoom = Math.max(0.05, Math.min(20, zoom * factor));

      const newPanX = mouseX - (mouseX - panX) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - panY) * (newZoom / zoom);

      onZoomPan(newZoom, newPanX, newPanY);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [zoom, panX, panY, onZoomPan]);

  // Pan via mouse drag on workspace background
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan if clicking on workspace background, canvas, or transform container
      if (e.button !== 0) return;

      const target = e.target as HTMLElement;
      // Allow pan when clicking on background, canvas, transform container,
      // or anywhere inside a locked snippet (since locked snippets are inert)
      const isLockedSnippet = target.closest(".snippet-overlay.locked") !== null;
      const isBackground =
        isLockedSnippet ||
        target === containerRef.current ||
        target === displayCanvasRef.current ||
        target.classList.contains("transform-container");

      if (!isBackground) return;

      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startPanX = panX;
      const startPanY = panY;

      const handleMove = (me: MouseEvent) => {
        onPan(startPanX + me.clientX - startX, startPanY + me.clientY - startY);
      };

      const handleUp = () => {
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [panX, panY, onPan]
  );

  return (
    <div
      ref={containerRef}
      className="workspace"
      onMouseDown={handleMouseDown}
    >
      {!pdfDoc && (
        <div className="workspace-empty">
          <div className="workspace-empty-title">
            PDF-Verifikationstool
          </div>
          <div className="workspace-empty-hint">
            PDF laden um zu beginnen
          </div>
        </div>
      )}

      <div
        className="transform-container"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        }}
      >
        <canvas
          ref={displayCanvasRef}
          className="pdf-canvas"
          style={{
            width: pdfSize.width,
            height: pdfSize.height,
          }}
        />

        {/* Snippet overlays */}
        {snippets.map((s) => (
          <SnippetOverlay
            key={s.id}
            snippet={s}
            verificationMode={verificationMode}
            globalOpacity={globalOpacity}
            zoom={zoom}
            onUpdate={onSnippetUpdate}
            onDelete={onSnippetDelete}
          />
        ))}
      </div>

      <div className="zoom-indicator">{Math.round(zoom * 100)}%</div>
    </div>
  );
}
