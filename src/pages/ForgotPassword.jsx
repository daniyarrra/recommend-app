import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useLanguage } from "../context/LanguageContext";
import "../styles/auth.css";

const ForgotPassword = () => {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            setSent(true);
        } catch (err) {
            setError(t("forgot_error") + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {/* Icon */}
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <div style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
                        border: "1px solid rgba(139,92,246,0.3)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px"
                    }}>
                        🔑
                    </div>
                </div>

                <h2 className="auth-title">{t("forgot_title")}</h2>
                <p className="auth-subtitle">{t("forgot_subtitle")}</p>

                {sent ? (
                    <div style={{
                        background: "rgba(34,197,94,0.1)",
                        border: "1px solid rgba(34,197,94,0.3)",
                        borderRadius: "12px",
                        padding: "20px",
                        textAlign: "center",
                        color: "#4ade80"
                    }}>
                        <div style={{ fontSize: "32px", marginBottom: "8px" }}>✉️</div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{t("forgot_sent")}</p>
                        <p style={{ margin: "8px 0 0", fontSize: "0.9rem", opacity: 0.85 }}>
                            {t("forgot_sent_desc")}
                        </p>
                    </div>
                ) : (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <input
                            type="email"
                            className="auth-input"
                            placeholder={t("email_placeholder")}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            id="forgot-email"
                        />
                        {error && (
                            <div style={{
                                background: "rgba(239,68,68,0.1)",
                                border: "1px solid rgba(239,68,68,0.3)",
                                borderRadius: "10px",
                                padding: "12px 14px",
                                color: "#f87171",
                                fontSize: "0.88rem"
                            }}>
                                {error}
                            </div>
                        )}
                        <button
                            type="submit"
                            className="auth-btn"
                            disabled={loading}
                            id="forgot-submit-btn"
                        >
                            {loading ? t("loading_btn") : t("forgot_btn")}
                        </button>
                    </form>
                )}

                <div className="auth-footer" style={{ marginTop: "24px" }}>
                    <Link to="/login" className="auth-link">
                        ← {t("back_to_login")}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
