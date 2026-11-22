/**
 * Group C online Reader content service.
 *
 * EPUB files are downloaded and parsed by epubContent.service.ts. Other supported
 * formats use the server's structured reader-document API. Group D is the sole
 * offline-file store; offline blobs are opened from the Offline Library instead
 * of being converted through Group C's legacy encrypted store.
 */
import type { ReaderDocument } from "../types/reader.types";
import { apiRequest } from "./userApi";
import { getEpubReaderDocument } from "./epubContent.service";
import { getPdfReaderDocument } from "./pdfContent.service";
import { supabase } from "../../../services/supabase";


export interface LoadedDocument {
  doc: ReaderDocument;
  source: "online" | "offline";
}


async function getMaterialDetails(materialId: string): Promise<{ title: string; author: string; fileType: string }> {
  const { data, error } = await supabase.from("materials").select("title, author, file_type").eq("id", materialId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("The requested material could not be found.");
  return { title: data.title ?? "Untitled book", author: data.author ?? "", fileType: String(data.file_type ?? "").toLowerCase() };
}


function isEpub(fileType: string): boolean {
  return fileType.includes("epub") || fileType.includes("application/epub");
}


function isValidDocument(value: unknown, materialId: string): value is ReaderDocument {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const document = value as Partial<ReaderDocument>;
  return document.id === materialId && Array.isArray(document.pages) && document.pages.length > 0 && Array.isArray(document.chapters);
}


export async function getReaderDocument(materialId: string): Promise<LoadedDocument> {
  const id = materialId.trim();
  if (!id) throw new Error("A valid material ID is required.");
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("The online Reader is unavailable offline. Open saved files from the Group D Offline Library.");
  }

  const material = await getMaterialDetails(id);
  const document = isEpub(material.fileType)
    ? await getEpubReaderDocument(id, material.title, material.author)
    : material.fileType.includes("pdf")
      ? await getPdfReaderDocument(id, material.title, material.author)
      : await apiRequest<ReaderDocument>(`/materials/${encodeURIComponent(id)}/reader-document`);

  if (!isValidDocument(document, id)) throw new Error("The server returned an invalid reading document.");
  return { doc: document, source: "online" };
}
