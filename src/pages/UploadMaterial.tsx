import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase";
import { ArrowLeft, UploadCloud, Image as ImageIcon, CheckCircle2, X } from "lucide-react";

export default function UploadMaterial() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ title: "", author: "", description: "", category: "General" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !formData.title || !formData.author) {
      return setToastMessage("Please fill in Title, Author, and select a PDF.");
    }
    
    setLoading(true);
    try {
      const formPayload = new FormData();
      formPayload.append("pdfFile", pdfFile);
      if (coverImage) formPayload.append("coverImage", coverImage);
      
      const res = await fetch("http://localhost:3001/api/upload", { method: "POST", body: formPayload });
      const uploadData = await res.json();
      if (!res.ok) throw new Error(uploadData.error);

      const { error: dbError } = await supabase.from("materials").insert({
        title: formData.title,
        author: formData.author,
        description: formData.description,
        category_id: formData.category, // Saving Category
        file_name: pdfFile.name,
        file_type: pdfFile.type || "application/pdf",
        file_size: pdfFile.size,
        file_url: uploadData.url, 
        image_url: uploadData.coverUrl, 
        status: "published"
      });

      if (dbError) throw dbError;

      setToastMessage("Material uploaded successfully!");
      setTimeout(() => navigate("/manage"), 1500);
      
    } catch (error: any) {
      setToastMessage("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-vt-700 p-6 md:p-10 flex flex-col items-center font-sans relative">
      
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2 fade-in ${toastMessage.includes('Error') ? 'bg-red-600 text-white' : 'bg-vt-900 text-white'}`}>
          <CheckCircle2 className="h-5 w-5 text-green-400" />
          <p className="font-medium">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="ml-4 text-white/70 hover:text-white"><X className="h-4 w-4"/></button>
        </div>
      )}

      <div className="w-full max-w-2xl mb-6">
        <Link to="/manage" className="text-ink-500 hover:text-vt-900 flex items-center gap-2 text-sm font-medium transition">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-2xl border border-ink-200">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-vt-50 p-3 rounded-xl text-vt-800"><UploadCloud className="h-8 w-8" /></div>
          <div>
            <h1 className="text-2xl font-bold font-serif text-ink-900">Upload New Material</h1>
            <p className="text-sm text-ink-500">Add a new PDF and its cover image to the catalogue.</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input required type="text" placeholder="e.g., Introduction to Algorithms" className="w-full border border-ink-300 rounded-lg p-3 outline-none focus:border-vt-800 focus:ring-1 focus:ring-vt-800 transition text-ink-900" onChange={(e) => setFormData({...formData, title: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1.5">Author / Creator <span className="text-red-500">*</span></label>
            <input required type="text" placeholder="e.g., Thomas H. Cormen" className="w-full border border-ink-300 rounded-lg p-3 outline-none focus:border-vt-800 focus:ring-1 focus:ring-vt-800 transition text-ink-900" onChange={(e) => setFormData({...formData, author: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1.5">Category</label>
            <select className="w-full border border-ink-300 rounded-lg p-3 outline-none focus:border-vt-800 focus:ring-1 focus:ring-vt-800 transition text-ink-900 bg-white" onChange={(e) => setFormData({...formData, category: e.target.value})}>
              <option value="General">General</option>
              <option value="Novels">Novels</option>
              <option value="Science">Science</option>
              <option value="History">History</option>
              <option value="Educational">Educational</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1.5">Description</label>
            <textarea placeholder="Provide a brief summary..." className="w-full border border-ink-300 rounded-lg p-3 outline-none focus:border-vt-800 focus:ring-1 focus:ring-vt-800 transition h-28 text-ink-900 resize-none" onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5 flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Cover Image</label>
              <input type="file" accept="image/*" className="w-full border border-ink-300 rounded-lg p-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-vt-50 file:text-vt-800 hover:file:bg-vt-100 transition" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1.5 flex items-center gap-2"><UploadCloud className="h-4 w-4" /> PDF File <span className="text-red-500">*</span></label>
              <input required type="file" accept=".pdf" className="w-full border border-ink-300 rounded-lg p-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-vt-50 file:text-vt-800 hover:file:bg-vt-100 transition" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
            </div>
          </div>

          <div className="flex gap-4 pt-4 mt-2 border-t border-ink-200">
            <button type="button" onClick={() => navigate("/manage")} className="flex-1 bg-white border border-ink-300 text-ink-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">Cancel</button>
            <button disabled={loading} type="submit" className="flex-1 bg-vt-800 text-white py-3 rounded-lg font-semibold hover:bg-vt-700 disabled:opacity-50 transition flex justify-center items-center gap-2">
              {loading ? "Uploading to Cloud..." : "Publish Material"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}