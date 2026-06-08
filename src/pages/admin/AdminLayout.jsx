import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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
    const [role, setRole] = useState(null); // null=loading, 'admin', 'manager', 'none'
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();

    useEffect(() => {
        const checkRole = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate("/login"); return; }

            const { data } = await supabase
                .from("profiles")
                .select("is_admin, is_manager")
                .eq("id", session.user.id)
                .maybeSingle();

            if (data?.is_admin) {
                setRole('admin');
            } else if (data?.is_manager) {
                setRole('manager');
            } else {
                setRole('none');
            }
        };
        checkRole();
    }, [navigate]);

    if (role === null) {
        return (
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <span>{t('loading')}</span>
            </div>
        );
    }

    if (role === 'none') {
        return (
            <div className="admin-denied">
                <IconShield />
                <h2>{t('admin_access_denied')}</h2>
                <p>{t('admin_access_denied_desc')}</p>
                <button className="admin-btn admin-btn-primary" onClick={() => navigate("/")}>{t('back_to_home')}</button>
            </div>
        );
    }

    const isAdmin = role === 'admin';
    const isManager = role === 'manager';

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <p className="admin-sidebar-title">
                    {isAdmin ? t('admin_panel') : t('manager_panel')}
                </p>

                {/* Dashboard — admin only */}
                {isAdmin && (
                    <NavLink to="/admin" end className={({isActive}) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                        <IconDashboard /> {t('admin_dashboard')}
                    </NavLink>
                )}

                {/* Users — admin only */}
                {isAdmin && (
                    <NavLink to="/admin/users" className={({isActive}) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                        <IconUsers /> {t('admin_users')}
                    </NavLink>
                )}

                {/* Content — manager only (and admin too, for full access) */}
                {(isManager || isAdmin) && (
                    <NavLink to="/admin/content" className={({isActive}) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                        <IconContent /> {t('admin_content')}
                    </NavLink>
                )}

                {/* Reviews — manager only (and admin too) */}
                {(isManager || isAdmin) && (
                    <NavLink to="/admin/reviews" className={({isActive}) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                        <IconReviews /> {t('admin_reviews')}
                    </NavLink>
                )}
            </aside>
            <main className="admin-main">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        style={{ willChange: "opacity" }}
                    >
                        <Outlet context={{ role }} />
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default AdminLayout;
