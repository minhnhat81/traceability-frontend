// src/utils/hashPdf.ts
import CryptoJS from "crypto-js";

/**
 * Hash ArrayBuffer (PDF file) using SHA-256
 */
export function hashPdf(buffer: ArrayBuffer): string {
  const wordArray = CryptoJS.lib.WordArray.create(buffer as any);
  return CryptoJS.SHA256(wordArray).toString();
}

/**
 * Hash Blob (PDF from browser)
 */
// src/utils/hashPdf.ts
// Hash PDF (or any Blob) using browser-native WebCrypto SHA-256
// -> returns lowercase hex string

export async function hashPdfBlob(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();

  // WebCrypto: SHA-256
  const digest = await crypto.subtle.digest("SHA-256", buf);

  // Convert to hex
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

