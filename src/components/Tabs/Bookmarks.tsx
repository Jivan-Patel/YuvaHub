import React, { useState, useEffect } from 'react';
import { Bookmark as BookmarkIcon, Target, Loader2, ExternalLink } from 'lucide-react';
import { UserProfile } from '../../types';
import { fetchOpportunityById } from '../../services/apiClient';

interface BookmarksProps {
  user: any;
  profile: UserProfile | null;
  onViewDetails: (id: string, title?: string) => void;
}

export default function Bookmarks({ user, profile, onViewDetails }: BookmarksProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookmarks() {
      if (!profile || !profile.bookmarks || profile.bookmarks.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const results = await Promise.all(
          profile.bookmarks.map(id => fetchOpportunityById(id))
        );
        // Filter out any nulls if an opp got deleted
        setItems(results.filter(r => r));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadBookmarks();
  }, [profile?.bookmarks]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading your saved opportunities...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Your Bookmarks</h2>
          <p className="text-gray-500 mt-1">Opportunities you've saved for later.</p>
        </header>

        <div className="clean-card p-12 text-center border-dashed border-gray-300">
          <BookmarkIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No bookmarks yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            When you find an opportunity you like, save it to your bookmarks to keep track of it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Your Bookmarks</h2>
        <p className="text-gray-500 mt-1">Review your saved opportunities and apply.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <div key={i} className="clean-card p-6 flex flex-col justify-between relative group">
            <div className="flex justify-between items-start mb-2 pr-6">
              <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                {item.type || 'Opportunity'}
              </span>
            </div>
            <a 
              href={`/opportunity/${item.id}/${(item.title || "opportunity").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`}
              onClick={(e) => {
                e.preventDefault();
                onViewDetails(item.id, item.title);
              }}
              className="hover:text-blue-600 transition-colors block cursor-pointer"
            >
              <h4 className="font-bold text-gray-900 mb-1 leading-tight text-base sm:text-lg">{item.title}</h4>
            </a>
            <p className="text-sm text-gray-500 mb-3">{item.organization || item.org}</p>
            <p className="text-sm text-gray-700 line-clamp-2 mb-4">{item.description}</p>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                <div className="flex flex-wrap gap-2">
                  {item.tags?.slice(0,2).map((t: string) => (
                    <span key={t} className="text-[10px] bg-gray-100 px-2 py-1 text-gray-600 rounded">{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {(item.apply_link || item.applyLink) ? (
                    <a 
                      href={item.apply_link || item.applyLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="clean-btn px-4 py-1.5 text-xs font-bold hover:shadow-md transition-shadow"
                    >
                      Apply
                    </a>
                  ) : (
                    <span className="text-[10px] font-semibold text-red-500">DL: {item.deadline || item.daysLeft + 'd'}</span>
                  )}
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
