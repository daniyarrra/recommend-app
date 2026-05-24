import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useLanguage } from "../context/LanguageContext";

/* ── SVG Star Icon ── */
const StarIcon = ({ filled, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#fbbf24" : "none"} stroke={filled ? "#fbbf24" : "var(--hover-bg)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
);

const Rating = ({ itemId, onRatingSaved }) => {
    const { t } = useLanguage();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [review, setReview] = useState("");
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        const fetchRating = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user && isMounted) {
                setUser(session.user);
                // Пытаемся получить существующую оценку
                const { data } = await supabase
                    .from("ratings")
                    .select("rating")
                    .eq("user_id", session.user.id)
                    .eq("item_id", parseInt(itemId))
                    .maybeSingle();

                if (data && isMounted) {
                    setRating(data.rating);
                    setReview(data.review || "");
                }
            }
            if (isMounted) setLoading(false);
        };

        fetchRating();
        return () => { isMounted = false; };
    }, [itemId]);

    const handleSave = async () => {
        if (!user) {
            alert(t('login_to_rate'));
            return;
        }

        setSaving(true);
        try {
            const parsedItemId = parseInt(itemId);

            const { data: existing } = await supabase
                .from("ratings")
                .select("id")
                .eq("user_id", user.id)
                .eq("item_id", parsedItemId)
                .maybeSingle();

            if (existing) {
                await supabase
                    .from("ratings")
                    .update({ rating, review })
                    .eq("id", existing.id);
            } else {
                await supabase
                    .from("ratings")
                    .insert([{ user_id: user.id, item_id: parsedItemId, rating, review }]);
            }

            // Автоматически добавляем в watchlist, если ещё не добавлен
            const { data: inWl } = await supabase
                .from("watchlist")
                .select("id")
                .eq("user_id", user.id)
                .eq("item_id", parsedItemId)
                .maybeSingle();

            if (!inWl) {
                await supabase
                    .from("watchlist")
                    .insert([{ user_id: user.id, item_id: parsedItemId }]);
            }

            alert(t('review_saved'));
            if (onRatingSaved) onRatingSaved();
        } catch (error) {
            console.error("Error saving rating:", error);
            alert(t('review_error'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="skeleton-pulse" style={{ height: '40px', width: '200px', borderRadius: '8px' }}></div>;

    const displayRating = hoverRating || rating;

    return (
        <div className="rating-container" style={{ marginTop: "20px" }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '0.88rem', fontWeight: '500' }}>{t('your_rating')}</p>
            <div style={{ display: "flex", gap: "4px", marginBottom: "16px", alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            transform: displayRating >= star ? "scale(1.1)" : "scale(1)",
                            filter: displayRating >= star ? "drop-shadow(0 0 6px rgba(251, 191, 36, 0.4))" : "none",
                            display: "flex"
                        }}
                    >
                        <StarIcon filled={displayRating >= star} size={26} />
                    </span>
                ))}
                {rating > 0 && (
                    <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: '#fbbf24', fontWeight: '600' }}>{rating}/5</span>
                )}
            </div>
            
            <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder={t('review_placeholder')}
                style={{
                    width: '100%',
                    minHeight: '90px',
                    background: 'var(--hover-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    marginBottom: '12px',
                    resize: 'vertical',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
            
            <button 
                onClick={handleSave}
                disabled={saving || rating === 0}
                className="btn-watchlist"
                style={{ 
                    width: 'auto', 
                    padding: '10px 24px',
                    opacity: (saving || rating === 0) ? 0.5 : 1,
                    cursor: (saving || rating === 0) ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem'
                }}
            >
                {saving ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        {t('saving')}
                    </span>
                ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        {t('save_review')}
                    </span>
                )}
            </button>
        </div>
    );
};

export default Rating;