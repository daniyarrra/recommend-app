import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useLanguage } from "../context/LanguageContext";
import "../styles/auth.css";

const ResetPassword = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");
    const [sessionReady, setSessionReady] = useState(false);

    // Supabase puts the session tokens in the URL hash after clicking the email link.
    // We need to wait for onAuthStateChange to fire with SIGNED_IN / PASSWORD_RECOVERY.
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
                setSessionReady(true);
            }
        });

        // Also check if there's already an active session (page reload case)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setSessionReady(true);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password.length < 6) {
            setError(t("reset_password_short"));
            return;
        }
        if (password !== confirm) {
            setError(t("reset_password_mismatch"));
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setDone(true);
            setTimeout(() => navigate("/login"), 2500);
        } catch (err) {
            setError(t("reset_error") + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!sessionReady) {
        return (
            <div className="auth-page">
                <div className="auth-card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
                    <p style={{ color: "var(--text-secondary)" }}>{t("reset_verifying")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
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
                        🔒
                    </div>
                </div>

                <h2 className="auth-title">{t("reset_title")}</h2>
                <p className="auth-subtitle">{t("reset_subtitle")}</p>

                {done ? (
                    <div style={{
                        background: "rgba(34,197,94,0.1)",
                        border: "1px solid rgba(34,197,94,0.3)",
                        borderRadius: "12px",
                        padding: "20px",
                        textAlign: "center",
                        color: "#4ade80"
                    }}>
                        <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{t("reset_success")}</p>
                        <p style={{ margin: "8px 0 0", fontSize: "0.9rem", opacity: 0.85 }}>
                            {t("reset_redirect")}
                        </p>
                    </div>
                ) : (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div style={{ position: "relative" }}>
                            <input
                                type="password"
                                className="auth-input"
                                placeholder={t("reset_new_password")}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                id="reset-password-input"
                                style={{ width: "100%", boxSizing: "border-box" }}
                            />
                        </div>
                        <input
                            type="password"
                            className="auth-input"
                            placeholder={t("reset_confirm_password")}
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                            id="reset-confirm-input"
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
                            id="reset-submit-btn"
                        >
                            {loading ? t("loading_btn") : t("reset_btn")}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
