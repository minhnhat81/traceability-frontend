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
export async function hashPdfBlob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  return hashPdf(buffer);
}
