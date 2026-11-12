import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabase";
import { ArrowLeft, BookOpen, X } from "lucide-react";

export default function MaterialDetails() {
  const { id } = useParams();
  const [material, setMaterial] = useState<any>(null);
  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
    const fetchMaterial = async () => {
      const { data } = await supabase.from("materials").select("*").eq("id", id).single();
      if (data) setMaterial(data);
    };
    fetchMaterial();
  }, [id]);

  if (!material) return <div className="p-10 text-center text-ink-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-10 flex justify-center">
      <div className="max-w-3xl w-full bg-white p-8 rounded-xl shadow-lg border border-ink-300">
        <Link to="/" className="text-vt-800 flex items-center gap-2 mb-6 hover:underline font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to Catalogue
        </Link>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover Image */}
          <div className="w-full md:w-1/3 aspect-[3/4] bg-vt-50 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
            {material.image_url ? (
               <img src={material.image_url} alt={material.title} className="h-full w-full object-cover" />
            ) : (
               <BookOpen className="h-16 w-16 text-vt-600/40" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1">
            <span className="bg-vt-100 text-vt-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {material.category_id || "General"}
            </span>
            <h1 className="text-3xl font-bold font-serif text-ink-900 mt-4">{material.title}</h1>
            <p className="text-lg text-ink-700 mt-2">By {material.author}</p>
            
            <hr className="my-6 border-ink-300" />
            
            <h3 className="font-semibold text-ink-900 mb-2">Description</h3>
            <p className="text-ink-600 leading-relaxed">
              {material.description || "No description provided for this material."}
            </p>

            <div className="mt-8 flex gap-4">
              <button 
                onClick={() => setIsReading(true)}
                className="bg-vt-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-vt-700 transition shadow-sm"
              >
                Read Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── FULL SCREEN PDF VIEWER MODAL ── */}
      {isReading && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full h-full max-w-6xl rounded-xl flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-vt-900 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-semibold">{material.title}</h3>
              <button onClick={() => setIsReading(false)} className="hover:bg-white/20 p-2 rounded-md transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <iframe 
              src={`${material.file_url}#toolbar=1`} 
              className="w-full flex-1 border-0" 
              title={material.title}
            />
          </div>
        </div>
      )}
    </div>
  );
}