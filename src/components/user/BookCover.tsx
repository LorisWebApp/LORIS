import { useState } from "react";
import type { LibraryMaterial } from "../../types/userLibrary.types";
import { cx } from "./sharedUi";

interface CoverTheme {
  background: string;
  text: string;
  muted: string;
}

const THEMES: { test: RegExp; theme: CoverTheme }[] = [
  {
    test: /personal|growth/i,
    theme: {
      background: "linear-gradient(165deg,#f2eee5,#e3dccd)",
      text: "#26352f",
      muted: "#6c766f",
    },
  },
  {
    test: /science|nature/i,
    theme: {
      background: "linear-gradient(170deg,#143452,#0a1f35)",
      text: "#eaf1ef",
      muted: "#9fb5bd",
    },
  },
  {
    test: /design|society/i,
    theme: {
      background: "linear-gradient(170deg,#76846f,#434f45)",
      text: "#f3f5ee",
      muted: "#cfd6c8",
    },
  },
  {
    test: /art|history|culture/i,
    theme: {
      background: "linear-gradient(165deg,#e4d3b4,#d3bc93)",
      text: "#3a2f1f",
      muted: "#7a6a50",
    },
  },
  {
    test: /literature|fiction|novel/i,
    theme: {
      background: "linear-gradient(165deg,#e9e3d6,#d8cfbd)",
      text: "#2c3a34",
      muted: "#707a72",
    },
  },
];
const FALLBACK: CoverTheme = {
  background: "linear-gradient(170deg,#1a5247,#0c2f2a)",
  text: "#eef5f1",
  muted: "#a8c4bb",
};

export function getCoverTheme(category: string): CoverTheme {
  return THEMES.find((t) => t.test.test(category))?.theme ?? FALLBACK;
}

export interface BookCoverProps {
  material: Pick<LibraryMaterial, "title" | "author" | "category" | "coverUrl">;
  /** `thumb` for small covers in rows, `card` for large shelf cards. */
  size?: "thumb" | "card";
  className?: string;
}

/** Shows the uploaded cover image, or generated artwork (category colour + title) when there is none. */
export function BookCover({
  material,
  size = "card",
  className,
}: BookCoverProps) {
  const [failed, setFailed] = useState(false);
  const label = `Cover of ${material.title} by ${material.author}`;

  if (material.coverUrl && !failed) {
    return (
      <img
        src={material.coverUrl}
        alt={label}
        onError={() => setFailed(true)}
        className={cx("size-full object-cover", className)}
      />
    );
  }

  const theme = getCoverTheme(material.category);
  const thumb = size === "thumb";
  return (
    <div
      role="img"
      aria-label={label}
      style={{ background: theme.background, color: theme.text }}
      className={cx(
        "flex size-full flex-col justify-between overflow-hidden",
        thumb ? "p-1.5" : "p-5",
        className,
      )}
    >
      {/* Thumbnails skip the category line: the favourite button sits over that corner. */}
      {thumb ? (
        <span aria-hidden />
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
          thumb ? "text-[10px] leading-[1.1]" : "text-[30px] leading-[1.05]",
        )}
      >
        {material.title}
      </span>
      <span
        style={{ color: theme.muted }}
        className={cx(
          "uppercase",
          thumb
            ? "text-[5px] tracking-[0.08em]"
            : "text-[11px] tracking-[0.14em]",
        )}
      >
        {material.author}
      </span>
    </div>
  );
}
