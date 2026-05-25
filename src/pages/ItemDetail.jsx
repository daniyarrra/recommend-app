import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { supabase } from "../services/supabase";
import Rating from "../components/Rating";
import AudioPlayer from "../components/AudioPlayer";
import LikeButton from "../components/LikeButton";
import { useLanguage } from "../context/LanguageContext";
import "../styles/detail.css";

/* ── SVG Icons ── */
const ArrowLeftIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"/>
        <polyline points="12 19 5 12 12 5"/>
    </svg>
);

const StarIcon = ({ filled, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#fbbf24" : "none"} stroke={filled ? "#fbbf24" : "#4b5563"} strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
);

const ChatIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
);

const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);

const HeadphonesIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
    </svg>
);

const PlayIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
);

const ItemDetail = () => {
    const { t, language } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewers, setViewers] = useState(1);
    
    // Состояния для Watchlist
    const [user, setUser] = useState(null);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [itemFolder, setItemFolder] = useState(null);
    const [showFolderDropdown, setShowFolderDropdown] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        API.get(`/items/${id}?lang=${language}`).then(res => {
            setItem(res.data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setError(t('load_error'));
            setLoading(false);
        });

        // Проверяем авторизацию и наличие в Watchlist
        const checkWatchlist = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                
                const { data } = await supabase
                    .from("watchlist")
                    .select("*")
                    .eq("user_id", session.user.id)
                    .eq("item_id", parseInt(id));
                
                if (data && data.length > 0) {
                    setInWatchlist(true);
                    setItemFolder(data[0].folder || null);
                }
            }
        };
        
        checkWatchlist();
        fetchReviews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, language]);

    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from("ratings")
                .select(`
                    id,
                    rating,
                    review,
                    created_at,
                    user_id,
                    profiles (
                        email,
                        avatar_url,
                        nickname
                    )
                `)
                .eq("item_id", parseInt(id))
                .not("review", "is", null)
                .neq("review", "")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (err) {
            console.error("Error fetching reviews:", err);
        } finally {
            setReviewsLoading(false);
        }
    };

    // Presence effect
    useEffect(() => {
        if (!id) return;
        
        const room = supabase.channel(`item-${id}`, {
            config: {
                presence: {
                    key: user ? user.id : Math.random().toString(36).substring(7),
                },
            },
        });
        
        room.on('presence', { event: 'sync' }, () => {
            const newState = room.presenceState();
            const count = Object.keys(newState).length;
            setViewers(count === 0 ? 1 : count);
        }).subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await room.track({
                    online_at: new Date().toISOString(),
                });
            }
        });

        return () => {
            supabase.removeChannel(room);
        };
    }, [id, user]);

    const toggleWatchlist = async () => {
        if (!user) {
            alert(t('watchlist_login_alert'));
            navigate("/login");
            return;
        }

        setProcessing(true);
        try {
            if (inWatchlist) {
                const { error } = await supabase
                    .from("watchlist")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("item_id", parseInt(id));
                
                if (error) throw error;
                setInWatchlist(false);
            } else {
                const { error } = await supabase
                    .from("watchlist")
                    .insert([{ user_id: user.id, item_id: parseInt(id), folder: null }]);
                
                if (error) throw error;
                setInWatchlist(true);
            }
        } catch (err) {
            console.error("Ошибка Watchlist:", err);
            alert(t('watchlist_error'));
        } finally {
            setProcessing(false);
        }
    };

    const changeFolder = async (folderName) => {
        if (!user) return;
        try {
            await supabase
                .from("watchlist")
                .update({ folder: folderName })
                .eq("user_id", user.id)
                .eq("item_id", parseInt(id));
            setItemFolder(folderName);
        } catch(err) {
            console.error(err);
        }
    };

    if (loading) return (
        <div className="detail-page">
            <div className="btn-back skeleton-pulse" style={{ width: "140px", height: "24px", background: "var(--hover-bg)", border: "none", color: "transparent", borderRadius: "8px" }}>{t('back_to_list')}</div>
            <div className="detail-layout">
                <div className="detail-poster-container skeleton-pulse" style={{ background: "var(--hover-bg)", height: "600px", borderRadius: "20px" }}></div>
                <div className="detail-info">
                    <div className="skeleton-pulse" style={{ width: "80%", height: "48px", background: "var(--glass-border)", borderRadius: "12px", marginBottom: "24px" }}></div>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
                        <div className="skeleton-pulse" style={{ width: "100px", height: "28px", background: "var(--hover-bg)", borderRadius: "8px" }}></div>
                        <div className="skeleton-pulse" style={{ width: "80px", height: "28px", background: "var(--hover-bg)", borderRadius: "8px" }}></div>
                    </div>
                    <div className="skeleton-pulse" style={{ width: "100%", height: "20px", background: "var(--hover-bg)", borderRadius: "4px", marginBottom: "8px" }}></div>
                    <div className="skeleton-pulse" style={{ width: "90%", height: "20px", background: "var(--hover-bg)", borderRadius: "4px", marginBottom: "8px" }}></div>
                    <div className="skeleton-pulse" style={{ width: "95%", height: "20px", background: "var(--hover-bg)", borderRadius: "4px", marginBottom: "40px" }}></div>
                    <div className="skeleton-pulse" style={{ width: "200px", height: "48px", background: "var(--glass-border)", borderRadius: "12px" }}></div>
                </div>
            </div>
        </div>
    );
    if (error || !item) {
        return (
            <div className="detail-page" style={{ textAlign: "center" }}>
                <h2>{error || t('item_not_found')}</h2>
                <Link to="/" className="btn-back">{t('back_to_home')}</Link>
            </div>
        );
    }

    const imageUrl = item.image || "https://via.placeholder.com/500x750?text=No+Image";

    return (
        <div className="detail-page">
                <Link to={-1} className="btn-back">
                    <ArrowLeftIcon />
                    {t('back_to_list')}
                </Link>
                
                <div className="detail-layout">
                    <div className="detail-poster-container">
                        <img src={imageUrl} alt={item.title} className="detail-poster" />
                    </div>
                    
                    <div className="detail-info">
                        <h1 className="detail-title">{item.title}</h1>
                        <div className="detail-meta">
                            <span className="detail-genre">{item.genre}</span>
                            <span>{item.category}</span>
                            {viewers > 1 && (
                                <span style={{ marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.85rem', fontWeight: '500', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                                    <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981' }}></span>
                                    {viewers} {language === 'ru' ? 'смотрят сейчас' : 'viewing now'}
                                </span>
                            )}
                        </div>
                        
                        <p className="detail-description">
                            {item.description || t('no_description')}
                        </p>

                        {(item.director?.length > 0 || item.cast?.length > 0) && (
                            <div className="detail-people-section" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {item.director?.length > 0 && (
                                    <div className="people-group">
                                        <h3 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{language === 'ru' ? 'Режиссер' : 'Director'}</h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                            {Array.isArray(item.director) ? item.director.map((p, i) => (
                                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '80px', textAlign: 'center' }}>
                                                    <img src={p.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=334155&color=fff`} alt={p.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--glass-border)', background: 'var(--glass-bg)' }} />
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.2' }}>{p.name}</span>
                                                </div>
                                            )) : (
                                                <span style={{ color: 'var(--text-primary)' }}>{item.director}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {item.cast?.length > 0 && (
                                    <div className="people-group">
                                        <h3 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{language === 'ru' ? 'В ролях' : 'Cast'}</h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                            {Array.isArray(item.cast) ? item.cast.map((p, i) => (
                                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '80px', textAlign: 'center' }}>
                                                    <img src={p.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=334155&color=fff`} alt={p.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--glass-border)', background: 'var(--glass-bg)' }} />
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.2' }}>{p.name}</span>
                                                </div>
                                            )) : (
                                                <span style={{ color: 'var(--text-primary)' }}>{item.cast}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {item.preview_url && (
                            <div style={{ marginBottom: '24px' }}>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '0.88rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <HeadphonesIcon />
                                    {t('listen_preview')}
                                </p>
                                <AudioPlayer src={item.preview_url} variant="large" />
                            </div>
                        )}
                        
                        {item.trailer_url && (
                            <div style={{ marginBottom: '24px' }}>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '0.88rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <PlayIcon />
                                    {t('watch_trailer')}
                                </p>
                                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', background: '#000' }}>
                                    {item.trailer_url.match(/\.(mp4|m4v)$/i) || item.trailer_url.includes('video-ssl.itunes') ? (
                                        <video 
                                            src={item.trailer_url} 
                                            controls 
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                        />
                                    ) : (
                                        <iframe 
                                            src={item.trailer_url} 
                                            frameBorder="0" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                            allowFullScreen
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                            title="Trailer"
                                        ></iframe>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="detail-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            <Rating itemId={item.id} />
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button 
                                    className="btn-watchlist" 
                                    onClick={toggleWatchlist}
                                    disabled={processing}
                                    style={{ 
                                        background: inWatchlist ? 'rgba(239, 68, 68, 0.1)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        border: inWatchlist ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
                                        color: inWatchlist ? '#f87171' : 'var(--btn-text)'
                                    }}
                                >
                                    {processing ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                        </svg>
                                    ) : inWatchlist ? <CheckIcon /> : <PlusIcon />}
                                    {processing ? "..." : (inWatchlist ? t('remove_watchlist') : t('add_watchlist'))}
                                </button>

                                {inWatchlist && (
                                    <div style={{ position: 'relative' }}>
                                        <button 
                                            onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                                            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '0 16px', borderRadius: '12px', height: '48px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, backdropFilter: 'blur(12px)' }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                            {itemFolder || 'Без папки'}
                                        </button>
                                        {showFolderDropdown && (
                                            <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', top: 'auto', left: 0, background: 'var(--bg-color)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '8px', zIndex: 1000, minWidth: '160px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                                                {['В планах', 'Смотрю', 'Просмотрено', 'Брошено'].map(f => (
                                                    <button 
                                                        key={f}
                                                        onClick={() => { changeFolder(f); setShowFolderDropdown(false); }}
                                                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: itemFolder === f ? 'var(--accent-color)' : 'transparent', color: itemFolder === f ? 'white' : 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '4px' }}
                                                        onMouseOver={e=>e.currentTarget.style.background = itemFolder === f ? 'var(--accent-color)' : 'var(--hover-bg)'}
                                                        onMouseOut={e=>e.currentTarget.style.background = itemFolder === f ? 'var(--accent-color)' : 'transparent'}
                                                    >
                                                        {f}
                                                    </button>
                                                ))}
                                                <div style={{ height: '1px', background: 'var(--glass-border)', margin: '4px 0' }}></div>
                                                <button 
                                                    onClick={() => { changeFolder(null); setShowFolderDropdown(false); }}
                                                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                    onMouseOver={e=>e.currentTarget.style.background='var(--hover-bg)'}
                                                    onMouseOut={e=>e.currentTarget.style.background='transparent'}
                                                >
                                                    Убрать из папки
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Блок отзывов */}
                <div className="reviews-section">
                    <h2 className="reviews-title">
                        <ChatIcon />
                        {t('user_reviews')}
                    </h2>
                    
                    {reviewsLoading ? (
                        <div className="skeleton-pulse" style={{ height: '100px', borderRadius: '16px' }}></div>
                    ) : reviews.length > 0 ? (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {reviews.map((rev, index) => (
                                <div key={index} className="review-card">
                                    <div className="review-header">
                                        <Link to={`/user/${rev.user_id}`} className="review-user" style={{ textDecoration: 'none' }}>
                                            <img 
                                                src={rev.profiles?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${rev.profiles?.email}&backgroundColor=3b82f6`} 
                                                alt="User" 
                                                className="review-avatar"
                                            />
                                            <span className="review-username" style={{ color: 'var(--text-primary)' }}>
                                                {rev.profiles?.nickname || rev.profiles?.email?.split('@')[0]}
                                            </span>
                                        </Link>
                                        <div className="review-stars">
                                            {[1,2,3,4,5].map(star => (
                                                <StarIcon key={star} filled={star <= rev.rating} size={16} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="review-text">
                                        "{rev.review}"
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                                        <LikeButton ratingId={rev.id} ownerId={rev.user_id} currentUser={user} />
                                        <div className="review-date">
                                            {new Date(rev.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="reviews-empty">
                            <ChatIcon />
                            <p className="reviews-empty-text" style={{ marginTop: '12px' }}>
                                {t('no_reviews')}
                            </p>
                        </div>
                    )}
                </div>
        </div>
    );
};

export default ItemDetail;
