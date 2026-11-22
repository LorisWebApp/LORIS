import ePub from "epubjs";
import { API_BASE_URL, getAccessToken, ApiError } from "./userApi";
import type {
  ReaderDocument,
  ReaderChapter,
  ReaderPage,
} from "../types/reader.types";

/**
 * Downloads the original EPUB file from the authenticated backend.
 */
export async function getEpubFile(materialId: string): Promise<Blob> {
  if (!materialId.trim()) {
    throw new Error("A valid material ID is required.");
  }

  const token = await getAccessToken();

  if (!token) {
    throw new ApiError("Please sign in to read this material.", 401);
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/materials/${encodeURIComponent(materialId)}/file`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/epub+zip",
        },
      },
    );
  } catch {
    throw new ApiError("Could not connect to the file server.", 0);
  }

  if (!response.ok) {
    let message = `Could not retrieve the EPUB file (${response.status}).`;

    try {
      const body = await response.json();
      message = body.error || body.message || message;
    } catch {
      // Keep the default error message.
    }

    throw new ApiError(message, response.status);
  }

  const file = await response.blob();

  if (!file.size) {
    throw new Error("The EPUB file is empty.");
  }

  return file;
}

/**
 * Extracts readable text from an EPUB section.
 */
async function extractSectionText(
  section: {
    load: (request: (url: string) => Promise<unknown>) => Promise<Document>;
  },
  request: (url: string) => Promise<unknown>,
): Promise<string[]> {
  const document = await section.load(request);

  const elements = Array.from(
    document.querySelectorAll("h1, h2, h3, h4, h5, h6, p, blockquote, li"),
  );

  const paragraphs = elements
    .map((element) => element.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .filter(Boolean);

  if (paragraphs.length) {
    return paragraphs;
  }

  const bodyText = document.body?.textContent ?? "";

  return bodyText
    .split(/\n+/)
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * Converts extracted EPUB paragraphs into logical reading pages.
 *
 * Each page belongs to a chapter and contains paragraphs
 * compatible with the existing Group C Reader.
 */
function createReadingPages(
  sections: { title: string; paragraphs: string[] }[],
): {
  chapters: ReaderChapter[];
  pages: ReaderPage[];
} {
  const chapters: ReaderChapter[] = [];
  const pages: ReaderPage[] = [];

  let pageNumber = 1;

  const MAX_PARAGRAPHS_PER_PAGE = 5;
  const MAX_CHARACTERS_PER_PAGE = 1800;

  sections.forEach((section, chapterIndex) => {
    if (!section.paragraphs.length) return;

    const chapterId = `chapter-${chapterIndex + 1}`;

    chapters.push({
      id: chapterId,
      title: section.title,
      page: pageNumber,
    });

    let currentParagraphs: string[] = [];
    let currentCharacters = 0;

    const savePage = () => {
      if (!currentParagraphs.length) return;

      pages.push({
        number: pageNumber,
        chapterId,
        paragraphs: currentParagraphs,
      });

      pageNumber += 1;
      currentParagraphs = [];
      currentCharacters = 0;
    };

    section.paragraphs.forEach((paragraph) => {
      const exceedsParagraphLimit =
        currentParagraphs.length >= MAX_PARAGRAPHS_PER_PAGE;

      const exceedsCharacterLimit =
        currentParagraphs.length > 0 &&
        currentCharacters + paragraph.length > MAX_CHARACTERS_PER_PAGE;

      if (exceedsParagraphLimit || exceedsCharacterLimit) {
        savePage();
      }

      currentParagraphs.push(paragraph);
      currentCharacters += paragraph.length;
    });

    savePage();
  });

  return { chapters, pages };
}

/**
 * Downloads and parses an EPUB into the ReaderDocument format
 * expected by the existing Group C Reader.
 */
export async function getEpubReaderDocument(
  materialId: string,
  titleFallback = "Untitled book",
  authorFallback = "",
): Promise<ReaderDocument> {
  const file = await getEpubFile(materialId);
  const arrayBuffer = await file.arrayBuffer();

  const book = ePub(arrayBuffer);

  try {
    await book.ready;

    const metadata = await book.loaded.metadata;

    const sections: {
      title: string;
      paragraphs: string[];
    }[] = [];

    const request = book.load.bind(book);

    // Extract EPUB sections using the supported spine.each() method.
    const sectionPromises: Promise<void>[] = [];

    const extractedSections: Array<
      | {
          title: string;
          paragraphs: string[];
        }
      | undefined
    > = [];

    let sectionIndex = 0;

    book.spine.each(
      (section: {
        load: (request: (url: string) => Promise<unknown>) => Promise<Document>;
      }) => {
        const index = sectionIndex++;

        const sectionPromise = (async () => {
          const paragraphs = await extractSectionText(section, request);

          if (!paragraphs.length) return;

          extractedSections[index] = {
            title: `Chapter ${index + 1}`,
            paragraphs,
          };
        })();

        sectionPromises.push(sectionPromise);
      },
    );

    await Promise.all(sectionPromises);

    sections.push(
      ...extractedSections.filter(
        (
          section,
        ): section is {
          title: string;
          paragraphs: string[];
        } => section !== undefined,
      ),
    );

    const { chapters, pages } = createReadingPages(sections);

    if (!pages.length) {
      throw new Error("This EPUB does not contain readable text content.");
    }

    const metadataTitle =
      typeof metadata.title === "string" ? metadata.title.trim() : "";

    const metadataCreator = Array.isArray(metadata.creator)
      ? metadata.creator.join(", ")
      : typeof metadata.creator === "string"
        ? metadata.creator
        : "";

    return {
      id: materialId,
      title: metadataTitle || titleFallback,
      author: metadataCreator || authorFallback,
      format: "EPUB",
      chapters,
      pages,
    };
  } finally {
    book.destroy();
  }
}
