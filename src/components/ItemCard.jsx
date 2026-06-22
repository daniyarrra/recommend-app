import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/card.css";
import Rating from "./Rating";
import AudioPlayer from "./AudioPlayer";
import { useLanguage } from "../context/LanguageContext";
import { parseGenres } from "../utils/filterCatalog";

const ItemCard = ({ item }) => {
    const navigate = useNavigate();
    const { t, translateGenre } = useLanguage();
    const imageUrl = item.image || "https://via.placeholder.com/500x750?text=No+Image";

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="card" 
            onClick={() => navigate(`/item/${item.id}`)}
        >
            <div className="card-image-container">
                <img src={imageUrl} alt={item.title} className="card-image" loading="lazy" />
                <div className="card-image-overlay" />
                {item.ai_reason && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(96, 165, 250, 0.9)', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        {t('ai_match')}
                    </div>
                )}
                {item.userRating > 0 && (
                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(251, 191, 36, 0.9)', color: '#1a1a2e', padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px', backdropFilter: 'blur(4px)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#1a1a2e" stroke="none">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        {item.userRating}/5
                    </div>
                )}
            </div>
            <div className="card-content">
                <div className="genre">{parseGenres(item.genre).map(g => translateGenre(g)).join(", ")}</div>
                <div className="title">{item.title}</div>
                {item.artist && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', opacity: 0.8 }}>{item.artist}</div>
                )}
                {item.preview_url && (
                    <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '12px' }}>
                        <AudioPlayer src={item.preview_url} />
                    </div>
                )}

                {item.ai_reason && (
                    <div style={{ marginTop: '12px', padding: '10px', background: 'var(--hover-bg)', borderRadius: '8px', borderLeft: '3px solid #60a5fa' }}>
                        <p style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('why_love_it')}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{item.ai_reason}</p>
                    </div>
                )}
                
                <div style={{ marginTop: 'auto', paddingTop: '16px' }} onClick={(e) => e.stopPropagation()}>
                    <Rating itemId={item.id} />
                </div>
            </div>
        </motion.div>
    );
};

export default ItemCard;