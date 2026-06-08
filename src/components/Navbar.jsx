import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useLanguage } from "../context/LanguageContext";
import { AnimatePresence } from "framer-motion";
import NotificationDropdown from "./NotificationDropdown";
import "../styles/navbar.css";

/* ── SVG Icon Components ── */
const IconMovies = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
        <line x1="7" y1="2" x2="7" y2="22"/>
        <line x1="17" y1="2" x2="17" y2="22"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <line x1="2" y1="7" x2="7" y2="7"/>
        <line x1="2" y1="17" x2="7" y2="17"/>
        <line x1="17" y1="7" x2="22" y2="7"/>
        <line x1="17" y1="17" x2="22" y2="17"/>
    </svg>
);

const IconBooks = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        <line x1="8" y1="7" x2="16" y2="7"/>
        <line x1="8" y1="11" x2="13" y2="11"/>
    </svg>
);

const IconMusic = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
    </svg>
);

const IconRecommend = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
);

const IconProfile = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
    </svg>
);

const IconLogout = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
);

const IconLogin = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <polyline points="10 17 15 12 10 7"/>
        <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
);

const IconRegister = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="8.5" cy="7" r="4"/>
        <line x1="20" y1="8" x2="20" y2="14"/>
        <line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
);

const IconBell = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
);

const IconAdmin = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
);

const IconSun = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
);

const IconMoon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
);

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [theme, setTheme] = useState(document.documentElement.getAttribute("data-theme") || "dark");
    const { t, language, setLanguage } = useLanguage();

    useEffect(() => {
        const checkSession = async (session) => {
            setUser(session?.user || null);
            if (session?.user) {
                const { data } = await supabase
                    .from("profiles")
                    .select("is_admin, is_manager")
                    .eq("id", session.user.id)
                    .maybeSingle();
                setIsAdmin(data?.is_admin || false);
                setIsManager(data?.is_manager || false);

                // Fetch unread notifications
                try {
                    const { count } = await supabase
                        .from("notifications")
                        .select("*", { count: 'exact', head: true })
                        .eq("user_id", session.user.id)
                        .eq("is_read", false);
                    setUnreadCount(count || 0);
                } catch(e) {}
            } else {
                setIsAdmin(false);
                setIsManager(false);
                setUnreadCount(0);
            }
        };

        supabase.auth.getSession().then(({ data: { session } }) => checkSession(session));

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            checkSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "data-theme") {
                    setTheme(document.documentElement.getAttribute("data-theme"));
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('app-theme', newTheme);
        setTheme(newTheme);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src="/logo.png" alt="RecMedia Logo" style={{ height: '36px', width: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: '20px', background: 'linear-gradient(to right, #60a5fa, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            RecMedia
                        </span>
                    </div>
                </Link>

                <div className="navbar-links">
                    <Link to="/" className={location.pathname === "/" ? "nav-link active" : "nav-link"}>
                        <IconMovies />
                        <span>{t('nav_movies')}</span>
                    </Link>
                    <Link to="/books" className={location.pathname === "/books" ? "nav-link active" : "nav-link"}>
                        <IconBooks />
                        <span>{t('nav_books')}</span>
                    </Link>
                    <Link to="/music" className={location.pathname === "/music" ? "nav-link active" : "nav-link"}>
                        <IconMusic />
                        <span>{t('nav_music')}</span>
                    </Link>
                    <Link to="/recommend" className={location.pathname === "/recommend" ? "nav-link active" : "nav-link"}>
                        <IconRecommend />
                        <span>{t('nav_recommend')}</span>
                    </Link>
                </div>

                <div className="navbar-auth">
                    {user ? (
                        <>
                            {(isAdmin || isManager) && (
                                <Link to="/admin" className={location.pathname.startsWith('/admin') ? 'nav-btn nav-btn-outline active' : 'nav-btn nav-btn-outline'}
                                    style={{ borderColor: isAdmin ? 'rgba(139, 92, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)', color: isAdmin ? '#a78bfa' : '#34d399' }}>
                                    <IconAdmin />
                                    <span>{isAdmin ? t('nav_admin') : t('nav_manager')}</span>
                                </Link>
                            )}
                            <select 
                                value={language} 
                                onChange={(e) => setLanguage(e.target.value)}
                                className="nav-lang-select"
                                style={{ marginLeft: 'auto' }}
                                title={t('language')}
                            >
                                <option value="ru">RU</option>
                                <option value="en">EN</option>
                                <option value="kz">KZ</option>
                            </select>
                            <button onClick={toggleTheme} className="nav-btn-icon" title="Toggle Theme">
                                {theme === 'dark' ? <IconSun /> : <IconMoon />}
                            </button>
                            <div style={{ position: 'relative' }}>
                                <button onClick={() => setShowNotifications(true)} className="nav-btn-icon" style={{ position: 'relative' }}>
                                    <IconBell />
                                    {unreadCount > 0 && (
                                        <span style={{ 
                                            position: 'absolute', top: '0', right: '0', 
                                            background: '#ef4444', color: 'white', 
                                            fontSize: '0.65rem', fontWeight: 'bold',
                                            width: '16px', height: '16px', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            borderRadius: '50%', border: '2px solid var(--bg-color)'
                                        }}>
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>
                                <AnimatePresence>
                                    {showNotifications && (
                                        <NotificationDropdown 
                                            user={user} 
                                            onClose={() => setShowNotifications(false)} 
                                            onRead={() => setUnreadCount(0)} 
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                            <Link to="/profile" className="nav-btn nav-btn-outline">
                                <IconProfile />
                                <span>{t('nav_profile')}</span>
                            </Link>
                            <button onClick={handleLogout} className="nav-btn nav-btn-primary" style={{ border: 'none', fontFamily: 'inherit' }}>
                                <IconLogout />
                                <span>{t('nav_logout')}</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <select 
                                value={language} 
                                onChange={(e) => setLanguage(e.target.value)}
                                className="nav-lang-select"
                                style={{ marginLeft: 'auto' }}
                                title={t('language')}
                            >
                                <option value="ru">RU</option>
                                <option value="en">EN</option>
                                <option value="kz">KZ</option>
                            </select>
                            <button onClick={toggleTheme} className="nav-btn-icon" title="Toggle Theme">
                                {theme === 'dark' ? <IconSun /> : <IconMoon />}
                            </button>
                            <Link to="/login" className="nav-btn nav-btn-outline">
                                <IconLogin />
                                <span>{t('nav_login')}</span>
                            </Link>
                            <Link to="/register" className="nav-btn nav-btn-primary">
                                <IconRegister />
                                <span>{t('nav_register')}</span>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
