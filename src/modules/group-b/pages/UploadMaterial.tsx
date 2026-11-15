import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { getUploadAuthContext, getUploadApiBaseUrl } from "../services/uploadAuth";
import { PageHeader, Button, ToastNotification, SectionHeader } from "../shared";

export default function UploadMaterial() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"info" | "success" | "error">("info");

  const [formData, setFormData] = useState({ title: "", author: "", description: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !formData.title) {
      setToastMessage("Title and Material File are required.");
      setToastVariant("error");
      return;
    }
    
    setLoading(true);
    try {
      const authContext = await getUploadAuthContext();
      const formPayload = new FormData();
      formPayload.append("pdfFile", pdfFile);
      if (coverImage) formPayload.append("coverImage", coverImage);

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
      if (!res.ok) throw new Error(uploadData.error || "File upload failed.");

      const { error: metadataError } = await supabase.from("materials").insert({
        title: formData.title,
        author: formData.author,
        description: formData.description,
        file_name: pdfFile.name,
        file_type: uploadData.fileType || pdfFile.type || "application/pdf",
        file_size: pdfFile.size,
        file_url: uploadData.url,
        image_url: uploadData.coverUrl,
        uploaded_by: authContext.userId,
        organisation_id: authContext.organisationId,
        status: "published"
      });
      if (metadataError) {
        // Avoid leaving an unreferenced object in R2 when Supabase rejects metadata.
        await fetch(`${apiBaseUrl}/api/uploaded-objects`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authContext.accessToken}`,
            "X-Organisation-Id": String(authContext.organisationId),
          },
          body: JSON.stringify({ objectKeys: uploadData.objectKeys ?? [] }),
        });
        throw metadataError;
      }

      setToastMessage("Material uploaded successfully!");
      setToastVariant("success");
      setTimeout(() => navigate("/manage"), 1500);
      
    } catch (error: any) {
      setToastMessage(error.message);
      setToastVariant("error");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border-b border-line bg-transparent px-0 py-3 text-[16px] text-deep outline-none placeholder:text-muted focus:border-deep transition-colors";

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-serif pb-20">
      
            {/* DEEP GREEN HEADER with Background Books */}
      <div className="relative bg-deep text-white w-full overflow-hidden">
        
        {/* Background Image with Fade */}
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity" 
          style={{ maskImage: 'linear-gradient(to left, black, transparent)' }}
        ></div>

        {/* Content Container */}
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
            
            {/* Details Section */}
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
                <div>
                  <label className="block text-[13px] font-semibold uppercase tracking-[0.12em] text-muted mb-1">Description</label>
                  <textarea className={inputClass + " h-24 resize-none"} placeholder="Provide a brief summary..." onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>
            </section>

            {/* Files Section */}
            <section>
              <SectionHeader title="Files" size="sm" divider />
              <div className="mt-6 grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[13px] font-semibold uppercase tracking-[0.12em] text-muted mb-2">Cover Image (JPG/PNG)</label>
                  <input type="file" accept="image/*" className="w-full text-[15px] text-ink file:mr-4 file:border-0 file:bg-mint file:px-4 file:py-2.5 file:text-[14px] file:font-semibold file:text-deep hover:file:bg-line transition-colors" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold uppercase tracking-[0.12em] text-muted mb-2">Material File <span className="text-rose-text">*</span></label>
                  <input type="file" accept=".pdf,.epub,.mp3,.mp4,.jpg,.jpeg,.png" className="w-full text-[15px] text-ink file:mr-4 file:border-0 file:bg-mint file:px-4 file:py-2.5 file:text-[14px] file:font-semibold file:text-deep hover:file:bg-line transition-colors" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                  <p className="text-[13px] text-muted mt-2">Supported: PDF, EPUB, MP3, JPG, PNG, MP4</p>
                </div>
              </div>
            </section>

            {/* Actions */}
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