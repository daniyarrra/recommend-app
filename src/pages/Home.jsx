import { useEffect, useState } from "react";
import API from "../services/api";
import ItemCard from "../components/ItemCard";
import SkeletonCard from "../components/SkeletonCard";
import Carousel from "../components/Carousel";
import HeroSlider from "../components/HeroSlider";
import PageTransition from "../components/PageTransition";
import { useLanguage } from "../context/LanguageContext";
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
    const { t, language } = useLanguage();
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeGenre, setActiveGenre] = useState("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        API.get(`/items?lang=${language}`).then(res => {
            setItems(res.data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [language]);

    const availableGenres = [t('all_genres'), ...new Set(items.filter(item => item.category === "Фильмы" || item.category === "Сериалы" || item.category === "Movies" || item.category === "TV Shows").map(item => item.genre))].filter(Boolean);

    // Full filter
    const filteredItems = items.filter(item => {
        const isMovieOrTV = item.category === "Фильмы" || item.category === "Сериалы" || item.category === "Movies" || item.category === "TV Shows";
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGenre = activeGenre === "all" || activeGenre === t('all_genres') || item.genre === activeGenre;
        return isMovieOrTV && matchesSearch && matchesGenre;
    });

    const moviesAndTvItems = items.filter(item => item.category === "Фильмы" || item.category === "Сериалы" || item.category === "Movies" || item.category === "TV Shows");
    const featuredItems = moviesAndTvItems.filter(item => item.is_featured);
    const sliderItems = featuredItems.length > 0 ? featuredItems : moviesAndTvItems;

    return (
        <PageTransition>
            <div className="container" style={{ paddingTop: '20px' }}>
                {!loading && <HeroSlider items={sliderItems} />}

            <div className="hero-section" style={{ padding: '0', textAlign: 'center', marginBottom: '40px' }}>
                <div className="search-container">
                    <SearchIcon />
                    <input 
                        type="text" 
                        className="search-bar" 
                        placeholder={t('search_catalog')} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>


                {availableGenres.length > 1 && (
                    <div className="genre-tags">
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
                )}
            </div>

            {loading ? (
                <Carousel>
                    {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
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
                    <p className="empty-state-text">{t('nothing_found')}</p>
                </div>
            )}
            </div>
        </PageTransition>
    );
};

export default Home;