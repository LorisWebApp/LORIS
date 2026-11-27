import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../../supabase"; // Adjust path if needed
import { useAuth } from "../../group-a/contexts/AuthContext";
import { BookOpen, X, PlayCircle, Headphones, FileText } from "lucide-react";
import { PageHeader, Button, DetailRow, StatusBadge } from "../../../shared"; // Adjust path if needed

export default function MaterialDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [material, setMaterial] = useState<any>(null);
  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
    // Guests read the public preview view (description only, no file link).
    supabase.from(user ? "materials" : "public_materials").select("*").eq("id", id).single().then(({ data }) => setMaterial(data));
  }, [id, user]);

  if (!material) return <div className="p-10 text-center text-muted font-serif">Loading...</div>;

  const fileType = material.file_type ? material.file_type.toLowerCase() : "";
  const fileUrl = material.file_url ? material.file_url.toLowerCase() : "";

  // Check file_type OR the file_url ending to see what it is
  const isAudio = fileType.includes("audio") || fileType.includes("mp3") || fileUrl.endsWith('.mp3');
  const isVideo = fileType.includes("video") || fileType.includes("mp4") || fileUrl.endsWith('.mp4');
  const isPDF = fileType.includes("pdf") || fileUrl.endsWith('.pdf');
  const isEPUB = fileType.includes("epub") || fileUrl.endsWith('.epub');
  const isImage = 
    fileType.includes("image") || 
    fileType.includes("jpg") || 
    fileType.includes("jpeg") || 
    fileType.includes("png") ||
    fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null;
    
  const isOffice = 
    fileType.includes("presentationml") || 
    fileType.includes("wordprocessingml") || 
    fileType.includes("docx") || 
    fileType.includes("pptx") ||
    fileUrl.endsWith('.docx') ||
    fileUrl.endsWith('.pptx');

  const getReadableFormat = (type: string, url: string) => {
    if (type) {
      if (type.includes("pdf")) return "PDF";
      if (type.includes("epub")) return "EPUB";
      if (type.includes("presentationml") || type.includes("pptx")) return "PRESENTATION (PPTX)";
      if (type.includes("wordprocessingml") || type.includes("docx")) return "WORD DOCUMENT (DOCX)";
      if (type.includes("audio")) return "AUDIO";
      if (type.includes("video")) return "VIDEO";
      if (type.includes("image")) return "IMAGE";
      return type.split('/')[1]?.toUpperCase() || "FILE";
    }
    if (url.endsWith('.pdf')) return "PDF";
    if (url.endsWith('.epub')) return "EPUB";
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return "IMAGE";
    if (url.endsWith('.mp3')) return "AUDIO";
    if (url.endsWith('.mp4')) return "VIDEO";
    if (url.endsWith('.docx')) return "WORD DOCUMENT (DOCX)";
    if (url.endsWith('.pptx')) return "PRESENTATION (PPTX)";
    return "FILE";
  };

  return (
    <div className="min-h-screen bg-page font-serif pb-20">
      
      {/* HEADER */}
      <div className="bg-white border-b border-line">
        <div className="max-w-[1312px] mx-auto px-8 py-8">
          <PageHeader 
            title={material.title}
            breadcrumbs={[{ label: "Catalogue", to: "/catalogue" }, { label: "Details" }]}
          />
        </div>
      </div>

      <main className="max-w-[1312px] mx-auto px-8 py-10 grid md:grid-cols-[300px_1fr] gap-12">
        
        {/* Cover Image */}
        <div className="aspect-[3/4] bg-mint border border-line overflow-hidden rounded-lg shadow-sm">
          {material.image_url ? (
            <img src={material.image_url} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted"><BookOpen size={48}/></div>
          )}
        </div>

        {/* Details Info */}
        <div>
          <StatusBadge label={material.category_name || "General"} variant="accent" />
          <h1 className="text-[38px] font-medium text-deep mt-4 leading-tight">{material.title}</h1>
          <p className="text-[17px] text-muted mt-2">By {material.author || "Unknown Author"}</p>

          <div className="mt-8 border-t border-line">
            <DetailRow label="Format" value={getReadableFormat(material.file_type, material.file_url)} divider />
            {/* ADDED ISBN HERE */}
            {material.isbn && <DetailRow label="ISBN" value={material.isbn} divider />}
            <DetailRow label="Description" value={material.description || "No description provided."} layout="stacked" divider />
          </div>

          {/* ACTION BUTTONS */}
          {!user && (
            <div className="mt-8 rounded-xl border border-line bg-mint-soft p-6">
              <p className="font-semibold text-deep">Sign in to read this resource</p>
              <p className="mt-1 text-sm text-muted">Anyone can browse the catalogue. An account is needed to read, listen or watch, and to save materials to your library.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/login" className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-deep">Login</Link>
                <Link to="/register" className="rounded-lg border border-ink/25 px-5 py-2.5 text-sm font-semibold text-ink no-underline hover:bg-mint">Get Started</Link>
              </div>
            </div>
          )}

          <div className={`mt-8 flex flex-wrap gap-4 ${user ? "" : "hidden"}`}>
            {isPDF && (
              <Button onClick={() => setIsReading(true)} leftIcon={<BookOpen size={16}/>}>Read Document</Button>
            )}
            
            {isEPUB && (
              <Button onClick={() => setIsReading(true)} leftIcon={<BookOpen size={16}/>}>Open EPUB</Button>
            )}

            {isAudio && (
              <Button onClick={() => setIsReading(true)} leftIcon={<Headphones size={16}/>}>Listen Now</Button>
            )}

            {isVideo && (
              <Button onClick={() => setIsReading(true)} leftIcon={<PlayCircle size={16}/>}>Watch Video</Button>
            )}

            {isImage && (
              <Button onClick={() => window.open(material.file_url, '_blank')} leftIcon={<BookOpen size={16}/>}>View Image</Button>
            )}

            {isOffice && (
              <Button onClick={() => setIsReading(true)} leftIcon={<FileText size={16}/>}>View Document</Button>
            )}

            {(!isPDF && !isEPUB && !isAudio && !isVideo && !isImage && !isOffice) && (
              <p className="text-sm text-muted">This file type cannot be viewed online.</p>
            )}
          </div>
        </div>
      </main>

      {/* ── MEDIA VIEWER MODAL ── */}
      {user && isReading && (
        <div className="fixed inset-0 bg-deep/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          
          <div className={`bg-white w-full ${isAudio || isVideo ? 'max-w-2xl' : 'max-w-6xl h-full'} rounded-xl flex flex-col overflow-hidden shadow-2xl`}>
            
            <div className="bg-ink px-6 py-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-semibold font-serif truncate pr-4">{material.title}</h3>
              <button onClick={() => setIsReading(false)} className="hover:bg-white/20 p-2 rounded-md transition shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {isAudio ? (
              <div className="p-8 flex flex-col items-center justify-center bg-mint-soft">
                {material.image_url && <img src={material.image_url} className="h-48 w-48 object-cover rounded-lg shadow-lg mb-8" />}
                <audio controls controlsList="nodownload noplaybackrate" onContextMenu={(e) => e.preventDefault()} autoPlay className="w-full">
                  <source src={material.file_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            ) : isVideo ? (
              <div className="w-full bg-black flex items-center justify-center">
                <video 
                  controls
                  controlsList="nodownload noremoteplayback"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                  autoPlay 
                  playsInline 
                  className="w-full max-h-[80vh] object-contain bg-black"
                  src={material.file_url}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : isEPUB ? (
              <div className="w-full flex-1 bg-mint-soft flex flex-col items-center justify-center p-8">
                <BookOpen size={64} className="text-brand mb-4" />
                <h2 className="text-2xl font-serif text-deep mb-2">EPUB Reader</h2>
                <p className="text-muted mb-8 text-center max-w-md">An in-app EPUB reader is not available yet. EPUB files cannot be downloaded from LORIS.</p>
              </div>
            ) : isOffice ? (
              <iframe 
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(material.file_url)}`} 
                className="w-full flex-1 border-0 bg-white" 
                title={material.title} 
              />
            ) : (
              <iframe src={`${material.file_url}#toolbar=0&navpanes=0&scrollbar=1`} className="w-full flex-1 border-0" title={material.title} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}