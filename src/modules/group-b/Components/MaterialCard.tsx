import { useState } from 'react';
import { Bookmark, FileText, Headphones, Video } from 'lucide-react';

interface MaterialCardProps {
  material: {
    id: string;
    title: string;
    author: string;
    file_type: string;
    category_id?: string;
    image_url?: string;
  };
  onClick?: () => void;
}

export default function MaterialCard({ material, onClick }: MaterialCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  // Determine icon and label based on file type
  const getTypeInfo = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('pdf') || t.includes('epub')) return { label: 'EPUB', icon: <FileText size={12} /> };
    if (t.includes('audio')) return { label: 'AUDIO', icon: <Headphones size={12} /> };
    if (t.includes('video')) return { label: 'VIDEO', icon: <Video size={12} /> };
    return { label: 'DOC', icon: <FileText size={12} /> };
  };

  const typeInfo = getTypeInfo(material.file_type);

  return (
    <div 
      onClick={onClick}
      className="bg-white border border-line rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 group cursor-pointer flex flex-col"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-mint overflow-hidden">
        {material.image_url ? (
          <img 
            src={material.image_url} 
            alt={material.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-mint text-brand/30">
            <BookOpenIcon size={48} />
          </div>
        )}
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-white/90 backdrop-blur-sm text-deep text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 uppercase tracking-wider">
            {typeInfo.icon} {typeInfo.label}
          </span>
          <span className="bg-white/90 backdrop-blur-sm text-deep text-[10px] px-2 py-1 rounded-md capitalize">
            {material.category_id || 'General'}
          </span>
        </div>

        {/* Bookmark Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); setIsSaved(!isSaved); }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-deep hover:bg-white transition-colors"
        >
          <Bookmark size={16} className={isSaved ? "fill-deep text-deep" : "text-muted"} />
        </button>
      </div>

      {/* Content Container */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-[18px] font-semibold text-deep mb-1 leading-tight group-hover:text-brand transition-colors line-clamp-2">
          {material.title}
        </h3>
        <p className="text-[14px] text-muted mb-4">{material.author}</p>
        
        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-line flex items-center justify-between">
          <span className="text-[12px] text-muted flex items-center gap-1">
            {typeInfo.icon} {material.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}
          </span>
          <span className="text-[12px] font-semibold text-brand flex items-center gap-1 group-hover:underline">
            {typeInfo.label === 'AUDIO' ? 'Listen' : typeInfo.label === 'VIDEO' ? 'Watch' : 'Open'} &rarr;
          </span>
        </div>
      </div>
    </div>
  );
}

// Fallback icon if image fails
function BookOpenIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}