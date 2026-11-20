import { useEffect, useState } from "react";

import type { LibraryMaterial } from "../../types/userLibrary.types";
import { cx } from "./sharedUi";

interface CoverTheme {
  background: string;
  text: string;
  muted: string;
}

const THEMES: {
  test: RegExp;
  theme: CoverTheme;
}[] = [
  {
    test: /personal|growth/i,
    theme: {
      background: "#E9DFC6",
      text: "#3B2F1D",
      muted: "#7A6A4F",
    },
  },
  {
    test: /science|nature/i,
    theme: {
      background: "#0A3D42",
      text: "#F0FAFB",
      muted: "#A8D9DC",
    },
  },
  {
    test: /design|society/i,
    theme: {
      background: "#76846F",
      text: "#F3F5EE",
      muted: "#E0E5D9",
    },
  },
  {
    test: /art|history|culture/i,
    theme: {
      background: "#D3BC93",
      text: "#3A2F1F",
      muted: "#6B5B43",
    },
  },
  {
    test: /literature|fiction|novel/i,
    theme: {
      background: "#D8CFBD",
      text: "#2C3A34",
      muted: "#626D65",
    },
  },
];

const FALLBACK: CoverTheme = {
  background: "#164E49",
  text: "#EEF5F1",
  muted: "#C0D8D0",
};

/** Returns the generated cover colours for a material category. */
export function getCoverTheme(category: string): CoverTheme {
  return THEMES.find((item) => item.test.test(category))?.theme ?? FALLBACK;
}

export interface BookCoverProps {
  material: Pick<LibraryMaterial, "title" | "author" | "category" | "coverUrl">;

  /** thumb for small covers in rows, card for larger shelf covers. */
  size?: "thumb" | "card";

  className?: string;
}

/**
 * Displays an uploaded cover image.
 * If no image exists or loading fails, generates a category-based cover.
 */
export function BookCover({
  material,
  size = "card",
  className,
}: BookCoverProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [material.coverUrl]);

  const label = `Cover of ${material.title} by ${material.author}`;

  if (material.coverUrl && !failed) {
    return (
      <img
        src={material.coverUrl}
        alt={label}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cx("size-full object-cover", className)}
      />
    );
  }

  const theme = getCoverTheme(material.category);
  const isThumb = size === "thumb";

  return (
    <div
      role="img"
      aria-label={label}
      style={{
        backgroundColor: theme.background,
        color: theme.text,
      }}
      className={cx(
        "flex size-full flex-col justify-between overflow-hidden",
        isThumb ? "p-1.5" : "p-5",
        className,
      )}
    >
      {isThumb ? (
        <span aria-hidden="true" />
      ) : (
        <span
          style={{ color: theme.muted }}
          className="text-[11px] font-semibold uppercase tracking-[0.16em]"
        >
          {material.category}
        </span>
      )}

      <span
        className={cx(
          "font-serif font-medium",
          isThumb
            ? "line-clamp-3 text-[10px] leading-[1.1]"
            : "line-clamp-4 text-[30px] leading-[1.05]",
        )}
      >
        {material.title}
      </span>

      <span
        style={{ color: theme.muted }}
        className={cx(
          "line-clamp-2 uppercase",
          isThumb
            ? "text-[5px] tracking-[0.08em]"
            : "text-[11px] tracking-[0.14em]",
        )}
      >
        {material.author}
      </span>
    </div>
  );
}
