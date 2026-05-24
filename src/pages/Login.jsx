import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useLanguage } from "../context/LanguageContext";
import "../styles/auth.css";

const Login = () => {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
                    <input 
                        type="password" 
                        className="auth-input"
                        placeholder={t('password_placeholder')} 
                        onChange={e => setPassword(e.target.value)} 
                        required
                    />
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