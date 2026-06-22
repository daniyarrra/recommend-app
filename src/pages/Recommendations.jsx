import { useEffect, useState } from "react";
import API from "../services/api";
import { supabase } from "../services/supabase";
import ItemCard from "../components/ItemCard";
import SkeletonCard from "../components/SkeletonCard";
import Carousel from "../components/Carousel";
import PageTransition from "../components/PageTransition";
import { useLanguage } from "../context/LanguageContext";
import { useCatalog } from "../hooks/useCatalog";
import "../styles/main.css";

/* ── SVG Icons ── */
const SparklesIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#sparkleGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <defs>
            <linearGradient id="sparkleGrad" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#60a5fa"/>
                <stop offset="100%" stopColor="#c084fc"/>
            </linearGradient>
        </defs>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
);

const EmptyIcon = () => (
    <svg className="empty-state-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
);

const Recommendations = () => {
    const { t, language } = useLanguage();
    const { data: allItems = [], isLoading: catalogLoading } = useCatalog(language);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (catalogLoading) return;

        let isMounted = true;
        setLoading(true);
        setError(null);

        const fetchRecommendations = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                let liked_titles = [];
                let watchlist_titles = [];

                if (session?.user) {
                    const [{ data: ratingsData }, { data: watchlistData }] = await Promise.all([
                        supabase.from("ratings").select("item_id").eq("user_id", session.user.id).gte("rating", 4),
                        supabase.from("watchlist").select("item_id").eq("user_id", session.user.id),
                    ]);

                    if (ratingsData) {
                        liked_titles = ratingsData
                            .map((r) => allItems.find((i) => String(i.id) === String(r.item_id))?.title)
                            .filter(Boolean);
                    }
                    if (watchlistData) {
                        watchlist_titles = watchlistData
                            .map((w) => allItems.find((i) => String(i.id) === String(w.item_id))?.title)
                            .filter(Boolean);
                    }
                }

                let result = [];

                // Try personalized POST if user has taste data
                if (liked_titles.length > 0 || watchlist_titles.length > 0) {
                    try {
                        const res = await API.post(`/recommend?lang=${language}`, { liked_titles, watchlist_titles });
                        result = Array.isArray(res.data) ? res.data : [];
                    } catch {
                        // POST failed — fall through to GET below
                    }
                }

                // Always fallback to GET if POST returned nothing or wasn't called
                if (result.length === 0) {
                    const res = await API.get(`/recommend?lang=${language}`);
                    result = Array.isArray(res.data) ? res.data : [];
                }

                if (isMounted) setItems(result);
            } catch (err) {
                console.error("Failed to fetch recommendations:", err);
                if (isMounted) setError(err.message || "error");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchRecommendations();
        return () => { isMounted = false; };
    }, [language, catalogLoading, allItems]);

    const isPageLoading = catalogLoading || loading;
    const hasAiReasons = items.some((item) => item.ai_reason);

    return (
        <PageTransition>
            <div className="container">
                <div className="page-header">
                    <div className="page-header-icon">
                        <SparklesIcon />
                    </div>
                    <h1 style={{ background: "linear-gradient(135deg, #60a5fa, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {t('rec_title')}
                    </h1>
                    <p>{t('rec_subtitle')}</p>
                    {isPageLoading && (
                        <div style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(96, 165, 250, 0.1)', borderRadius: '20px', color: '#60a5fa', fontSize: '0.9rem', fontWeight: '500' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>
                            {t('rec_ai_analyzing')}
                        </div>
                    )}
                    {!isPageLoading && items.length > 0 && !hasAiReasons && (
                        <p style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {t('rec_ai_fallback')}
                        </p>
                    )}
                    {!isPageLoading && error && items.length === 0 && (
                        <div style={{ marginTop: '16px', color: '#f87171', fontSize: '0.9rem', padding: '12px 16px', background: 'rgba(248,113,113,0.1)', borderRadius: '12px', border: '1px solid rgba(248,113,113,0.2)' }}>
                            ⚠️ Не удалось подключиться к серверу. Убедитесь, что бэкенд запущен (python app.py).
                        </div>
                    )}
                </div>

                {isPageLoading ? (
                    <Carousel>
                        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                    </Carousel>
                ) : items.length > 0 ? (
                    <Carousel>
                        {items.map(item => (
                            <ItemCard key={item.id} item={item} />
                        ))}
                    </Carousel>
                ) : !error ? (
                    <div className="empty-state-container">
                        <EmptyIcon />
                        <p className="empty-state-text">{t('no_recs')}</p>
                    </div>
                ) : null}
            </div>
        </PageTransition>
    );
};

export default Recommendations;
