import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

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

const Rating = ({ itemId }) => {
    const [average, setAverage] = useState(0);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        const fetchRating = async () => {
            try {
                const { data, error } = await supabase
                    .from("ratings")
                    .select("rating")
                    .eq("item_id", parseInt(itemId));

                if (error) throw error;

                if (isMounted && data) {
                    setCount(data.length);
                    if (data.length > 0) {
                        const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
                        setAverage(sum / data.length);
                    } else {
                        setAverage(0);
                    }
                }
            } catch (err) {
                console.error("Error fetching total rating:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchRating();
        return () => { isMounted = false; };
    }, [itemId]);

    if (loading) return <div className="skeleton-pulse" style={{ height: '24px', width: '120px', borderRadius: '8px', marginTop: '12px' }}></div>;

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
};

export default Rating;