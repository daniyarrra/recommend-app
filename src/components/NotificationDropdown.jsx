import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import { motion } from "framer-motion";

const NotificationDropdown = ({ user, onClose, onRead }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const { data, error } = await supabase
                    .from("notifications")
                    .select("id, type, is_read, created_at, actor_id")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(20);
                
                if (error) throw error;

                if (data && data.length > 0) {
                    // Fetch profiles for the actors
                    const actorIds = [...new Set(data.map(n => n.actor_id))];
                    const { data: profiles } = await supabase
                        .from("profiles")
                        .select("id, email, avatar_url")
                        .in("id", actorIds);
                    
                    const profileMap = {};
                    if (profiles) {
                        profiles.forEach(p => profileMap[p.id] = p);
                    }

                    const formattedData = data.map(n => ({
                        ...n,
                        actors: profileMap[n.actor_id] || { email: "Unknown" }
                    }));

                    setNotifications(formattedData);
                } else {
                    setNotifications([]);
                }

                // Mark all as read
                const unreadIds = data?.filter(n => !n.is_read).map(n => n.id) || [];
                if (unreadIds.length > 0) {
                    await supabase
                        .from("notifications")
                        .update({ is_read: true })
                        .in("id", unreadIds);
                    
                    if (onRead) onRead(); // update badge in navbar
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifs();
    }, [user, onRead]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <motion.div 
            ref={dropdownRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
                position: 'absolute',
                top: 'calc(100% + 15px)',
                right: '0',
                width: '320px',
                maxHeight: '400px',
                overflowY: 'auto',
                background: 'var(--surface-heavy)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                boxShadow: 'var(--glass-shadow)',
                zIndex: 1000,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Уведомления</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Загрузка...</div>
            ) : notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>У вас пока нет уведомлений.</div>
            ) : (
                notifications.map(n => (
                    <div key={n.id} style={{ 
                        padding: '12px', background: 'var(--hover-bg)', 
                        borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px',
                        opacity: n.is_read ? 0.7 : 1
                    }}>
                        <img 
                            src={n.actors?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${n.actors?.email}&backgroundColor=3b82f6`} 
                            alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%' }} 
                        />
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 4px 0', color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: '1.3' }}>
                                <Link 
                                    to={`/user/${n.actor_id}`} 
                                    onClick={onClose}
                                    style={{ color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 'bold' }}
                                >
                                    {(n.actors?.email && n.actors.email !== 'Unknown' ? n.actors.email.split('@')[0] : 'Пользователь')}
                                </Link> 
                                {n.type === 'like' ? ' оценил(а) ваш отзыв! ❤️' : ' подписался на вас!'}
                            </p>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {new Date(n.created_at).toLocaleString([], {hour: '2-digit', minute:'2-digit', day: '2-digit', month: 'short'})}
                            </span>
                        </div>
                    </div>
                ))
            )}
        </motion.div>
    );
};

export default NotificationDropdown;
