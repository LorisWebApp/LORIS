import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Bell, User, ChevronRight, LayoutGrid, XCircle } from "lucide-react";
import MaterialCard from "./Components/MaterialCard";
import { supabase } from "./supabase";

export default function App() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Loading State

  useEffect(() => {
    const fetchMaterials = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
      if (!error && data) setMaterials(data);
      setIsLoading(false);
    };
    fetchMaterials();
  }, []);

  const filteredMaterials = materials.filter((mat) => 
    mat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (mat.author && mat.author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-ink-900 flex flex-col">
      
      {/* HEADER */}
      <header className="bg-white border-b border-ink-300 px-8 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-vt-900 text-white p-1.5 rounded-md"><LayoutGrid className="h-5 w-5" /></div>
            <span className="font-semibold text-lg tracking-tight">Atlas Institute</span>
          </Link>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-ink-500">
            <Link to="/" className="text-vt-900 hover:text-vt-800 transition">Browse</Link>
            <a href="#" className="hover:text-vt-900 transition">My library</a>
            <a href="#" className="hover:text-vt-900 transition">Collections</a>
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <div className="hidden sm:flex items-center bg-gray-50 border-2 border-vt-600 rounded-full px-4 py-1.5 text-sm text-ink-500">
            <Search className="h-4 w-4 mr-2" />
            <input type="text" placeholder="Quick search..." className="bg-transparent outline-none w-40 text-ink-900 placeholder:text-ink-400" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button className="text-ink-500 hover:text-vt-900 transition"><Bell className="h-5 w-5" /></button>
          <button className="bg-ink-100 p-1.5 rounded-full hover:bg-ink-200 transition"><User className="h-4 w-4 text-ink-700" /></button>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-vt-900 text-white px-8 py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between relative z-10">
          <div className="max-w-xl">
            <p className="text-vt-200 text-xs font-semibold tracking-[0.2em] uppercase mb-4">Your Next Chapter Starts Here</p>
            <h1 className="text-5xl font-serif mb-4 text-white">Browse your library</h1>
            <p className="text-vt-100 text-lg mb-8 opacity-90">Big ideas, new perspectives, and a little room for discovery.</p>
            <div className="flex items-center bg-white rounded-md p-1 w-full max-w-md shadow-lg">
              <Search className="h-5 w-5 text-gray-400 ml-3" />
              <input type="text" placeholder="Search by title or author..." className="flex-1 px-3 py-2 text-ink-900 outline-none text-sm bg-transparent" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <button className="bg-vt-800 text-white px-6 py-2 rounded text-sm font-medium hover:bg-vt-700 transition">Find</button>
            </div>
          </div>
          <div className="hidden md:block w-72 bg-vt-800 p-2 rounded-lg shadow-2xl mt-8 md:mt-0">
            <div className="h-48 bg-gray-300 rounded mb-3 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center"></div>
            <div className="px-2 pb-2">
              <p className="text-xs font-semibold text-vt-200">FEATURED READING</p>
              <h3 className="font-serif text-xl mt-1 mb-2 text-white">A world of ideas</h3>
              <p className="text-xs flex items-center text-white opacity-80">12 hand-picked titles for curious minds <ChevronRight className="h-3 w-3 ml-1" /></p>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOGUE */}
      <main className="max-w-7xl mx-auto px-8 py-10 flex gap-8 flex-1 w-full">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-vt-800 text-white p-6 rounded-xl mb-8">
             <div className="bg-white/20 p-2 rounded w-fit mb-4"><LayoutGrid className="h-5 w-5" /></div>
             <h3 className="font-serif text-xl mb-2">Your institute. Your library.</h3>
             <p className="text-xs text-vt-100 mb-4">Everything Atlas offers, gathered in one place.</p>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif text-ink-900">Explore the collection <span className="text-sm font-sans text-ink-500 ml-2">{filteredMaterials.length}</span></h2>
          </div>

          <div className="flex gap-6 border-b border-ink-300 mb-6 text-sm font-medium">
            <button className="text-vt-900 border-b-2 border-vt-900 pb-3">All resources</button>
            <button className="text-ink-500 hover:text-vt-900 pb-3">Books & documents</button>
            <button className="text-ink-500 hover:text-vt-900 pb-3">Watch & listen</button>
          </div>

          {/* GRID: SKELETON, EMPTY, OR CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
            {isLoading ? (
              // SKELETON LOADERS
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse flex flex-col gap-3">
                  <div className="aspect-[3/4] w-full bg-ink-200 rounded-lg"></div>
                  <div className="h-4 bg-ink-200 rounded w-3/4"></div>
                  <div className="h-3 bg-ink-200 rounded w-1/2"></div>
                </div>
              ))
            ) : filteredMaterials.length === 0 ? (
              // BEAUTIFUL EMPTY STATE
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                <div className="bg-vt-50 p-4 rounded-full mb-4">
                  <XCircle className="h-10 w-10 text-vt-600" />
                </div>
                <h3 className="text-xl font-semibold text-ink-900">No materials found</h3>
                <p className="text-ink-500 mt-2 mb-6">We couldn't find anything matching "{searchQuery}"</p>
                <button onClick={() => setSearchQuery("")} className="bg-vt-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-vt-700 transition">Clear Search</button>
              </div>
            ) : (
              // ACTUAL CARDS
              filteredMaterials.map((mat) => (
                <MaterialCard 
                  key={mat.id}
                  id={mat.id}
                  title={mat.title}
                  author={mat.author || "Unknown Author"}
                  category={mat.category_id || "General"} 
                  rating={4.8} 
                  fileType={mat.file_type ? mat.file_type.split('/')[1]?.toUpperCase() : "PDF"}
                  pages="PDF Document"
                  imageUrl={mat.image_url}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* FOOTER with Admin Link */}
      <footer className="bg-vt-950 text-vt-200 py-8 px-8 mt-auto border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">© 2026 Atlas Institute. All rights reserved.</p>
          <Link to="/manage" className="text-sm font-medium text-vt-100 hover:text-white underline underline-offset-4 transition">
            Admin Portal
          </Link>
        </div>
      </footer>
    </div>
  );
}