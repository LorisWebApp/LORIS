import { useState, useEffect } from 'react';
import { BookOpen, Upload, Users, Video, Image as ImageIcon, Headphones, Library } from 'lucide-react';
import { supabase } from '../supabase';
import { PageHeader, Button } from '../shared';

export default function OrganisationOverview() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('materials').select('*');
      if (data) setMaterials(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-10 text-muted font-serif">Loading dashboard...</div>;

  // Calculate stats cleanly
  const total = materials.length;
  const books = materials.filter(m => m.file_type?.includes('pdf') || m.file_type?.includes('epub')).length;
  const videos = materials.filter(m => m.file_type?.includes('video')).length;
  const audio = materials.filter(m => m.file_type?.includes('audio')).length;
  const images = materials.filter(m => m.file_type?.includes('image')).length;

  return (
    <div className="min-h-screen bg-[#EFFAF7] font-serif pb-20">
      
      {/* DEEP GREEN HEADER */}
      <div className="relative bg-deep text-white w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity" 
          style={{ maskImage: 'linear-gradient(to left, black, transparent)' }}
        ></div>
        <div className="relative z-10 max-w-[1312px] mx-auto px-8 py-10">
          <PageHeader 
            title="Dashboard" 
            description="Overview of your organisation's library."
            breadcrumbs={[{ label: "Catalogue", to: "/catalogue" }, { label: "Dashboard" }]}
            tone="dark"
            className="bg-transparent"
          />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-[1312px] mx-auto px-8 py-10 space-y-12">
        
        {/* 5-COLUMN STATS ROW (TRANSPARENT CARDS) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          
          {/* Total */}
          <div className="relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow group border-t-4 border-t-brand">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=400')] bg-cover bg-center opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent" />
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[12px] font-bold uppercase tracking-widest text-muted">Total</p>
                <div className="bg-mint p-2 rounded-md group-hover:bg-badge transition-colors"><Library size={18} className="text-deep" /></div>
              </div>
              <p className="text-[36px] font-serif text-deep leading-none mb-2">{total}</p>
              <p className="text-[13px] text-muted">All materials</p>
            </div>
          </div>

          {/* Books */}
          <div className="relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow group border-t-4 border-t-brand">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=400')] bg-cover bg-center opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent" />
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[12px] font-bold uppercase tracking-widest text-muted">Books</p>
                <div className="bg-mint p-2 rounded-md group-hover:bg-badge transition-colors"><BookOpen size={18} className="text-deep" /></div>
              </div>
              <p className="text-[36px] font-serif text-deep leading-none mb-2">{books}</p>
              <p className="text-[13px] text-muted">PDFs & EPUBs</p>
            </div>
          </div>

          {/* Audio */}
          <div className="relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow group border-t-4 border-t-brand">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=400')] bg-cover bg-center opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent" />
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[12px] font-bold uppercase tracking-widest text-muted">Audio</p>
                <div className="bg-mint p-2 rounded-md group-hover:bg-badge transition-colors"><Headphones size={18} className="text-deep" /></div>
              </div>
              <p className="text-[36px] font-serif text-deep leading-none mb-2">{audio}</p>
              <p className="text-[13px] text-muted">Audio files</p>
            </div>
          </div>

          {/* Videos */}
          <div className="relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow group border-t-4 border-t-brand">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?q=80&w=400')] bg-cover bg-center opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent" />
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[12px] font-bold uppercase tracking-widest text-muted">Videos</p>
                <div className="bg-mint p-2 rounded-md group-hover:bg-badge transition-colors"><Video size={18} className="text-deep" /></div>
              </div>
              <p className="text-[36px] font-serif text-deep leading-none mb-2">{videos}</p>
              <p className="text-[13px] text-muted">Video files</p>
            </div>
          </div>

          {/* Images */}
          <div className="relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow group border-t-4 border-t-brand">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=400')] bg-cover bg-center opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent" />
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[12px] font-bold uppercase tracking-widest text-muted">Images</p>
                <div className="bg-mint p-2 rounded-md group-hover:bg-badge transition-colors"><ImageIcon size={18} className="text-deep" /></div>
              </div>
              <p className="text-[36px] font-serif text-deep leading-none mb-2">{images}</p>
              <p className="text-[13px] text-muted">Visual archives</p>
            </div>
          </div>

        </div>

        {/* Spaces Section with Background Image */}
        <section className="relative bg-deep text-white border border-[#0A3D42] rounded-lg p-8 shadow-md overflow-hidden">
          
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity" ></div>

          <div className="relative z-10">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-2 w-8 bg-[#A8D9DC] rounded-full"></div>
                <h2 className="text-[28px] font-medium leading-tight text-white">Your organisation spaces</h2>
              </div>
              <p className="text-[16px] text-[#A8D9DC] ml-11">Manage your materials, uploads, and members.</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              <div className="relative overflow-hidden rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer flex flex-col border border-white/20">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513828583688-c52646db42da?q=80&w=500')] bg-cover bg-center opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent" />
                <div className="relative z-10 p-8">
                  <div className="bg-[#E3F3EF] w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#B0EFE5] transition-colors">
                    <Upload size={24} className="text-[#0B7A63]" />
                  </div>
                  <h3 className="text-[22px] font-semibold text-deep mb-2">Upload materials</h3>
                  <p className="text-[16px] text-muted mb-6">Add new discoveries to your library.</p>
                  <Button to="/upload" variant="text" className="px-0 text-[#0B7A63]">Go to uploads &rarr;</Button>
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer flex flex-col border border-white/20">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=500')] bg-cover bg-center opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent" />
                <div className="relative z-10 p-8">
                  <div className="bg-[#E3F3EF] w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#B0EFE5] transition-colors">
                    <BookOpen size={24} className="text-[#0B7A63]" />
                  </div>
                  <h3 className="text-[22px] font-semibold text-deep mb-2">Materials</h3>
                  <p className="text-[16px] text-muted mb-6">Review and manage your existing materials.</p>
                  <Button to="/manage/table" variant="text" className="px-0 text-[#0B7A63]">Go to materials &rarr;</Button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer flex flex-col border border-white/20">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=500')] bg-cover bg-center opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent" />
                <div className="relative z-10 p-8">
                  <div className="bg-[#E3F3EF] w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#B0EFE5] transition-colors">
                    <Users size={24} className="text-[#0B7A63]" />
                  </div>
                  <h3 className="text-[22px] font-semibold text-deep mb-2">Members</h3>
                  <p className="text-[16px] text-muted mb-6">Manage your community and access.</p>
                  <Button to="/manage/members" variant="text" className="px-0 text-[#0B7A63]">Go to members &rarr;</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Format Share Section with Background Image */}
        <section className="relative bg-deep text-white border border-[#0A3D42] rounded-lg p-8 shadow-md overflow-hidden">
          
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity" ></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-2 w-8 bg-[#A8D9DC] rounded-full"></div>
              <h2 className="text-[24px] font-medium leading-tight text-white">Your collection</h2>
            </div>
            <p className="text-[15px] text-[#A8D9DC] ml-11 mb-8">How your {total} materials are shared across formats.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               
               {/* Books */}
               <div className="relative overflow-hidden rounded-lg shadow-lg border-l-4 border-l-brand">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=400')] bg-cover bg-center opacity-40" />
                 <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent" />
                 <div className="relative z-10 p-5">
                   <div className="flex items-center justify-between mb-3">
                     <p className="text-[12px] font-bold uppercase tracking-widest text-muted">Books</p>
                     <div className="bg-mint p-1.5 rounded-md"><BookOpen size={16} className="text-deep" /></div>
                   </div>
                   <p className="text-[32px] font-serif text-deep leading-none mb-2">{books}</p>
                   <p className="text-[12px] text-muted">{total > 0 ? ((books/total)*100).toFixed(1) : 0}% of collection</p>
                 </div>
               </div>

               {/* Videos */}
               <div className="relative overflow-hidden rounded-lg shadow-lg border-l-4 border-l-brand">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?q=80&w=400')] bg-cover bg-center opacity-40" />
                 <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent" />
                 <div className="relative z-10 p-5">
                   <div className="flex items-center justify-between mb-3">
                     <p className="text-[12px] font-bold uppercase tracking-widest text-muted">Videos</p>
                     <div className="bg-mint p-1.5 rounded-md"><Video size={16} className="text-deep" /></div>
                   </div>
                   <p className="text-[32px] font-serif text-deep leading-none mb-2">{videos}</p>
                   <p className="text-[12px] text-muted">{total > 0 ? ((videos/total)*100).toFixed(1) : 0}% of collection</p>
                 </div>
               </div>

               {/* Images */}
               <div className="relative overflow-hidden rounded-lg shadow-lg border-l-4 border-l-brand">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=400')] bg-cover bg-center opacity-40" />
                 <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent" />
                 <div className="relative z-10 p-5">
                   <div className="flex items-center justify-between mb-3">
                     <p className="text-[12px] font-bold uppercase tracking-widest text-muted">Images</p>
                     <div className="bg-mint p-1.5 rounded-md"><ImageIcon size={16} className="text-deep" /></div>
                   </div>
                   <p className="text-[32px] font-serif text-deep leading-none mb-2">{images}</p>
                   <p className="text-[12px] text-muted">{total > 0 ? ((images/total)*100).toFixed(1) : 0}% of collection</p>
                 </div>
               </div>

               {/* Audio */}
               <div className="relative overflow-hidden rounded-lg shadow-lg border-l-4 border-l-brand">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=400')] bg-cover bg-center opacity-40" />
                 <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent" />
                 <div className="relative z-10 p-5">
                   <div className="flex items-center justify-between mb-3">
                     <p className="text-[12px] font-bold uppercase tracking-widest text-muted">Audio</p>
                     <div className="bg-mint p-1.5 rounded-md"><Headphones size={16} className="text-deep" /></div>
                   </div>
                   <p className="text-[32px] font-serif text-deep leading-none mb-2">{audio}</p>
                   <p className="text-[12px] text-muted">{total > 0 ? ((audio/total)*100).toFixed(1) : 0}% of collection</p>
                 </div>
               </div>

            </div>
          </div>
        </section>

      </main>
    </div>
  );
}