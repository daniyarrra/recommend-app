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
    const [pwdError, setPwdError] = useState("");
    const navigate = useNavigate();

    // Password strength: 0–4
    const getStrength = (pwd) => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return Math.min(score, 4);
    };

    const strength = getStrength(password);

    const strengthLabels = [
        t('pwd_very_weak'),
        t('pwd_weak'),
        t('pwd_fair'),
        t('pwd_strong'),
        t('pwd_very_strong'),
    ];
    const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];

    // Only English letters, digits, and special characters allowed
    const isLatinOnly = (str) => /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~ ]*$/.test(str);

    const handlePasswordChange = (e) => {
        const val = e.target.value;
        setPassword(val);
        if (val.length > 0 && !isLatinOnly(val)) {
            setPwdError(t('pwd_latin_only'));
        } else if (val.length > 0 && val.length < 8) {
            setPwdError(t('pwd_min_8'));
        } else {
            setPwdError("");
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!isLatinOnly(password)) {
            setPwdError(t('pwd_latin_only'));
            return;
        }
        if (password.length < 8) {
            setPwdError(t('pwd_min_8'));
            return;
        }

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

                    {/* Password field + strength indicator */}
                    <div>
                        <input 
                            type="password" 
                            className="auth-input"
                            placeholder={t('password_hint')} 
                            value={password}
                            onChange={handlePasswordChange}
                            required
                            minLength={8}
                            style={{ width: "100%", boxSizing: "border-box" }}
                        />

                        {/* Strength bar — shown only when user starts typing */}
                        {password.length > 0 && (
                            <div style={{ marginTop: "8px" }}>
                                <div style={{
                                    display: "flex",
                                    gap: "4px",
                                    height: "4px",
                                    borderRadius: "4px",
                                    overflow: "hidden"
                                }}>
                                    {[1, 2, 3, 4].map(i => (
                                        <div
                                            key={i}
                                            style={{
                                                flex: 1,
                                                borderRadius: "4px",
                                                background: i <= strength
                                                    ? strengthColors[strength - 1]
                                                    : "var(--glass-border)",
                                                transition: "background 0.3s ease"
                                            }}
                                        />
                                    ))}
                                </div>
                                <div style={{
                                    marginTop: "4px",
                                    fontSize: "0.78rem",
                                    color: strength > 0 ? strengthColors[strength - 1] : "var(--text-secondary)",
                                    transition: "color 0.3s ease"
                                }}>
                                    {strength > 0 ? strengthLabels[strength - 1] : ""}
                                </div>
                            </div>
                        )}

                        {/* Error message if < 8 chars */}
                        {pwdError && (
                            <div style={{
                                marginTop: "6px",
                                background: "rgba(239,68,68,0.1)",
                                border: "1px solid rgba(239,68,68,0.3)",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                color: "#f87171",
                                fontSize: "0.82rem"
                            }}>
                                {pwdError}
                            </div>
                        )}
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading || password.length < 8}>
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