import { useState } from "react";
import ItemCard from "../components/ItemCard";
import SkeletonCard from "../components/SkeletonCard";
import Carousel from "../components/Carousel";
import PageTransition from "../components/PageTransition";
import { useLanguage } from "../context/LanguageContext";
import { useCatalog } from "../hooks/useCatalog";
import { filterBySearch, getUniqueGenres, matchesGenreFilter } from "../utils/filterCatalog";
import "../styles/main.css";

/* ── SVG Icons ── */
const SearchIcon = () => (
    <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
);

const MusicIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#musicGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <defs>
            <linearGradient id="musicGrad" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#10b981"/>
                <stop offset="100%" stopColor="#3b82f6"/>
            </linearGradient>
        </defs>
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
    </svg>
);

const EmptyIcon = () => (
    <svg className="empty-state-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
        <line x1="2" y1="2" x2="22" y2="22"/>
    </svg>
);

const Music = () => {
    const { t, language, translateCategory, translateGenre } = useLanguage();
    const { data: catalog = [], isLoading: loading } = useCatalog(language);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeGenre, setActiveGenre] = useState("all");
    const [showFilters, setShowFilters] = useState(false);

    const items = catalog.filter(item => translateCategory(item.category) === t('cat_music'));
    const availableGenres = [t('all_genres'), ...getUniqueGenres(items, translateGenre)];
    const searchedItems = filterBySearch(items, searchQuery, translateCategory, translateGenre);
    const filteredItems = searchedItems.filter(item =>
        matchesGenreFilter(item, activeGenre, t('all_genres'), translateGenre)
    );

    return (
        <PageTransition>
            <div className="container">
                <div className="page-header">
                <div className="page-header-icon">
                    <MusicIcon />
                </div>
                <h1 style={{ background: "linear-gradient(135deg, #10b981, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {t('music_title')}
                </h1>
                <p>{t('music_subtitle')}</p>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', maxWidth: '650px', margin: '28px auto' }}>
                    <div className="search-container" style={{ margin: '0', flex: '1', maxWidth: '500px' }}>
                        <SearchIcon />
                        <input 
                            type="text" 
                            className="search-bar" 
                            placeholder={t('search_music')} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button 
                        className={`tab-btn ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ height: '54px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', borderRadius: '16px' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                        <span>{t('filter_btn')}</span>
                    </button>
                </div>

                {showFilters && availableGenres.length > 1 && (
                    <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)', maxWidth: '800px', margin: '0 auto 28px auto' }}>
                        <div>
                            <div style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 'bold' }}>Жанры:</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {availableGenres.map(genre => (
                                    <button
                                        key={genre}
                                        type="button"
                                        className={`genre-tag ${(activeGenre === genre || (activeGenre === "all" && genre === t('all_genres'))) ? "active" : ""}`}
                                        onClick={() => setActiveGenre(genre === t('all_genres') ? "all" : genre)}
                                    >
                                        {genre}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {loading ? (
                <Carousel>
                    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </Carousel>
            ) : filteredItems.length > 0 ? (
                <Carousel>
                    {filteredItems.map(item => (
                        <ItemCard key={item.id} item={item} />
                    ))}
                </Carousel>
            ) : (
                <div className="empty-state-container">
                    <EmptyIcon />
                    <p className="empty-state-text">{t('no_music_found')}</p>
                </div>
            )}
            </div>
        </PageTransition>
    );
};

export default Music;
