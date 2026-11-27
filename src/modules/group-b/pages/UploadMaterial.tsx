import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase"; // Adjust path if needed
import { getUploadAuthContext, getUploadApiBaseUrl } from "../services/uploadAuth";
import { PageHeader, Button, ToastNotification, SectionHeader } from "../../../shared";

export default function UploadMaterial() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"info" | "success" | "error">("info");

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  
  // 1. Added ISBN to the state
  const [formData, setFormData] = useState({ 
    title: "", 
    author: "", 
    description: "", 
    category_id: "",
    isbn: "" 
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      if (data && data.length > 0) {
        setCategories(data);
        setFormData(prev => ({ ...prev, category_id: data[0].id }));
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !formData.title || !formData.category_id) {
      setToastMessage("Title, Category, and Material File are required.");
      setToastVariant("error");
      return;
    }
    
    setLoading(true);
    try {
      let orgId = 5; // Default fallback for local testing
      let userId = null;
      let accessToken = "";

      try {
        const authContext = await getUploadAuthContext();
        if (authContext) {
          orgId = authContext.organisationId || 5;
          userId = authContext.userId || null;
          accessToken = authContext.accessToken || "";
        }
      } catch (authErr) {
        console.warn("Using default organisation because auth context failed:", authErr);
      }

      const formPayload = new FormData();
      formPayload.append("pdfFile", pdfFile);
      if (coverImage) formPayload.append("coverImage", coverImage);

      const apiBaseUrl = getUploadApiBaseUrl();
      const headers: Record<string, string> = {
        "X-Organisation-Id": String(orgId),
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch(`${apiBaseUrl}/api/upload`, {
        method: "POST",
        headers,
        body: formPayload,
      });
      
      const uploadData = await res.json();
      if (!res.ok) throw new Error(uploadData.error || "File upload failed.");

      // 2. Added ISBN to the insert payload
      const { error: insertError } = await supabase.from("materials").insert({
        title: formData.title,
        author: formData.author,
        description: formData.description,
        category_id: formData.category_id,
        isbn: formData.isbn || null, // Save null if empty
        file_name: pdfFile.name,
        file_type: uploadData.fileType || pdfFile.type || "application/pdf",
        file_size: pdfFile.size,
        file_url: uploadData.url,
        image_url: uploadData.coverUrl,
        uploaded_by: userId,
        organisation_id: orgId,
        status: "published"
      });

      if (insertError) throw insertError;

      setToastMessage("Material uploaded successfully!");
      setToastVariant("success");
      setTimeout(() => navigate("/manage/table"), 1500);
      
    } catch (error: any) {
      console.error(error);
      setToastMessage(error.message || "An error occurred during upload.");
      setToastVariant("error");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border-b border-line bg-transparent px-0 py-3 text-[16px] text-deep outline-none placeholder:text-muted focus:border-deep transition-colors";

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-serif pb-20">
      
      {/* HEADER */}
      <div className="relative bg-deep text-white w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity" 
          style={{ maskImage: 'linear-gradient(to left, black, transparent)' }}
        ></div>

        <div className="relative z-10 max-w-[1312px] mx-auto px-8 py-10">
          <PageHeader 
            title="Upload Material" 
            description="Add a new book, audio, or video to the library."
            breadcrumbs={[{ label: "Dashboard", to: "/manage" }, { label: "Upload" }]}
            tone="dark"
            className="bg-transparent"
          />
        </div>
      </div> 

      {/* FORM AREA */}
      <main className="max-w-[1312px] mx-auto px-8 py-10">
        <div className="max-w-3xl mx-auto bg-white border border-line shadow-sm p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-10">
            
            <section>
              <SectionHeader title="Material Details" size="sm" divider />
              <div className="mt-6 space-y-6">
                <div>
                  <label className="block text-[13px] font-semibold uppercase tracking-[0.12em] text-muted mb-1">Title <span className="text-rose-text">*</span></label>
                  <input type="text" className={inputClass} placeholder="e.g. Introduction to Algorithms" onChange={(e) => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold uppercase tracking-[0.12em] text-muted mb-1">Author</label>
                  <input type="text" className={inputClass} placeholder="e.g. Thomas H. Cormen" onChange={(e) => setFormData({...formData, author: e.target.value})} />
                </div>
                
                {/* 3. ADDED ISBN INPUT */}
                <div>
                  <label className="block text-[13px] font-semibold uppercase tracking-[0.12em] text-muted mb-1">ISBN (Optional)</label>
                  <input type="text" className={inputClass} placeholder="e.g. 978-3-16-148410-0" onChange={(e) => setFormData({...formData, isbn: e.target.value})} />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold uppercase tracking-[0.12em] text-muted mb-1">Category</label>
                  <select 
                    className={inputClass + " cursor-pointer"}
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  >
                    {categories.length === 0 && <option value="">Loading categories...</option>}
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold uppercase tracking-[0.12em] text-muted mb-1">Description</label>
                  <textarea className={inputClass + " h-24 resize-none"} placeholder="Provide a brief summary..." onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>
            </section>

            <section>
              <SectionHeader title="Files" size="sm" divider />
              <div className="mt-6 grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[13px] font-semibold uppercase tracking-[0.12em] text-muted mb-2">Cover Image (JPG/PNG)</label>
                  <input type="file" accept="image/*" className="w-full text-[15px] text-ink file:mr-4 file:border-0 file:bg-mint file:px-4 file:py-2.5 file:text-[14px] file:font-semibold file:text-deep hover:file:bg-line transition-colors" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold uppercase tracking-[0.12em] text-muted mb-2">Material File <span className="text-rose-text">*</span></label>
                  <input type="file" accept=".pdf,.epub,.mp3,.mp4,.jpg,.jpeg,.png,.docx,.pptx" className="w-full text-[15px] text-ink file:mr-4 file:border-0 file:bg-mint file:px-4 file:py-2.5 file:text-[14px] file:font-semibold file:text-deep hover:file:bg-line transition-colors" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                  <p className="text-[13px] text-muted mt-2">Supported: PDF, EPUB, MP3, JPG, PNG, MP4, DOCX, PPTX</p>
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-3 pt-6 border-t border-line">
              <Button variant="text" onClick={() => navigate("/manage")}>Cancel</Button>
              <Button type="submit" loading={loading}>Publish Material</Button>
            </div>

          </form>
        </div>
      </main>

      <ToastNotification open={!!toastMessage} message={toastMessage || ""} variant={toastVariant} onClose={() => setToastMessage(null)} placement="top-right" />
    </div>
  );
}