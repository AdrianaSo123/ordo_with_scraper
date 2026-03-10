export function downloadFileFromUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

import { UI_CONSTANTS } from "./constants";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  downloadFileFromUrl(url, filename);
  // Revoke object URL after a short delay to ensure browser has started download
  setTimeout(() => URL.revokeObjectURL(url), UI_CONSTANTS.DOWNLOAD_CLEANUP_MS);
}
