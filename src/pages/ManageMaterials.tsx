import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";
import { 
  LayoutGrid, BookOpen, Folder, Activity, 
  Search, Bell, Trash2, Edit, Plus, ArrowLeft, CheckCircle2, X
} from "lucide-react";

export default function ManageMaterials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Edit State
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null); // For replacing PDF

  // Custom Toast & Delete State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchMaterials = async () => {
    const { data } = await supabase.from("materials").select("*").order("created_at", { ascending: false });
    if (data) setMaterials(data);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000); // Hide after 3 seconds
  };

  // Delete Logic
   const confirmDelete = async () => {
    if (!deleteId) return;
    
    // 1. Find the material to get its file URL
    const materialToDelete = materials.find(m => m.id === deleteId);

    // 2. Ask the Node backend to delete the file from Cloudflare R2
    if (materialToDelete && materialToDelete.file_url) {
      try {
        await fetch("http://localhost:3001/api/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl: materialToDelete.file_url })
        });
      } catch (err) {
        console.error("Failed to delete from R2:", err);
        // We continue anyway so the DB record is removed even if R2 fails
      }
    }

    // 3. Delete the record from Supabase
    const { error } = await supabase.from("materials").delete().eq("id", deleteId);
    
    if (!error) {
      fetchMaterials();
      setDeleteId(null);
      showToast("Material archived and file deleted from cloud.");
    }
  };

  // Edit Logic
  const handleEditClick = (mat: any) => {
    setEditingMaterial(mat);
    setEditTitle(mat.title);
    setEditAuthor(mat.author || "");
    setEditImage(mat.image_url || "");
    setEditFile(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;

    let newFileUrl = editingMaterial.file_url;

    // If the admin uploaded a new PDF to replace the old one
    if (editFile) {
      const formPayload = new FormData();
      formPayload.append("pdfFile", editFile);
      const res = await fetch("http://localhost:3001/api/upload", { method: "POST", body: formPayload });
      const uploadData = await res.json();
      if (res.ok) newFileUrl = uploadData.url;
    }

    const { error } = await supabase
      .from("materials")
      .update({ 
        title: editTitle, 
        author: editAuthor, 
        image_url: editImage,
        file_url: newFileUrl
      })
      .eq("id", editingMaterial.id);

    if (!error) {
      setEditingMaterial(null);
      fetchMaterials();
      showToast("Material updated successfully.");
    }
  };

  const filteredMaterials = materials.filter((mat) => 
    mat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (mat.author && mat.author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex relative">
      
      {/* ── TOAST NOTIFICATION ──────────────────────── */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-vt-900 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2 fade-in">
          <CheckCircle2 className="h-5 w-5 text-green-400" />
          <p className="font-medium">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="ml-4 text-vt-200 hover:text-white"><X className="h-4 w-4"/></button>
        </div>
      )}

      {/* ── SIDEBAR ───────────────────── */}
      <aside className="w-64 bg-vt-900 text-white flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="bg-white text-vt-900 p-1.5 rounded-md"><LayoutGrid className="h-5 w-5" /></div>
          <span className="font-semibold text-lg tracking-tight">Atlas Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-vt-200 hover:bg-white/5 hover:text-white transition"><BookOpen className="h-5 w-5" /> Back to Catalogue</Link>
          <Link to="/manage" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-vt-800 text-white transition"><Folder className="h-5 w-5" /> Manage Materials</Link>
          <Link to="/upload" className="flex items-center gap-3 px-4 py-3 rounded-lg text-vt-200 hover:bg-white/5 hover:text-white transition"><Plus className="h-5 w-5" /> Upload Material</Link>
        </nav>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────── */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-ink-300 px-8 py-3 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-ink-900 hidden sm:block">Library Management</h1>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center bg-gray-50 border-2 border-vt-600 rounded-full px-4 py-1.5 text-sm text-ink-500">
              <Search className="h-4 w-4 mr-2" />
              <input type="text" placeholder="Search materials..." className="bg-transparent outline-none w-48 text-ink-900 placeholder:text-ink-400" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button className="text-ink-500 hover:text-vt-900"><Bell className="h-5 w-5" /></button>
            <Link to="/upload" className="bg-vt-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-vt-700 flex items-center gap-2 shadow-sm"><Plus className="h-4 w-4" /> Add Material</Link>
          </div>
        </header>

        <div className="p-8 max-w-6xl w-full mx-auto flex-1 flex flex-col">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-ink-300 shadow-sm flex items-center gap-4">
              <div className="bg-vt-50 p-3 rounded-lg text-vt-800"><BookOpen className="h-6 w-6" /></div>
              <div><p className="text-sm text-ink-500 font-medium">Total Materials</p><p className="text-2xl font-bold text-ink-900">{materials.length}</p></div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-ink-300 shadow-sm flex items-center gap-4">
              <div className="bg-amber-50 p-3 rounded-lg text-amber-600"><Folder className="h-6 w-6" /></div>
              <div><p className="text-sm text-ink-500 font-medium">Categories</p><p className="text-2xl font-bold text-ink-900">4</p></div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-ink-300 shadow-sm flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-blue-600"><Activity className="h-6 w-6" /></div>
              <div><p className="text-sm text-ink-500 font-medium">Cloud Storage</p><p className="text-2xl font-bold text-ink-900">Active</p></div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-ink-300 shadow-sm overflow-hidden mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-ink-500 text-xs uppercase tracking-wider border-b border-ink-200">
                  <th className="px-6 py-4 font-medium">Material Name</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {filteredMaterials.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-ink-500">No materials found.</td></tr>
                ) : (
                  filteredMaterials.map((mat) => (
                    <tr key={mat.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-vt-50 rounded overflow-hidden flex items-center justify-center text-vt-800">
                            {mat.image_url ? <img src={mat.image_url} className="h-full w-full object-cover" /> : <BookOpen className="h-5 w-5" />}
                          </div>
                          <div><p className="font-semibold text-ink-900">{mat.title}</p><p className="text-sm text-ink-500">{mat.author || "Unknown Author"}</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="bg-red-50 text-red-700 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide">{mat.file_type ? mat.file_type.split('/')[1] : "PDF"}</span></td>
                      <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"><span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>Published</span></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEditClick(mat)} className="p-2 text-ink-500 hover:text-vt-800 hover:bg-vt-50 rounded-md transition"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteId(mat.id)} className="p-2 text-ink-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Back Button - Changed to lighter Teal */}
          <div className="mt-auto pt-8 pb-4 flex justify-start">
            <Link to="/" className="inline-flex items-center gap-2 px-6 py-2.5 bg-vt-100 text-vt-900 rounded-lg font-semibold hover:bg-vt-200 transition shadow-sm">
              <ArrowLeft className="h-4 w-4" /> Back to Catalogue
            </Link>
          </div>
        </div>
      </main>

      {/* ── EDIT MODAL ────────────────────────────────── */}
      {editingMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold font-serif text-vt-900 mb-4">Edit Material</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Title</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full border border-ink-300 rounded-lg p-2 outline-none focus:border-vt-800" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Author</label>
                <input type="text" value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} className="w-full border border-ink-300 rounded-lg p-2 outline-none focus:border-vt-800" />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Cover Image URL</label>
                <input type="url" value={editImage} onChange={(e) => setEditImage(e.target.value)} className="w-full border border-ink-300 rounded-lg p-2 outline-none focus:border-vt-800" placeholder="https://..." />
                {editImage && <img src={editImage} className="mt-2 h-20 rounded border border-ink-200 object-cover" alt="Preview" />}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Replace PDF File (Optional)</label>
                <input type="file" accept=".pdf" onChange={(e) => setEditFile(e.target.files?.[0] || null)} className="w-full border border-ink-300 rounded-lg p-2 text-sm file:bg-vt-50 file:text-vt-800 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3" />
                <p className="text-xs text-ink-500 mt-1">Leave blank to keep the existing file.</p>
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t border-ink-200 pt-4">
                <button type="button" onClick={() => setEditingMaterial(null)} className="px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-vt-800 hover:bg-vt-700 rounded-lg">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CUSTOM DELETE CONFIRMATION MODAL ───────────── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="mx-auto bg-red-50 h-12 w-12 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-ink-900 mb-2">Archive Material?</h2>
            <p className="text-sm text-ink-500 mb-6">This action cannot be undone. The file will be removed from the catalogue.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm font-medium text-ink-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg">Yes, Archive</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}