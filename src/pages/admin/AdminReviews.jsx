import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import API from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";

const StarIcon = ({ filled, size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#fbbf24" : "none"} stroke={filled ? "#fbbf24" : "#4b5563"} strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
);

const BAD_WORDS = ["fuck", "shit", "bitch", "asshole", "хуй", "пиздец", "бля", "сука", "ебать", "далбаеб"];

const isSuspicious = (text) => {
    if (!text) return false;
    const lower = text.toLowerCase();
    // Check for bad words
    if (BAD_WORDS.some(word => lower.includes(word))) return true;
    // Check for spammy short reviews (less than 3 chars)
    if (text.trim().length > 0 && text.trim().length < 3) return true;
    return false;
};

const AdminReviews = () => {
    const { t } = useLanguage();
    const [reviews, setReviews] = useState([]);
    const [search, setSearch] = useState("");
    const [filterRating, setFilterRating] = useState(0); // 0 = all
    const [filterSuspicious, setFilterSuspicious] = useState(false);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all reviews with user profile
                const { data: ratingsData } = await supabase
                    .from("ratings")
                    .select(`
                        id, rating, review, item_id, created_at, user_id,
                        profiles ( email, avatar_url, nickname )
                    `)
                    .order("created_at", { ascending: false });

                setReviews(ratingsData || []);

                // Fetch items for titles
                try {
                    const res = await API.get("/items");
                    setItems(res.data);
                } catch(e) { console.error(e); }
            } catch (err) {
                console.error("Error fetching reviews:", err);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const getItemTitle = (itemId) => {
        const item = items.find(i => i.id === itemId);
        return item?.title || `Item #${itemId}`;
    };

    const getItemCategory = (itemId) => {
        const item = items.find(i => i.id === itemId);
        return item?.category || "";
    };

    const handleDelete = async (review) => {
        try {
            await supabase.from("ratings").delete().eq("id", review.id);
            setReviews(prev => prev.filter(r => r.id !== review.id));
            setConfirmDelete(null);
        } catch (err) {
            console.error(err);
        }
    };

    const filtered = reviews.filter(r => {
        const email = r.profiles?.nickname || r.profiles?.email || "";
        const reviewText = r.review || "";
        const title = getItemTitle(r.item_id);
        const matchSearch = email.toLowerCase().includes(search.toLowerCase()) ||
                            reviewText.toLowerCase().includes(search.toLowerCase()) ||
                            title.toLowerCase().includes(search.toLowerCase());
        const matchRating = filterRating === 0 || r.rating === filterRating;
        const matchSuspicious = !filterSuspicious || isSuspicious(reviewText);
        return matchSearch && matchRating && matchSuspicious;
    });

    if (loading) {
        return <div className="admin-loading"><div className="loading-spinner"></div><span>{t('loading')}</span></div>;
    }

    return (
        <div>
            <div className="admin-page-header">
                <h1>{t('admin_reviews')}</h1>
                <p>{t('admin_reviews_desc')}</p>
            </div>

            <div className="admin-table-container">
                <div className="admin-table-toolbar">
                    <div className="admin-search">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input placeholder={t('admin_search_reviews')} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <div className="admin-filter-tabs">
                            <button className={`admin-filter-tab ${filterRating === 0 && !filterSuspicious ? 'active' : ''}`}
                                onClick={() => { setFilterRating(0); setFilterSuspicious(false); }}>{t('cat_all')}</button>
                            
                            <button className={`admin-filter-tab ${filterSuspicious ? 'active' : ''}`}
                                onClick={() => { setFilterSuspicious(true); setFilterRating(0); }}
                                style={filterSuspicious ? { color: '#ef4444', borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' } : { color: '#ef4444' }}>
                                ⚠️ Подозрительные
                            </button>

                            <div style={{ width: '1px', background: 'var(--glass-border)', margin: '0 4px' }}></div>

                            {[5,4,3,2,1].map(r => (
                                <button key={r} className={`admin-filter-tab ${filterRating === r && !filterSuspicious ? 'active' : ''}`}
                                    onClick={() => { setFilterRating(r); setFilterSuspicious(false); }}>
                                    {r} ★
                                </button>
                            ))}
                        </div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginLeft: '8px' }}>
                            {filtered.length} {t('admin_reviews_total')}
                        </span>
                    </div>
                </div>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>{t('admin_col_user')}</th>
                            <th>{t('admin_col_content')}</th>
                            <th>{t('admin_col_rating')}</th>
                            <th>{t('admin_col_review')}</th>
                            <th>{t('admin_col_date')}</th>
                            <th>{t('admin_col_actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(review => (
                            <tr key={review.id}>
                                <td>
                                    <div className="admin-user-cell">
                                        <img
                                            src={review.profiles?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${review.profiles?.email}`}
                                            alt="" className="admin-user-avatar"
                                        />
                                        <span style={{ fontSize: '0.85rem' }}>{review.profiles?.nickname || review.profiles?.email?.split('@')[0] || '—'}</span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{getItemTitle(review.item_id)}</span>
                                        <span className="admin-badge admin-badge-category" style={{ width: 'fit-content', marginTop: '3px' }}>
                                            {getItemCategory(review.item_id)}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div className="admin-stars">
                                        {[1,2,3,4,5].map(s => <StarIcon key={s} filled={s <= review.rating} />)}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span className="admin-review-text" style={{ color: isSuspicious(review.review) ? '#f87171' : 'var(--text-secondary)' }}>
                                            {review.review || <em style={{ opacity: 0.4 }}>—</em>}
                                        </span>
                                        {isSuspicious(review.review) && (
                                            <span className="admin-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '0.65rem', width: 'fit-content' }}>
                                                Подозрительный
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                    {new Date(review.created_at).toLocaleDateString()}
                                </td>
                                <td>
                                    <button className="admin-btn admin-btn-sm admin-btn-danger"
                                        onClick={() => setConfirmDelete(review)}>
                                        {t('delete_btn')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <div className="admin-empty"><p>{t('admin_no_reviews')}</p></div>}
            </div>

            {/* Delete Confirm */}
            {confirmDelete && (
                <div className="admin-modal-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <h2>{t('admin_confirm_title')}</h2>
                        <p>
                            {t('admin_confirm_delete_review')}<br/>
                            <strong>{confirmDelete.profiles?.nickname || confirmDelete.profiles?.email}</strong> → {getItemTitle(confirmDelete.item_id)}
                        </p>
                        <div className="admin-modal-actions">
                            <button className="admin-btn admin-btn-ghost" onClick={() => setConfirmDelete(null)}>{t('admin_cancel')}</button>
                            <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(confirmDelete)}>{t('delete_btn')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReviews;
