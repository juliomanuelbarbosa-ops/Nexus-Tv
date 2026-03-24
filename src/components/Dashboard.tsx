/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Channel, ContentType } from '../types';
import { Play, Search, Filter, Tv, Film, Clapperboard, LogOut, Settings, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  channels: Channel[];
  filteredChannels: Channel[];
  favorites: string[];
  recentlyPlayed: string[];
  customFilters: any;
  showBlocked: boolean;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (id: string) => void;
  onToggleShowBlocked: () => void;
  onUpdateFilters: (filters: any) => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  channels, 
  filteredChannels, 
  favorites,
  recentlyPlayed,
  customFilters,
  showBlocked,
  onSelectChannel, 
  onToggleFavorite,
  onToggleShowBlocked,
  onUpdateFilters,
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<ContentType | 'FAVORITES' | 'RECENT'>(ContentType.LIVE);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const stats = useMemo(() => {
    const total = channels.length;
    const live = channels.filter(c => c.type === ContentType.LIVE).length;
    const movies = channels.filter(c => c.type === ContentType.MOVIE).length;
    const series = channels.filter(c => c.type === ContentType.SERIES).length;
    const blocked = channels.filter(c => c.isBlocked).length;
    return { total, live, movies, series, blocked };
  }, [channels]);

  const categories = useMemo(() => {
    const list = showBlocked ? channels : filteredChannels;
    const filteredByType = list.filter(c => c.type === activeTab);
    const groups = new Set(filteredByType.map(c => c.groupTitle || 'General'));
    return Array.from(groups).sort();
  }, [channels, filteredChannels, activeTab, showBlocked]);

  const currentChannels = useMemo(() => {
    let list = filteredChannels;
    
    if (showBlocked) {
      list = channels;
    }

    if (activeTab === 'FAVORITES') {
      list = list.filter(ch => favorites.includes(ch.id));
    } else if (activeTab === 'RECENT') {
      list = recentlyPlayed
        .map(id => channels.find(c => c.id === id))
        .filter((c): c is Channel => !!c);
    } else {
      list = list.filter(ch => ch.type === activeTab);
      if (selectedCategory) {
        list = list.filter(ch => (ch.groupTitle || 'General') === selectedCategory);
      }
    }

    return list.filter(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [channels, filteredChannels, activeTab, searchQuery, favorites, recentlyPlayed, showBlocked, selectedCategory]);

  const handleExport = () => {
    const m3uHeader = '#EXTM3U\n';
    const m3uContent = filteredChannels
      .filter(ch => !ch.isBlocked)
      .map(ch => {
        return `#EXTINF:-1 tvg-logo="${ch.logo || ''}" group-title="${ch.groupTitle || ''}",${ch.name}\n${ch.url}`;
      })
      .join('\n');
    
    const blob = new Blob([m3uHeader + m3uContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned_playlist.m3u';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* Sidebar / Top Nav */}
      <header className="bg-[#0a0a0a] border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Tv className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">NEXUS</h1>
            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-tighter">Zero-Clutter</p>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input
            type="text"
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-2.5 focus:outline-none focus:border-orange-500/30 transition-colors text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-xs font-bold text-white/60 hover:text-white"
          >
            <Clapperboard size={14} />
            Export Clean M3U
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/40"
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={onLogout}
            className="p-2.5 bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all text-white/40"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Category Sidebar */}
        <aside className="w-64 bg-[#080808] border-r border-white/5 flex flex-col">
          <div className="p-6">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4">Categories</h2>
            <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-250px)] pr-2 custom-scrollbar">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  selectedCategory === null 
                    ? 'bg-orange-500 text-white' 
                    : 'text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all truncate ${
                    selectedCategory === cat 
                      ? 'bg-orange-500 text-white' 
                      : 'text-white/40 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Stats Strip */}
          <div className="px-6 py-4 bg-[#080808] border-b border-white/5 grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Total', value: stats.total, color: 'text-white' },
              { label: 'Live', value: stats.live, color: 'text-blue-400' },
              { label: 'Movies', value: stats.movies, color: 'text-purple-400' },
              { label: 'Series', value: stats.series, color: 'text-green-400' },
              { label: 'Hidden', value: stats.blocked, color: 'text-orange-500' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-white/20 font-bold">{stat.label}</span>
                <span className={`text-xl font-black ${stat.color}`}>{stat.value.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                { id: ContentType.LIVE, icon: Tv, label: 'Live TV' },
                { id: ContentType.MOVIE, icon: Film, label: 'Movies' },
                { id: ContentType.SERIES, icon: Clapperboard, label: 'Series' },
                { id: 'FAVORITES', icon: Play, label: 'Favorites' },
                { id: 'RECENT', icon: Search, label: 'Recent' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSelectedCategory(null);
                  }}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20' 
                      : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={onToggleShowBlocked}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${
                  showBlocked 
                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-500' 
                    : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
                }`}
              >
                <Filter size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {showBlocked ? 'Showing All' : 'Filtering Clutter'}
                </span>
              </button>
            </div>
          </div>

          {/* Channel Grid */}
          <div className="px-6 pb-12 flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
              <AnimatePresence mode="popLayout">
                {currentChannels.map((channel) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={channel.id}
                    className={`group relative aspect-[3/4] bg-[#111] rounded-2xl overflow-hidden cursor-pointer border transition-all ${
                      channel.isBlocked 
                        ? 'border-orange-500/20 opacity-40 grayscale' 
                        : 'border-white/5 hover:border-orange-500/50'
                    }`}
                  >
                    <div 
                      className="absolute inset-0 z-10" 
                      onClick={() => onSelectChannel(channel)}
                    />

                    {channel.logo ? (
                      <img 
                        src={channel.logo} 
                        alt={channel.name}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-transparent">
                        <Tv size={40} className="text-orange-500/20" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(channel.id);
                      }}
                      className={`absolute top-3 right-3 z-20 p-2 rounded-lg transition-all ${
                        favorites.includes(channel.id)
                          ? 'bg-orange-500 text-white'
                          : 'bg-black/40 text-white/40 hover:bg-black/60 hover:text-white'
                      }`}
                    >
                      <Play size={12} fill={favorites.includes(channel.id) ? "white" : "none"} />
                    </button>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/40 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                        <Play size={20} fill="white" />
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                      <p className="text-[10px] font-black uppercase tracking-tighter text-orange-500 mb-1 truncate">
                        {channel.groupTitle || 'General'}
                      </p>
                      <h3 className="text-sm font-bold leading-tight line-clamp-2 group-hover:text-orange-500 transition-colors">
                        {channel.name}
                      </h3>
                    </div>

                    {channel.isBlocked && (
                      <div className="absolute top-3 left-3 z-20 px-2 py-1 bg-orange-500 rounded text-[8px] font-black uppercase tracking-widest">
                        Blocked
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {currentChannels.length === 0 && (
              <div className="h-96 flex flex-col items-center justify-center text-white/20 space-y-4">
                <Search size={48} />
                <p className="text-lg font-bold">No channels found in this category</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="text-orange-500" />
                  <h2 className="text-xl font-bold">Filter Settings</h2>
                </div>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
                {/* Languages */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Blocked Languages</h3>
                    <button 
                      onClick={() => {
                        const lang = prompt('Enter language code or name to block:');
                        if (lang) onUpdateFilters({ ...customFilters, blockedLanguages: [...customFilters.blockedLanguages, lang] });
                      }}
                      className="flex items-center gap-2 text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors"
                    >
                      <Plus size={14} /> Add Language
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {customFilters.blockedLanguages.map((lang: string) => (
                      <div key={lang} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 group">
                        <span className="text-xs font-bold">{lang}</span>
                        <button 
                          onClick={() => onUpdateFilters({ ...customFilters, blockedLanguages: customFilters.blockedLanguages.filter((l: string) => l !== lang) })}
                          className="text-white/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Keywords */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Blocked Keywords</h3>
                    <button 
                      onClick={() => {
                        const kw = prompt('Enter keyword to block:');
                        if (kw) onUpdateFilters({ ...customFilters, blockedKeywords: [...customFilters.blockedKeywords, kw] });
                      }}
                      className="flex items-center gap-2 text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors"
                    >
                      <Plus size={14} /> Add Keyword
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {customFilters.blockedKeywords.map((kw: string) => (
                      <div key={kw} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 group">
                        <span className="text-xs font-bold">{kw}</span>
                        <button 
                          onClick={() => onUpdateFilters({ ...customFilters, blockedKeywords: customFilters.blockedKeywords.filter((k: string) => k !== kw) })}
                          className="text-white/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Countries */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Blocked Countries</h3>
                    <button 
                      onClick={() => {
                        const c = prompt('Enter country code or name to block:');
                        if (c) onUpdateFilters({ ...customFilters, blockedCountries: [...customFilters.blockedCountries, c] });
                      }}
                      className="flex items-center gap-2 text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors"
                    >
                      <Plus size={14} /> Add Country
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {customFilters.blockedCountries.map((c: string) => (
                      <div key={c} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 group">
                        <span className="text-xs font-bold">{c}</span>
                        <button 
                          onClick={() => onUpdateFilters({ ...customFilters, blockedCountries: customFilters.blockedCountries.filter((country: string) => country !== c) })}
                          className="text-white/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="p-6 border-t border-white/5 flex justify-end">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-8 py-3 bg-orange-500 text-white rounded-2xl font-bold shadow-xl shadow-orange-500/20 hover:bg-orange-400 transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
