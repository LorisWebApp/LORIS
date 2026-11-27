import { useState, useEffect } from "react";
import { supabase } from "../../../supabase";
import { useAuth } from "../../group-a/contexts/AuthContext";
import { getUploadAuthContext, getUploadApiBaseUrl } from "../services/uploadAuth";
import { 
  PageHeader, DataTable, Button, StatusBadge, 
  ConfirmationDialog, ToastNotification, SearchBar, Modal
} from "../../../shared";
import { FileText, Video, Headphones, Image as ImageIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  EDIT FORM (Isolated Component to fix the greying-out bug)          */
/* ------------------------------------------------------------------ */
function EditMaterialForm({ material, onClose, onSaved, onError }: { material: any, onClose: () => void, onSaved: () => void, onError: (msg: string) => void }) {
  const [title, setTitle] = useState(material.title || "");
  const [author, setAuthor] = useState(material.author || "");
  const [description, setDescription] = useState(material.description || "");
  const [categoryId, setCategoryId] = useState(material.category_id || ""); // Start with the material's existing category
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Fetch categories
  useEffect(() => {
    supabase.from("categories").select("id, name").order("name").then(({ data }) => {
      if (data) {
        setCategories(data);
        // If the material had no category, default to the first one
        if (!categoryId && data.length > 0) {
          setCategoryId(data[0].id);
        }
      }
    });
  }, [categoryId]);

  const handleSave = async () => {
    if (isUpdating) return;
    if (!title.trim()) return onError("Title cannot be empty.");
    if (!categoryId) return onError("Please select a category."); // Safety check
    setIsUpdating(true);

    try {
      let newImageUrl = material.image_url;

      if (imageFile) {
        const authContext = await getUploadAuthContext(material.organisation_id);
        const formPayload = new FormData();
        formPayload.append("coverImage", imageFile);
        const apiBaseUrl = getUploadApiBaseUrl();

        const res = await fetch(`${apiBaseUrl}/api/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authContext.accessToken}`,
            "X-Organisation-Id": String(authContext.organisationId),
          },
          body: formPayload,
        });
        const uploadData = await res.json();
        if (!res.ok) throw new Error(uploadData.error || "Cover image upload failed.");
        newImageUrl = uploadData.coverUrl;
      }

      const { error } = await supabase
        .from("materials")
        .update({ 
          title: title.trim(), 
          author, 
          description, 
          category_id: categoryId, // Now guaranteed to be a valid UUID
          image_url: newImageUrl 
        })
        .eq("id", material.id);

      if (error) throw error;
      onSaved();
    } catch (error: any) {
      onError("Update failed: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-5 pt-4 max-h-[60vh] overflow-y-auto pr-2">
      <div>
        <label className="block text-[13px] font-semibold uppercase tracking-widest text-muted mb-2">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border-b border-line bg-transparent py-2 text-[16px] text-deep outline-none focus:border-deep transition-colors" />
      </div>
      <div>
        <label className="block text-[13px] font-semibold uppercase tracking-widest text-muted mb-2">Author</label>
        <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full border-b border-line bg-transparent py-2 text-[16px] text-deep outline-none focus:border-deep transition-colors" />
      </div>
      <div>
        <label className="block text-[13px] font-semibold uppercase tracking-widest text-muted mb-2">Category</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full border-b border-line bg-transparent py-2 text-[16px] text-deep outline-none focus:border-deep transition-colors cursor-pointer">
          {categories.length === 0 && <option value="">Loading...</option>}
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[13px] font-semibold uppercase tracking-widest text-muted mb-2">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-line bg-transparent p-3 rounded-md text-[15px] text-deep outline-none focus:border-deep transition-colors h-24 resize-none" />
      </div>
      <div>
        <label className="block text-[13px] font-semibold uppercase tracking-widest text-muted mb-2">Replace Cover Image</label>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-mint rounded border border-line flex items-center justify-center overflow-hidden shrink-0">
            {imageFile ? <img src={URL.createObjectURL(imageFile)} className="h-full w-full object-cover" /> : material.image_url ? <img src={material.image_url} className="h-full w-full object-cover" /> : <ImageIcon size={20} className="text-muted" />}
          </div>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-[14px] text-ink file:mr-4 file:border-0 file:bg-mint file:px-4 file:py-2 file:text-[14px] file:font-semibold file:text-deep hover:file:bg-line transition-colors" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-line">
        <Button variant="text" onClick={onClose} disabled={isUpdating}>Cancel</Button>
        <Button onClick={handleSave} loading={isUpdating}>Save Changes</Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN PAGE                                                          */
/* ------------------------------------------------------------------ */
export default function ManageMaterials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { memberships } = useAuth();
  const adminOrgKey = memberships.filter((m) => m.status === "active" && m.role === "admin").map((m) => m.organisation_id).sort((a, b) => a - b).join(",");

  const fetchMaterials = async () => {
    const ids = adminOrgKey ? adminOrgKey.split(",").map(Number) : [];
    if (!ids.length) { setMaterials([]); return; }
    const { data, error } = await supabase.from("materials").select("*").in("organisation_id", ids).order("created_at", { ascending: false });
    if (error) { setToastMessage(`Could not load materials: ${error.message}`); return; }
    setMaterials(data ?? []);
  };

  useEffect(() => { void fetchMaterials(); }, [adminOrgKey]);

  const handleArchiveToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'archived' ? 'published' : 'archived';
    const { error } = await supabase.from("materials").update({ status: newStatus }).eq("id", id);
    if (error) return setToastMessage(`Error: ${error.message}`);
    fetchMaterials();
    setToastMessage(`Material ${newStatus === 'archived' ? 'archived' : 'unarchived'} successfully.`);
    setArchiveId(null);
  };

  const confirmDelete = async () => {
    if (!deleteId || isDeleting) return;
    setIsDeleting(true);
    try {
      const material = materials.find(m => m.id === deleteId);
      if (material) {
        const files = [material.file_url, material.image_url].filter(Boolean);
        if (files.length > 0) {
          const authContext = await getUploadAuthContext(material.organisation_id);
          const res = await fetch(`${getUploadApiBaseUrl()}/api/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${authContext.accessToken}` },
            body: JSON.stringify({ materialId: material.id, fileUrls: files }),
          });
          if (!res.ok) throw new Error("Stored files could not be deleted.");
        }
      }
      const { error } = await supabase.from("materials").delete().eq("id", deleteId);
      if (error) throw error;
      setDeleteId(null);
      fetchMaterials();
      setToastMessage("Material permanently deleted.");
    } catch (error: any) {
      setToastMessage(error.message || "The material could not be deleted.");
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMaterials = materials.filter((mat) => mat.title.toLowerCase().includes(searchQuery.toLowerCase()));

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
        
        {/* FIXED: Archive/Unarchive Toggle */}
        <Button variant="outline" onClick={() => handleArchiveToggle(row.id, row.status)}>
          {row.status === 'archived' ? 'Unarchive' : 'Archive'}
        </Button>
        
        <Button variant="danger" onClick={() => setDeleteId(row.id)}>Delete</Button>
      </div>
    )}
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-serif pb-20">
      <div className="relative bg-deep text-white w-full overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminance" style={{ maskImage: 'linear-gradient(to left, black, transparent)' }}></div>
        <div className="relative z-10 max-w-[1312px] mx-auto px-8 py-10">
          <PageHeader title="Library Management" description="Review, edit, and organise your library materials." breadcrumbs={[{ label: "Dashboard", to: "/manage" }, { label: "Materials" }]} actions={<Button to="/upload" variant="secondary">Upload Material</Button>} tone="dark" className="bg-transparent" />
        </div>
      </div>

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
          <DataTable columns={columns} rows={filteredMaterials} getRowKey={(r: any) => r.id} caption="Library materials" />
        </div>
      </main>

      {/* EDIT MODAL (Now using the isolated component) */}
      {editingMaterial && (
        <Modal open={true} onClose={() => setEditingMaterial(null)} title="Edit Material" description="Update the metadata or replace the cover image.">
          <EditMaterialForm 
            material={editingMaterial} 
            onClose={() => setEditingMaterial(null)} 
            onSaved={() => { setEditingMaterial(null); fetchMaterials(); setToastMessage("Material updated successfully."); }} 
            onError={(msg) => setToastMessage(msg)} 
          />
        </Modal>
      )}

      <ConfirmationDialog open={!!archiveId} title="Toggle Archive" description="Change the visibility of this material." tone="default" confirmLabel="Confirm" onConfirm={() => {}} onCancel={() => setArchiveId(null)} />

      <ConfirmationDialog open={!!deleteId} title="Delete Material Permanently" description="Are you sure? This will permanently delete the record AND the files from Cloudflare. This cannot be undone." tone="danger" confirmLabel={isDeleting ? "Deleting..." : "Delete Forever"} onConfirm={confirmDelete} onCancel={() => !isDeleting && setDeleteId(null)} />

      <ToastNotification open={!!toastMessage} message={toastMessage || ""} variant={toastMessage?.includes("Error") || toastMessage?.includes("failed") ? "error" : "success"} placement="top-right" onClose={() => setToastMessage(null)} />
    </div>
  );
}