import { supabase } from "../../../services/supabase";
import { getLibrary } from "./library.service";

import type {
  DashboardData,
  LibraryMaterial,
  OfflineDownloadStatus,
  AnnotationSummary,
  HighlightColor,
} from "../types/userLibrary.types";

// Convert a Supabase material row into the format used by Group C.
function material(row: Record<string, any>): LibraryMaterial {
  const raw = String(row.file_type ?? "").toLowerCase();

  let format: LibraryMaterial["format"] = "PDF";

  if (raw.includes("epub")) {
    format = "EPUB";
  } else if (raw.includes("audio") || raw.includes("mpeg")) {
    format = "MP3";
  } else if (raw.includes("video") || raw.includes("mp4")) {
    format = "MP4";
  } else if (raw.includes("docx")) {
    format = "DOCX";
  } else if (raw.includes("pptx")) {
    format = "PPTX";
  }

  return {
    id: row.id,
    title: row.title,
    author: row.author ?? "",
    category: row.category?.name ?? "General",
    format,
    kind: format === "MP3" ? "audio" : format === "MP4" ? "video" : "book",
    coverUrl: row.image_url ?? null,
    fileSizeBytes: row.file_size ?? undefined,
  };
}

// Convert the stored highlight colour to a supported Group C colour.
function highlightColor(value: unknown): HighlightColor {
  const color = String(value ?? "").toLowerCase();

  if (
    color === "yellow" ||
    color === "green" ||
    color === "blue" ||
    color === "pink"
  ) {
    return color;
  }

  return "yellow";
}

export async function fetchDashboard(): Promise<DashboardData> {
  // Get the currently authenticated user.
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError) throw authError;

  if (!auth.user) {
    throw new Error("Sign in to load your dashboard.");
  }

  const userId = auth.user.id;

  // Load dashboard information from Supabase.
  const [
    profileResult,
    library,
    materialsResult,
    offlineResult,
    notesResult,
    highlightsResult,
    bookmarksResult,
  ] = await Promise.all([
    supabase
      .from("Profiles")
      .select("full_name")
      .eq("auth_user_id", userId)
      .single(),

    getLibrary(),

    supabase
      .from("materials")
      .select("*, category:categories(name)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(30),

    supabase
      .from("offline_downloads")
      .select("*, material:materials(*)")
      .eq("user_id", userId),

    supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),

    supabase
      .from("user_highlights")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),

    supabase
      .from("user_bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  // Stop if any required query fails.
  for (const result of [
    profileResult,
    materialsResult,
    offlineResult,
    notesResult,
    highlightsResult,
    bookmarksResult,
  ]) {
    if (result.error) throw result.error;
  }

  if (!profileResult.data) {
    throw new Error("Your LORIS profile could not be found.");
  }

  const fullName =
    profileResult.data.full_name || auth.user.email || "LORIS reader";

  // Collect material IDs referenced by bookmarks, notes and highlights.
  const linkedMaterialIds = [
    ...(bookmarksResult.data ?? []).map((row) => row.material_id),
    ...(notesResult.data ?? []).map((row) => row.material_id),
    ...(highlightsResult.data ?? []).map((row) => row.material_id),
  ].filter(Boolean);

  const uniqueLinkedMaterialIds = [...new Set(linkedMaterialIds)];

  // Retrieve materials referenced by user activity.
  // This also allows older annotations to display their material titles.
  let linkedMaterials: Record<string, any>[] = [];

  if (uniqueLinkedMaterialIds.length > 0) {
    const { data, error } = await supabase
      .from("materials")
      .select("*, category:categories(name)")
      .in("id", uniqueLinkedMaterialIds);

    if (error) throw error;

    linkedMaterials = data ?? [];
  }

  // Combine recommendation materials and linked materials.
  const materialMap = new Map<string, LibraryMaterial>();

  for (const row of [...(materialsResult.data ?? []), ...linkedMaterials]) {
    const mapped = material(row as Record<string, any>);
    materialMap.set(mapped.id, mapped);
  }

  const allMaterials = [...materialMap.values()];

  // Get the user's current reading shelf.
  const shelf = [...library.inProgress, ...library.completed];

  // Build the actual bookmarked materials.
  // Multiple bookmarks for different pages of the same material
  // produce one material entry in the dashboard's bookmarked list.
  const bookmarkedIds = [
    ...new Set(
      (bookmarksResult.data ?? []).map((row) => row.material_id as string),
    ),
  ];

  const bookmarked = bookmarkedIds
    .map((id) => materialMap.get(id))
    .filter((item): item is LibraryMaterial => Boolean(item));

  // Convert notes into dashboard annotations.
  const notes: AnnotationSummary[] = (notesResult.data ?? []).map((row) => {
    const linkedMaterial = materialMap.get(row.material_id);

    return {
      id: row.id,
      type: "note",
      materialId: row.material_id,
      materialTitle: linkedMaterial?.title ?? "Unknown material",
      page: Number(row.page_number ?? 1),
      note: row.note_content ?? "",
      createdAt: row.created_at ?? "",
    };
  });

  // Convert highlights into dashboard annotations.
  const highlights: AnnotationSummary[] = (highlightsResult.data ?? []).map(
    (row) => {
      const linkedMaterial = materialMap.get(row.material_id);

      return {
        id: row.id,
        type: "highlight",
        materialId: row.material_id,
        materialTitle: linkedMaterial?.title ?? "Unknown material",
        page: Number(row.page_number ?? 1),
        quote: row.highlighted_text ?? "",
        color: highlightColor(row.highlight_color),
        createdAt: row.created_at ?? "",
      };
    },
  );

  // Combine notes and highlights, newest first.
  const annotations = [...notes, ...highlights].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Convert offline download records.
  const downloads = (offlineResult.data ?? []).flatMap((row) => {
    if (!row.material) return [];

    const status: OfflineDownloadStatus =
      row.download_status === "available"
        ? "ready"
        : row.download_status === "pending"
          ? "downloading"
          : row.download_status === "expired"
            ? "expired"
            : "failed";

    return [
      {
        id: row.id,
        material: material(row.material as Record<string, any>),
        sizeBytes: Number(row.material.file_size ?? 0),
        downloadedAt: row.downloaded_at ?? row.created_at,
        expiresAt: row.expires_at,
        status,
      },
    ];
  });

  // Find the most recently read unfinished material.
  const currentlyReading =
    shelf
      .filter((entry) => !entry.progress.completed)
      .sort(
        (a, b) =>
          new Date(b.progress.lastReadAt).getTime() -
          new Date(a.progress.lastReadAt).getTime(),
      )[0] ?? null;

  // Exclude materials already on the user's shelf or saved lists.
  const excludedIds = new Set([
    ...shelf.map((entry) => entry.material.id),
    ...library.favourites.map((item) => item.id),
    ...bookmarkedIds,
  ]);

  const recommended = allMaterials
    .filter((item) => !excludedIds.has(item.id))
    .slice(0, 6);

  return {
    user: {
      firstName: fullName.split(/\s+/)[0],
      displayName: fullName,
    },

    stats: {
      activeBooks: library.inProgress.length,
      notesAndQuotes: annotations.length,
      offlineReady: downloads.filter((item) => item.status === "ready").length,

      // Historical reading activity is not currently stored.
      // We will implement this after adding reading activity tracking.
      readingStreakDays: 0,
    },

    counts: {
      inProgress: library.inProgress.length,
      favourites: library.favourites.length,
      bookmarks: bookmarksResult.data?.length ?? 0,
    },

    currentlyReading,
    shelf,

    favourites: library.favourites,
    bookmarked,

    favouriteIds: library.favourites.map((item) => item.id),

    annotations,

    offline: {
      downloads,
    },

    recommended,

    lastSyncedAt: new Date().toISOString(),
  };
}

export async function removeOfflineDownload(downloadId: string): Promise<void> {
  if (!downloadId.trim()) {
    throw new Error("A valid download ID is required.");
  }

  const { data: session, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) throw sessionError;

  const userId = session.session?.user.id;

  if (!userId) {
    throw new Error("Sign in to manage offline downloads.");
  }

  const { error } = await supabase
    .from("offline_downloads")
    .delete()
    .eq("id", downloadId)
    .eq("user_id", userId);

  if (error) throw error;
}
