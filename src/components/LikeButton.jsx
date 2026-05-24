import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

const HeartIcon = ({ filled }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "#ef4444" : "none"} stroke={filled ? "#ef4444" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
);

const LikeButton = ({ ratingId, ownerId, currentUser }) => {
    const [likesCount, setLikesCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLikes = async () => {
            try {
                // Get count
                const { count } = await supabase
                    .from("review_likes")
                    .select("*", { count: 'exact', head: true })
                    .eq("rating_id", ratingId);
                
                setLikesCount(count || 0);

                if (currentUser) {
                    const { data } = await supabase
                        .from("review_likes")
                        .select("id")
                        .eq("rating_id", ratingId)
                        .eq("user_id", currentUser.id);
                    if (data && data.length > 0) setIsLiked(true);
                }
            } catch (e) {
                // Table might not exist yet
            } finally {
                setLoading(false);
            }
        };
        if (ratingId) fetchLikes();
    }, [ratingId, currentUser]);

    const toggleLike = async () => {
        if (!currentUser) {
            alert("Пожалуйста, войдите в аккаунт, чтобы ставить лайки.");
            return;
        }
        
        try {
            if (isLiked) {
                await supabase.from("review_likes").delete()
                    .eq("rating_id", ratingId)
                    .eq("user_id", currentUser.id);
                setIsLiked(false);
                setLikesCount(prev => Math.max(0, prev - 1));
            } else {
                await supabase.from("review_likes").insert({
                    rating_id: ratingId,
                    user_id: currentUser.id
                });
                setIsLiked(true);
                setLikesCount(prev => prev + 1);

                // Send notification
                if (ownerId && ownerId !== currentUser.id) {
                    await supabase.from("notifications").insert({
                        user_id: ownerId,
                        actor_id: currentUser.id,
                        type: 'like',
                        entity_id: ratingId
                    });
                }
            }
        } catch (e) {
            console.error("Like error, table might not exist", e);
        }
    };

    return (
        <button 
            onClick={toggleLike} 
            disabled={loading}
            style={{ 
                background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', 
                color: isLiked ? '#ef4444' : 'var(--text-secondary)',
                fontSize: '0.9rem',
                padding: '4px 8px', borderRadius: '8px',
                transition: 'all 0.2s',
                opacity: loading ? 0.5 : 1
            }}
            onMouseEnter={(e) => { if(!loading) e.currentTarget.style.background = 'var(--hover-bg)'}}
            onMouseLeave={(e) => { if(!loading) e.currentTarget.style.background = 'none'}}
        >
            <HeartIcon filled={isLiked} />
            {likesCount > 0 && <span>{likesCount}</span>}
        </button>
    );
};

export default LikeButton;
