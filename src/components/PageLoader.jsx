import "../styles/main.css";

const PageLoader = () => (
    <div
        style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "40vh",
            flexDirection: "column",
            gap: "16px",
            color: "var(--text-secondary, #94a3b8)",
        }}
    >
        <div className="loading-spinner" />
        <span style={{ fontSize: "0.95rem" }}>Загрузка...</span>
    </div>
);

export default PageLoader;
