import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { parseGenres } from "../utils/filterCatalog";
import "../styles/slider.css";

const HeroSlider = ({ items }) => {
    const { t, translateGenre } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);

    // Выбираем топ 5 элементов с картинками
    const sliderItems = items
        .filter(item => item.image && item.description)
        .slice(0, 5);

    useEffect(() => {
        if (sliderItems.length === 0) return;
        
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % sliderItems.length);
        }, 7000);

        return () => clearInterval(interval);
    }, [sliderItems.length]);

    if (sliderItems.length === 0) return null;

    return (
        <div className="hero-slider-container">
            {sliderItems.map((item, index) => {
                const isActive = index === currentIndex;
                const imageUrl = item.image;

                return (
                    <div 
                        key={item.id} 
                        className={`hero-slide ${isActive ? "active" : ""}`}
                    >
                        {/* Размытый задний фон */}
                        <div 
                            className="hero-bg-blur" 
                            style={{ backgroundImage: `url(${imageUrl})` }}
                        ></div>

                        {/* Контент */}
                        <div className="hero-content-wrapper">
                            <div className="hero-info">
                                <span className="hero-slide-genre">{parseGenres(item.genre).map(g => translateGenre(g)).join(", ")}</span>
                                <h2 className="hero-slide-title">{item.title}</h2>
                                <p className="hero-slide-desc">{item.description}</p>

                                <div className="hero-slide-actions">
                                    <Link to={`/item/${item.id}`} className="hero-btn hero-btn-primary">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="5 3 19 12 5 21 5 3"/>
                                        </svg>
                                        {t('more_info')}
                                    </Link>
                                </div>
                            </div>
                            
                            <div className="hero-poster-wrapper">
                                <img src={imageUrl} alt={item.title} className="hero-slide-poster" />
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Навигационные точки */}
            <div className="hero-controls">
                {sliderItems.map((_, index) => (
                    <div 
                        key={index}
                        className={`hero-dot ${index === currentIndex ? "active" : ""}`}
                        onClick={() => setCurrentIndex(index)}
                    ></div>
                ))}
            </div>
        </div>
    );
};

export default HeroSlider;
