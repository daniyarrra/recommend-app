import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { useLanguage } from "../../context/LanguageContext";
import { useCatalog } from "../../hooks/useCatalog";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

const StarIcon = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
);

const AdminDashboard = () => {
    const { t, language } = useLanguage();
    const { data: allItems = [], isLoading: catalogLoading } = useCatalog(language);
    const [stats, setStats] = useState({ users: 0, items: 0, reviews: 0, avgRating: 0 });
    const [topRated, setTopRated] = useState([]);
    const [topWatchlisted, setTopWatchlisted] = useState([]);
    const [catData, setCatData] = useState([]);
    const [rateData, setRateData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (catalogLoading) {
            return;
        }

        const fetchStats = async () => {
            try {
                const { count: usersCount } = await supabase
                    .from("profiles").select("*", { count: "exact", head: true });

                const { data: allRatings, count: reviewsCount } = await supabase
                    .from("ratings").select("rating, item_id", { count: "exact" });

                let avg = 0;
                if (allRatings && allRatings.length > 0) {
                    avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
                }

                setStats({
                    users: usersCount || 0,
                    items: allItems.length,
                    reviews: reviewsCount || 0,
                    avgRating: avg.toFixed(1)
                });

                // Category distribution
                const catDist = {};
                allItems.forEach(i => {
                    catDist[i.category] = (catDist[i.category] || 0) + 1;
                });
                setCatData(Object.entries(catDist).map(([name, value]) => ({ name, value })));

                // Rating distribution
                const rateDist = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
                if (allRatings) {
                    allRatings.forEach(r => {
                        rateDist[r.rating] = (rateDist[r.rating] || 0) + 1;
                    });
                }
                setRateData(Object.entries(rateDist).map(([name, value]) => ({ name: `${name} ★`, value })).reverse());

                // Top rated: aggregate by item_id
                if (allRatings && allRatings.length > 0) {
                    const itemRatings = {};
                    allRatings.forEach(r => {
                        if (!itemRatings[r.item_id]) itemRatings[r.item_id] = { sum: 0, count: 0 };
                        itemRatings[r.item_id].sum += r.rating;
                        itemRatings[r.item_id].count += 1;
                    });

                    const sorted = Object.entries(itemRatings)
                        .map(([id, v]) => ({ id: parseInt(id), avg: v.sum / v.count, count: v.count }))
                        .sort((a, b) => b.avg - a.avg || b.count - a.count)
                        .slice(0, 5);

                    const enriched = sorted.map(r => {
                        const item = allItems.find(i => i.id === r.id);
                        return { ...r, title: item?.title || `#${r.id}`, image: item?.image, category: item?.category };
                    });
                    setTopRated(enriched);
                }

                // Top watchlisted
                const { data: watchlistData } = await supabase
                    .from("watchlist").select("item_id");
                if (watchlistData && watchlistData.length > 0) {
                    const wlCount = {};
                    watchlistData.forEach(w => { wlCount[w.item_id] = (wlCount[w.item_id] || 0) + 1; });
                    const sortedWl = Object.entries(wlCount)
                        .map(([id, count]) => ({ id: parseInt(id), count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5);
                    const enrichedWl = sortedWl.map(r => {
                        const item = allItems.find(i => i.id === r.id);
                        return { ...r, title: item?.title || `#${r.id}`, image: item?.image };
                    });
                    setTopWatchlisted(enrichedWl);
                }
            } catch (err) {
                console.error("Stats error:", err);
            }
            setLoading(false);
        };
        fetchStats();
    }, [allItems, catalogLoading]);

    if (loading || catalogLoading) {
        return <div className="admin-loading"><div className="loading-spinner"></div><span>{t('loading')}</span></div>;
    }

    return (
        <div>
            <div className="admin-page-header">
                <h1>{t('admin_dashboard')}</h1>
                <p>{t('admin_dashboard_desc')}</p>
            </div>

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
                <div className="admin-stat-card">
                    <div className="admin-stat-icon">
                        <StarIcon size={20} />
                    </div>
                    <div className="admin-stat-value">{stats.avgRating}</div>
                    <div className="admin-stat-label">{t('admin_stat_avg_rating')}</div>
                </div>
            </div>

            <div className="admin-grid-2">
                <div className="admin-top-list" style={{ padding: '20px' }}>
                    <div className="admin-top-list-title" style={{ padding: '0 0 16px 0', border: 'none' }}>Контент по категориям</div>
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
                </div>

                <div className="admin-top-list" style={{ padding: '20px' }}>
                    <div className="admin-top-list-title" style={{ padding: '0 0 16px 0', border: 'none' }}>Распределение оценок</div>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart data={rateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'var(--hover-bg)' }} contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: '#fff' }} />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Rated */}
                <div className="admin-top-list">
                    <div className="admin-top-list-title">
                        <StarIcon size={16} /> {t('admin_top_rated')}
                    </div>
                    {topRated.length > 0 ? topRated.map((item, i) => (
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

                {/* Top Watchlisted */}
                <div className="admin-top-list">
                    <div className="admin-top-list-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                        {t('admin_top_watchlisted')}
                    </div>
                    {topWatchlisted.length > 0 ? topWatchlisted.map((item, i) => (
                        <div key={item.id} className="admin-top-item">
                            <span className="admin-top-rank">#{i + 1}</span>
                            {item.image && <img src={item.image} alt="" className="admin-top-poster" />}
                            <div className="admin-top-info">
                                <div className="admin-top-name">{item.title}</div>
                                <div className="admin-top-meta">{item.count} {t('admin_saves')}</div>
                            </div>
                        </div>
                    )) : (
                        <div className="admin-empty"><p>{t('admin_no_data')}</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
