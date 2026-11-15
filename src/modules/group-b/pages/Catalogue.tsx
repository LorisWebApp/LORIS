import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Search, PlayCircle, Headphones, Book, FileText, Video, X } from "lucide-react";
import { supabase } from "../supabase";

export default function Catalogue() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // States for suggestions and modals
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [infoModal, setInfoModal] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('materials')
        .select('*')
        .neq('status', 'archived')
        .order('created_at', { ascending: false });
        
      if (data) setMaterials(data);
      setIsLoading(false);
    };
    fetchMaterials();
  }, []);

  const filtered = materials.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Get up to 5 suggestions based on what the user types
  const suggestions = searchQuery.trim().length > 0 
    ? materials
        .filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5)
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      


      {/* HERO SECTION */}
      <section className="relative bg-[#062B2E] text-white px-12 py-12 overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#A8D9DC] uppercase mb-2">Your Next Discovery Starts Here</p>
          <h1 className="text-[48px] leading-tight font-serif mb-3">Browse your library</h1>
          <p className="text-[16px] text-white/70 mb-6 max-w-lg">Big ideas, new perspectives, and the resources to take you further.</p>
          
          {/* Hero Search */}
          <div className="relative w-full max-w-lg">
            <div className="flex items-center bg-white rounded-md p-1 shadow-lg">
              <Search className="h-5 w-5 text-gray-400 ml-3" />
              <input 
                type="text" 
                placeholder="Search by title, author, or ISBN..." 
                className="flex-1 px-3 py-2 text-[#062B2E] outline-none text-sm bg-transparent" 
                value={searchQuery} 
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }} 
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              <button className="bg-[#0A3D42] text-white px-6 py-2 rounded text-sm font-medium hover:bg-[#12686E] transition">Search</button>
            </div>
            {/* Hero Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md shadow-xl border border-gray-100 overflow-hidden z-50">
                {suggestions.map((mat) => (
                  <button
                    key={mat.id}
                    onClick={() => {
                      setSearchQuery(mat.title);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-[#0F172A] hover:bg-gray-50 transition border-b border-gray-50 last:border-0 flex items-center gap-2"
                  >
                    <Search size={14} className="text-gray-400" />
                    <span className="font-medium">{mat.title}</span>
                    <span className="text-gray-400 text-xs ml-auto">{mat.author}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <p className="mt-4 text-[13px] text-white/40">
            Popular: Novel <span className="mx-1">•</span> Science <span className="mx-1">•</span> Design <span className="mx-1">•</span> Personal growth
          </p>
        </div>
        
        <div className="absolute right-0 bottom-0 h-full w-1/2 bg-[url('https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-60 mix-blend-luminosity" style={{ maskImage: 'linear-gradient(to right, transparent, black)' }}></div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#062B2E] to-transparent"></div>
      </section>

      {/* MAIN FEED */}
      <main className="max-w-[1200px] mx-auto px-8 py-10 w-full flex-1 space-y-12">
        
        {/* SECTION 1: BOOKS */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="text-[28px] font-serif text-[#0F172A]">Books & E-books</h2>
              <p className="text-[#64748B] mt-1 text-[14px]">Read text-based materials like PDFs and EPUBs.</p>
            </div>
            <button 
              onClick={() => {
                setToastMessage("This feature is being built by Group C.");
                setTimeout(() => setToastMessage(null), 3000);
              }}
              className="flex items-center gap-2 border border-[#E2E8F0] bg-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition"
            >
              <Book size={16} /> My saved resources
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? <p className="text-[#64748B] col-span-3">Loading...</p> : 
              filtered.filter(m => m.file_type?.includes('pdf') || m.file_type?.includes('epub')).map((mat) => (
                <Link to={`/material/${mat.id}`} key={mat.id} className="group border border-[#E2E8F0] bg-white rounded-lg overflow-hidden hover:shadow-md transition flex flex-col">
                  <div className="h-48 bg-[#F1F5F9] relative overflow-hidden">
                    {mat.image_url ? <img src={mat.image_url} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center"><BookOpen size={40}/></div>}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      {mat.file_type?.includes('epub') ? <><BookOpen size={14} className="text-[#0B7A63]"/> EPUB</> : <><FileText size={14} className="text-red-500"/> PDF</>}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-[20px] font-serif text-[#0F172A] leading-tight mb-1">{mat.title}</h3>
                    <p className="text-[14px] text-[#64748B] mb-4">{mat.author}</p>
                    <div className="flex justify-between text-[13px] border-t pt-4 mt-auto">
                      <span className="text-[#64748B]">{mat.file_size ? `${(mat.file_size / 1024 / 1024).toFixed(1)} MB` : ''}</span>
                      <span className="text-[#0A3D42] font-semibold">Open &rarr;</span>
                    </div>
                  </div>
                </Link>
              ))
            }
          </div>
        </section>

        {/* SECTION 2: AUDIO */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="text-[28px] font-serif text-[#0F172A]">Audio Library</h2>
              <p className="text-[#64748B] mt-1 text-[14px]">Listen to audiobooks, podcasts, and audio lectures.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.filter(m => m.file_type?.includes('audio')).length === 0 ? (
              <p className="text-[#64748B] col-span-3">No audio materials yet.</p>
            ) : (
              filtered.filter(m => m.file_type?.includes('audio')).map((mat) => (
                <Link to={`/material/${mat.id}`} key={mat.id} className="group border border-[#E2E8F0] bg-white rounded-lg p-4 flex gap-4 hover:shadow-md transition items-center">
                   <div className="h-20 w-20 bg-[#F1F5F9] rounded-md overflow-hidden shrink-0">
                      {mat.image_url ? <img src={mat.image_url} className="w-full h-full object-cover"/> : <div className="flex h-full items-center justify-center"><Headphones size={24}/></div>}
                   </div>
                   <div className="flex-1">
                     <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">AUDIO</span>
                     <h3 className="text-[16px] font-semibold text-[#0F172A] mt-1 leading-tight">{mat.title}</h3>
                     <p className="text-[13px] text-[#64748B]">{mat.author}</p>
                   </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* SECTION 3: VIDEOS */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="text-[28px] font-serif text-[#0F172A]">Video Library</h2>
              <p className="text-[#64748B] mt-1 text-[14px]">Watch lectures, documentaries, and video content.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.filter(m => m.file_type?.includes('video')).length === 0 ? (
              <p className="text-[#64748B] col-span-3">No video materials yet.</p>
            ) : (
              filtered.filter(m => m.file_type?.includes('video')).map((mat) => (
                <Link to={`/material/${mat.id}`} key={mat.id} className="group border border-[#E2E8F0] bg-white rounded-lg overflow-hidden hover:shadow-md transition flex flex-col">
                  <div className="h-48 bg-[#F1F5F9] relative overflow-hidden">
                    {mat.image_url ? <img src={mat.image_url} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center"><Video size={40}/></div>}
                    
                    {/* SLEEK PLAY BUTTON OVERLAY */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition">
                       <div className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                         <PlayCircle size={28} className="text-[#0A3D42]" strokeWidth={1.5} />
                       </div>
                    </div>

                  </div>
                  <div className="p-5">
                    <h3 className="text-[20px] font-serif text-[#0F172A] leading-tight mb-1">{mat.title}</h3>
                    <p className="text-[14px] text-[#64748B]">{mat.author}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* SECTION 4: IMAGES */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="text-[28px] font-serif text-[#0F172A]">Visual Archives</h2>
              <p className="text-[#64748B] mt-1 text-[14px]">Explore photos, maps, and visual resources.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.filter(m => m.file_type?.includes('image')).length === 0 ? (
              <p className="text-[#64748B] col-span-3">No image materials yet.</p>
            ) : (
              filtered.filter(m => m.file_type?.includes('image')).map((mat) => (
                <Link to={`/material/${mat.id}`} key={mat.id} className="group border border-[#E2E8F0] bg-white rounded-lg overflow-hidden hover:shadow-md transition flex flex-col">
                  <div className="h-48 bg-[#F1F5F9] relative overflow-hidden">
                    {(mat.image_url || mat.file_url) ? (
                      <img src={mat.image_url || mat.file_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><FileText size={40}/></div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                      IMAGE
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-[20px] font-serif text-[#0F172A] leading-tight mb-1">{mat.title}</h3>
                    <p className="text-[14px] text-[#64748B]">{mat.author}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-[#062B2E] text-white/70 py-8 px-8 mt-auto">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[13px]">
          <div className="flex items-center gap-2 text-white font-semibold text-lg tracking-tight"><BookOpen className="h-5 w-5" /> LORIS</div>
          <p>© 2026 LORIS. Built for curious minds.</p>
          <div className="flex gap-6">
            <button onClick={() => setInfoModal({ title: "About the Library", content: "The LORIS Library is a shared digital space designed for curious minds. We host a wide range of materials including books, audio, and visual archives to support learning and discovery." })} className="hover:text-white transition">About the library</button>
            <button onClick={() => setInfoModal({ title: "Help Center", content: "Need assistance? Please contact your library administrator for help with account access, uploads, or reading materials." })} className="hover:text-white transition">Help center</button>
          </div>
        </div>
      </footer>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#062B2E] text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2">
          <div className="bg-white/20 p-1 rounded-full"><Book size={16} /></div>
          <p className="font-medium text-sm">{toastMessage}</p>
        </div>
      )}

      {/* INFO MODAL */}
      {infoModal && (
        <div className="fixed inset-0 bg-[#062B2E]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative">
            <button onClick={() => setInfoModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-serif text-[#0F172A] mb-4">{infoModal.title}</h2>
            <p className="text-[#64748B] leading-relaxed">{infoModal.content}</p>
            <button onClick={() => setInfoModal(null)} className="mt-8 w-full bg-[#062B2E] text-white py-2 rounded-md font-semibold hover:bg-[#0A3D42] transition">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}