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
    const { t, language, translateCategory } = useLanguage();
    const { data: catalog = [], isLoading: loading } = useCatalog(language);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeGenre, setActiveGenre] = useState("all");

    const items = catalog.filter(item => translateCategory(item.category) === t('cat_music'));
    const availableGenres = [t('all_genres'), ...getUniqueGenres(items)];
    const searchedItems = filterBySearch(items, searchQuery, translateCategory);
    const filteredItems = searchedItems.filter(item =>
        matchesGenreFilter(item, activeGenre, t('all_genres'))
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
                
                <div className="search-container" style={{ marginTop: '28px' }}>
                    <SearchIcon />
                    <input 
                        type="text" 
                        className="search-bar" 
                        placeholder={t('search_music')} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {availableGenres.length > 1 && (
                    <div className="genre-tags">
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
