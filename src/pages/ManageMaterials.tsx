import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { 
  PageHeader, DataTable, Button, StatusBadge, 
  ConfirmationDialog, ToastNotification, SearchBar, Modal
} from "../shared";
import { FileText, Video, Headphones, Image as ImageIcon } from "lucide-react";

export default function ManageMaterials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Action States
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit States
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchMaterials = async () => {
    const { data } = await supabase.from("materials").select("*").order("created_at", { ascending: false });
    if (data) setMaterials(data);
  };

  useEffect(() => { fetchMaterials(); }, []);

  // --- ACTIONS ---

  const confirmArchive = async () => {
    if (!archiveId) return;
    await supabase.from("materials").update({ status: "archived" }).eq("id", archiveId);
    setArchiveId(null);
    fetchMaterials();
    setToastMessage("Material archived successfully.");
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const material = materials.find(m => m.id === deleteId);
    
    if (material) {
      const files = [material.file_url, material.image_url].filter(Boolean);
      if (files.length > 0) {
        await fetch("http://localhost:3001/api/delete", {
          method: "DELETE", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrls: files })
        });
      }
    }

    await supabase.from("materials").delete().eq("id", deleteId);
    setDeleteId(null);
    fetchMaterials();
    setToastMessage("Material permanently deleted.");
  };

  const handleEditClick = (mat: any) => {
    setEditingMaterial(mat);
    setEditTitle(mat.title);
    setEditAuthor(mat.author || "");
    setEditDescription(mat.description || "");
    setEditImageFile(null); 
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    setIsUpdating(true);

    let newImageUrl = editingMaterial.image_url;

    try {
      if (editImageFile) {
        const formPayload = new FormData();
        formPayload.append("coverImage", editImageFile);
        
        const res = await fetch("http://localhost:3001/api/upload", { 
          method: "POST", 
          body: formPayload 
        });
        const uploadData = await res.json();
        if (res.ok && uploadData.coverUrl) {
          newImageUrl = uploadData.coverUrl;
        }
      }

      const { error } = await supabase
        .from("materials")
        .update({ 
          title: editTitle, 
          author: editAuthor, 
          description: editDescription,
          image_url: newImageUrl 
        })
        .eq("id", editingMaterial.id);

      if (error) throw error;

      setEditingMaterial(null);
      fetchMaterials();
      setToastMessage("Material updated successfully.");
    } catch (error: any) {
      setToastMessage("Error updating: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredMaterials = materials.filter((mat) => 
    mat.title.toLowerCase().includes(searchQuery.toLowerCase())
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
        <Button variant="text" onClick={() => handleEditClick(row)}>Edit</Button>
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

      {/* EDIT MODAL - Wrapped carefully so it only renders when a material is selected */}
      {editingMaterial && (
        <Modal 
          open={true} 
          onClose={() => setEditingMaterial(null)}
          title="Edit Material"
          description="Update the metadata or replace the cover image."
          actions={
            <>
              <Button variant="text" onClick={() => setEditingMaterial(null)} disabled={isUpdating}>Cancel</Button>
              <Button onClick={handleUpdate} loading={isUpdating}>Save Changes</Button>
            </>
          }
        >
          <div className="space-y-5 pt-4">
            <div>
              <label className="block text-[13px] font-semibold uppercase tracking-widest text-muted mb-2">Title</label>
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full border-b border-line bg-transparent py-2 text-[16px] text-deep outline-none focus:border-deep transition-colors" />
            </div>

            <div>
              <label className="block text-[13px] font-semibold uppercase tracking-widest text-muted mb-2">Author</label>
              <input type="text" value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} className="w-full border-b border-line bg-transparent py-2 text-[16px] text-deep outline-none focus:border-deep transition-colors" />
            </div>

            <div>
              <label className="block text-[13px] font-semibold uppercase tracking-widest text-muted mb-2">Description</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full border border-line bg-transparent p-3 rounded-md text-[15px] text-deep outline-none focus:border-deep transition-colors h-24 resize-none" />
            </div>

            <div>
              <label className="block text-[13px] font-semibold uppercase tracking-widest text-muted mb-2">Replace Cover Image</label>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-mint rounded border border-line flex items-center justify-center overflow-hidden shrink-0">
                  {editImageFile ? (
                     <img src={URL.createObjectURL(editImageFile)} className="h-full w-full object-cover" />
                  ) : editingMaterial.image_url ? (
                     <img src={editingMaterial.image_url} className="h-full w-full object-cover" />
                  ) : (
                     <ImageIcon size={20} className="text-muted" />
                  )}
                </div>
                <input type="file" accept="image/*" onChange={(e) => setEditImageFile(e.target.files?.[0] || null)} className="w-full text-[14px] text-ink file:mr-4 file:border-0 file:bg-mint file:px-4 file:py-2 file:text-[14px] file:font-semibold file:text-deep hover:file:bg-line transition-colors" />
              </div>
            </div>
          </div>
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
        confirmLabel="Delete Forever"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
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