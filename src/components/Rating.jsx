import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useLanguage } from "../context/LanguageContext";

/* ── SVG Star Icon ── */
const StarIcon = ({ filled, partial, size = 24 }) => (
    <div style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: 0, left: 0 }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        {(filled || partial > 0) && (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', top: 0, left: 0, clipPath: filled ? 'none' : `inset(0 ${100 - partial * 100}% 0 0)` }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
        )}
    </div>
);

const Rating = ({ itemId, onRatingSaved, readOnly = false }) => {
    const { t } = useLanguage();
    
    // Average rating state
    const [average, setAverage] = useState(0);
    const [count, setCount] = useState(0);
    
    // User rating state
    const [userRating, setUserRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [review, setReview] = useState("");
    const [user, setUser] = useState(null);
    
    // Status
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            try {
                const parsedItemId = parseInt(itemId);
                
                // 1. Fetch total rating for average
                const { data: allRatings, error: avgError } = await supabase
                    .from("ratings")
                    .select("rating")
                    .eq("item_id", parsedItemId);

                if (avgError) throw avgError;

                if (isMounted && allRatings) {
                    setCount(allRatings.length);
                    if (allRatings.length > 0) {
                        const sum = allRatings.reduce((acc, curr) => acc + curr.rating, 0);
                        setAverage(sum / allRatings.length);
                    } else {
                        setAverage(0);
                    }
                }

                // 2. Fetch current user's rating if not readOnly
                if (!readOnly) {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user && isMounted) {
                        setUser(session.user);
                        const { data: userRatingData } = await supabase
                            .from("ratings")
                            .select("rating, review")
                            .eq("user_id", session.user.id)
                            .eq("item_id", parsedItemId)
                            .maybeSingle();

                        if (userRatingData && isMounted) {
                            setUserRating(userRatingData.rating);
                            setReview(userRatingData.review || "");
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching rating data:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [itemId, readOnly]);

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
                    .update({ rating: userRating, review })
                    .eq("id", existing.id);
            } else {
                await supabase
                    .from("ratings")
                    .insert([{ user_id: user.id, item_id: parsedItemId, rating: userRating, review }]);
            }

            alert(t('review_saved'));
            
            // Recalculate average locally or refetch
            if (onRatingSaved) onRatingSaved();
            
        } catch (error) {
            console.error("Error saving rating:", error);
            alert(t('review_error'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="skeleton-pulse" style={{ height: readOnly ? '24px' : '40px', width: readOnly ? '120px' : '200px', borderRadius: '8px', marginTop: '12px' }}></div>;
    }

    if (readOnly) {
        return (
            <div className="rating-container" style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                    {[1, 2, 3, 4, 5].map((star) => {
                        const filled = average >= star;
                        const partial = (!filled && average > star - 1) ? average - (star - 1) : 0;
                        return <StarIcon key={star} filled={filled} partial={partial} size={20} />;
                    })}
                </div>
                <span style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: '600' }}>
                    {average.toFixed(1)}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    ({count})
                </span>
            </div>
        );
    }

    const displayRating = hoverRating || userRating;

    return (
        <div className="rating-container" style={{ marginTop: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: '500', margin: 0 }}>{t('your_rating')}</p>
                {count > 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--glass-bg)', padding: '2px 8px', borderRadius: '12px' }}>
                        {t('admin_stat_avg_rating')}: <span style={{color: '#fbbf24', fontWeight: '600'}}>{average.toFixed(1)}</span> ({count})
                    </span>
                )}
            </div>
            
            <div style={{ display: "flex", gap: "4px", marginBottom: "16px", alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        onClick={() => setUserRating(star)}
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
                {userRating > 0 && (
                    <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: '#fbbf24', fontWeight: '600' }}>{userRating}/5</span>
                )}
            </div>
            
            <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder={t('review_placeholder') || "Напишите отзыв..."}
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
                disabled={saving || userRating === 0}
                className="btn-watchlist"
                style={{ 
                    width: 'auto', 
                    padding: '10px 24px',
                    opacity: (saving || userRating === 0) ? 0.5 : 1,
                    cursor: (saving || userRating === 0) ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '12px',
                    fontWeight: 600
                }}
            >
                {saving ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        {t('saving') || "Сохранение..."}
                    </span>
                ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        {t('save_review') || "Сохранить отзыв"}
                    </span>
                )}
            </button>
        </div>
    );
};

export default Rating;