import { useState } from "react";
import ItemCard from "../components/ItemCard";
import SkeletonCard from "../components/SkeletonCard";
import Carousel from "../components/Carousel";
import HeroSlider from "../components/HeroSlider";
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

const EmptyIcon = () => (
    <svg className="empty-state-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
);

const Home = () => {
    const { t, language, translateCategory, translateGenre } = useLanguage();
    const { data: items = [], isLoading: loading } = useCatalog(language);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeGenres, setActiveGenres] = useState([]);
    const [activeCategory, setActiveCategory] = useState("all");
    const [sortBy, setSortBy] = useState("default");
    const [showFilters, setShowFilters] = useState(false);

    const moviesAndTvItems = items.filter(item => {
        const cat = translateCategory(item.category);
        if (activeCategory === 'movies') return cat === t('cat_movies');
        if (activeCategory === 'series') return cat === t('cat_tv');
        return cat === t('cat_movies') || cat === t('cat_tv');
    });

    const availableGenres = getUniqueGenres(moviesAndTvItems, translateGenre);

    const searchedItems = filterBySearch(moviesAndTvItems, searchQuery, translateCategory, translateGenre);

    const genreFiltered = searchedItems.filter(item =>
        matchesMultiGenreFilter(item, activeGenres, translateGenre)
    );

    const sortedItems = sortItems(genreFiltered, sortBy);

    const filteredMovies = sortedItems.filter(item =>
        translateCategory(item.category) === t('cat_movies')
    );

    const filteredSeries = sortedItems.filter(item =>
        translateCategory(item.category) === t('cat_tv')
    );

    const featuredItems = moviesAndTvItems.filter(item => item.is_featured);
    
    // Всегда показываем 5 фильмов/сериалов в верхнем слайдере
    let sliderItems = [...featuredItems];
    if (sliderItems.length < 5) {
        const remaining = moviesAndTvItems.filter(item => !sliderItems.find(f => f.id === item.id));
        sliderItems = [...sliderItems, ...remaining];
    }
    sliderItems = sliderItems.slice(0, 5);

    const hasActiveFilters = activeGenres.length > 0 || activeCategory !== "all" || sortBy !== "default";
    const isFiltered = searchQuery.length > 0 || hasActiveFilters;

    const SortIconDefault = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
    const SortIconStar = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    const SortIconAlpha = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>;
    const SortIconCalendar = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;

    const sortOptions = [
        { value: "default", label: t('sort_default'), icon: SortIconDefault },
        { value: "year_desc", label: t('sort_year_desc'), icon: SortIconCalendar },
        { value: "year_asc", label: t('sort_year_asc'), icon: SortIconCalendar },
    ];

    const categories = [
        { value: "all", label: t('cat_all') },
        { value: "movies", label: t('cat_movies') },
        { value: "series", label: t('cat_tv') },
    ];

    const handleGenreToggle = (genre) => {
        setActiveGenres(prev =>
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        );
    };

    const handleReset = () => {
        setActiveGenres([]);
        setActiveCategory("all");
        setSortBy("default");
    };

    return (
        <PageTransition>
            <div className="container" style={{ paddingTop: '20px' }}>
                {!loading && <HeroSlider items={sliderItems} />}

            <div className="hero-section" style={{ padding: '0', textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', maxWidth: '650px', margin: '0 auto 28px auto' }}>
                    <div className="search-container" style={{ margin: '0', flex: '1', maxWidth: '500px' }}>
                        <SearchIcon />
                        <input 
                            type="text" 
                            className="search-bar" 
                            placeholder={t('search_catalog')} 
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
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                resultCount={filteredMovies.length + filteredSeries.length}
                onReset={handleReset}
            />

            {loading ? (
                <>
                    <h2 className="section-title" style={{ marginTop: '30px', marginBottom: '20px', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                        {t('cat_movies')}
                    </h2>
                    <div className={isFiltered ? "grid" : ""} style={isFiltered ? { padding: '0 20px', paddingBottom: '40px' } : {}}>
                        {isFiltered ? (
                            [...Array(10)].map((_, i) => <SkeletonCard key={i} />)
                        ) : (
                            <Carousel>
                                {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
                            </Carousel>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {filteredMovies.length > 0 && (
                        <>
                            <h2 className="section-title" style={{ marginTop: '30px', marginBottom: '20px', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                                {t('cat_movies')}
                            </h2>
                            {isFiltered ? (
                                <div className="grid" style={{ padding: '0 20px', paddingBottom: '40px' }}>
                                    {filteredMovies.map(item => (
                                        <ItemCard key={item.id} item={item} />
                                    ))}
                                </div>
                            ) : (
                                <Carousel>
                                    {filteredMovies.map(item => (
                                        <ItemCard key={item.id} item={item} />
                                    ))}
                                </Carousel>
                            )}
                        </>
                    )}
                    
                    {filteredSeries.length > 0 && (
                        <>
                            <h2 className="section-title" style={{ marginTop: '40px', marginBottom: '20px', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                                {t('cat_tv')}
                            </h2>
                            {isFiltered ? (
                                <div className="grid" style={{ padding: '0 20px', paddingBottom: '40px' }}>
                                    {filteredSeries.map(item => (
                                        <ItemCard key={item.id} item={item} />
                                    ))}
                                </div>
                            ) : (
                                <Carousel>
                                    {filteredSeries.map(item => (
                                        <ItemCard key={item.id} item={item} />
                                    ))}
                                </Carousel>
                            )}
                        </>
                    )}

                    {filteredMovies.length === 0 && filteredSeries.length === 0 && (
                        <div className="empty-state-container">
                            <EmptyIcon />
                            <p className="empty-state-text">{t('nothing_found')}</p>
                        </div>
                    )}
                </>
            )}
            </div>
        </PageTransition>
    );
};

export default Home;