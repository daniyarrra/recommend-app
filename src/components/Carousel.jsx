import { useRef, useState, useEffect } from "react";
import "../styles/carousel.css";

const Carousel = ({ children }) => {
    const carouselRef = useRef(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    const handleScroll = () => {
        if (!carouselRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        setShowLeft(scrollLeft > 10);
        // Using Math.ceil to prevent sub-pixel issues where scrollLeft + clientWidth is slightly less than scrollWidth
        setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 10);
    };

    useEffect(() => {
        handleScroll();
        window.addEventListener('resize', handleScroll);
        
        // Use a timeout to re-check after images/content load
        const timeout = setTimeout(handleScroll, 500);
        
        return () => {
            window.removeEventListener('resize', handleScroll);
            clearTimeout(timeout);
        };
    }, [children]);

    const scroll = (direction) => {
        if (carouselRef.current) {
            const { clientWidth } = carouselRef.current;
            // Scroll by roughly 3 items or 80% of width
            const scrollAmount = direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
            carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className={`carousel-wrapper ${showLeft ? 'has-left-scroll' : ''} ${showRight ? 'has-right-scroll' : ''}`}>
            {showLeft && (
                <button className="carousel-btn left" onClick={() => scroll('left')} aria-label="Scroll left">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
            )}
            
            <div className="carousel-container" ref={carouselRef} onScroll={handleScroll}>
                {children}
            </div>

            {showRight && (
                <button className="carousel-btn right" onClick={() => scroll('right')} aria-label="Scroll right">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            )}
        </div>
    );
};

export default Carousel;
