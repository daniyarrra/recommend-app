import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { useLanguage } from "../../context/LanguageContext";

const AdminUsers = () => {
    const { t } = useLanguage();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [confirmAction, setConfirmAction] = useState(null); // { type, user }

    const fetchUsers = async () => {
        try {
            // Try full query first; if columns don't exist, fall back to basic
            let data = null;
            let res = await supabase
                .from("profiles")
                .select("id, email, is_admin, is_banned, avatar_url, created_at")
                .order("created_at", { ascending: false });

            if (res.error) {
                // Fallback: columns is_banned/created_at may not exist yet
                console.warn("Full query failed, trying basic columns:", res.error.message);
                res = await supabase
                    .from("profiles")
                    .select("id, email, is_admin, avatar_url");
                data = (res.data || []).map(u => ({ ...u, is_banned: false, created_at: null }));
            } else {
                data = res.data || [];
            }

            // Get review counts per user
            const { data: ratings } = await supabase.from("ratings").select("user_id");
            const reviewCounts = {};
            (ratings || []).forEach(r => { reviewCounts[r.user_id] = (reviewCounts[r.user_id] || 0) + 1; });

            const enriched = data.map(u => ({ ...u, reviewCount: reviewCounts[u.id] || 0 }));
            setUsers(enriched);
        } catch (err) {
            console.error("Error fetching users:", err);
        }
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleBan = async (user) => {
        const newVal = !user.is_banned;
        const { error } = await supabase.rpc('admin_set_ban', { target_uid: user.id, ban_status: newVal });
        if (!error) {
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_banned: newVal } : u));
        } else {
            console.error("Ban error:", error);
            alert("Ошибка при изменении статуса блокировки");
        }
        setConfirmAction(null);
    };

    const handleToggleAdmin = async (user) => {
        const newVal = !user.is_admin;
        const { error } = await supabase.rpc('admin_set_role', { target_uid: user.id, make_admin: newVal });
        if (!error) {
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_admin: newVal } : u));
        } else {
            console.error("Role error:", error);
            alert("Ошибка при изменении роли");
        }
        setConfirmAction(null);
    };

    const handleDelete = async (user) => {
        const { error } = await supabase.rpc('admin_delete_user', { target_uid: user.id });
        if (!error) {
            setUsers(prev => prev.filter(u => u.id !== user.id));
        } else {
            console.error("Delete user error:", error);
            alert("Ошибка при удалении пользователя");
        }
        setConfirmAction(null);
    };

    const filtered = users.filter(u =>
        (u.email || "").toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="admin-loading"><div className="loading-spinner"></div><span>{t('loading')}</span></div>;
    }

    return (
        <div>
            <div className="admin-page-header">
                <h1>{t('admin_users')}</h1>
                <p>{t('admin_users_desc')}</p>
            </div>

            <div className="admin-table-container">
                <div className="admin-table-toolbar">
                    <div className="admin-search">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input
                            placeholder={t('admin_search_users')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {filtered.length} {t('admin_users_total')}
                    </span>
                </div>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>{t('admin_col_user')}</th>
                            <th>{t('admin_col_reviews')}</th>
                            <th>{t('admin_col_status')}</th>
                            <th>{t('admin_col_role')}</th>
                            <th>{t('admin_col_registered')}</th>
                            <th>{t('admin_col_actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div className="admin-user-cell">
                                        <img
                                            src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`}
                                            alt="" className="admin-user-avatar"
                                        />
                                        <span>{user.email}</span>
                                    </div>
                                </td>
                                <td>{user.reviewCount}</td>
                                <td>
                                    {user.is_banned
                                        ? <span className="admin-badge admin-badge-banned">{t('admin_banned')}</span>
                                        : <span className="admin-badge admin-badge-active">{t('admin_active')}</span>
                                    }
                                </td>
                                <td>
                                    {user.is_admin && <span className="admin-badge admin-badge-admin">{t('admin_role_admin')}</span>}
                                </td>
                                <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                                </td>
                                <td>
                                    <div className="admin-actions">
                                        <button
                                            className={`admin-btn admin-btn-sm ${user.is_banned ? 'admin-btn-ghost' : 'admin-btn-danger'}`}
                                            onClick={() => setConfirmAction({ type: 'ban', user })}
                                        >
                                            {user.is_banned ? t('admin_unban') : t('admin_ban')}
                                        </button>
                                        <button
                                            className="admin-btn admin-btn-sm admin-btn-ghost"
                                            onClick={() => setConfirmAction({ type: 'role', user })}
                                        >
                                            {user.is_admin ? t('admin_remove_admin') : t('admin_make_admin')}
                                        </button>
                                        <button
                                            className="admin-btn admin-btn-sm admin-btn-danger"
                                            onClick={() => setConfirmAction({ type: 'delete', user })}
                                        >
                                            {t('delete_btn')}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filtered.length === 0 && (
                    <div className="admin-empty"><p>{t('admin_no_users')}</p></div>
                )}
            </div>

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="admin-modal-overlay" onClick={() => setConfirmAction(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <h2>{t('admin_confirm_title')}</h2>
                        <p>
                            {confirmAction.type === 'ban' && (confirmAction.user.is_banned
                                ? t('admin_confirm_unban') : t('admin_confirm_ban'))}
                            {confirmAction.type === 'role' && (confirmAction.user.is_admin
                                ? t('admin_confirm_remove_admin') : t('admin_confirm_make_admin'))}
                            {confirmAction.type === 'delete' && t('admin_confirm_delete_user')}
                            <br/><strong>{confirmAction.user.email}</strong>
                        </p>
                        <div className="admin-modal-actions">
                            <button className="admin-btn admin-btn-ghost" onClick={() => setConfirmAction(null)}>
                                {t('admin_cancel')}
                            </button>
                            <button
                                className={`admin-btn ${confirmAction.type === 'delete' ? 'admin-btn-danger' : 'admin-btn-primary'}`}
                                onClick={() => {
                                    if (confirmAction.type === 'ban') handleBan(confirmAction.user);
                                    if (confirmAction.type === 'role') handleToggleAdmin(confirmAction.user);
                                    if (confirmAction.type === 'delete') handleDelete(confirmAction.user);
                                }}
                            >
                                {t('admin_confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
