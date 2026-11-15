import { BookOpen } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { buildMaterialEntry } from "../../components/user/materialEntries";

import {
  Alert,
  Button,
  EmptyState,
  FilterDropdown,
  LoadingIndicator,
  MaterialList,
  PageHeader,
  Pagination,
  SearchBar,
  SectionHeader,
  StatDisplay,
  TabNavigation,
  ToastNotification,
} from "../../components/user/sharedUi";

import { USER_ROUTES } from "../../config/userRoutes";

import { useMyLibrary, type LibraryItem } from "../../hooks/useMyLibrary";

import { formatTimeAgo } from "../../utils/libraryFormat";

type Tab = "all" | "reading" | "favourites" | "offline";
type Sort = "recent" | "title" | "author";

const PAGE_SIZE = 6;

const tabMatch: Record<Tab, (item: LibraryItem) => boolean> = {
  all: () => true,

  reading: (item) => Boolean(item.progress) && !item.completed,

  favourites: (item) => item.isFavourite,

  offline: (item) => item.isOffline,
};

/**
 * My Library / Favourites page.
 *
 * Group C – Screen 3.
 * Route: /user/favourites
 */
export function Favourites() {
  const lib = useMyLibrary();

  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [page, setPage] = useState(1);

  const [toast, setToast] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  /**
   * Adds or removes a favourite.
   */
  const toggle = useCallback(
    async (id: string) => {
      const result = await lib.toggleFavourite(id);

      setToast({
        variant: result.ok ? "success" : "error",
        message: result.message,
      });
    },
    [lib.toggleFavourite],
  );

  /**
   * Resets pagination when filters change.
   */
  const resetPage = useCallback(
    <T,>(setter: (value: T) => void) =>
      (value: T) => {
        setter(value);
        setPage(1);
      },
    [],
  );

  /**
   * Counts for the library tabs.
   */
  const counts = useMemo(
    () => ({
      all: lib.items.length,

      reading: lib.items.filter(tabMatch.reading).length,

      favourites: lib.items.filter(tabMatch.favourites).length,

      offline: lib.items.filter(tabMatch.offline).length,
    }),
    [lib.items],
  );

  /**
   * Available material formats.
   */
  const formats = useMemo(
    () => [...new Set(lib.items.map((item) => item.material.format))].sort(),
    [lib.items],
  );

  /**
   * Filters and sorts the library.
   */
  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();

    const filtered = lib.items
      .filter(tabMatch[tab])
      .filter((item) => format === "all" || item.material.format === format)
      .filter((item) => {
        if (!search) return true;

        const searchableText =
          `${item.material.title} ${item.material.author}`.toLowerCase();

        return searchableText.includes(search);
      });

    return [...filtered].sort((a, b) => {
      if (sort === "title") {
        return a.material.title.localeCompare(b.material.title);
      }

      if (sort === "author") {
        return a.material.author.localeCompare(b.material.author);
      }

      return (b.progress?.lastReadAt ?? "").localeCompare(
        a.progress?.lastReadAt ?? "",
      );
    });
  }, [lib.items, tab, format, query, sort]);

  /**
   * Pagination.
   */
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));

  const currentPage = Math.min(page, pageCount);

  const shown = visible.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  /**
   * Clears all active filters.
   */
  const clearFilters = () => {
    setQuery("");
    setFormat("all");
    setTab("all");
    setSort("recent");
    setPage(1);
  };

  const tile = "rounded-[4px] border border-white/15 bg-white/5 px-3 py-3";

  return (
    <div className="min-h-screen">
      {/* Page heading and statistics */}
      <PageHeader
        tone="dark"
        size="md"
        className="px-4 py-10 lg:px-10"
        eyebrow="— Your scholarly workspace"
        title="My Library"
        description="Everything you’ve saved, started and downloaded, in one place."
        meta={
          <div className="mt-2 grid max-w-[640px] grid-cols-2 gap-3 sm:grid-cols-4">
            <StatDisplay
              className={tile}
              tone="inverse"
              label="Favourites"
              value={counts.favourites}
            />

            <StatDisplay
              className={tile}
              tone="inverse"
              label="In progress"
              value={counts.reading}
            />

            <StatDisplay
              className={tile}
              tone="inverse"
              label="Offline"
              value={counts.offline}
            />

            <StatDisplay
              className={tile}
              tone="inverse"
              label="Notes"
              value={lib.noteCount}
            />
          </div>
        }
      />

      <div className="mx-auto w-full max-w-[1312px] px-4 py-8 lg:px-10">
        {/* Tabs and filters */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <TabNavigation
            variant="pill"
            aria-label="Library sections"
            activeId={tab}
            onChange={(id) => resetPage(setTab)(id as Tab)}
            tabs={[
              {
                id: "all",
                label: "All Items",
                count: counts.all,
              },
              {
                id: "reading",
                label: "Continue Reading",
                count: counts.reading,
              },
              {
                id: "favourites",
                label: "Favourites",
                count: counts.favourites,
              },
              {
                id: "offline",
                label: "Offline",
                count: counts.offline,
              },
            ]}
          />

          <div className="flex flex-wrap items-end gap-5">
            <SearchBar
              appearance="line"
              placeholder="Filter by title or author"
              value={query}
              onChange={resetPage(setQuery)}
              className="w-56"
            />

            <FilterDropdown
              label="Format"
              value={format}
              onChange={resetPage(setFormat)}
              options={[
                {
                  value: "all",
                  label: "All formats",
                },
                ...formats.map((itemFormat) => ({
                  value: itemFormat,
                  label: itemFormat,
                })),
              ]}
            />

            <FilterDropdown
              label="Sort"
              align="right"
              value={sort}
              onChange={(value) => resetPage(setSort)(value as Sort)}
              options={[
                {
                  value: "recent",
                  label: "Recently read",
                },
                {
                  value: "title",
                  label: "Title A–Z",
                },
                {
                  value: "author",
                  label: "Author A–Z",
                },
              ]}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section aria-label="Library items">
            {lib.state === "loading" && (
              <LoadingIndicator centered label="Loading your library…" />
            )}

            {lib.state === "error" && (
              <Alert
                severity="error"
                title="We couldn’t load your library"
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void lib.reload()}
                  >
                    Try again
                  </Button>
                }
              >
                Check your connection and try again.
              </Alert>
            )}

            {lib.state === "ready" && (
              <>
                <MaterialList
                  aria-label="Library materials"
                  layout="grid"
                  columns={3}
                  framed
                  materials={shown.map((item) =>
                    buildMaterialEntry(item.material, {
                      layout: "card",
                      variant: "shelf",
                      progress: item.progress,
                      isOffline: item.isOffline,
                      isFavourite: lib.favouriteIds.has(item.material.id),
                      onToggleFavourite: (id) => void toggle(id),
                    }),
                  )}
                  emptyState={
                    <EmptyState
                      icon={<BookOpen size={32} />}
                      title={
                        lib.items.length === 0
                          ? "Your library is empty"
                          : "No matches"
                      }
                      description={
                        lib.items.length === 0
                          ? "Favourite a title in the catalogue and it will appear here."
                          : "Try a different search, filter or section."
                      }
                      action={
                        lib.items.length === 0 ? (
                          <Button to={USER_ROUTES.catalogue}>
                            Browse catalogue
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={clearFilters}>
                            Clear filters
                          </Button>
                        )
                      }
                    />
                  }
                />

                {visible.length > PAGE_SIZE && (
                  <Pagination
                    className="mt-8"
                    page={currentPage}
                    pageCount={pageCount}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </section>

          {/* Recent notes */}
          <aside aria-label="Recent notes">
            <SectionHeader
              title="Recent Notes"
              size="sm"
              as="h2"
              divider
              actions={
                <Button to={USER_ROUTES.notes} variant="text" size="sm">
                  View all ›
                </Button>
              }
            />

            {lib.recentNotes.length === 0 ? (
              <p className="mt-4 text-[15px] text-muted">
                Notes you write while reading appear here.
              </p>
            ) : (
              <ul className="m-0 mt-2 list-none divide-y divide-line p-0">
                {lib.recentNotes.map((note) => (
                  <li key={note.id}>
                    <Link
                      to={USER_ROUTES.reader(note.materialId, note.page)}
                      className="block py-3 hover:bg-mint-soft"
                    >
                      <p className="m-0 text-[14px] text-muted">
                        {note.materialTitle} · p. {note.page} ·{" "}
                        {formatTimeAgo(note.createdAt)}
                      </p>

                      <p className="m-0 mt-1 text-[16px] text-deep">
                        {note.text}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>

      {/* Feedback */}
      <ToastNotification
        open={toast !== null}
        variant={toast?.variant ?? "info"}
        message={toast?.message ?? ""}
        onClose={closeToast}
      />
    </div>
  );
}

export default Favourites;
