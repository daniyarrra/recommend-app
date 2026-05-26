import { useEffect, useState } from "react";
import API from "../services/api";
import ItemCard from "../components/ItemCard";
import SkeletonCard from "../components/SkeletonCard";
import Carousel from "../components/Carousel";
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

const BookIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#bookGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <defs>
            <linearGradient id="bookGrad" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#fcd34d"/>
                <stop offset="100%" stopColor="#f97316"/>
            </linearGradient>
        </defs>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        <line x1="8" y1="7" x2="16" y2="7"/>
        <line x1="8" y1="11" x2="13" y2="11"/>
    </svg>
);

const EmptyIcon = () => (
    <svg className="empty-state-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        <line x1="9" y1="10" x2="15" y2="10"/>
    </svg>
);

const Books = () => {
    const { t, language, translateCategory } = useLanguage();
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        API.get(`/items?lang=${language}`).then(res => {
            const books = res.data.filter(item => translateCategory(item.category) === t('cat_books'));
            setItems(books);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [language, t]);

    const filteredItems = items.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <PageTransition>
            <div className="container">
                <div className="page-header">
                <div className="page-header-icon">
                    <BookIcon />
                </div>
                <h1 style={{ background: "linear-gradient(135deg, #fcd34d, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {t('books_title')}
                </h1>
                <p>{t('books_subtitle')}</p>
                
                <div className="search-container" style={{ marginTop: '28px' }}>
                    <SearchIcon />
                    <input 
                        type="text" 
                        className="search-bar" 
                        placeholder={t('search_books')} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
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
                    <p className="empty-state-text">{t('no_books_found')}</p>
                </div>
            )}
            </div>
        </PageTransition>
    );
};

export default Books;
