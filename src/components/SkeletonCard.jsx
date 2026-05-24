import "../styles/card.css";

const SkeletonCard = () => {
    return (
        <div className="card skeleton-card">
            <div className="card-image-container skeleton-pulse" style={{ background: "rgba(255, 255, 255, 0.05)" }}></div>
            <div className="card-content">
                <div className="genre skeleton-pulse" style={{ height: "24px", width: "80px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.05)", marginBottom: "16px" }}></div>
                <div className="title skeleton-pulse" style={{ height: "20px", width: "90%", borderRadius: "4px", background: "rgba(255, 255, 255, 0.08)", marginBottom: "8px" }}></div>
                <div className="title skeleton-pulse" style={{ height: "20px", width: "60%", borderRadius: "4px", background: "rgba(255, 255, 255, 0.08)" }}></div>
                
                <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                    <div className="skeleton-pulse" style={{ height: "24px", width: "120px", borderRadius: "4px", background: "rgba(255, 255, 255, 0.05)" }}></div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonCard;
