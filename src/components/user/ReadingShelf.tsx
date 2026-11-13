import { BookOpen, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { USER_ROUTES } from "../../config/userRoutes";
import type {
  DashboardCounts,
  LibraryMaterial,
  MaterialKind,
  ShelfEntry,
} from "../../types/userLibrary.types";
import { buildMaterialEntry } from "./materialEntries";
import {
  Button,
  EmptyState,
  MaterialItem,
  MaterialList,
  SectionHeader,
  StatusBadge,
  TabNavigation,
  type MaterialListEntry,
  type TabItem,
} from "./sharedUi";

export interface ReadingShelfProps {
  isDesktop: boolean;
  shelf: ShelfEntry[];
  favourites: LibraryMaterial[];
  bookmarked: LibraryMaterial[];
  counts: DashboardCounts;
  favouriteIds: ReadonlySet<string>;
  offlineMaterialIds: ReadonlySet<string>;
  onToggleFavourite: (materialId: string) => void;
}

type KindFilter = "all" | "book" | "paper" | "media";
type MobileTab = "progress" | "favourites" | "bookmarks";

const KIND_TABS: { id: Exclude<KindFilter, "all">; label: string }[] = [
  { id: "book", label: "Books" },
  { id: "paper", label: "Research Papers" },
  { id: "media", label: "Audio & Video" },
];
const kindMatches = (kind: MaterialKind, filter: KindFilter) =>
  filter === "all" ||
  (filter === "media" ? kind === "audio" || kind === "video" : kind === filter);

const EXPLORE_ID = "__explore__";

function ExploreTile() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[4px] border border-dashed border-ink/30 p-6 text-center">
      <span
        className="grid size-12 place-items-center rounded-full border border-line bg-white text-ink"
        aria-hidden
      >
        <Plus size={20} />
      </span>
      <h3 className="mt-4 font-serif text-[24px] font-medium text-deep">
        Explore Collection
      </h3>
      <p className="mt-1.5 max-w-[220px] text-[15px] leading-6 text-muted">
        Add monographs, research papers or media to your active shelf.
      </p>
      <Button
        to={USER_ROUTES.catalogue}
        variant="outline"
        size="sm"
        className="mt-5"
      >
        Browse Catalogue
      </Button>
    </div>
  );
}

function ShelfEmptyState() {
  return (
    <EmptyState
      icon={<BookOpen size={32} />}
      title="Nothing in progress yet"
      description="Titles you start reading appear here so you can pick up exactly where you stopped."
      action={<Button to={USER_ROUTES.catalogue}>Browse catalogue</Button>}
    />
  );
}

/** "Active Reading Shelf" on desktop; the In Progress / Favourites / Bookmarks tabs + "Continue Reading" list on mobile. */
export function ReadingShelf(props: ReadingShelfProps) {
  return props.isDesktop ? (
    <DesktopShelf {...props} />
  ) : (
    <MobileShelf {...props} />
  );
}

function DesktopShelf({
  shelf,
  favouriteIds,
  onToggleFavourite,
}: ReadingShelfProps) {
  const [filter, setFilter] = useState<KindFilter>("all");

  const tabs = useMemo<TabItem[]>(() => {
    const kindTabs = KIND_TABS.map((t) => ({
      ...t,
      count: shelf.filter((e) => kindMatches(e.material.kind, t.id)).length,
    })).filter((t) => t.count > 0);
    return [{ id: "all", label: "All Active" }, ...kindTabs];
  }, [shelf]);

  const activeFilter = tabs.some((t) => t.id === filter) ? filter : "all";
  const visible = shelf.filter((e) =>
    kindMatches(e.material.kind, activeFilter),
  );

  const entries: MaterialListEntry[] = [
    ...visible.map((e) =>
      buildMaterialEntry(e.material, {
        layout: "card",
        variant: "shelf",
        progress: e.progress,
        isOffline: e.isOffline,
        isFavourite: favouriteIds.has(e.material.id),
        onToggleFavourite,
      }),
    ),
    { id: EXPLORE_ID, title: "Explore Collection", cover: null },
  ];

  return (
    <section aria-label="Active reading shelf">
      <SectionHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            Active Reading Shelf
            <StatusBadge
              variant="neutral"
              label={`${shelf.length} in progress`}
            />
          </span>
        }
        description="Pick up instantly where you stopped across any of your devices."
        actions={
          shelf.length > 0 ? (
            <TabNavigation
              variant="pill"
              aria-label="Filter active reading by type"
              tabs={tabs}
              activeId={activeFilter}
              onChange={(id) => setFilter(id as KindFilter)}
            />
          ) : undefined
        }
      />
      <div className="mt-6">
        {shelf.length === 0 ? (
          <ShelfEmptyState />
        ) : (
          <MaterialList
            aria-label="Materials in progress"
            layout="grid"
            columns={4}
            framed
            materials={entries}
            renderItem={(entry, layout) =>
              entry.id === EXPLORE_ID ? (
                <ExploreTile />
              ) : (
                <MaterialItem {...entry} layout={layout} framed />
              )
            }
          />
        )}
      </div>
    </section>
  );
}

function MobileShelf({
  shelf,
  favourites,
  bookmarked,
  counts,
  favouriteIds,
  offlineMaterialIds,
  onToggleFavourite,
}: ReadingShelfProps) {
  const [tab, setTab] = useState<MobileTab>("progress");

  const tabs: TabItem[] = [
    { id: "progress", label: "In Progress", count: counts.inProgress },
    { id: "favourites", label: "Favourites", count: counts.favourites },
    { id: "bookmarks", label: "Bookmarks", count: counts.bookmarks },
  ];

  const plain = (materials: LibraryMaterial[]): MaterialListEntry[] =>
    materials.map((m) =>
      buildMaterialEntry(m, {
        layout: "compact",
        variant: "shelf",
        isOffline: offlineMaterialIds.has(m.id),
        isFavourite: favouriteIds.has(m.id),
        onToggleFavourite,
      }),
    );

  const entries: MaterialListEntry[] =
    tab === "progress"
      ? shelf.map((e) =>
          buildMaterialEntry(e.material, {
            layout: "compact",
            variant: "shelf",
            progress: e.progress,
            isOffline: e.isOffline,
            isFavourite: favouriteIds.has(e.material.id),
            onToggleFavourite,
          }),
        )
      : plain(tab === "favourites" ? favourites : bookmarked);

  const heading = {
    progress: "Continue Reading",
    favourites: "Favourites",
    bookmarks: "Bookmarked",
  }[tab];
  const viewAll =
    tab === "bookmarks"
      ? { label: "View all", to: USER_ROUTES.notes }
      : {
          label: tab === "progress" ? "All Books" : "View all",
          to: USER_ROUTES.favourites,
        };

  const empty = {
    progress: <ShelfEmptyState />,
    favourites: (
      <EmptyState
        icon={<BookOpen size={28} />}
        title="No favourites yet"
        description="Tap the bookmark on any cover to keep it here."
        className="py-8"
      />
    ),
    bookmarks: (
      <EmptyState
        icon={<BookOpen size={28} />}
        title="No bookmarks yet"
        description="Bookmark a page while reading and it will appear here."
        className="py-8"
      />
    ),
  }[tab];

  return (
    <section aria-label="My reading" className="space-y-5 px-4 pt-6">
      <TabNavigation
        variant="pill"
        aria-label="Choose a reading list"
        tabs={tabs}
        activeId={tab}
        onChange={(id) => setTab(id as MobileTab)}
      />
      {/* The shared SectionHeader title is a fixed 30px desktop size, so mobile uses its own compact heading. */}
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 font-serif text-[22px] font-medium leading-tight text-deep">
          {heading}
        </h2>
        <Button to={viewAll.to} variant="text" size="sm">
          {viewAll.label} ›
        </Button>
      </div>
      <MaterialList
        aria-label={heading}
        layout="compact"
        materials={entries}
        emptyState={empty}
      />
    </section>
  );
}
