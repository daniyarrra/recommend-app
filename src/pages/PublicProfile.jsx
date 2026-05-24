import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import API from "../services/api";
import ItemCard from "../components/ItemCard";
import "../styles/profile.css";
import "../styles/main.css";
// import custom translation if needed, but for simplicity I will use hardcoded strings for now or default to basic translations
// It's better to use LanguageContext
import { useLanguage } from "../context/LanguageContext";

const PublicProfile = () => {
    const { id } = useParams();
    const { t } = useLanguage();
    
    const [profile, setProfile] = useState(null);
    const [savedItems, setSavedItems] = useState([]);
    const [ratedItems, setRatedItems] = useState([]);
    const [activeTab, setActiveTab] = useState("watchlist");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [topGenres, setTopGenres] = useState([]);
    const [categoryCounts, setCategoryCounts] = useState({});

    // Социальные элементы
    const [currentUser, setCurrentUser] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);

    useEffect(() => {
        const fetchPublicData = async () => {
            try {
                // 1. Fetch profile
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", id)
                    .maybeSingle();

                if (profileError) throw profileError;
                
                if (!profileData || !profileData.is_public) {
                    setError("Этот профиль скрыт настройками приватности или не существует.");
                    setLoading(false);
                    return;
                }

                setProfile(profileData);

                // Check auth & follow status
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setCurrentUser(session.user);
                    try {
                        const { data: followData } = await supabase
                            .from("follows")
                            .select("id")
                            .eq("follower_id", session.user.id)
                            .eq("following_id", id);
                        if (followData && followData.length > 0) setIsFollowing(true);
                    } catch(e) {}
                }

                // Count followers
                try {
                    const { count } = await supabase
                        .from("follows")
                        .select("*", { count: 'exact', head: true })
                        .eq("following_id", id);
                    setFollowersCount(count || 0);
                } catch(e) {}

                // 2. Load catalog
                const res = await API.get("/items");
                const allItems = res.data;

                // 3. Load Watchlist
                const { data: watchlistData } = await supabase
                    .from("watchlist")
                    .select("item_id")
                    .eq("user_id", id);
                
                let sItems = [];
                if (watchlistData) {
                    const savedIds = watchlistData.map(w => w.item_id);
                    sItems = allItems.filter(item => savedIds.includes(item.id));
                    setSavedItems(sItems);
                }

                // 4. Load Ratings
                const { data: ratingsData } = await supabase
                    .from("ratings")
                    .select("item_id, rating")
                    .eq("user_id", id);
                
                let rItems = [];
                if (ratingsData) {
                    const ratedIds = ratingsData.map(r => r.item_id);
                    rItems = allItems.filter(item => ratedIds.includes(item.id)).map(item => {
                        const rInfo = ratingsData.find(r => r.item_id === item.id);
                        return { ...item, userRating: rInfo.rating };
                    });
                    setRatedItems(rItems);
                }

                calculateAnalytics(sItems, rItems);

            } catch (err) {
                console.error("Ошибка загрузки публичного профиля:", err);
                setError("Ошибка загрузки данных профиля.");
            }

            setLoading(false);
        };
        fetchPublicData();
    }, [id]);

    const calculateAnalytics = (saved, rated) => {
        const uniqueItems = Array.from(new Set([...saved, ...rated]));
        const genreTally = {};
        const catTally = {};

        uniqueItems.forEach(item => {
            if (item.genre) {
                genreTally[item.genre] = (genreTally[item.genre] || 0) + 1;
            }
            if (item.category) {
                catTally[item.category] = (catTally[item.category] || 0) + 1;
            }
        });

        const sortedGenres = Object.entries(genreTally)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(entry => entry[0]);

        setTopGenres(sortedGenres);
        setCategoryCounts(catTally);
    };

    if (loading) {
        return <div className="profile-page" style={{ textAlign: "center" }}>Загрузка профиля...</div>;
    }

    if (error) {
        return (
            <div className="profile-page" style={{ textAlign: "center" }}>
                <h2>{error}</h2>
                <Link to="/" className="btn-back" style={{ marginTop: "20px" }}>На главную</Link>
            </div>
        );
    }

    const handleFollowToggle = async () => {
        if (!currentUser) {
            alert("Пожалуйста, войдите в аккаунт, чтобы подписаться.");
            return;
        }
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await supabase.from("follows").delete()
                    .eq("follower_id", currentUser.id)
                    .eq("following_id", id);
                setIsFollowing(false);
                setFollowersCount(prev => Math.max(0, prev - 1));
            } else {
                await supabase.from("follows").insert({
                    follower_id: currentUser.id,
                    following_id: id
                });
                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);
            }
        } catch (err) {
            alert("Ошибка при подписке. Проверьте БД.");
        } finally {
            setFollowLoading(false);
        }
    };

    const avatarUrl = profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.email}&backgroundColor=3b82f6`;
    const displayItems = activeTab === "watchlist" ? savedItems :
                         activeTab === "favorites" ? ratedItems.filter(i => i.userRating >= 5) :
                         activeTab === "watched" ? ratedItems.filter(i => i.userRating >= 3 && i.userRating < 5) :
                         activeTab === "terrible" ? ratedItems.filter(i => i.userRating <= 2) :
                         activeTab === "ratings" ? ratedItems : [];

    return (
        <div className="profile-page">
            <div className="profile-header">
                <img src={avatarUrl} alt="Аватар профиля" className="profile-avatar-img" />
                <div className="profile-info">
                    <h1 style={{ marginBottom: '4px' }}>
                        {profile.nickname || profile.email.split('@')[0]}
                    </h1>
                    <p className="profile-email" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{profile.email}</p>
                    {profile.bio && <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.95rem', lineHeight: '1.4', maxWidth: '400px' }}>{profile.bio}</p>}
                    {topGenres.length > 0 && (
                        <div className="profile-favorite-genres">
                            <span className="genres-label">{t('favorite_genres')}</span>
                            <div className="genres-list">
                                {topGenres.map((genre, idx) => (
                                    <span key={idx} className="profile-genre-tag">{genre}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{followersCount}</strong> подписчиков
                        </div>
                        {currentUser && currentUser.id !== id && (
                            <button 
                                onClick={handleFollowToggle} 
                                disabled={followLoading}
                                className={isFollowing ? "btn-logout" : "nav-btn nav-btn-primary"}
                                style={{ margin: 0, padding: '8px 20px' }}
                            >
                                {followLoading ? "..." : isFollowing ? "Отписаться" : "Подписаться"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="profile-analytics-section">
                <h3>{t('library')} (Публичная)</h3>
                <div className="profile-stats">
                    <div className="stat-card">
                        <div className="stat-value">{savedItems.length}</div>
                        <div className="stat-label">{t('in_watchlist')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{ratedItems.length}</div>
                        <div className="stat-label">{t('ratings_left')}</div>
                    </div>
                    
                    {Object.entries(categoryCounts).map(([cat, count]) => (
                        <div className="stat-card stat-card-category" key={cat}>
                            <div className="stat-value">{count}</div>
                            <div className="stat-label">{cat}</div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="profile-content">
                <div className="profile-tabs" style={{ display: 'flex', overflowX: 'auto', paddingBottom: '10px' }}>
                    <button 
                        className={`profile-tab ${activeTab === 'watchlist' ? 'active' : ''}`}
                        onClick={() => setActiveTab('watchlist')}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {t('tab_watchlist')}
                    </button>
                    <button 
                        className={`profile-tab ${activeTab === 'favorites' ? 'active' : ''}`}
                        onClick={() => setActiveTab('favorites')}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        Любимые (5★)
                    </button>
                    <button 
                        className={`profile-tab ${activeTab === 'watched' ? 'active' : ''}`}
                        onClick={() => setActiveTab('watched')}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        Просмотренные (3-4★)
                    </button>
                    <button 
                        className={`profile-tab ${activeTab === 'terrible' ? 'active' : ''}`}
                        onClick={() => setActiveTab('terrible')}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        Ужасные (1-2★)
                    </button>
                </div>

                {displayItems.length > 0 ? (
                    (() => {
                        const categories = [
                            { key: 'Фильмы', label: 'cat_movies' },
                            { key: 'Сериалы', label: 'cat_tv' },
                            { key: 'Книги', label: 'cat_books' },
                            { key: 'Музыка', label: 'cat_music' }
                        ];

                        return categories.map(cat => {
                            const itemsInCategory = displayItems.filter(item => item.category === cat.key);
                            if (itemsInCategory.length === 0) return null;

                            return (
                                <div key={cat.key} className="profile-section-group" style={{ marginBottom: '40px' }}>
                                    <h3 style={{ 
                                        fontSize: '1.4rem', 
                                        color: 'var(--text-primary)', 
                                        marginBottom: '20px',
                                        paddingLeft: '10px',
                                        borderLeft: '4px solid #3b82f6'
                                    }}>
                                        {t(cat.label)}
                                    </h3>
                                    <div className="grid">
                                        {itemsInCategory.map(item => (
                                            <ItemCard key={item.id} item={item} />
                                        ))}
                                    </div>
                                </div>
                            );
                        });
                    })()
                ) : (
                    <div className="empty-state">
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            {activeTab === 'watchlist' ? 'Пользователь еще ничего не добавил в Watchlist' :
                             activeTab === 'favorites' ? 'У пользователя пока нет любимых фильмов.' :
                             activeTab === 'watched' ? 'Пользователь еще не оценил фильмы на 3 или 4 звезды.' :
                             activeTab === 'terrible' ? 'Здесь пусто.' :
                             'Список пуст'}
                        </p>       </div>
                )}
            </div>
        </div>
    );
};

export default PublicProfile;
