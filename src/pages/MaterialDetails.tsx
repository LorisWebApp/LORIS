import { useState, useEffect } from "react";
import { useParams,} from "react-router-dom";
import { supabase } from "../supabase";
import { BookOpen, X, Download, PlayCircle, Headphones } from "lucide-react";
import { PageHeader, Button, DetailRow, StatusBadge } from "../shared";

export default function MaterialDetails() {
  const { id } = useParams();
  const [material, setMaterial] = useState<any>(null);
  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
    supabase.from("materials").select("*").eq("id", id).single().then(({ data }) => setMaterial(data));
  }, [id]);

  if (!material) return <div className="p-10 text-center text-muted font-serif">Loading...</div>;

    const fileType = material.file_type ? material.file_type.toLowerCase() : "";
  const isAudio = fileType.includes("audio") || fileType.includes("mp3");
  const isVideo = fileType.includes("video") || fileType.includes("mp4");
  const isPDF = fileType.includes("pdf");
  const isEPUB = fileType.includes("epub");
  const isImage = fileType.includes("image") || fileType.includes("jpg") || fileType.includes("jpeg") || fileType.includes("png");
  return (
    <div className="min-h-screen bg-page font-serif pb-20">
      
      {/* HEADER */}
      <div className="bg-white border-b border-line">
        <div className="max-w-[1312px] mx-auto px-8 py-8">
          <PageHeader 
            title={material.title}
            breadcrumbs={[{ label: "Catalogue", to: "/" }, { label: "Details" }]}
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
          <StatusBadge label={material.category_id || "General"} variant="accent" />
          <h1 className="text-[38px] font-medium text-deep mt-4 leading-tight">{material.title}</h1>
          <p className="text-[17px] text-muted mt-2">By {material.author || "Unknown Author"}</p>

          <div className="mt-8 border-t border-line">
            <DetailRow label="Format" value={material.file_type?.split('/')[1]?.toUpperCase() || "FILE"} divider />
            <DetailRow label="Description" value={material.description || "No description provided."} layout="stacked" divider />
          </div>

                  {/* ACTION BUTTONS */}
          <div className="mt-8 flex flex-wrap gap-4">
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

            {/* ADD THIS IMAGE BUTTON */}
            {isImage && (
              <Button onClick={() => window.open(material.file_url, '_blank')} leftIcon={<BookOpen size={16}/>}>View Image</Button>
            )}

            {/* MAKE SURE TO ADD !isImage HERE SO IT DOESN'T SHOW BOTH BUTTONS */}
            {(!isPDF && !isEPUB && !isAudio && !isVideo && !isImage) && (
              <Button onClick={() => window.open(material.file_url, '_blank')} leftIcon={<Download size={16}/>}>Download File</Button>
            )}
          </div>
        </div>
      </main>

      {/* ── MEDIA VIEWER MODAL ── */}
      {isReading && (
        <div className="fixed inset-0 bg-deep/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          
          {/* The modal is narrower for Audio/Video, and wider for PDFs */}
          <div className={`bg-white w-full ${isAudio || isVideo ? 'max-w-2xl' : 'max-w-6xl h-full'} rounded-xl flex flex-col overflow-hidden shadow-2xl`}>
            
            {/* Modal Header */}
            <div className="bg-ink px-6 py-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-semibold font-serif truncate pr-4">{material.title}</h3>
              <button onClick={() => setIsReading(false)} className="hover:bg-white/20 p-2 rounded-md transition shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            {isAudio ? (
              <div className="p-8 flex flex-col items-center justify-center bg-mint-soft">
                {material.image_url && <img src={material.image_url} className="h-48 w-48 object-cover rounded-lg shadow-lg mb-8" />}
                <audio controls autoPlay className="w-full">
                  <source src={material.file_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            ) : isVideo ? (
              <div className="w-full bg-black flex items-center justify-center">
                <video 
                  controls 
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
                <p className="text-muted mb-8 text-center max-w-md">Browsers cannot display EPUB files natively. Group C will build a custom EPUB reader here later. For now, you can download the file to read it.</p>
                <Button onClick={() => window.open(material.file_url, '_blank')} leftIcon={<Download size={16}/>}>Download EPUB</Button>
              </div>
            ) : (
              <iframe 
  src={`https://docs.google.com/viewer?url=${encodeURIComponent(material.file_url)}&embedded=true`} 
  className="w-full flex-1 border-0 bg-white" 
  title={material.title} 
/>
            )}
          </div>
        </div>
      )}
    </div>
  );
}