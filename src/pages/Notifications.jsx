import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import PageTransition from "../components/PageTransition";

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifs = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            try {
                const { data } = await supabase
                    .from("notifications")
                    .select(`
                        id, type, is_read, created_at,
                        actors:actor_id ( email, avatar_url )
                    `)
                    .eq("user_id", session.user.id)
                    .order("created_at", { ascending: false })
                    .limit(50);
                
                if (data) setNotifications(data);

                // Mark all as read
                await supabase
                    .from("notifications")
                    .update({ is_read: true })
                    .eq("user_id", session.user.id)
                    .eq("is_read", false);
                    
            } catch (e) {
                // ignore
            } finally {
                setLoading(false);
            }
        };
        fetchNotifs();
    }, []);

    if (loading) return <div className="container" style={{padding: '40px'}}><div className="loading-spinner"></div></div>;

    return (
        <PageTransition>
            <div className="container" style={{ paddingTop: '40px', maxWidth: '600px' }}>
                <h1 style={{ marginBottom: '24px' }}>Уведомления</h1>
                {notifications.length === 0 ? (
                    <div className="empty-state">У вас пока нет новых уведомлений.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {notifications.map(n => (
                            <div key={n.id} style={{ 
                                padding: '16px', background: 'var(--hover-bg)', 
                                borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px',
                                opacity: n.is_read ? 0.7 : 1
                            }}>
                                <img 
                                    src={n.actors?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${n.actors?.email}&backgroundColor=3b82f6`} 
                                    alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} 
                                />
                                <div>
                                    <p style={{ margin: 0, color: 'var(--text-primary)' }}>
                                        <strong style={{ color: 'var(--accent-light)' }}>{n.actors?.email?.split('@')[0]}</strong> 
                                        {n.type === 'like' && ' оценил(а) ваш отзыв! ❤️'}
                                    </p>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {new Date(n.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default Notifications;
