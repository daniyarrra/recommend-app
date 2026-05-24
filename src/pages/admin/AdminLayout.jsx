import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { useLanguage } from "../../context/LanguageContext";
import "../../styles/admin.css";

/* SVG Icons for sidebar */
const IconDashboard = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
);
const IconUsers = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);
const IconContent = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
        <line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
    </svg>
);
const IconReviews = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
);
const IconShield = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
);

const AdminLayout = () => {
    const [isAdmin, setIsAdmin] = useState(null); // null = loading
    const navigate = useNavigate();
    const { t } = useLanguage();

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate("/login"); return; }

            const { data } = await supabase
                .from("profiles")
                .select("is_admin")
                .eq("id", session.user.id)
                .maybeSingle();

            if (data?.is_admin) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        };
        checkAdmin();
    }, [navigate]);

    if (isAdmin === null) {
        return (
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <span>{t('loading')}</span>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="admin-denied">
                <IconShield />
                <h2>{t('admin_access_denied')}</h2>
                <p>{t('admin_access_denied_desc')}</p>
                <button className="admin-btn admin-btn-primary" onClick={() => navigate("/")}>{t('back_to_home')}</button>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <p className="admin-sidebar-title">{t('admin_panel')}</p>
                <NavLink to="/admin" end className={({isActive}) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                    <IconDashboard /> {t('admin_dashboard')}
                </NavLink>
                <NavLink to="/admin/users" className={({isActive}) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                    <IconUsers /> {t('admin_users')}
                </NavLink>
                <NavLink to="/admin/content" className={({isActive}) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                    <IconContent /> {t('admin_content')}
                </NavLink>
                <NavLink to="/admin/reviews" className={({isActive}) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                    <IconReviews /> {t('admin_reviews')}
                </NavLink>
            </aside>
            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
