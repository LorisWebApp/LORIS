import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabase";
import {
  PageHeader, DataTable, Button, StatusBadge,
  ConfirmationDialog, ToastNotification, SearchBar, Modal
} from "../shared";
import { FileText, Video, Headphones, Image as ImageIcon } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/+$/, "");

/* ------------------------------------------------------------------ */
/*  EDIT FORM                                                          */
/*  Lives in its own component with its own state. Typing here does    */
/*  NOT re-render the whole page, so the Modal no longer loses focus   */
/*  (the "greys out after one letter" bug).                            */
/* ------------------------------------------------------------------ */
function EditMaterialForm({
  material,
  onClose,
  onSaved,
  onError,
}: {
  material: any;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [title, setTitle] = useState(material.title || "");
  const [author, setAuthor] = useState(material.author || "");
  const [description, setDescription] = useState(material.description || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Create the preview URL once per file (not on every keystroke)
  const previewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile]
  );
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSave = async () => {
    if (isUpdating) return;
    if (!title.trim()) {
      onError("Error: Title cannot be empty.");
      return;
    }
    setIsUpdating(true);

    try {
      let newImageUrl = material.image_url;

      if (imageFile) {
        const formPayload = new FormData();
        formPayload.append("coverImage", imageFile);

        const res = await fetch(`${API_BASE}/api/upload`, {
          method: "POST",
          body: formPayload,
        });
        const uploadData = await res.json();
        if (res.ok && uploadData.coverUrl) {
          newImageUrl = uploadData.coverUrl;
        } else {
          throw new Error("Cover image upload failed.");
        }
      }

      // .select() makes Supabase return the updated rows, so we can tell
      // when a security (RLS) policy silently blocked the update.
      const { data, error } = await supabase
        .from("materials")
        .update({
          title: title.trim(),
          author,
          description,
          image_url: newImageUrl,
        })
        .eq("id", material.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(
          "Update was blocked. Check the Supabase policy for UPDATE on the materials table."
        );
      }

      onSaved();
    } catch (error: any) {
      console.error("Update failed:", error);
      onError("Error updating: " + (error.message || "Unknown error"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-5 pt-4"
      >
        <div>
          <label className="block text-[13px] font-semibold uppercase tracking-widest text-muted mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-b border-line bg-transparent py-2 text-[16px] text-deep outline-none focus:border-deep transition-colors"
          />
        </div>

        <div>
          <label className="block text-[13px] font-semibold uppercase tracking-widest text-muted mb-2">Author</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full border-b border-line bg-transparent py-2 text-[16px] text-deep outline-none focus:border-deep transition-colors"
          />
        </div>

        <div>
          <label className="block text-[13px] font-semibold uppercase tracking-widest text-muted mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-line bg-transparent p-3 rounded-md text-[15px] text-deep outline-none focus:border-deep transition-colors h-24 resize-none"
          />
        </div>

        <div>
          <label className="block text-[13px] font-semibold uppercase tracking-widest text-muted mb-2">Replace Cover Image</label>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-mint rounded border border-line flex items-center justify-center overflow-hidden shrink-0">
              {previewUrl ? (
                <img src={previewUrl} className="h-full w-full object-cover" />
              ) : material.image_url ? (
                <img src={material.image_url} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon size={20} className="text-muted" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full text-[14px] text-ink file:mr-4 file:border-0 file:bg-mint file:px-4 file:py-2 file:text-[14px] file:font-semibold file:text-deep hover:file:bg-line transition-colors"
            />
          </div>
        </div>
      </form>

      {/* Buttons sit inside the modal body, so they always show.
          They are outside the <form> so a click cannot save twice. */}
      <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-line">
        <Button variant="text" onClick={onClose} disabled={isUpdating}>Cancel</Button>
        <Button onClick={handleSave} loading={isUpdating}>Save Changes</Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */
export default function ManageMaterials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Action states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Which material is being edited (the form state itself lives in EditMaterialForm)
  const [editingMaterial, setEditingMaterial] = useState<any>(null);

  const fetchMaterials = async () => {
    const { data } = await supabase
      .from("materials")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setMaterials(data);
  };

  useEffect(() => { fetchMaterials(); }, []);

  // Stable function, so the Modal does not see a "new" onClose on every render
  const closeEdit = useCallback(() => setEditingMaterial(null), []);

  // --- ACTIONS ---

  const confirmArchive = async () => {
    if (!archiveId) return;

    const { data, error } = await supabase
      .from("materials")
      .update({ status: "archived" })
      .eq("id", archiveId)
      .select();

    setArchiveId(null);

    if (error || !data || data.length === 0) {
      console.error("Archive failed:", error);
      setToastMessage("Error archiving: " + (error?.message || "blocked by a database policy."));
      return;
    }

    fetchMaterials();
    setToastMessage("Material archived successfully.");
  };

      const confirmDelete = async () => {
    if (!deleteId || isDeleting) return;
    setIsDeleting(true);

    try {
      const material = materials.find((m) => m.id === deleteId);

      const { data, error } = await supabase
        .from("materials")
        .delete()
        // ... rest of the code
        .eq("id", deleteId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Delete was blocked by the database.");
      }
      
      // ... rest of your code

      // ... rest of your R2 deletion code ...

      // 2) Remove the files from Cloudflare R2
      if (material) {
        const files = [material.file_url, material.image_url].filter(Boolean);
        if (files.length > 0) {
          try {
            const res = await fetch(`${API_BASE}/api/delete`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileUrls: files }),
            });
            if (!res.ok) {
              console.error("R2 delete responded with status", res.status);
            }
          } catch (err) {
            console.error("Failed to delete files from R2:", err);
          }
        }
      }

      setDeleteId(null);
      fetchMaterials();
      setToastMessage("Material permanently deleted.");
    } catch (err: any) {
      console.error("Delete failed:", err);
      setDeleteId(null);
      setToastMessage("Error deleting: " + (err.message || "Unknown error"));
    } finally {
      setIsDeleting(false);
    }
  };


  const filteredMaterials = materials.filter((mat) =>
    (mat.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- TABLE COLUMNS ---
  const columns = [
    { key: "title", header: "Material Name", cell: (row: any) => (
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-mint rounded overflow-hidden flex items-center justify-center shrink-0 border border-line">
          {row.image_url || row.file_type?.includes('image') ? (
            <img src={row.image_url || row.file_url} className="h-full w-full object-cover" />
          ) : row.file_type?.includes('pdf') ? (
            <FileText size={18} className="text-red-500" />
          ) : row.file_type?.includes('audio') ? (
            <Headphones size={18} className="text-purple-500" />
          ) : (
            <Video size={18} className="text-blue-500" />
          )}
        </div>
        <div>
          <p className="font-semibold text-deep">{row.title}</p>
          <p className="text-[14px] text-muted">{row.author || "Unknown"}</p>
        </div>
      </div>
    )},
    { key: "status", header: "Status", cell: (row: any) => (
      row.status === "archived"
        ? <StatusBadge label="Archived" variant="warning" dot />
        : <StatusBadge label="Published" variant="success" dot />
    )},
    { key: "actions", header: "Actions", align: "right" as const, cell: (row: any) => (
      <div className="flex justify-end gap-2">
        <Button variant="text" onClick={() => setEditingMaterial(row)}>Edit</Button>
        {row.status !== 'archived' && (
          <Button variant="outline" onClick={() => setArchiveId(row.id)}>Archive</Button>
        )}
        <Button variant="danger" onClick={() => setDeleteId(row.id)}>Delete</Button>
      </div>
    )}
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-serif pb-20">

      {/* DEEP GREEN HEADER */}
      <div className="relative bg-deep text-white w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity"
          style={{ maskImage: 'linear-gradient(to left, black, transparent)' }}
        ></div>
        <div className="relative z-10 max-w-[1312px] mx-auto px-8 py-10">
          <PageHeader
            title="Library Management"
            description="Review, edit, and organise your library materials."
            breadcrumbs={[{ label: "Dashboard", to: "/manage" }, { label: "Materials" }]}
            actions={<Button to="/upload" variant="secondary">Upload Material</Button>}
            tone="dark"
            className="bg-transparent"
          />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-[1312px] mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-deep">All Materials</h2>
            <p className="text-[15px] text-muted">Manage your library's files and metadata.</p>
          </div>
          <div className="w-72">
            <SearchBar placeholder="Search materials..." value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>

        <div className="bg-white border border-line shadow-sm rounded-lg p-6">
          <DataTable
            columns={columns}
            rows={filteredMaterials}
            getRowKey={(r: any) => r.id}
            caption="Library materials"
          />
        </div>
      </main>

      {/* EDIT MODAL */}
      {editingMaterial && (
        <Modal
          open={true}
          onClose={closeEdit}
          title="Edit Material"
          description="Update the metadata or replace the cover image."
        >
          <EditMaterialForm
            key={editingMaterial.id}
            material={editingMaterial}
            onClose={closeEdit}
            onSaved={() => {
              setEditingMaterial(null);
              fetchMaterials();
              setToastMessage("Material updated successfully.");
            }}
            onError={(msg) => setToastMessage(msg)}
          />
        </Modal>
      )}

      {/* ARCHIVE CONFIRMATION */}
      <ConfirmationDialog
        open={!!archiveId}
        title="Archive Material"
        description="Are you sure you want to archive this? It will be hidden from the catalogue, but the files will be kept safe."
        tone="default"
        confirmLabel="Archive"
        onConfirm={confirmArchive}
        onCancel={() => setArchiveId(null)}
      />

      {/* DELETE CONFIRMATION */}
      <ConfirmationDialog
        open={!!deleteId}
        title="Delete Material Permanently"
        description="Are you sure? This will permanently delete the record AND the files from Cloudflare. This cannot be undone."
        tone="danger"
        confirmLabel={isDeleting ? "Deleting..." : "Delete Forever"}
        onConfirm={confirmDelete}
        onCancel={() => !isDeleting && setDeleteId(null)}
      />

      <ToastNotification
        open={!!toastMessage}
        message={toastMessage || ""}
        variant={toastMessage?.includes("Error") ? "error" : "success"}
        placement="top-right"
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}