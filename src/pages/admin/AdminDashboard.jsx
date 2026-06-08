import { useEffect, useState, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { useLanguage } from "../../context/LanguageContext";
import { useCatalog } from "../../hooks/useCatalog";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

const CATEGORY_KEYS = [
    { key: 'Фильмы',  tKey: 'dash_cat_movies',  color: '#3b82f6' },
    { key: 'Сериалы', tKey: 'dash_cat_tv',       color: '#8b5cf6' },
    { key: 'Книги',   tKey: 'dash_cat_books',    color: '#10b981' },
    { key: 'Музыка',  tKey: 'dash_cat_music',    color: '#f59e0b' },
];

const StarIcon = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
);

const AdminDashboard = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const { role } = useOutletContext() || {};
    // Always load in 'ru' — categories are stored in Russian in the DB
    // (same approach as AdminContent.jsx)
    const { data: allItems = [], isLoading: catalogLoading } = useCatalog('ru');

    const [stats, setStats] = useState({ users: 0, items: 0, reviews: 0, avgRating: 0 });
    const [allRatings, setAllRatings] = useState([]);
    const [allWatchlist, setAllWatchlist] = useState([]);
    const [catData, setCatData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Active category tab for the bottom 3 sections
    const [activeTab, setActiveTab] = useState('Фильмы');

    // Managers go straight to Content
    useEffect(() => {
        if (role === 'manager') navigate('/admin/content', { replace: true });
    }, [role, navigate]);

    useEffect(() => {
        if (catalogLoading) return;

        const fetchStats = async () => {
            try {
                const { count: usersCount } = await supabase
                    .from("profiles").select("*", { count: "exact", head: true });

                const { data: ratings, count: reviewsCount } = await supabase
                    .from("ratings").select("rating, item_id", { count: "exact" });

                let avg = 0;
                if (ratings && ratings.length > 0) {
                    avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
                }

                setStats({
                    users: usersCount || 0,
                    items: allItems.length,
                    reviews: reviewsCount || 0,
                    avgRating: avg.toFixed(1)
                });

                setAllRatings(ratings || []);

                // Category distribution pie
                const catDist = {};
                allItems.forEach(i => {
                    catDist[i.category] = (catDist[i.category] || 0) + 1;
                });
                setCatData(Object.entries(catDist).map(([name, value]) => ({ name, value })));

                // Watchlist
                const { data: watchlistData } = await supabase
                    .from("watchlist").select("item_id");
                setAllWatchlist(watchlistData || []);

            } catch (err) {
                console.error("Stats error:", err);
            }
            setLoading(false);
        };
        fetchStats();
    }, [allItems, catalogLoading]);

    /* ── Derived data filtered by activeTab ── */
    const itemsInTab = useMemo(
        () => allItems.filter(i => i.category === activeTab),
        [allItems, activeTab]
    );
    const tabItemIds = useMemo(() => new Set(itemsInTab.map(i => i.id)), [itemsInTab]);

    const rateDataFiltered = useMemo(() => {
        const dist = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
        allRatings
            .filter(r => tabItemIds.has(r.item_id))
            .forEach(r => { dist[r.rating] = (dist[r.rating] || 0) + 1; });
        return Object.entries(dist).map(([name, value]) => ({ name: `${name} ★`, value })).reverse();
    }, [allRatings, tabItemIds]);

    const topRatedFiltered = useMemo(() => {
        const ratingsInTab = allRatings.filter(r => tabItemIds.has(r.item_id));
        if (!ratingsInTab.length) return [];
        const agg = {};
        ratingsInTab.forEach(r => {
            if (!agg[r.item_id]) agg[r.item_id] = { sum: 0, count: 0 };
            agg[r.item_id].sum += r.rating;
            agg[r.item_id].count += 1;
        });
        return Object.entries(agg)
            .map(([id, v]) => {
                const item = allItems.find(i => i.id === parseInt(id));
                return { id: parseInt(id), avg: v.sum / v.count, count: v.count, title: item?.title || `#${id}`, image: item?.image };
            })
            .sort((a, b) => b.avg - a.avg || b.count - a.count)
            .slice(0, 5);
    }, [allRatings, tabItemIds, allItems]);

    const topWatchlistedFiltered = useMemo(() => {
        const wlInTab = allWatchlist.filter(w => tabItemIds.has(w.item_id));
        if (!wlInTab.length) return [];
        const wlCount = {};
        wlInTab.forEach(w => { wlCount[w.item_id] = (wlCount[w.item_id] || 0) + 1; });
        return Object.entries(wlCount)
            .map(([id, count]) => {
                const item = allItems.find(i => i.id === parseInt(id));
                return { id: parseInt(id), count, title: item?.title || `#${id}`, image: item?.image };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [allWatchlist, tabItemIds, allItems]);

    const activeColor = CATEGORY_KEYS.find(c => c.key === activeTab)?.color || '#8b5cf6';
    const CATEGORIES = CATEGORY_KEYS.map(c => ({ ...c, label: t(c.tKey) }));

    if (loading || catalogLoading) {
        return <div className="admin-loading"><div className="loading-spinner"></div><span>{t('loading')}</span></div>;
    }

    return (
        <div>
            <div className="admin-page-header">
                <h1>{t('admin_dashboard')}</h1>
                <p>{t('admin_dashboard_desc')}</p>
            </div>

            {/* Stat Cards */}
            <div className="admin-stats-grid">
                <div className="admin-stat-card">
                    <div className="admin-stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    </div>
                    <div className="admin-stat-value">{stats.users}</div>
                    <div className="admin-stat-label">{t('admin_stat_users')}</div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/></svg>
                    </div>
                    <div className="admin-stat-value">{stats.items}</div>
                    <div className="admin-stat-label">{t('admin_stat_content')}</div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div className="admin-stat-value">{stats.reviews}</div>
                    <div className="admin-stat-label">{t('admin_stat_reviews')}</div>
                </div>
            </div>

            {/* Top row: pie chart + category tabs */}
            <div className="admin-grid-2" style={{ marginBottom: 0 }}>
                <div className="admin-top-list" style={{ padding: '20px' }}>
                    <div className="admin-top-list-title" style={{ padding: '0 0 16px 0', border: 'none' }}>{t('dash_content_by_cat')}</div>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={catData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                    {catData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '8px' }}>
                        {catData.map((entry, i) => (
                            <span key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                                {entry.name}: <strong style={{ color: 'var(--text-primary)' }}>{entry.value}</strong>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Category filter tabs — affects bottom 3 sections */}
                <div className="admin-top-list" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                    <div className="admin-top-list-title" style={{ padding: '0 0 16px 0', border: 'none' }}>{t('dash_cat_filter')}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
                        {CATEGORIES.map(cat => (
                            <button key={cat.key}
                                onClick={() => setActiveTab(cat.key)}
                                style={{
                                    padding: '14px 20px',
                                    borderRadius: '12px',
                                    border: `1px solid ${activeTab === cat.key ? cat.color : 'var(--glass-border)'}`,
                                    background: activeTab === cat.key ? `${cat.color}18` : 'var(--hover-bg)',
                                    color: activeTab === cat.key ? cat.color : 'var(--text-secondary)',
                                    fontWeight: activeTab === cat.key ? 700 : 500,
                                    fontSize: '0.92rem',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    textAlign: 'left',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                }}
                            >
                                {cat.label}
                                <span style={{ marginLeft: 'auto', fontSize: '0.78rem', opacity: 0.7 }}>
                                    {allItems.filter(i => i.category === cat.key).length} {t('dash_items_count')}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom section label */}
            <div style={{ margin: '28px 0 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 4, height: 20, borderRadius: 2, background: activeColor }} />
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {t('dash_stats_for')} {CATEGORIES.find(c => c.key === activeTab)?.label || activeTab}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginLeft: 4 }}>
                    ({allItems.filter(i => i.category === activeTab).length} {t('dash_records')})
                </span>
            </div>

            <div className="admin-grid-2">
                {/* Rating Distribution for selected category */}
                <div className="admin-top-list" style={{ padding: '20px' }}>
                    <div className="admin-top-list-title" style={{ padding: '0 0 16px 0', border: 'none' }}>{t('dash_rating_dist')}</div>
                    <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer>
                            <BarChart data={rateDataFiltered} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'var(--hover-bg)' }} contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: '#fff' }} />
                                <Bar dataKey="value" fill={activeColor} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Rated for selected category */}
                <div className="admin-top-list">
                    <div className="admin-top-list-title">
                        <StarIcon size={16} /> {t('admin_top_rated')}
                    </div>
                    {topRatedFiltered.length > 0 ? topRatedFiltered.map((item, i) => (
                        <div key={item.id} className="admin-top-item">
                            <span className="admin-top-rank">#{i + 1}</span>
                            {item.image && <img src={item.image} alt="" className="admin-top-poster" />}
                            <div className="admin-top-info">
                                <div className="admin-top-name">{item.title}</div>
                                <div className="admin-top-meta">{item.count} {t('admin_reviews_count')}</div>
                            </div>
                            <div className="admin-top-rating">
                                <StarIcon size={14} /> {item.avg.toFixed(1)}
                            </div>
                        </div>
                    )) : (
                        <div className="admin-empty"><p>{t('admin_no_data')}</p></div>
                    )}
                </div>

                {/* Top Watchlisted for selected category */}
                <div className="admin-top-list" style={{ gridColumn: '1 / -1' }}>
                    <div className="admin-top-list-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        {t('admin_top_watchlisted')}
                    </div>
                    {topWatchlistedFiltered.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {topWatchlistedFiltered.map((item, i) => (
                                <div key={item.id} className="admin-top-item">
                                    <span className="admin-top-rank">#{i + 1}</span>
                                    {item.image && <img src={item.image} alt="" className="admin-top-poster" />}
                                    <div className="admin-top-info">
                                        <div className="admin-top-name">{item.title}</div>
                                        <div className="admin-top-meta">{item.count} {t('admin_saves')}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="admin-empty"><p>{t('admin_no_data')}</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
