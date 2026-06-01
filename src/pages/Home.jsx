import { useState } from "react";
import ItemCard from "../components/ItemCard";
import SkeletonCard from "../components/SkeletonCard";
import Carousel from "../components/Carousel";
import HeroSlider from "../components/HeroSlider";
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
    const [activeGenre, setActiveGenre] = useState("all");
    const [activeCategory, setActiveCategory] = useState("all");
    const [showFilters, setShowFilters] = useState(false);

    const moviesAndTvItems = items.filter(item => {
        const cat = translateCategory(item.category);
        if (activeCategory === 'movies') return cat === t('cat_movies');
        if (activeCategory === 'series') return cat === t('cat_tv');
        return cat === t('cat_movies') || cat === t('cat_tv');
    });

    const availableGenres = [t('all_genres'), ...getUniqueGenres(moviesAndTvItems, translateGenre)];

    const searchedItems = filterBySearch(moviesAndTvItems, searchQuery, translateCategory, translateGenre);

    const filteredMovies = searchedItems.filter(item =>
        translateCategory(item.category) === t('cat_movies') &&
        matchesGenreFilter(item, activeGenre, t('all_genres'), translateGenre)
    );

    const filteredSeries = searchedItems.filter(item =>
        translateCategory(item.category) === t('cat_tv') &&
        matchesGenreFilter(item, activeGenre, t('all_genres'), translateGenre)
    );

    const featuredItems = moviesAndTvItems.filter(item => item.is_featured);
    
    // Всегда показываем 5 фильмов/сериалов в верхнем слайдере
    let sliderItems = [...featuredItems];
    if (sliderItems.length < 5) {
        const remaining = moviesAndTvItems.filter(item => !sliderItems.find(f => f.id === item.id));
        sliderItems = [...sliderItems, ...remaining];
    }
    sliderItems = sliderItems.slice(0, 5);

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
                        className={`tab-btn ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ height: '54px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', borderRadius: '16px' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                        <span>{t('filter_btn')}</span>
                    </button>
                </div>

                {showFilters && (
                    <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)', maxWidth: '800px', margin: '0 auto 28px auto' }}>
                        <div>
                            <div style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 'bold' }}>Категория:</div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button className={`genre-tag ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>{t('cat_all')}</button>
                                <button className={`genre-tag ${activeCategory === 'movies' ? 'active' : ''}`} onClick={() => setActiveCategory('movies')}>{t('cat_movies')}</button>
                                <button className={`genre-tag ${activeCategory === 'series' ? 'active' : ''}`} onClick={() => setActiveCategory('series')}>{t('cat_tv')}</button>
                            </div>
                        </div>

                        {availableGenres.length > 1 && (
                            <div>
                                <div style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 'bold' }}>Жанры:</div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {availableGenres.map(genre => (
                                        <button
                                            key={genre}
                                            className={`genre-tag ${(activeGenre === genre || (activeGenre === "all" && genre === t('all_genres'))) ? "active" : ""}`}
                                            onClick={() => setActiveGenre(genre === t('all_genres') ? "all" : genre)}
                                        >
                                            {genre}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {loading ? (
                <>
                    <h2 className="section-title" style={{ marginTop: '30px', marginBottom: '20px', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                        {t('cat_movies')}
                    </h2>
                    <Carousel>
                        {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
                    </Carousel>
                </>
            ) : (
                <>
                    {filteredMovies.length > 0 && (
                        <>
                            <h2 className="section-title" style={{ marginTop: '30px', marginBottom: '20px', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                                {t('cat_movies')}
                            </h2>
                            <Carousel>
                                {filteredMovies.map(item => (
                                    <ItemCard key={item.id} item={item} />
                                ))}
                            </Carousel>
                        </>
                    )}
                    
                    {filteredSeries.length > 0 && (
                        <>
                            <h2 className="section-title" style={{ marginTop: '40px', marginBottom: '20px', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                                {t('cat_tv')}
                            </h2>
                            <Carousel>
                                {filteredSeries.map(item => (
                                    <ItemCard key={item.id} item={item} />
                                ))}
                            </Carousel>
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