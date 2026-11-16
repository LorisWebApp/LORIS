import { supabase } from "../../services/supabase";

/** Only these fixed SELECT operations are exposed to the chatbot. No user-supplied SQL is executed. */
export type ChatbotDataIntent =
  | { type: "search_materials"; term: string }
  | { type: "count_materials"; term: string }
  | { type: "categories" }
  | { type: "bookmarks" }
  | { type: "notes" }
  | { type: "highlights" }
  | { type: "favourites" }
  | { type: "reading_progress" }
  | { type: "offline_downloads" };

interface MaterialRow {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  file_type: string | null;
  category_id: string | null;
}

function safeSearchTerm(value: string): string {
  return value.replace(/[,%()]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error("I couldn't verify your session. Please sign in again.");
  if (!data.user) throw new Error("Please sign in to LORIS to use database-powered chatbot queries.");
  return data.user;
}

async function materialCategoryNames(rows: MaterialRow[]): Promise<Map<string, string>> {
  const ids = [...new Set(rows.map((row) => row.category_id).filter((id): id is string => Boolean(id)))];
  if (!ids.length) return new Map();
  const { data, error } = await supabase.from("categories").select("id,name").in("id", ids);
  if (error) throw new Error("I found materials, but couldn't retrieve their category names.");
  return new Map((data ?? []).map((category) => [String(category.id), String(category.name)]));
}

function formatMaterials(rows: MaterialRow[], categories: Map<string, string>): string {
  if (!rows.length) return "I couldn't find any published materials matching that search.";
  const lines = rows.slice(0, 8).map((row, index) => {
    const details = [row.author ? `by ${row.author}` : null, row.category_id ? categories.get(row.category_id) : null, row.file_type]
      .filter(Boolean).join(" • ");
    return `${index + 1}. ${row.title}${details ? ` — ${details}` : ""}`;
  });
  return `Here are the matching published materials I found (showing up to 8):\n${lines.join("\n")}`;
}

async function getOwnRows<T extends Record<string, unknown>>(
  table: string,
  columns: string,
  limit = 10,
): Promise<T[]> {
  const user = await requireUser();
  // Table names and column lists are internal constants selected by the switch below.
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("I couldn't retrieve your records. Please try again.");
  return (data ?? []) as T[];
}

export async function executeChatbotDataQuery(intent: ChatbotDataIntent): Promise<string> {
  try {
    if (intent.type === "categories") {
      await requireUser();
      const { data, error } = await supabase.from("categories").select("name,description").order("name").limit(100);
      if (error) throw new Error("I couldn't retrieve the categories.");
      if (!data?.length) return "There are currently no categories available.";
      return `Available catalogue categories:\n${data.map((item, index) => `${index + 1}. ${item.name}${item.description ? ` — ${item.description}` : ""}`).join("\n")}`;
    }

    if (intent.type === "search_materials") {
      await requireUser();
      const term = safeSearchTerm(intent.term);
      const { data, error } = await supabase.rpc("chatbot_search_materials", {
        p_search_term: term || null,
        p_limit: 8,
      });
      if (error) throw new Error("I couldn't search the catalogue. Please try again.");
      const rows = (data ?? []) as MaterialRow[];
      return formatMaterials(rows, await materialCategoryNames(rows));
    }

    if (intent.type === "count_materials") {
      await requireUser();
      const term = safeSearchTerm(intent.term);
      const { data: count, error } = await supabase.rpc("chatbot_count_materials", {
        p_search_term: term || null,
      });
      if (error) throw new Error("I couldn't count the catalogue materials.");
      const total = Number(count ?? 0);
      return `There ${total === 1 ? "is" : "are"} ${total} published material${total === 1 ? "" : "s"}${term ? ` matching “${term}”` : " available to your account"}.`;
    }

    const configs: Record<Exclude<ChatbotDataIntent["type"], "search_materials" | "count_materials" | "categories">, { table: string; columns: string; label: string; format: (row: Record<string, unknown>) => string }> = {
      bookmarks: { table: "user_bookmarks", columns: "bookmark_name,page_number,material_id,created_at", label: "bookmarks", format: (r) => `${String(r.bookmark_name || "Bookmark")}${r.page_number ? ` (page ${r.page_number})` : ""}` },
      notes: { table: "user_notes", columns: "note_title,note_content,page_number,material_id,created_at", label: "notes", format: (r) => `${String(r.note_title || "Untitled note")}${r.page_number ? ` (page ${r.page_number})` : ""}: ${String(r.note_content || "")}` },
      highlights: { table: "user_highlights", columns: "highlighted_text,highlight_color,page_number,material_id,created_at", label: "highlights", format: (r) => `${String(r.highlighted_text || "(empty highlight)")}${r.page_number ? ` (page ${r.page_number})` : ""}` },
      favourites: { table: "user_favourites", columns: "material_id,created_at", label: "favourites", format: (r) => `Material ID: ${String(r.material_id)}` },
      reading_progress: { table: "reading_progress", columns: "material_id,current_page,total_pages,progress_percentage,completed,last_read_at,created_at", label: "reading progress records", format: (r) => `Material ${String(r.material_id)} — ${r.completed ? "completed" : `${String(r.progress_percentage ?? 0)}% complete (page ${String(r.current_page ?? 0)} of ${String(r.total_pages ?? "?")})`}` },
      offline_downloads: { table: "offline_downloads", columns: "material_id,download_status,downloaded_at,expires_at,created_at", label: "offline downloads", format: (r) => `Material ${String(r.material_id)} — ${String(r.download_status)}${r.expires_at ? ` (access expires ${String(r.expires_at)})` : ""}` },
    };
    const config = configs[intent.type];
    const rows = await getOwnRows<Record<string, unknown>>(config.table, config.columns);
    if (!rows.length) return `You don't have any ${config.label} yet.`;
    return `Your ${config.label}:\n${rows.map((row, index) => `${index + 1}. ${config.format(row)}`).join("\n")}`;
  } catch (error) {
    return error instanceof Error ? error.message : "I couldn't complete that database query. Please try again.";
  }
}
