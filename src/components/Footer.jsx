import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import "../styles/footer.css";

const Footer = () => {
    const { t } = useLanguage();

    return (
        <footer className="footer">
            <div className="container footer-container">
                <div className="footer-content">
                    <div className="footer-brand">
                        <svg className="footer-logo-svg" width="120" height="28" viewBox="0 0 160 36" fill="none">
                            <defs>
                                <linearGradient id="logoGradFooter" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#60a5fa"/>
                                    <stop offset="100%" stopColor="#a855f7"/>
                                </linearGradient>
                                <linearGradient id="textGradFooter" x1="40" y1="0" x2="160" y2="36" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#60a5fa"/>
                                    <stop offset="50%" stopColor="#818cf8"/>
                                    <stop offset="100%" stopColor="#a855f7"/>
                                </linearGradient>
                            </defs>
                            <rect x="1" y="2" width="32" height="32" rx="8" fill="url(#logoGradFooter)" opacity="0.15"/>
                            <rect x="1" y="2" width="32" height="32" rx="8" stroke="url(#logoGradFooter)" strokeWidth="2" fill="none"/>
                            <polygon points="14,10 14,26 26,18" fill="url(#logoGradFooter)"/>
                            <text x="40" y="25" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="20" fill="url(#textGradFooter)">
                                RecMedia
                            </text>
                        </svg>
                        <p className="footer-desc">{t('footer_desc') || 'Your ultimate destination for discovering the best movies, books, and music tailored to your taste.'}</p>
                    </div>
                    
                    <div className="footer-links-group">
                        <h4 className="footer-heading">Explore</h4>
                        <Link to="/" className="footer-link">{t('nav_movies') || 'Movies'}</Link>
                        <Link to="/books" className="footer-link">{t('nav_books') || 'Books'}</Link>
                        <Link to="/music" className="footer-link">{t('nav_music') || 'Music'}</Link>
                        <Link to="/recommend" className="footer-link">{t('nav_recommend') || 'Recommendations'}</Link>
                    </div>

                    <div className="footer-links-group">
                        <h4 className="footer-heading">Account</h4>
                        <Link to="/profile" className="footer-link">{t('nav_profile') || 'Profile'}</Link>
                        <Link to="/login" className="footer-link">{t('nav_login') || 'Login'}</Link>
                        <Link to="/register" className="footer-link">{t('nav_register') || 'Register'}</Link>
                    </div>

                    <div className="footer-links-group">
                        <h4 className="footer-heading">Connect</h4>
                        <div className="social-links">
                            <a href="https://www.instagram.com/don4ika/" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Instagram">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                            </a>
                            <a href="https://t.me/qwdon" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Telegram">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </a>
                            <a href="mailto:topdaniar@gmail.com" className="social-icon" aria-label="Email">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} RecMedia. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
