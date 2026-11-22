import { useEffect, useRef, useState } from "react";
import ePub from "epubjs";

import { getEpubFile } from "../../services/epubContent.service";

interface EpubReaderProps {
  materialId: string;
}

export default function EpubReader({ materialId }: EpubReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const bookRef = useRef<ReturnType<typeof ePub> | null>(null);

  const renditionRef = useRef<ReturnType<
    ReturnType<typeof ePub>["renderTo"]
  > | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBook() {
      try {
        setLoading(true);
        setError(null);

        const file = await getEpubFile(materialId);

        if (cancelled) return;

        // Convert the downloaded EPUB into binary data.
        const arrayBuffer = await file.arrayBuffer();

        if (cancelled) return;

        // Create the EPUB book.
        const book = ePub(arrayBuffer);

        bookRef.current = book;

        if (!containerRef.current) {
          throw new Error("The EPUB reader container could not be found.");
        }

        // Render the EPUB inside the reader container.
        const rendition = book.renderTo(containerRef.current, {
          width: "100%",
          height: "100%",
          flow: "paginated",
          spread: "none",
        });

        renditionRef.current = rendition;

        await rendition.display();

        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        console.error("EPUB loading error:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load this EPUB book.",
          );

          setLoading(false);
        }
      }
    }

    loadBook();

    return () => {
      cancelled = true;

      renditionRef.current?.destroy();
      bookRef.current?.destroy();

      renditionRef.current = null;
      bookRef.current = null;
    };
  }, [materialId]);

  async function nextPage() {
    try {
      await renditionRef.current?.next();
    } catch (err) {
      console.error("Could not move to the next page:", err);
    }
  }

  async function previousPage() {
    try {
      await renditionRef.current?.prev();
    } catch (err) {
      console.error("Could not move to the previous page:", err);
    }
  }

  return (
    <div className="epub-reader">
      {loading && (
        <div className="epub-reader__message">Loading your book...</div>
      )}

      {error && (
        <div className="epub-reader__error">
          <h3>Unable to open this book</h3>
          <p>{error}</p>
        </div>
      )}

      <div
        ref={containerRef}
        className="epub-reader__content"
        style={{ display: loading || error ? "none" : "block" }}
      />

      {!loading && !error && (
        <div className="epub-reader__controls">
          <button onClick={previousPage}>Previous</button>

          <button onClick={nextPage}>Next</button>
        </div>
      )}
    </div>
  );
}
