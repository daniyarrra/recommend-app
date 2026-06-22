import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useLanguage } from "../context/LanguageContext";
import "../styles/auth.css";

const Login = () => {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            
            if (error) throw error;
            
            console.log("Logged in successfully:", data.user);
            navigate("/");
        } catch (error) {
            console.error("Login failed", error);
            alert(t('login_error') + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2 className="auth-title">{t('login_title')}</h2>
                
                <form className="auth-form" onSubmit={handleLogin}>
                    <input 
                        type="email"
                        className="auth-input"
                        placeholder={t('email_placeholder')} 
                        onChange={e => setEmail(e.target.value)} 
                        required
                    />
                    <div style={{ position: 'relative' }}>
                        <input 
                            type={showPassword ? "text" : "password"}
                            className="auth-input"
                            placeholder={t('password_placeholder')} 
                            onChange={e => setPassword(e.target.value)} 
                            required
                            style={{ width: '100%', boxSizing: 'border-box', paddingRight: '48px' }}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)', transition: 'color 0.2s' }}
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                    <line x1="1" y1="1" x2="23" y2="23"/>
                                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            )}
                        </button>
                    </div>
                    <div style={{ textAlign: "right", marginTop: "-4px" }}>
                        <Link to="/forgot-password" className="auth-link" style={{ fontSize: "0.88rem" }}>
                            {t('forgot_password')}
                        </Link>
                    </div>
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? t('loading_btn') : t('login_btn')}
                    </button>
                </form>

                <div className="auth-footer">
                    {t('no_account')} <Link to="/register" className="auth-link">{t('register_link')}</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;