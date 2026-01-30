"use client";
import React, { useState, useEffect, useRef } from 'react';

// --- KONFIGURASI API ---
const API_BASE = "https://dramabos.asia/api/tensei";

// --- HELPER ---
const cleanData = (arr: any[]) => {
  if (!arr) return [];
  return arr.filter((v, i, a) => a.findIndex(t => t.slug === v.slug) === i);
};

const formatLabel = (item: any) => {
  if (item.episode) {
    // Ubah "Episode 12" jadi "Ep 12" biar singkat
    return item.episode.replace('Episode', 'Ep').replace('Subtitle Indonesia', '').trim();
  }
  return item.status || 'Sub Indo';
};

// --- COMPONENTS: LOADING KEREN ---
const SuperLoader = () => {
  const [text, setText] = useState("Memanggil Waifu...");
  useEffect(() => {
    const texts = ["Memanggil Waifu...", "Menyiapkan Isekai...", "Loading Anime...", "Sabar ya..."];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % texts.length;
      setText(texts[i]);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-blue-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
           <span className="text-2xl">⚡</span>
        </div>
      </div>
      <p className="text-sm font-bold text-slate-400 animate-pulse tracking-widest uppercase">{text}</p>
    </div>
  );
};

// --- ICONS (SVG) ---
const Icons = {
  Home: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Genre: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Search: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Fav: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  Back: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  Ongoing: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Play: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
};

export default function AnimeApp() {
  // --- STATE ---
  const [view, setView] = useState<'home' | 'ongoing' | 'genres' | 'genre_result' | 'search' | 'favorites' | 'detail' | 'watch'>('home');
  const [loading, setLoading] = useState(false);
  
  // Data
  const [listData, setListData] = useState<any[]>([]);
  const [animeDetail, setAnimeDetail] = useState<any>(null);
  const [watchData, setWatchData] = useState<any>(null);
  const [streamData, setStreamData] = useState<any>(null);
  const [genres, setGenres] = useState<any[]>([]);
  
  // User Data
  const [favorites, setFavorites] = useState<any[]>([]);
  
  // UI Controls
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState({ name: '', slug: '' });
  const [nativeSrc, setNativeSrc] = useState('');
  const [playerMode, setPlayerMode] = useState<'iframe' | 'native'>('iframe');
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- INIT ---
  useEffect(() => {
    const savedFav = localStorage.getItem('favorites');
    if (savedFav) setFavorites(JSON.parse(savedFav));
    
    // Fetch Genres
    fetch(`${API_BASE}/genres`).then(r => r.json()).then(j => setGenres(j.data)).catch(console.error);
  }, []);

  // --- FETCHING ---
  const fetchList = async (endpoint: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      const json = await res.json();
      setListData(cleanData(json.data));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadDetail = async (slug: string) => {
    setLoading(true);
    try {
      const clean = slug.replace(/-episode-\d+.*$/, '');
      const res = await fetch(`${API_BASE}/detail/${clean}`);
      const json = await res.json();
      setAnimeDetail(json.data);
      setView('detail');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadWatch = async (slug: string) => {
    setView('watch');
    setWatchData(null);
    setStreamData(null);
    setNativeSrc('');
    setPlayerMode('native'); 
    
    try {
      const resWatch = await fetch(`${API_BASE}/watch/${slug}`);
      const jsonWatch = await resWatch.json();
      setWatchData(jsonWatch.data);

      const resStream = await fetch(`${API_BASE}/stream/${slug}`);
      const jsonStream = await resStream.json();
      
      if (jsonStream.code === 0 && jsonStream.data?.length > 0) {
        setStreamData(jsonStream.data);
        setNativeSrc(jsonStream.data[0].url);
      }
    } catch (e) { console.error(e); }
  };

  const toggleFav = () => {
    if(!animeDetail) return;
    const exists = favorites.some(f => f.title === animeDetail.title);
    const newFav = exists 
      ? favorites.filter(f => f.title !== animeDetail.title)
      : [{ title: animeDetail.title, img: animeDetail.img, slug: `detail/${animeDetail.title.toLowerCase().replace(/ /g, '-')}` }, ...favorites];
    
    setFavorites(newFav);
    localStorage.setItem('favorites', JSON.stringify(newFav));
  };

  const openGenre = (slug: string, name: string) => {
    setSelectedGenre({ name, slug });
    setPage(1);
    setView('genre_result');
  };

  // --- EFFECTS ---
  useEffect(() => {
    window.scrollTo(0, 0);
    if (view === 'home') fetchList(`/anime?page=${page}&order=update`);
    if (view === 'ongoing') fetchList(`/ongoing?page=${page}`);
    if (view === 'search' && searchQuery) fetchList(`/search?q=${searchQuery}`);
    if (view === 'genre_result') fetchList(`/anime?genre=${selectedGenre.slug}&page=${page}&order=update`);
  }, [view, page, selectedGenre]);

  // --- HEADER COMPONENT ---
  const MobileHeader = () => (
    <div className="fixed top-0 left-0 right-0 h-14 bg-[#0f172a]/95 backdrop-blur z-40 flex items-center justify-between px-4 border-b border-slate-800 shadow-md">
       <h1 className="text-lg font-black italic bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
         ALBEDOWIBU-TV
       </h1>
       {view !== 'search' && (
         <button onClick={() => setView('search')} className="text-slate-400">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
         </button>
       )}
    </div>
  );

  // --- BOTTOM NAV COMPONENT ---
  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a] border-t border-slate-800 pb-safe z-50 flex justify-around items-center h-16 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
      <button onClick={() => { setView('home'); setPage(1); }} className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-blue-500' : 'text-slate-500'}`}>
        <Icons.Home /> <span className="text-[10px] font-bold">Home</span>
      </button>
      <button onClick={() => { setView('ongoing'); setPage(1); }} className={`flex flex-col items-center gap-1 ${view === 'ongoing' ? 'text-blue-500' : 'text-slate-500'}`}>
        <Icons.Ongoing /> <span className="text-[10px] font-bold">Ongoing</span>
      </button>
      <button onClick={() => setView('genres')} className={`flex flex-col items-center gap-1 ${(view === 'genres' || view === 'genre_result') ? 'text-blue-500' : 'text-slate-500'}`}>
        <Icons.Genre /> <span className="text-[10px] font-bold">Genre</span>
      </button>
      <button onClick={() => setView('favorites')} className={`flex flex-col items-center gap-1 ${view === 'favorites' ? 'text-blue-500' : 'text-slate-500'}`}>
        <Icons.Fav /> <span className="text-[10px] font-bold">Favorit</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans pb-20 pt-16 selection:bg-blue-500 selection:text-white">
      <MobileHeader />

      {/* SEARCH INPUT */}
      {view === 'search' && (
        <div className="container mx-auto px-4 mb-4">
          <form onSubmit={(e) => { e.preventDefault(); fetchList(`/search?q=${searchQuery}`); }} className="relative">
            <input autoFocus type="text" placeholder="Ketik judul anime..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10" />
            <div className="absolute left-3 top-3 text-slate-400"><Icons.Search /></div>
          </form>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-3">
        {loading ? (
          <SuperLoader />
        ) : (
          <>
            {/* VIEW: GENRE MENU */}
            {view === 'genres' && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold mb-4 px-1">Pilih Genre</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {genres.map((g, i) => (
                    <button key={i} onClick={() => openGenre(g.slug, g.name)}
                      className="bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 p-4 rounded-xl text-left transition-all group">
                      <span className="font-bold text-sm text-slate-300 group-hover:text-white block">{g.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW: LIST (Home, Ongoing, Search, Genre Result) */}
            {(['home', 'ongoing', 'search', 'genre_result'].includes(view) && (listData.length > 0 || view === 'genre_result')) && (
              <>
                {/* HERO BANNER - JUDUL DI ATAS GAMBAR SEKARANG */}
                {view === 'home' && !searchQuery && page === 1 && listData.length > 0 && (
                  <div className="mb-8">
                     {/* 1. JUDUL DITARUH DI LUAR GAMBAR (DI ATAS) */}
                     <div className="mb-3 px-1">
                        <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-1 rounded mr-2 align-middle shadow-lg shadow-red-500/20">HOT UPDATE</span>
                        <h2 className="text-xl md:text-2xl font-black text-white leading-tight inline align-middle">{listData[0].title}</h2>
                     </div>

                     {/* 2. GAMBAR BANNER (TV LABEL DIHAPUS) */}
                     <div onClick={() => loadDetail(listData[0].slug)} className="relative rounded-2xl overflow-hidden aspect-video shadow-2xl border border-slate-800 active:scale-95 transition-transform cursor-pointer">
                        <img src={listData[0].img} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        
                        {/* Status Label (Ep 12 / Sub Indo) */}
                        <div className="absolute bottom-3 left-3">
                           <span className="bg-blue-600 text-xs font-bold px-3 py-1 rounded-full text-white shadow border border-blue-400">
                              {formatLabel(listData[0])}
                           </span>
                        </div>
                     </div>
                  </div>
                )}

                <div className="flex justify-between items-center mb-4 px-1">
                   <h2 className="font-bold text-lg text-slate-200 flex items-center gap-2">
                     {view === 'genre_result' && <button onClick={()=>setView('genres')}><Icons.Back /></button>}
                     {view === 'home' ? 'Update Terbaru' : view === 'ongoing' ? 'Sedang Tayang' : view === 'genre_result' ? `Genre: ${selectedGenre.name}` : 'Hasil Pencarian'}
                   </h2>
                   {listData.length > 0 && (
                     <div className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">Page {page}</div>
                   )}
                </div>

                {/* GRID LIST */}
                {listData.length === 0 ? (
                   <p className="text-center text-slate-500 mt-10">Tidak ada anime ditemukan.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {listData.map((item, i) => (
                      <div key={i} onClick={() => loadDetail(item.slug)} className="relative group rounded-xl overflow-hidden bg-slate-900 shadow-md active:scale-95 transition-transform border border-slate-800 cursor-pointer">
                        {/* Image Container */}
                        <div className="aspect-[3/4] relative">
                          <img src={item.img} className="w-full h-full object-cover" loading="lazy" />
                          <div className="absolute bottom-2 right-2">
                            <span className="text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur border border-white/10 block truncate">
                              {formatLabel(item)}
                            </span>
                          </div>
                        </div>
                        
                        {/* 3. FIX TITLE WARNA: PAKSA BG GELAP & TEKS PUTIH */}
                        <div className="p-3 bg-slate-900 h-[4.5rem] flex items-center">
                          <h3 className="text-xs font-bold leading-snug line-clamp-2 text-white group-hover:text-blue-400 transition-colors">
                            {item.title}
                          </h3>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* PAGINATION */}
                {listData.length > 0 && (
                  <div className="flex justify-center gap-4 mt-8">
                    <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-5 py-2 bg-slate-800 rounded-full text-xs font-bold disabled:opacity-50">← Prev</button>
                    <button onClick={()=>setPage(p=>p+1)} className="px-5 py-2 bg-blue-600 rounded-full text-xs font-bold text-white shadow-lg shadow-blue-500/30">Next →</button>
                  </div>
                )}
              </>
            )}

            {/* VIEW: FAVORITES */}
            {view === 'favorites' && (
              <div className="px-2 animate-fade-in">
                 <h2 className="font-bold text-lg mb-4">Koleksi Favorit</h2>
                 {favorites.length === 0 ? <p className="text-slate-500 text-sm text-center mt-20">Belum ada anime favorit.</p> : (
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {favorites.map((item, i) => (
                        <div key={i} onClick={() => loadDetail(item.slug)} className="bg-slate-800 rounded-xl overflow-hidden shadow border border-slate-700 active:scale-95 transition">
                           <div className="aspect-[16/9]"><img src={item.img} className="w-full h-full object-cover"/></div>
                           <div className="p-3"><h3 className="text-xs font-bold line-clamp-2 text-white">{item.title}</h3></div>
                        </div>
                      ))}
                   </div>
                 )}
              </div>
            )}

            {/* VIEW: DETAIL */}
            {view === 'detail' && animeDetail && (
              <div className="animate-fade-in pb-10">
                <div className="relative h-64 -mt-6 -mx-3 mb-14 overflow-hidden">
                   <img src={animeDetail.img} className="w-full h-full object-cover opacity-30 blur-md scale-110" />
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#020617]"></div>
                   <button onClick={() => setView('home')} className="absolute top-4 left-4 bg-black/40 p-2 rounded-full backdrop-blur text-white z-10"><Icons.Back /></button>
                   
                   <div className="absolute -bottom-10 left-4 right-4 flex gap-4 items-end z-20">
                      <img src={animeDetail.img} className="w-28 rounded-lg shadow-2xl border-2 border-slate-700 bg-slate-800" />
                      <div className="flex-1 pb-1">
                         <h1 className="text-lg font-black leading-tight line-clamp-3 mb-2 text-white shadow-black drop-shadow-md">{animeDetail.title}</h1>
                         <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-300">
                            <span className="bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/30">★ {animeDetail.rating || '-'}</span>
                            <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">{animeDetail.status}</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex gap-3 px-1 mb-6 mt-6">
                   <button onClick={() => animeDetail.episodes?.[0] && loadWatch(animeDetail.episodes[0].slug)} 
                     className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 py-3 rounded-xl font-bold text-sm text-white shadow-lg shadow-blue-500/20 active:scale-95 transition flex justify-center items-center gap-2">
                     <Icons.Play /> Mulai Nonton
                   </button>
                   <button onClick={toggleFav} className={`px-4 py-3 rounded-xl border transition ${favorites.some(f=>f.title===animeDetail.title)?'border-red-500 bg-red-500/10 text-red-400':'border-slate-700 bg-slate-800 text-slate-400'}`}>
                     <Icons.Fav />
                   </button>
                </div>

                <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800 mb-6">
                   <h3 className="font-bold text-xs text-slate-500 uppercase mb-2">Genre</h3>
                   <div className="flex flex-wrap gap-2 mb-4">
                      {animeDetail.genres && animeDetail.genres.length > 0 ? (
                        animeDetail.genres.map((g:string) => (
                          <span key={g} className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">{g}</span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Genre tidak tersedia</span>
                      )}
                   </div>
                   <h3 className="font-bold text-xs text-slate-500 uppercase mb-1">Sinopsis</h3>
                   <p className="text-xs text-slate-400 leading-relaxed line-clamp-6">
                     {animeDetail.synopsis ? animeDetail.synopsis : "Sinopsis belum tersedia untuk anime ini."}
                   </p>
                </div>

                <div className="px-1">
                   <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                     <span className="w-1 h-4 bg-blue-500 rounded-full"></span> Daftar Episode
                   </h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-1">
                      {animeDetail.episodes?.map((ep:any) => (
                         <button key={ep.slug} onClick={()=>loadWatch(ep.slug)} className="bg-slate-800 p-3 rounded-lg text-left border border-slate-700 active:bg-blue-600 active:border-blue-500 transition group">
                            <div className="text-[11px] font-bold truncate text-slate-300 group-active:text-white">{ep.title.replace(animeDetail.title, '').replace('Subtitle Indonesia','').trim() || ep.title}</div>
                            <div className="text-[9px] text-slate-500 mt-1 group-active:text-blue-200">{ep.date}</div>
                         </button>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {/* VIEW: WATCH (FIXED ERROR UI) */}
            {view === 'watch' && (
              <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-fade-in">
                 <div className="absolute top-0 left-0 right-0 p-4 z-10 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start pointer-events-none">
                    <button onClick={()=>setView('detail')} className="pointer-events-auto bg-black/50 p-2 rounded-full backdrop-blur text-white active:scale-90 transition"><Icons.Back /></button>
                 </div>

                 <div className="flex-1 flex items-center justify-center bg-black relative">
                    {playerMode === 'native' && streamData ? (
                       <video 
                         ref={videoRef}
                         src={nativeSrc || streamData[0].url} 
                         controls 
                         autoPlay 
                         playsInline 
                         className="w-full max-h-screen aspect-video shadow-2xl"
                         poster={watchData?.title ? undefined : animeDetail?.img} 
                       />
                    ) : playerMode === 'iframe' && watchData?.servers ? (
                        <iframe 
                          src={watchData.servers[0].embed} 
                          className="w-full h-full" 
                          allowFullScreen 
                          allow="autoplay; encrypted-media"
                        ></iframe>
                    ) : (
                       // 4. FIX TAMPILAN ERROR (HAPUS DOWNLOAD BUTTON JELEK)
                       <div className="text-center p-8 space-y-4 max-w-sm bg-[#1e293b] rounded-2xl border border-slate-700 mx-4">
                          <div className="text-4xl">📡</div>
                          <h3 className="text-white font-bold">Mode Bebas Iklan Tidak Tersedia</h3>
                          <p className="text-slate-400 text-xs leading-relaxed">Server langsung (MP4) sedang sibuk atau tidak tersedia untuk episode ini.</p>
                          <button 
                             onClick={() => setPlayerMode('iframe')}
                             className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20"
                          >
                             Pindah ke Server Utama (Iframe)
                          </button>
                       </div>
                    )}
                 </div>

                 {/* CONTROLS */}
                 <div className="bg-[#0f172a] p-4 pb-safe border-t border-slate-800">
                    <div className="flex justify-between items-center mb-3">
                       <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sumber Video</h3>
                       <div className="flex gap-2 bg-slate-900 p-1 rounded-lg">
                          <button onClick={() => setPlayerMode('native')} className={`text-[10px] px-3 py-1 rounded font-bold transition ${playerMode==='native'?'bg-blue-600 text-white shadow':'text-slate-500 hover:text-white'}`}>No-Ads</button>
                          <button onClick={() => setPlayerMode('iframe')} className={`text-[10px] px-3 py-1 rounded font-bold transition ${playerMode==='iframe'?'bg-blue-600 text-white shadow':'text-slate-500 hover:text-white'}`}>Server Utama</button>
                       </div>
                    </div>

                    {playerMode === 'native' && streamData && (
                       <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                          {streamData.map((s:any, i:number) => (
                             <button key={i} onClick={()=>{ setNativeSrc(s.url); if(videoRef.current){videoRef.current.load(); videoRef.current.play();} }}
                               className={`px-4 py-2 rounded-lg text-xs font-bold border whitespace-nowrap ${nativeSrc === s.url ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                               {s.quality}
                             </button>
                          ))}
                       </div>
                    )}
                    
                    {watchData?.next && (
                       <button onClick={()=>loadWatch(watchData.next)} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 rounded-xl font-bold text-sm shadow-lg">
                          Lanjut Episode Berikutnya →
                       </button>
                    )}
                 </div>
              </div>
            )}
          </>
        )}
      </main>

      {view !== 'watch' && <BottomNav />}
    </div>
  );
}
