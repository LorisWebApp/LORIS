import { Link, Outlet, useLocation } from "react-router-dom";
import { BookOpen, Folder, Lightbulb, Users, ChevronRight, LayoutGrid } from "lucide-react";
import { Button } from "./shared";

export default function App() {
  const location = useLocation();

  const navItem = (to: string, label: string, icon: React.ReactNode) => {
    const active = location.pathname === to;
    return (
      <Link to={to} className={`flex items-center gap-3 px-4 py-2.5 text-[15px] rounded-md transition-colors ${active ? 'bg-[#0B7A63] text-white font-semibold' : 'text-[#E3F3EF] hover:bg-white/10'}`}>
        {icon} {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-page font-serif flex">
      
      {/* PERMANENT SIDEBAR */}
      <aside className="w-[260px] bg-ink text-white flex flex-col fixed h-screen border-r border-white/10">
        <div className="p-6 flex items-center gap-2 border-b border-white/10">
          <div className="bg-white text-ink p-1.5 rounded-md"><LayoutGrid className="h-5 w-5" /></div>
          <span className="font-semibold text-lg tracking-tight">Atlas Institute</span>
        </div>

        {/* Added pb-24 here to give space at the bottom */}
        <div className="p-4 flex-1 overflow-y-auto space-y-8 pb-24">
          {/* Workspace */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2 px-4">Your workspace</p>
            <div className="mb-2 px-4 text-[13px] text-white/70">The shared shelf</div>
            <nav className="space-y-1">
              {navItem("/", "Browse library", <BookOpen size={18} />)}
              {navItem("/manage", "Admin Dashboard", <Users size={18} />)}
              {navItem("/upload", "Upload Material", <Folder size={18} />)}
            </nav>
          </div>

          {/* Collections */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2 px-4">Collections</p>
            <nav className="space-y-1">
              {navItem("/reading", "The reading room", <BookOpen size={18} />)}
              {navItem("/ideas", "Ideas & inspiration", <Lightbulb size={18} />)}
            </nav>
          </div>
        </div>

        {/* Sidebar Promo - Now safely at the bottom */}
        <div className="p-4 mt-auto">
          <div className="rounded-lg bg-[#0B7A63] p-4 text-white">
            <h3 className="font-serif text-lg leading-tight mb-1">A little curiosity. A new perspective.</h3>
            <p className="text-xs text-white/80 mb-4">Explore the reading room, selected by your library.</p>
            <Button variant="text" tone="inverse" className="text-xs px-0">Discover the collection <ChevronRight size={14} /></Button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-[260px] flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}