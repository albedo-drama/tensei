"use client";
import React, { useState, useEffect } from 'react';

// --- KONFIGURASI API ---
const API_BASE = "https://dramabos.asia/api/tensei";

// Helper: Hapus data duplikat dari API list
const cleanData = (arr: any[]) => {
  if (!arr) return [];
  return arr.filter((v, i, a) => a.findIndex(t => t.slug === v.slug) === i);
};

export default function AnimeApp() {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState<'home' | 'ongoing' | 'explore' | 'detail' | 'watch'>('home');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [listData, setListData] = useState<any[]>([]); // Untuk Home/Search/Ongoing
  const [animeDetail, setAnimeDetail] = useState<any>(null); // Untuk Info Anime (Sinopsis, dll)
  const [watchData, setWatchData] = useState<any>(null); // Untuk Data Player (Server, Link Download)
  const [streamData, setStreamData] = useState<any>(null); // Untuk Direct MP4 (No Ads)
  const [genres, setGenres] = useState<any[]>([]); // List Genre

  // Filter & UI States
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [playerMode, setPlayerMode] = useState<'iframe' | 'native'>('iframe');
  const [nativeSrc, setNativeSrc] = useState('');

  // --- FETCHING LOGIC ---
  const fetchList = async (endpoint: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      const json = await res.json();
      setListData(cleanData(json.data));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadAnimeDetail = async (slug: string) => {
    setLoading(true);
    try {
      // Bersihkan slug jika ada sisa '-episode-x'
      const cleanSlug = slug.replace(/-episode-\d+.*$/, ''); 
      const res = await fetch(`${API_BASE}/detail/${cleanSlug}`);
      const json = await res.json();
      setAnimeDetail(json.data);
      setView('detail');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadWatch = async (slug: string) => {
    // Jangan set loading true full screen agar transisi lebih mulus
    setView('watch'); 
    setWatchData(null);
    setStreamData(null);
    setPlayerMode('iframe');
    
    try {
      // 1. Ambil Data Watch (Server Iframe & Download Link)
      const resWatch = await fetch(`${API_BASE}/watch/${slug}`);
      const jsonWatch = await resWatch.json();
      setWatchData(jsonWatch.data);

      // 2. Ambil Data Stream (Direct MP4) - Optional
      const resStream = await fetch(`${API_BASE}/stream/${slug}`);
      const jsonStream = await resStream.json();
      if(jsonStream.code === 0) setStreamData(jsonStream.data);

    } catch (e) { console.error(e); }
  };

  // Initial Load (Genres)
  useEffect(() => {
    fetch(`${API_BASE}/genres`).then(r => r.json()).then(j => setGenres(j.data)).catch(console.error);
  }, []);

  // Router Effect
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'home') fetchList(`/home?page=${page}`);
    if (view === 'ongoing') fetchList(`/ongoing?page=${page}`); 
    if (view === 'explore') {
      const p = new URLSearchParams();
      p.append('page', page.toString());
      if (filterStatus) p.append('status', filterStatus);
      if (filterGenre) p.append('genre', filterGenre);
      p.append('order', 'update');
      fetchList(`/anime?${p.toString()}`);
    }
  }, [view, page, filterStatus, filterGenre]);

  // --- COMPONENTS ---
  const Pagination = () => (
    <div className="flex justify-center gap-4 mt-8 pb-8">
      <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-5 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-50">← Prev</button>
      <span className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-sm flex items-center">Page {page}</span>
      <button onClick={() => setPage(p => p + 1)} className="px-5 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 font-bold">Next →</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200 font-sans">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#1e293b]/95 backdrop-blur border-b border-slate-700 shadow-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 cursor-pointer tracking-tighter"
                onClick={() => { setView('home'); setPage(1); }}>
              ALBEDOWIBU-TV
            </h1>
            <div className="hidden md:flex gap-1 bg-slate-800/50 p-1 rounded-lg">
              {['home', 'ongoing', 'explore'].map(v => (
                <button key={v} onClick={() => { setView(v as any); setPage(1); }}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${view === v ? 'bg-blue-600 text-white shadow' : 'hover:text-blue-400 text-slate-400'}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setView('explore'); fetchList(`/search?q=${searchQuery}`); }} className="relative w-full max-w-xs">
             <input type="text" placeholder="Cari waifu..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-full pl-4 pr-10 py-2 text-sm focus:outline-none focus:border-blue-500" />
             <button type="submit" className="absolute right-3 top-2.5 text-slate-500 hover:text-white">🔍</button>
          </form>
        </div>
      </nav>

      {/* FILTER BAR (EXPLORE ONLY) */}
      {view === 'explore' && !searchQuery && (
        <div className="bg-slate-900 border-b border-slate-800 py-3">
          <div className="container mx-auto px-4 flex gap-3 overflow-x-auto">
            <select className="bg-slate-800 border border-slate-700 text-sm rounded px-3 py-1.5 focus:border-blue-500 outline-none"
              onChange={e => { setFilterGenre(e.target.value); setPage(1); }}>
              <option value="">Semua Genre</option>
              {genres.map(g => <option key={g.slug} value={g.slug}>{g.name}</option>)}
            </select>
            <select className="bg-slate-800 border border-slate-700 text-sm rounded px-3 py-1.5 focus:border-blue-500 outline-none"
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">Semua Status</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm animate-pulse">Sabar ya, lagi loading...</p>
          </div>
        ) : (
          <>
            {/* VIEW: LIST (HOME / ONGOING / EXPLORE) */}
            {['home', 'ongoing', 'explore'].includes(view) && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold mb-6 border-l-4 border-blue-500 pl-3">
                  {searchQuery ? `Hasil: "${searchQuery}"` : view === 'ongoing' ? 'Anime Sedang Tayang' : view === 'home' ? 'Update Terbaru' : 'Jelajahi Anime'}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
                  {listData.map((item, i) => (
                    <div key={i} onClick={() => loadAnimeDetail(item.slug)} className="group cursor-pointer">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 shadow-lg group-hover:shadow-blue-900/20 transition-all">
                        <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                        <div className="absolute top-2 right-2 bg-blue-600 text-[10px] font-bold px-2 py-0.5 rounded shadow">{item.type || 'TV'}</div>
                        <div className="absolute bottom-2 left-2">
                           <span className="text-xs font-bold bg-white/10 backdrop-blur px-2 py-1 rounded text-white">{item.episode || item.status}</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-semibold leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">{item.title}</h3>
                    </div>
                  ))}
                </div>
                {listData.length > 0 && <Pagination />}
              </div>
            )}

            {/* VIEW: DETAIL */}
            {view === 'detail' && animeDetail && (
              <div className="max-w-6xl mx-auto animate-fade-in">
                <button onClick={() => setView('home')} className="mb-6 text-sm text-slate-400 hover:text-white flex items-center gap-2">← Kembali ke Beranda</button>
                
                {/* Header Detail */}
                <div className="grid md:grid-cols-[280px_1fr] gap-8 mb-10">
                  <div className="space-y-4">
                    <img src={animeDetail.img} className="w-full rounded-xl shadow-2xl border border-slate-800" />
                    <button onClick={() => animeDetail.episodes?.[0] && loadWatch(animeDetail.episodes[0].slug)} 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all text-white">
                      ▶ Mulai Nonton
                    </button>
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">{animeDetail.title}</h1>
                    {animeDetail.altTitle && <p className="text-slate-500 text-sm mb-4 italic">{animeDetail.altTitle}</p>}
                    
                    <div className="flex flex-wrap gap-3 mb-6">
                      <div className="bg-slate-800 px-3 py-1 rounded text-xs font-bold text-yellow-400">★ {animeDetail.rating}</div>
                      <div className="bg-slate-800 px-3 py-1 rounded text-xs font-bold text-blue-300">{animeDetail.status}</div>
                      <div className="bg-slate-800 px-3 py-1 rounded text-xs font-bold">{animeDetail.season}</div>
                      <div className="bg-slate-800 px-3 py-1 rounded text-xs font-bold">{animeDetail.studio}</div>
                    </div>

                    <p className="text-slate-400 leading-relaxed mb-6">{animeDetail.synopsis}</p>
                    
                    <div className="mb-6">
                      <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Genre</h4>
                      <div className="flex flex-wrap gap-2">
                        {animeDetail.genres?.map((g: string) => (
                          <span key={g} className="px-3 py-1 rounded-full border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 cursor-default">{g}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Episode List */}
                <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><span className="w-1 h-5 bg-blue-500 rounded"></span> Daftar Episode</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-2">
                    {animeDetail.episodes?.map((ep: any) => (
                      <button key={ep.slug} onClick={() => loadWatch(ep.slug)}
                        className="bg-slate-800 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500 p-3 rounded-lg text-left group transition-all">
                        <div className="text-xs font-bold text-slate-300 group-hover:text-blue-400 truncate">{ep.title}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{ep.date}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: WATCH */}
            {view === 'watch' && watchData && (
              <div className="max-w-5xl mx-auto animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => setView('detail')} className="text-sm text-slate-400 hover:text-white">← Info Anime</button>
                  <h2 className="text-lg font-bold truncate max-w-md text-right">{watchData.title}</h2>
                </div>

                {/* PLAYER AREA */}
                <div className="bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800 aspect-video relative">
                  {playerMode === 'iframe' ? (
                     <iframe src={watchData.servers?.[0]?.embed} className="w-full h-full" allowFullScreen />
                  ) : (
                     streamData ? (
                       <video src={nativeSrc || streamData[0]?.url} controls autoPlay className="w-full h-full" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-500">Player Native tidak tersedia</div>
                     )
                  )}
                </div>

                {/* CONTROLS */}
                <div className="mt-4 bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between gap-4">
                   <div className="flex gap-2">
                      <button onClick={() => setPlayerMode('iframe')} 
                        className={`px-4 py-2 rounded text-xs font-bold ${playerMode === 'iframe' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                        Server Utama
                      </button>
                      <button onClick={() => { setPlayerMode('native'); if(streamData) setNativeSrc(streamData[0].url); }} 
                        className={`px-4 py-2 rounded text-xs font-bold ${playerMode === 'native' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                        Player No-Ads
                      </button>
                   </div>
                   {watchData.next && (
                     <button onClick={() => loadWatch(watchData.next)} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-bold text-sm">
                       Episode Selanjutnya →
                     </button>
                   )}
                </div>

                {/* SERVER LIST / QUALITY */}
                <div className="mt-4 grid md:grid-cols-2 gap-8">
                   <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">
                        {playerMode === 'iframe' ? 'Pilih Server' : 'Pilih Resolusi'}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {playerMode === 'iframe' ? 
                           watchData.servers?.map((s: any, i: number) => (
                             <button key={i} onClick={() => { const ifr = document.querySelector('iframe'); if(ifr) ifr.src = s.embed; }}
                               className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs border border-slate-600">{s.name}</button>
                           )) 
                           :
                           streamData?.map((s: any, i: number) => (
                             <button key={i} onClick={() => setNativeSrc(s.url)}
                               className={`px-3 py-1.5 rounded text-xs border ${nativeSrc === s.url ? 'bg-green-600 border-green-600' : 'bg-slate-700 border-slate-600'}`}>
                               {s.quality}
                             </button>
                           ))
                        }
                      </div>
                   </div>

                   {/* DOWNLOAD LINKS (NEW FEATURE) */}
                   {watchData.downloads && (
                     <div>
                       <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Link Download Eksternal</h4>
                       <div className="flex flex-wrap gap-2">
                         {watchData.downloads.map((dl: any, i: number) => (
                           <a key={i} href={dl.url} target="_blank" rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-800 hover:bg-blue-900 border border-slate-700 hover:border-blue-500 rounded text-xs text-blue-400 flex items-center gap-1">
                              ⬇ {dl.quality}
                           </a>
                         ))}
                       </div>
                     </div>
                   )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mt-auto py-8 text-center text-slate-600 text-sm bg-[#0f172a] border-t border-slate-800">
        <p>&copy; 2026 ALBEDOWIBU-TV • Wibu gak harus bau</p>
      </footer>
    </div>
  );
}
