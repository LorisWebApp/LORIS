import { BookOpen, Bookmark } from "lucide-react";
import { Link } from "react-router-dom";

type MaterialProps = {
  id: string;
  title: string;
  author: string;
  category: string;
  rating: number;
  fileType: string;
  pages?: string;
  isSaved?: boolean;
  imageUrl?: string;
};

export default function MaterialCard({ 
  id,
  title, 
  author, 
  category, 
  rating, 
  fileType, 
  pages, 
  isSaved, 
  imageUrl 
}: MaterialProps) {
  
  const getBadgeColor = (type: string) => {
    if (type.includes('PDF')) return 'bg-red-50 text-red-700';
    if (type.includes('EPUB') || type.includes('BOOK')) return 'bg-green-50 text-green-700';
    if (type.includes('AUDIO')) return 'bg-purple-50 text-purple-700';
    return 'bg-blue-50 text-blue-700';
  };

  return (
    <Link to={`/material/${id}`}>
      <article className="group flex flex-col cursor-pointer h-full">
        
        {/* Image / Cover Area */}
        <div className="relative aspect-[3/4] w-full bg-vt-100 rounded-lg overflow-hidden mb-4">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center opacity-30">
              <BookOpen className="h-12 w-12 text-vt-900" />
            </div>
          )}

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getBadgeColor(fileType)}`}>
              {fileType}
            </span>
          </div>

          {/* Saved Bookmark Icon */}
          <button className="absolute top-3 right-3 bg-white p-1.5 rounded-full shadow-sm hover:scale-110 transition z-10">
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-vt-800 text-vt-800' : 'text-gray-400'}`} />
          </button>

          {/* Bottom Pages/Length Info */}
          {pages && (
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded">
              {pages}
            </div>
          )}
        </div>

        {/* Text Data */}
        <div className="flex flex-col flex-1 px-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold tracking-wider text-ink-500 uppercase">
              {category}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-ink-900">
              <span className="text-amber-500 text-sm">★</span> {rating}
            </span>
          </div>

          <h3 className="text-base font-semibold text-ink-900 leading-snug mb-1 group-hover:text-vt-800 transition">
            {title}
          </h3>
          <p className="text-sm text-ink-500">
            {author}
          </p>
        </div>
      </article>
    </Link>
  );
}