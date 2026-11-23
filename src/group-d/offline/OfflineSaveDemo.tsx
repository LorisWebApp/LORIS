
import { useEffect, useState } from "react";
import {
  saveMaterialForOffline,
  getOfflineMaterial,
  removeOfflineMaterial,
} from "./offlineMaterials";
import { buildSamplePdfBlob } from "./samplePdf";

const DEMO_ID = "group-d-offline-sample-pdf";

export default function OfflineSaveDemo() {
  const [message, setMessage] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  async function handleSave() {
    try {
      const blob = buildSamplePdfBlob();

      // DEMO ONLY: Local permission for this demonstration.
      // This is not a real server permission validation.
      const permission = {
        allowed: true,
        offlineAllowedUntil: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        validatedAt: new Date().toISOString(),
      };

      await saveMaterialForOffline({
        material: {
          id: DEMO_ID,
          title: "LORIS sample PDF",
          author: "Group D",
          category: "Offline demonstration",
          fileName: "loris-sample.pdf",
          mimeType: "application/pdf",
          fileSize: blob.size,
          ownerUserId: "group-d-demo",
        },
        fileBlob: blob,
        permission,
      });

      setMessage("Sample PDF saved offline successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save PDF."
      );
    }
  }

  async function handleOpen() {
    try {
      const record = await getOfflineMaterial(DEMO_ID);

      if (!record) {
        setMessage("No saved sample PDF was found.");
        return;
      }

      const url = URL.createObjectURL(record.fileBlob);
      setPdfUrl(url);
      setMessage("PDF retrieved from offline storage.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not open PDF."
      );
    }
  }

  async function handleRemove() {
    try {
      await removeOfflineMaterial(DEMO_ID);
      setPdfUrl(null);
      setMessage("Sample PDF removed from offline storage.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not remove PDF."
      );
    }
  }

  return (
    <section style={{ padding: 20, border: "1px dashed gray" }}>
      <h2>Offline PDF Demo - Task 3</h2>

      <button onClick={handleSave}>1. Save Sample PDF</button>{" "}
      <button onClick={handleOpen}>2. Open Saved PDF</button>{" "}
      <button onClick={handleRemove}>3. Remove PDF</button>

      <p role="status">{message}</p>

      {pdfUrl && (
        <iframe
          title="Saved sample PDF"
          src={pdfUrl}
          style={{ width: "100%", height: "70vh" }}
        />
      )}
    </section>
  );
}
