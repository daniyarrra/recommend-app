import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import ItemCard from "../components/ItemCard";
import "../styles/profile.css";
import "../styles/main.css";
import { useLanguage } from "../context/LanguageContext";
import { useCatalog } from "../hooks/useCatalog";

const PublicProfile = () => {
    const { id } = useParams();
    const { t, language } = useLanguage();
    const { data: allItems = [], isLoading: catalogLoading } = useCatalog(language);
    
    const [profile, setProfile] = useState(null);
    const [savedItems, setSavedItems] = useState([]);
    const [ratedItems, setRatedItems] = useState([]);
    const [activeTab, setActiveTab] = useState("watchlist");
    const [activeFolder, setActiveFolder] = useState("all");
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
        if (catalogLoading) {
            return;
        }

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

                // 3. Load Watchlist
                const { data: watchlistData } = await supabase
                    .from("watchlist")
                    .select("item_id, folder")
                    .eq("user_id", id);
                
                let sItems = [];
                if (watchlistData) {
                    const savedMap = {};
                    watchlistData.forEach(w => { savedMap[w.item_id] = w.folder || null; });
                    const savedIds = Object.keys(savedMap);
                    sItems = allItems.filter(item => savedIds.includes(item.id.toString())).map(item => ({
                        ...item,
                        folder: savedMap[item.id]
                    }));
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
    }, [id, allItems, catalogLoading]);

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
                
                // Add notification
                await supabase.from("notifications").insert({
                    user_id: id,          // The person being followed
                    actor_id: currentUser.id, // The person who followed
                    type: 'follow'
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
    
    const FIXED_FOLDERS = ['В планах', 'Смотрю', 'Просмотрено', 'Брошено'];
    const FOLDER_KEYS = {
        'В планах': 'folder_planned',
        'Смотрю': 'folder_watching',
        'Просмотрено': 'folder_watched',
        'Брошено': 'folder_dropped'
    };

    const displayItems = activeTab === "watchlist" ? (
        activeFolder === "all" ? savedItems :
        activeFolder === "unsorted" ? savedItems.filter(i => !i.folder) :
        savedItems.filter(i => i.folder === activeFolder)
    ) : activeTab === "ratings" ? ratedItems.sort((a, b) => b.userRating - a.userRating) : [];

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
                        className={`profile-tab ${activeTab === 'ratings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ratings')}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {t('tab_my_ratings')}
                    </button>
                </div>

                {activeTab === 'watchlist' && (
                    <div style={{ marginTop: '20px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', alignItems: 'center', scrollbarWidth: 'none' }}>
                        <button 
                            onClick={() => setActiveFolder('all')}
                            style={{ 
                                fontSize: '0.85rem', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, border: '1px solid', transition: 'all 0.2s', whiteSpace: 'nowrap',
                                background: activeFolder === 'all' ? 'var(--accent-color)' : 'transparent',
                                color: activeFolder === 'all' ? 'white' : 'var(--text-secondary)',
                                borderColor: activeFolder === 'all' ? 'var(--accent-color)' : 'var(--glass-border)'
                            }}
                        >
                            {t('folder_all')}
                        </button>
                        <button 
                            onClick={() => setActiveFolder('unsorted')}
                            style={{ 
                                fontSize: '0.85rem', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, border: '1px solid', transition: 'all 0.2s', whiteSpace: 'nowrap',
                                background: activeFolder === 'unsorted' ? 'var(--accent-color)' : 'transparent',
                                color: activeFolder === 'unsorted' ? 'white' : 'var(--text-secondary)',
                                borderColor: activeFolder === 'unsorted' ? 'var(--accent-color)' : 'var(--glass-border)'
                            }}
                        >
                            {t('folder_unsorted')}
                        </button>
                        {FIXED_FOLDERS.map(folder => (
                            <button 
                                key={folder}
                                onClick={() => setActiveFolder(folder)}
                                style={{ 
                                    fontSize: '0.85rem', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, border: '1px solid', transition: 'all 0.2s', whiteSpace: 'nowrap',
                                    background: activeFolder === folder ? 'var(--accent-color)' : 'transparent',
                                    color: activeFolder === folder ? 'white' : 'var(--text-secondary)',
                                    borderColor: activeFolder === folder ? 'var(--accent-color)' : 'var(--glass-border)'
                                }}
                            >
                                {t(FOLDER_KEYS[folder]) || folder}
                            </button>
                        ))}
                    </div>
                )}

                {displayItems.length > 0 ? (
                    (() => {
                        const categories = [
                            { key: 'Фильмы', label: 'cat_movies' },
                            { key: 'Сериалы', label: 'cat_tv' },
                            { key: 'Книги', label: 'cat_books' },
                            { key: 'Музыка', label: 'cat_music' }
                        ];

                        return categories.map(cat => {
                            const translatedCat = t(cat.label);
                            const itemsInCategory = displayItems.filter(item => item.category === cat.key || item.category === translatedCat);
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
                            {activeTab === 'watchlist' ? (
                                activeFolder === 'all' ? t('empty_watchlist') : t('folder_empty')
                             ) :
                             t('empty_ratings')}
                        </p>       </div>
                )}
            </div>
        </div>
    );
};

export default PublicProfile;
