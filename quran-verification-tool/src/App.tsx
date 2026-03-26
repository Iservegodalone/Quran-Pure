import { useState, useEffect, useCallback } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { SnippetData, SaveState } from "./types";
import Toolbar from "./components/Toolbar";
import Workspace from "./components/Workspace";
import "./App.css";

// Initialize PDF.js worker
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(
      String.fromCharCode(...bytes.subarray(i, i + chunkSize))
    );
  }
  return btoa(chunks.join(""));
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function App() {
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [snippets, setSnippets] = useState<SnippetData[]>([]);
  const [verificationMode, setVerificationMode] = useState(false);
  const [globalOpacity, setGlobalOpacity] = useState(0.5);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(50);
  const [panY, setPanY] = useState(50);

  // Load PDF document when data changes
  useEffect(() => {
    if (!pdfData) {
      setPdfDoc(null);
      setTotalPages(0);
      return;
    }

    let cancelled = false;
    const loadingTask = getDocument({ data: pdfData.slice(0) });

    loadingTask.promise
      .then((doc) => {
        if (!cancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("PDF load error:", err);
          alert("Die PDF-Datei konnte nicht geladen werden. Möglicherweise ist sie beschädigt.");
          setPdfData(null);
          setPdfFileName("");
        }
      });

    return () => {
      cancelled = true;
      loadingTask.destroy().catch(() => {});
    };
  }, [pdfData]);

  const handlePdfUpload = useCallback(
    (file: File) => {
      if (
        snippets.length > 0 &&
        !confirm(
          "Es sind bereits Schnipsel platziert. Beim Laden einer neuen PDF bleiben diese erhalten.\n\nFortfahren?"
        )
      ) {
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setPdfData(e.target!.result as ArrayBuffer);
        setPdfFileName(file.name);
        setCurrentPage(1);
        setZoom(1);
        setPanX(50);
        setPanY(50);
      };
      reader.readAsArrayBuffer(file);
    },
    [snippets.length]
  );

  const handleSnippetUpload = useCallback((files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target!.result as string;
        const img = new Image();
        img.onload = () => {
          const MAX_INITIAL_SIZE = 800;
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          if (w > MAX_INITIAL_SIZE || h > MAX_INITIAL_SIZE) {
            const scale = MAX_INITIAL_SIZE / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          const newSnippet: SnippetData = {
            id: crypto.randomUUID(),
            name: file.name,
            imageDataUrl: dataUrl,
            x: 50,
            y: 50,
            width: w,
            height: h,
            locked: false,
          };
          setSnippets((prev) => [...prev, newSnippet]);
        };
        img.onerror = () => {
          console.error("Failed to load image:", file.name);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleSnippetUpdate = useCallback((updated: SnippetData) => {
    setSnippets((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  }, []);

  const handleSnippetDelete = useCallback((id: string) => {
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleSave = useCallback(() => {
    if (!pdfData) return;

    const state: SaveState = {
      version: 1,
      pdfBase64: arrayBufferToBase64(pdfData),
      pdfFileName,
      currentPage,
      snippets,
      globalOpacity,
      zoom,
      panX,
      panY,
    };

    const blob = new Blob([JSON.stringify(state)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pdfFileName.replace(/\.pdf$/i, "")}_verification.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [pdfData, pdfFileName, currentPage, snippets, globalOpacity, zoom, panX, panY]);

  const handleLoad = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target!.result as string) as SaveState;
        if (state.pdfBase64) {
          setPdfData(base64ToArrayBuffer(state.pdfBase64));
        }
        setPdfFileName(state.pdfFileName || "");
        setCurrentPage(state.currentPage || 1);
        setSnippets(state.snippets || []);
        setGlobalOpacity(state.globalOpacity ?? 0.5);
        setZoom(state.zoom ?? 1);
        setPanX(state.panX ?? 50);
        setPanY(state.panY ?? 50);
      } catch {
        alert("Fehler beim Laden der Datei.");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleZoomPan = useCallback(
    (newZoom: number, newPanX: number, newPanY: number) => {
      setZoom(newZoom);
      setPanX(newPanX);
      setPanY(newPanY);
    },
    []
  );

  const handlePan = useCallback((newPanX: number, newPanY: number) => {
    setPanX(newPanX);
    setPanY(newPanY);
  }, []);

  return (
    <div className="app">
      <Toolbar
        onPdfUpload={handlePdfUpload}
        onSnippetUpload={handleSnippetUpload}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        verificationMode={verificationMode}
        onToggleVerification={() => setVerificationMode((v) => !v)}
        globalOpacity={globalOpacity}
        onOpacityChange={setGlobalOpacity}
        onSave={handleSave}
        onLoad={handleLoad}
        hasPdf={!!pdfData}
      />
      <Workspace
        pdfDoc={pdfDoc}
        currentPage={currentPage}
        snippets={snippets}
        verificationMode={verificationMode}
        globalOpacity={globalOpacity}
        zoom={zoom}
        panX={panX}
        panY={panY}
        onZoomPan={handleZoomPan}
        onPan={handlePan}
        onSnippetUpdate={handleSnippetUpdate}
        onSnippetDelete={handleSnippetDelete}
      />
    </div>
  );
}

export default App;
