import CryptoJS from "crypto-js";

export async function hashPdfBlob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(
    buffer as any
  );
  return CryptoJS.SHA256(wordArray).toString();
}
