export interface SnippetData {
  id: string;
  name: string;
  imageDataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  locked: boolean;
}

export interface SaveState {
  version: number;
  pdfBase64: string;
  pdfFileName: string;
  currentPage: number;
  snippets: SnippetData[];
  globalOpacity: number;
  zoom: number;
  panX: number;
  panY: number;
}
