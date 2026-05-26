import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import API from "../services/api";
import ItemCard from "../components/ItemCard";
import ActivityFeed from "../components/ActivityFeed";
import { useLanguage } from "../context/LanguageContext";
import "../styles/profile.css";
import "../styles/main.css";

/* ── SVG Icons ── */
const CameraIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
    </svg>
);

const UploadingIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
);

const LinkIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
);

const ShareIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/>
        <circle cx="6" cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
);

const Profile = () => {
    const [user, setUser] = useState(null);
    const [watchlistItems, setWatchlistItems] = useState([]);
    const [activeTab, setActiveTab] = useState("feed");
    const [activeFolder, setActiveFolder] = useState("all");
    const [folderAssignItem, setFolderAssignItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPublic, setIsPublic] = useState(true);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [bio, setBio] = useState("");
    const [nickname, setNickname] = useState("");
    const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'dark');
    const navigate = useNavigate();
    const { t, language, setLanguage } = useLanguage();

    const handleThemeToggle = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('app-theme', newTheme);
    };

    const [topGenres, setTopGenres] = useState([]);
    const [categoryCounts, setCategoryCounts] = useState({});
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [showModal, setShowModal] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate("/login"); return; }
            setUser(session.user);
            let allWatchlistItems = [];
            try {
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("is_public, avatar_url, bio, nickname")
                    .eq("id", session.user.id)
                    .maybeSingle();
                if (profileData) {
                    // If no profile row exists yet, is_public defaults to true
                    setIsPublic(profileData.is_public ?? true);
                    setAvatarUrl(profileData.avatar_url);
                    if (profileData.bio) setBio(profileData.bio);
                    // Prioritize profile nickname, then user_metadata, then email prefix
                    const resolvedNickname = profileData.nickname
                        || session.user.user_metadata?.nickname
                        || session.user.email.split('@')[0];
                    setNickname(resolvedNickname);
                } else {
                    // New user without profile row — use metadata nickname
                    const metaNickname = session.user.user_metadata?.nickname
                        || session.user.email.split('@')[0];
                    setNickname(metaNickname);
                    setIsPublic(true);
                }

                // Watchlist с папками
                const { data: watchlistData } = await supabase
                    .from("watchlist")
                    .select("item_id, folder")
                    .eq("user_id", session.user.id);

                const { data: ratingsData } = await supabase
                    .from("ratings")
                    .select("item_id, rating")
                    .eq("user_id", session.user.id);
                
                const ratingsMap = {};
                if (ratingsData) {
                    ratingsData.forEach(r => { ratingsMap[r.item_id] = r.rating; });
                }

                // Карта папок
                const folderMap = {};
                if (watchlistData) {
                    watchlistData.forEach(w => { folderMap[w.item_id] = w.folder || null; });
                }
                
                const itemIds = new Set([
                    ...(watchlistData || []).map(w => w.item_id),
                    ...(ratingsData || []).map(r => r.item_id)
                ]);

                let allItems = [];
                const idsArray = Array.from(itemIds);
                if (idsArray.length > 0) {
                    const res = await API.get(`/items?ids=${idsArray.join(',')}`);
                    allItems = res.data;
                }

                allWatchlistItems = idsArray.map(itemId => {
                    const item = allItems.find(i => i.id === itemId);
                    if (item) {
                        return {
                            ...item,
                            userRating: ratingsMap[itemId] || 0,
                            folder: folderMap[itemId] || null,
                            inWatchlist: folderMap[itemId] !== undefined // if it's in folderMap, it's in watchlistData
                        };
                    }
                    return null;
                }).filter(Boolean);
                setWatchlistItems(allWatchlistItems);

                // Followers / Following
                const { data: followersData } = await supabase
                    .from("follows")
                    .select("follower_id")
                    .eq("following_id", session.user.id);
                
                if (followersData && followersData.length > 0) {
                    const followerIds = followersData.map(f => f.follower_id);
                    const { data: followerProfiles } = await supabase
                        .from("profiles")
                        .select("id, email, avatar_url, is_public, nickname")
                        .in("id", followerIds);
                        
                    const profileMap = {};
                    if (followerProfiles) followerProfiles.forEach(p => profileMap[p.id] = p);

                    const fullFollowers = followerIds.map(id => profileMap[id] || { id, email: "Скрытый пользователь", is_private: true });
                    setFollowers(fullFollowers);
                }

                const { data: followingData } = await supabase
                    .from("follows")
                    .select("following_id")
                    .eq("follower_id", session.user.id);
                
                if (followingData && followingData.length > 0) {
                    const followingIds = followingData.map(f => f.following_id);
                    const { data: followingProfiles } = await supabase
                        .from("profiles")
                        .select("id, email, avatar_url, is_public, nickname")
                        .in("id", followingIds);
                        
                    const profileMap = {};
                    if (followingProfiles) followingProfiles.forEach(p => profileMap[p.id] = p);

                    const fullFollowing = followingIds.map(id => profileMap[id] || { id, email: "Скрытый пользователь", is_private: true });
                    setFollowing(fullFollowing);
                }

                calculateAnalytics(allWatchlistItems);

            } catch (err) {
                console.error("Ошибка загрузки профиля:", err);
            }

            setLoading(false);
        };
        fetchUserData();
    }, [navigate]);

    const calculateAnalytics = (items) => {
        const uniqueItems = items;
        
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

        // Сортируем жанры по количеству и берем топ-3
        const sortedGenres = Object.entries(genreTally)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(entry => entry[0]);

        setTopGenres(sortedGenres);
        setCategoryCounts(catTally);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Вы уверены, что хотите НАВСЕГДА удалить свой аккаунт? Это действие нельзя отменить.")) {
            try {
                // Вызываем SQL-функцию delete_user
                const { error } = await supabase.rpc('delete_user');
                if (error) throw error;
                
                // Выходим из системы и перенаправляем на главную
                await supabase.auth.signOut();
                navigate("/");
            } catch (err) {
                console.error("Ошибка при удалении аккаунта:", err);
                alert("Ошибка: " + err.message + "\n\nВозможно, у вас остались лайки или подписки, которые мешают удалению. Пожалуйста, покажите это сообщение разработчику.");
            }
        }
    };

    const [updatingPublic, setUpdatingPublic] = useState(false);
    const handlePublicToggle = async () => {
        if (updatingPublic) return;
        
        const newVal = !isPublic;
        setUpdatingPublic(true);
        
        try {
            const { error } = await supabase
                .from("profiles")
                .upsert({ 
                    id: user.id, 
                    is_public: newVal,
                    email: user.email,
                    avatar_url: avatarUrl,
                    bio: bio,
                    nickname: nickname
                });

            if (error) throw error;
            
            setIsPublic(newVal);
        } catch (err) {
            console.error("Error updating privacy:", err);
            alert("Ошибка при сохранении настроек.");
        } finally {
            setUpdatingPublic(false);
        }
    };

    const [uploading, setUploading] = useState(false);
    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Загрузка в бакет 'avatars' (нужно создать его в Supabase)
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({ id: user.id, avatar_url: publicUrl, email: user.email, is_public: isPublic, bio: bio, nickname: nickname });

            if (updateError) throw updateError;

            setAvatarUrl(publicUrl);
            alert("Аватарка успешно обновлена!");
        } catch (err) {
            console.error("Error uploading avatar:", err);
            alert("Ошибка загрузки. Убедитесь, что вы создали публичный бакет 'avatars' в Supabase Storage.");
        } finally {
            setUploading(false);
        }
    };

    const setDiceBearStyle = async (style) => {
        const newUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${user.email}&backgroundColor=3b82f6`;
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({ id: user.id, avatar_url: newUrl });
            if (error) throw error;
            setAvatarUrl(newUrl);
        } catch (err) {
            alert("Ошибка при выборе стиля.");
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <span className="loading-text">{t('loading')}</span>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const displayAvatar = avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}&backgroundColor=3b82f6`;

    const FIXED_FOLDERS = ['В планах', 'Смотрю', 'Просмотрено', 'Брошено'];

    // Фильтрация элементов
    const displayItems = 
        activeTab === "ratings" ? watchlistItems.filter(i => i.userRating > 0).sort((a, b) => b.userRating - a.userRating) :
        activeTab === "watchlist" ? (
            activeFolder === "all" ? watchlistItems.filter(i => i.inWatchlist) :
            activeFolder === "unsorted" ? watchlistItems.filter(i => i.inWatchlist && !i.folder) :
            watchlistItems.filter(i => i.inWatchlist && i.folder === activeFolder)
        ) : [];

    // Назначить папку элементу
    const assignFolder = async (itemId, folderName) => {
        try {
            await supabase
                .from("watchlist")
                .upsert({ user_id: user.id, item_id: itemId, folder: folderName || null }, { onConflict: "user_id, item_id" });
            setWatchlistItems(prev => prev.map(i => 
                i.id === itemId ? { ...i, folder: folderName || null, inWatchlist: true } : i
            ));
            setFolderAssignItem(null);
        } catch (err) {
            console.error("Error assigning folder:", err);
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="avatar-wrapper">
                    <img src={displayAvatar} alt="Аватар" className="profile-avatar-img" />
                    <label className="avatar-edit-btn">
                        <input type="file" hidden onChange={handleAvatarUpload} disabled={uploading} />
                        {uploading ? <UploadingIcon /> : <CameraIcon />}
                    </label>
                </div>
                <div className="profile-info">
                    <h1 style={{ marginBottom: '4px' }}>
                        {nickname || user.user_metadata?.nickname || user.email.split('@')[0]}
                    </h1>
                    <p className="profile-email" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{user.email}</p>
                    {bio && <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.95rem', lineHeight: '1.4', maxWidth: '400px' }}>{bio}</p>}
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
                    
                    <div style={{ marginTop: '16px', display: 'flex', gap: '20px', marginBottom: '20px' }}>
                        <div style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)', transition: 'color 0.2s' }} onClick={() => setShowModal('followers')} onMouseOver={e => e.currentTarget.style.color='var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color='var(--text-secondary)'}>
                            <strong style={{ color: 'var(--text-primary)' }}>{followers.length}</strong> подписчиков
                        </div>
                        <div style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)', transition: 'color 0.2s' }} onClick={() => setShowModal('following')} onMouseOver={e => e.currentTarget.style.color='var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color='var(--text-secondary)'}>
                            <strong style={{ color: 'var(--text-primary)' }}>{following.length}</strong> подписок
                        </div>
                    </div>

                    <button onClick={handleLogout} className="btn-logout">{t('logout')}</button>
                </div>
            </div>

            <div className="profile-analytics-section">
                <h3>{t('library')}</h3>
                <div className="profile-stats">
                    <div className="stat-card">
                        <div className="stat-value">{watchlistItems.length}</div>
                        <div className="stat-label">{t('in_watchlist')}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{watchlistItems.filter(i => i.userRating > 0).length}</div>
                        <div className="stat-label">{t('ratings_left')}</div>
                    </div>
                    
                    {/* Разбивка по категориям */}
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
                        className={`profile-tab ${activeTab === 'feed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('feed')}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        Лента активности
                    </button>
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
                        Мои оценки
                    </button>
                    <button 
                        className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {t('tab_settings')}
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
                            Все
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
                            Без папки
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
                                {folder}
                            </button>
                        ))}
                    </div>
                )}

                {activeTab === 'feed' ? (
                    <div style={{ marginTop: '20px' }}>
                        <ActivityFeed currentUser={user} />
                    </div>
                ) : activeTab === 'settings' ? (
                    <div className="settings-panel">
                        <div className="settings-section">
                            <h3>{t('account_settings')}</h3>
                            
                            <div className="settings-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <h4>О себе</h4>
                                    <p>Расскажите немного о себе, своих интересах и любимых жанрах</p>
                                </div>
                                <textarea 
                                    className="auth-input" 
                                    style={{ margin: 0, padding: '12px', minHeight: '80px', resize: 'vertical' }}
                                    placeholder="Всем привет! Люблю научную фантастику и инди-музыку..."
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    onBlur={async () => {
                                        await supabase.from('profiles').upsert({ id: user.id, bio, nickname, email: user.email, is_public: isPublic, avatar_url: avatarUrl });
                                    }}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'flex-end', marginTop: '4px' }}>Сохраняется автоматически</span>
                            </div>

                            <div className="settings-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <h4>Никнейм</h4>
                                    <p>Ваше отображаемое имя на платформе</p>
                                </div>
                                <input 
                                    type="text"
                                    className="auth-input" 
                                    style={{ margin: 0, padding: '12px' }}
                                    placeholder="Ваш никнейм"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    onBlur={async () => {
                                        await supabase.from('profiles').upsert({ id: user.id, bio, nickname, email: user.email, is_public: isPublic, avatar_url: avatarUrl });
                                        await supabase.auth.updateUser({ data: { nickname } });
                                    }}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'flex-end', marginTop: '4px' }}>Сохраняется автоматически</span>
                            </div>

                            <div className="settings-card">
                                <div>
                                    <h4>{t('language')}</h4>
                                    <p>{t('language_desc')}</p>
                                </div>
                                <select 
                                    className="auth-input" 
                                    style={{ width: '150px', margin: 0, padding: '10px' }}
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    <option value="ru">Русский</option>
                                    <option value="en">English</option>
                                    <option value="kz">Қазақша</option>
                                </select>
                            </div>

                            <div className="settings-card">
                                <div>
                                    <h4>{t('light_theme')}</h4>
                                    <p>{t('light_theme_desc')}</p>
                                </div>
                                <label className="settings-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={theme === 'light'} 
                                        onChange={handleThemeToggle} 
                                    />
                                    <span className="settings-slider"></span>
                                </label>
                            </div>

                            <div className="settings-card">
                                <div>
                                    <h4>{t('public_profile')}</h4>
                                    <p>{t('public_profile_desc')}</p>
                                </div>
                                <label className="settings-switch">
                                    <input type="checkbox" checked={isPublic} onChange={handlePublicToggle} />
                                    <span className="settings-slider"></span>
                                </label>
                            </div>

                            {isPublic && (
                                <div className="settings-card share-profile-card" onClick={() => {
                                    const link = window.location.origin + "/user/" + user.id;
                                    if (navigator.clipboard && window.isSecureContext) {
                                        navigator.clipboard.writeText(link);
                                        alert("Ссылка скопирована!");
                                    } else {
                                        const textArea = document.createElement("textarea");
                                        textArea.value = link;
                                        textArea.style.position = "fixed";
                                        textArea.style.left = "-999999px";
                                        document.body.appendChild(textArea);
                                        textArea.focus();
                                        textArea.select();
                                        try {
                                            document.execCommand('copy');
                                            alert("Ссылка скопирована!");
                                        } catch (err) {
                                            alert("Скопируйте ссылку вручную: " + link);
                                        }
                                        textArea.remove();
                                    }
                                }}>
                                    <div>
                                        <h4 style={{ color: "#60a5fa", display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <ShareIcon />
                                            Поделиться профилем
                                        </h4>
                                        <p>Скопировать ссылку на мою страницу</p>
                                    </div>
                                    <LinkIcon />
                                </div>
                            )}
                            
                            <h3 style={{ marginTop: '32px' }}>{t('danger_zone')}</h3>
                            <div className="settings-card danger-card">
                                <div>
                                    <h4 style={{ color: '#f87171' }}>{t('delete_account')}</h4>
                                    <p>{t('delete_account_desc')}</p>
                                </div>
                                <button onClick={handleDeleteAccount} className="btn-logout" style={{ marginTop: 0 }}>{t('delete_btn')}</button>
                            </div>

                            <h3 style={{ marginTop: '32px' }}>Стиль Аватарки (DiceBear)</h3>
                            <div className="settings-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '10px', padding: '15px' }}>
                                {['bottts', 'pixel-art', 'adventurer', 'avataaars', 'fun-emoji'].map(style => (
                                    <div 
                                        key={style} 
                                        onClick={() => setDiceBearStyle(style)}
                                        style={{ 
                                            cursor: 'pointer', 
                                            padding: '8px', 
                                            borderRadius: '12px', 
                                            background: (avatarUrl || '').includes(style) ? 'rgba(59, 130, 246, 0.2)' : 'var(--hover-bg)',
                                            border: (avatarUrl || '').includes(style) ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                                            textAlign: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <img src={`https://api.dicebear.com/7.x/${style}/svg?seed=${user.email}`} alt={style} style={{ width: '40px', height: '40px' }} />
                                        <div style={{ fontSize: '10px', marginTop: '4px', color: 'var(--text-secondary)' }}>{style}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : displayItems.length > 0 ? (
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
                                        fontSize: '1.3rem', 
                                        color: 'var(--text-primary)', 
                                        marginBottom: '20px',
                                        paddingLeft: '12px',
                                        borderLeft: '3px solid var(--accent-color)',
                                        fontWeight: '700'
                                    }}>
                                        {t(cat.label)}
                                    </h3>
                                    <div className="grid">
                                        {itemsInCategory.map(item => (
                                            <div key={item.id} style={{ position: 'relative' }}>
                                                <ItemCard item={item} />
                                                {activeTab === 'watchlist' && (
                                                    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setFolderAssignItem(folderAssignItem === item.id ? null : item.id); }}
                                                            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '8px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                                            {item.folder || 'В папку...'}
                                                        </button>
                                                        
                                                        {folderAssignItem === item.id && (
                                                            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden', minWidth: '120px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                                                                <button onClick={() => assignFolder(item.id, null)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', borderBottom: '1px solid var(--glass-border)' }}>
                                                                    Убрать из папки
                                                                </button>
                                                                {FIXED_FOLDERS.map(f => (
                                                                    <button key={f} onClick={() => assignFolder(item.id, f)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }} onMouseOver={e => e.currentTarget.style.background='var(--hover-bg)'} onMouseOut={e => e.currentTarget.style.background='transparent'}>
                                                                        {f}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        });
                    })()
                ) : (
                    <div className="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: '16px' }}>
                            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                            <line x1="7" y1="2" x2="7" y2="22"/>
                            <line x1="17" y1="2" x2="17" y2="22"/>
                            <line x1="2" y1="12" x2="22" y2="12"/>
                        </svg>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            {activeTab === 'watchlist' ? (
                                activeFolder === 'all' ? t('empty_watchlist') : `В папке "${activeFolder}" пока пусто.`
                             ) :
                             t('empty_ratings')}
                        </p>
                        <Link to="/" className="nav-btn nav-btn-primary" style={{ display: 'inline-flex' }}>{t('find_cool_stuff')}</Link>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-color)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '20px', width: '90%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>{showModal === 'followers' ? 'Подписчики' : 'Подписки'}</h3>
                            <button onClick={() => setShowModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {(showModal === 'followers' ? followers : following).length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>Список пуст</p>
                            ) : (
                                (showModal === 'followers' ? followers : following).map(p => (
                                    <Link key={p.id} to={`/user/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', padding: '8px', borderRadius: '8px', background: 'var(--hover-bg)' }} onClick={() => setShowModal(null)}>
                                        <img src={p.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.email}&backgroundColor=3b82f6`} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                        <div style={{ color: 'var(--text-primary)' }}>
                                            <strong>{p.nickname || p.email.split('@')[0]}</strong>
                                            {p.is_private && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Профиль скрыт</div>}
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
