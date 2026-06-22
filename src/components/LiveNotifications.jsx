import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../styles/live-toast.css";

const HeartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
);

const UserIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const InfoIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

const LiveNotifications = () => {
    const [toasts, setToasts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setCurrentUser(session.user);
            }
        };
        fetchUser();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setCurrentUser(session?.user || null);
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        // Subscribe to real-time changes on the notifications table
        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${currentUser.id}`
                },
                async (payload) => {
                    const newNotif = payload.new;
                    
                    // Fetch actor details to show their name
                    let actorName = "Кто-то";
                    try {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('email')
                            .eq('id', newNotif.actor_id)
                            .maybeSingle();
                        if (profile && profile.email) {
                            actorName = profile.email.split('@')[0];
                        }
                    } catch (e) {
                        console.error("Failed to fetch actor info", e);
                    }

                    let title = "Новое уведомление";
                    let message = "";
                    let type = "info";

                    if (newNotif.type === 'like') {
                        title = "Новый лайк!";
                        message = `${actorName} оценил(а) ваш отзыв.`;
                        type = "success";
                    } else if (newNotif.type === 'follow') {
                        title = "Новый подписчик!";
                        message = `${actorName} теперь подписан(а) на вас.`;
                        type = "info";
                    } else if (newNotif.type === 'reply') {
                        title = "Новый ответ!";
                        message = `${actorName} ответил(а) на ваш отзыв.`;
                        type = "info";
                    } else {
                        message = `Событие от ${actorName}`;
                    }

                    const toast = {
                        id: newNotif.id || Date.now().toString(),
                        title,
                        message,
                        type,
                        onClick: () => {
                            if ((newNotif.type === 'like' || newNotif.type === 'reply') && newNotif.entity_id) {
                                navigate(`/item/${newNotif.entity_id}`);
                            } else if (newNotif.type === 'follow') {
                                navigate(`/user/${newNotif.actor_id}`);
                            }
                        }
                    };

                    setToasts(prev => [toast, ...prev]);

                    // Auto remove after 5 seconds
                    setTimeout(() => {
                        setToasts(prev => prev.filter(t => t.id !== toast.id));
                    }, 5000);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser, navigate]);

    const removeToast = (id, e) => {
        e.stopPropagation();
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div className="live-toast-container">
            <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className={`live-toast ${toast.type}`}
                        onClick={toast.onClick}
                    >
                        <div className="toast-icon-wrapper">
                            {toast.type === 'success' ? <HeartIcon /> : toast.title.includes('подписчик') ? <UserIcon /> : <InfoIcon />}
                        </div>
                        <div className="toast-content">
                            <div className="toast-title">{toast.title}</div>
                            <div className="toast-message">{toast.message}</div>
                        </div>
                        <button className="toast-close" onClick={(e) => removeToast(toast.id, e)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default LiveNotifications;
