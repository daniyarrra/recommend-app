import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useLanguage } from "../context/LanguageContext";
import "../styles/auth.css";

const Register = () => {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            
            if (error) throw error;
            
            if (data?.session) {
                navigate("/");
            } else {
                alert(t('check_email'));
                navigate("/login");
            }
        } catch (error) {
            console.error("Registration failed", error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2 className="auth-title">{t('register_title')}</h2>
                
                <form className="auth-form" onSubmit={handleRegister}>
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
                        placeholder={t('password_hint')} 
                        onChange={e => setPassword(e.target.value)} 
                        required
                        minLength={6}
                    />
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? t('loading_btn') : t('register_btn')}
                    </button>
                </form>

                <div className="auth-footer">
                    {t('has_account')} <Link to="/login" className="auth-link">{t('login_link')}</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;