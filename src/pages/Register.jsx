import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useLanguage } from "../context/LanguageContext";
import "../styles/auth.css";

const Register = () => {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [nickname, setNickname] = useState("");
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
                options: {
                    data: {
                        nickname: nickname
                    }
                }
            });
            
            if (error) throw error;
            
            // Immediately create public profile with nickname
            if (data?.user) {
                await supabase.from('profiles').upsert({
                    id: data.user.id,
                    email: email,
                    nickname: nickname,
                    is_public: true,
                    avatar_url: null,
                    bio: ''
                });
            }
            
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
                        type="text"
                        className="auth-input"
                        placeholder={t('nickname_placeholder')} 
                        onChange={e => setNickname(e.target.value)} 
                        required
                        minLength={2}
                    />
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