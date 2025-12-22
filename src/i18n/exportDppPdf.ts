import jsPDF from "jspdf";
import { hashPdf } from "../utils/hashPdf";

export async function exportDppPdfWithHash(data: any) {
  const doc = new jsPDF();
  doc.text("Digital Product Passport", 20, 20);
  doc.text(`Batch: ${data.batch.batch_code}`, 20, 30);

  const blob = doc.output("blob");

  const hash = await hashPdfBlob(blob);

  console.log("PDF HASH:", hash);

  // TODO: call backend API to anchor hash
  // POST /api/blockchain/anchor-pdf-hash

  doc.save(`DPP-${data.batch.batch_code}.pdf`);
}
