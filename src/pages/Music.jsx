import { useState } from "react";
import ItemCard from "../components/ItemCard";
import SkeletonCard from "../components/SkeletonCard";
import Carousel from "../components/Carousel";
import AdvancedFilter from "../components/AdvancedFilter";
import PageTransition from "../components/PageTransition";
import { useLanguage } from "../context/LanguageContext";
import { useCatalog } from "../hooks/useCatalog";
import { filterBySearch, getUniqueGenres, matchesMultiGenreFilter, sortItems } from "../utils/filterCatalog";
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
    const [activeGenres, setActiveGenres] = useState([]);
    const [sortBy, setSortBy] = useState("default");
    const [showFilters, setShowFilters] = useState(false);

    const items = catalog.filter(item => translateCategory(item.category) === t('cat_music'));
    const availableGenres = getUniqueGenres(items, translateGenre);
    
    const searchedItems = filterBySearch(items, searchQuery, translateCategory, translateGenre);
    const genreFiltered = searchedItems.filter(item =>
        matchesMultiGenreFilter(item, activeGenres, translateGenre)
    );
    const filteredItems = sortItems(genreFiltered, sortBy);

    const hasActiveFilters = activeGenres.length > 0 || sortBy !== "default";
    const isFiltered = searchQuery.length > 0 || hasActiveFilters;

    const SortIconDefault = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
    const SortIconCalendar = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;

    const sortOptions = [
        { value: "default", label: t('sort_default'), icon: SortIconDefault },
        { value: "year_desc", label: t('sort_year_desc'), icon: SortIconCalendar },
        { value: "year_asc", label: t('sort_year_asc'), icon: SortIconCalendar },
    ];

    const handleGenreToggle = (genre) => {
        setActiveGenres(prev =>
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        );
    };

    const handleReset = () => {
        setActiveGenres([]);
        setSortBy("default");
    };

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
                        className={`af-trigger-btn ${showFilters ? 'open' : ''}`}
                        onClick={() => setShowFilters(true)}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                        <span>{t('filter_btn')}</span>
                        {hasActiveFilters && <span className="af-trigger-dot" />}
                    </button>
                </div>

                <AdvancedFilter
                    isOpen={showFilters}
                    onClose={() => setShowFilters(false)}
                    genres={availableGenres}
                    activeGenres={activeGenres}
                    onGenreToggle={handleGenreToggle}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    sortOptions={sortOptions}
                    resultCount={filteredItems.length}
                    onReset={handleReset}
                />
            </div>

            {loading ? (
                <div className={isFiltered ? "grid" : ""} style={isFiltered ? { padding: '0 20px', paddingBottom: '40px' } : {}}>
                    {isFiltered ? (
                        [...Array(10)].map((_, i) => <SkeletonCard key={i} />)
                    ) : (
                        <Carousel>
                            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                        </Carousel>
                    )}
                </div>
            ) : filteredItems.length > 0 ? (
                isFiltered ? (
                    <div className="grid" style={{ padding: '0 20px', paddingBottom: '40px' }}>
                        {filteredItems.map(item => (
                            <ItemCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <Carousel>
                        {filteredItems.map(item => (
                            <ItemCard key={item.id} item={item} />
                        ))}
                    </Carousel>
                )
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
