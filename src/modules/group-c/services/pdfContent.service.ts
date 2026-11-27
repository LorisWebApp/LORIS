/**
 * Builds a Group C ReaderDocument from a PDF by extracting its text in the browser.
 * The file is fetched through the authenticated API (never a public storage URL) and the
 * result lives in memory only. Image-only (scanned) PDFs have no extractable text and are reported as such.
 */
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type {
  ReaderDocument,
  ReaderChapter,
  ReaderPage,
} from "../types/reader.types";
import { getAccessToken } from "../../../integration/loris";
import { toHttps } from "../../../lib/secureUrl";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

type Item = { str: string; transform: number[]; hasEOL?: boolean };

/** Groups positioned text items into lines, then lines into paragraphs by vertical gap. */
export function itemsToParagraphs(items: Item[]): string[] {
  const rows: { y: number; h: number; parts: { x: number; s: string }[] }[] =
    [];
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const y = it.transform[5];
    const h = Math.abs(it.transform[3]) || 10;
    const x = it.transform[4];
    const row = rows.find((r) => Math.abs(r.y - y) < h * 0.5);
    if (row) row.parts.push({ x, s: it.str });
    else rows.push({ y, h, parts: [{ x, s: it.str }] });
  }
  rows.sort((a, b) => b.y - a.y);
  const paragraphs: string[] = [];
  let current: string[] = [];
  let prev: (typeof rows)[number] | null = null;
  for (const row of rows) {
    const line = row.parts
      .sort((a, b) => a.x - b.x)
      .map((p) => p.s)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (!line) continue;
    if (
      prev &&
      prev.y - row.y > Math.max(prev.h, row.h) * 1.8 &&
      current.length
    ) {
      paragraphs.push(current.join(" "));
      current = [];
    }
    current.push(line);
    prev = row;
  }
  if (current.length) paragraphs.push(current.join(" "));
  return paragraphs;
}

async function fetchPdf(materialId: string): Promise<ArrayBuffer> {
  const token = await getAccessToken();
  if (!token) throw new Error("Sign in to read this material.");
  const base = toHttps(
    ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "")
      .trim()
      .replace(/\/+$/, ""),
  );
  const res = await fetch(
    `${base}/api/materials/${encodeURIComponent(materialId)}/file`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok)
    throw new Error(
      res.status === 404
        ? "This material is not available."
        : "The PDF could not be loaded.",
    );
  return res.arrayBuffer();
}

export async function getPdfReaderDocument(
  materialId: string,
  title = "Untitled document",
  author = "",
): Promise<ReaderDocument> {
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(await fetchPdf(materialId)),
  }).promise;
  try {
    const pages: ReaderPage[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      pages.push({
        number: n,
        chapterId: "ch-1",
        paragraphs: itemsToParagraphs(content.items as Item[]),
      });
    }
    if (!pages.some((p) => p.paragraphs.length))
      throw new Error(
        "This PDF has no selectable text (it may be a scan), so it cannot be opened in the text reader. Use ΓÇ£View pagesΓÇ¥ on the material page instead.",
      );
    const chapters: ReaderChapter[] = [];
    try {
      const outline = await doc.getOutline();
      for (const [i, o] of (outline ?? []).entries()) {
        let pageNo = 1;
        try {
          const dest =
            typeof o.dest === "string"
              ? await doc.getDestination(o.dest)
              : o.dest;
          if (dest) pageNo = (await doc.getPageIndex(dest[0])) + 1;
        } catch {
          /* keep page 1 */
        }
        chapters.push({
          id: `ch-${i + 1}`,
          title: o.title || `Section ${i + 1}`,
          page: pageNo,
        });
      }
    } catch {
      /* no outline */
    }
    if (!chapters.length) chapters.push({ id: "ch-1", title: title, page: 1 });
    chapters.sort((a, b) => a.page - b.page);
    // Assign each page to the last chapter that starts on or before it.
    for (const p of pages)
      p.chapterId =
        [...chapters].reverse().find((c) => c.page <= p.number)?.id ??
        chapters[0].id;
    return { id: materialId, title, author, format: "PDF", chapters, pages };
  } finally {
    void doc.destroy();
  }
}
