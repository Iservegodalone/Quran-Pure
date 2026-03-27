import { useState, useEffect, useCallback, useRef } from "react";
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
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);

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
        fileHandleRef.current = null;
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
            page: currentPage,
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
  }, [currentPage]);

  const handleSnippetUpdate = useCallback((updated: SnippetData) => {
    setSnippets((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  }, []);

  const handleSnippetDelete = useCallback((id: string) => {
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleSave = useCallback(async () => {
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

    const jsonString = JSON.stringify(state);
    const suggestedName = `${pdfFileName.replace(/\.pdf$/i, "")}_verification.json`;

    // --- Try File System Access API ---
    if ("showSaveFilePicker" in window) {
      // If we already have a handle, try to reuse it
      if (fileHandleRef.current) {
        try {
          const perm = await fileHandleRef.current.queryPermission({ mode: "readwrite" });
          if (perm !== "granted") {
            const requested = await fileHandleRef.current.requestPermission({ mode: "readwrite" });
            if (requested !== "granted") {
              fileHandleRef.current = null;
            }
          }
        } catch {
          fileHandleRef.current = null;
        }
      }

      if (fileHandleRef.current) {
        try {
          const writable = await fileHandleRef.current.createWritable();
          await writable.write(jsonString);
          await writable.close();
          return;
        } catch {
          fileHandleRef.current = null;
        }
      }

      // No valid handle — prompt user for save location
      try {
        const handle = await window.showSaveFilePicker!({
          suggestedName,
          types: [{
            description: "JSON Files",
            accept: { "application/json": [".json"] },
          }],
        });
        fileHandleRef.current = handle;
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        return;
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        // Fall through to legacy fallback
      }
    }

    // --- Fallback: traditional blob download (Firefox, Safari) ---
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = suggestedName;
    a.click();
    URL.revokeObjectURL(url);
  }, [pdfData, pdfFileName, currentPage, snippets, globalOpacity, zoom, panX, panY]);

  const handleLoad = useCallback(async () => {
    let file: File;
    let handle: FileSystemFileHandle | null = null;

    if ("showOpenFilePicker" in window) {
      try {
        const [pickedHandle] = await window.showOpenFilePicker!({
          types: [{
            description: "JSON Files",
            accept: { "application/json": [".json"] },
          }],
          multiple: false,
        });
        handle = pickedHandle;
        file = await handle.getFile();
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        return;
      }
    } else {
      // Fallback: traditional file input
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      const picked = await new Promise<File | null>((resolve) => {
        input.onchange = () => resolve(input.files?.[0] ?? null);
        const onFocus = () => {
          window.removeEventListener("focus", onFocus);
          setTimeout(() => resolve(null), 300);
        };
        window.addEventListener("focus", onFocus);
        input.click();
      });
      if (!picked) return;
      file = picked;
    }

    try {
      const text = await file.text();
      const state = JSON.parse(text) as SaveState;
      if (state.pdfBase64) {
        setPdfData(base64ToArrayBuffer(state.pdfBase64));
      }
      setPdfFileName(state.pdfFileName || "");
      setCurrentPage(state.currentPage || 1);
      setSnippets(
        (state.snippets || []).map((s) => ({
          ...s,
          page: s.page ?? state.currentPage ?? 1,
        }))
      );
      setGlobalOpacity(state.globalOpacity ?? 0.5);
      setZoom(state.zoom ?? 1);
      setPanX(state.panX ?? 50);
      setPanY(state.panY ?? 50);

      // Remember file handle for future saves
      if (handle) {
        fileHandleRef.current = handle;
      }
    } catch {
      alert("Fehler beim Laden der Datei.");
    }
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
