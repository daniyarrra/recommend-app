import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import API from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import LikeButton from "./LikeButton";

const StarIcon = ({ filled, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#fbbf24" : "none"} stroke={filled ? "#fbbf24" : "#4b5563"} strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
);

const ActivityFeed = ({ currentUser }) => {
    const { language } = useLanguage();
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                // 1. Fetch users the current user follows
                const { data: followsData, error: followsError } = await supabase
                    .from("follows")
                    .select("following_id")
                    .eq("follower_id", currentUser.id);

                if (followsError) {
                    if (followsError.code === '42P01') {
                         throw new Error("Table 'follows' does not exist. Please run the SQL setup script in Supabase.");
                    }
                    throw followsError;
                }

                const followingIds = followsData.map(f => f.following_id);

                if (followingIds.length === 0) {
                    setLoading(false);
                    return;
                }

                // 2. Fetch recent ratings from these users
                const { data: ratingsData, error: ratingsError } = await supabase
                    .from("ratings")
                    .select(`
                        id,
                        rating,
                        review,
                        created_at,
                        item_id,
                        user_id,
                        profiles (
                            email,
                            avatar_url
                        )
                    `)
                    .in("user_id", followingIds)
                    .order("created_at", { ascending: false })
                    .limit(20);

                if (ratingsError) throw ratingsError;

                // 3. Fetch item details to show titles
                const res = await API.get(`/items?lang=${language}`);
                const items = res.data;

                const enrichedFeed = (ratingsData || []).map(r => ({
                    ...r,
                    item: items.find(i => i.id === r.item_id)
                })).filter(r => r.item);

                setFeed(enrichedFeed);

            } catch (err) {
                console.error("Feed error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFeed();
    }, [currentUser, language]);

    if (loading) return <div className="loading-spinner" style={{ margin: "40px auto" }}></div>;
    
    if (error) return (
        <div className="empty-state">
            <p style={{ color: "#f87171" }}>Ошибка загрузки ленты: {error}</p>
        </div>
    );

    if (feed.length === 0) return (
        <div className="empty-state">
            <p style={{ color: "var(--text-secondary)" }}>В вашей ленте пока пусто. Подпишитесь на других пользователей, чтобы видеть их отзывы!</p>
        </div>
    );

    return (
        <div className="activity-feed">
            {feed.map(activity => (
                <div key={activity.id} className="review-card" style={{ marginBottom: "16px" }}>
                    <div className="review-header">
                        <Link to={`/user/${activity.user_id}`} className="review-user" style={{ textDecoration: 'none' }}>
                            <img 
                                src={activity.profiles?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${activity.profiles?.email}&backgroundColor=3b82f6`} 
                                alt="User" 
                                className="review-avatar"
                            />
                            <span className="review-username" style={{ color: 'var(--text-primary)' }}>
                                {activity.profiles?.email?.split('@')[0]}
                            </span>
                        </Link>
                        <div className="review-date">
                            {new Date(activity.created_at).toLocaleDateString()}
                        </div>
                    </div>
                    
                    <div style={{ marginTop: "12px", padding: "12px", background: "var(--hover-bg)", borderRadius: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <Link to={`/item/${activity.item_id}`} style={{ color: "var(--accent-light)", fontWeight: "bold", textDecoration: "none", fontSize: "1.1rem" }}>
                                {activity.item.title}
                            </Link>
                            <div className="review-stars">
                                {[1,2,3,4,5].map(star => (
                                    <StarIcon key={star} filled={star <= activity.rating} size={14} />
                                ))}
                            </div>
                        </div>
                        {activity.review && (
                            <p className="review-text" style={{ fontStyle: "italic", borderLeft: "3px solid var(--accent-color)", paddingLeft: "12px", marginBottom: "12px" }}>
                                "{activity.review}"
                            </p>
                        )}
                        <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "8px", marginTop: "8px" }}>
                            <LikeButton ratingId={activity.id} ownerId={activity.user_id} currentUser={currentUser} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActivityFeed;
