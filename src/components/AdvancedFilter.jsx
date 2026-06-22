import { useLanguage } from "../context/LanguageContext";
import "../styles/advanced-filter.css";

/**
 * AdvancedFilter — универсальная панель расширенного фильтра.
 *
 * Props:
 *   isOpen         {boolean}   — открыта ли панель
 *   onClose        {function}  — закрыть панель
 *   genres         {string[]}  — список жанров (уже переведённых)
 *   activeGenres   {string[]}  — выбранные жанры
 *   onGenreToggle  {function}  — (genre) => void
 *   sortBy         {string}    — текущая сортировка
 *   onSortChange   {function}  — (value) => void
 *   sortOptions    {Array}     — [{ value, label }]
 *   categories     {Array}     — [{ value, label }] или null (не показывать)
 *   activeCategory {string}    — выбранная категория
 *   onCategoryChange {function}
 *   resultCount    {number}    — кол-во результатов
 *   onReset        {function}  — сбросить все фильтры
 */
const AdvancedFilter = ({
    isOpen,
    onClose,
    genres = [],
    activeGenres = [],
    onGenreToggle,
    sortBy,
    onSortChange,
    sortOptions = [],
    categories = null,
    activeCategory,
    onCategoryChange,
    resultCount,
    onReset,
}) => {
    const { t } = useLanguage();
    const hasActiveFilters =
        activeGenres.length > 0 ||
        (activeCategory && activeCategory !== "all") ||
        (sortBy && sortBy !== "default");

    if (!isOpen) return null;

    return (
        <div className="af-overlay" onClick={onClose}>
            <div
                className="af-panel"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="af-header">
                    <div className="af-header-left">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                        <span>{t('adv_filter_title')}</span>
                        {hasActiveFilters && (
                            <span className="af-active-badge">
                                {activeGenres.length +
                                    (activeCategory && activeCategory !== "all" ? 1 : 0)}
                            </span>
                        )}
                    </div>
                    <div className="af-header-right">
                        {hasActiveFilters && (
                            <button className="af-reset-btn" onClick={onReset}>
                                {t('adv_filter_reset')}
                            </button>
                        )}
                        <button className="af-close-btn" onClick={onClose} aria-label="Close">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="af-body">
                    {/* Sort */}
                    {sortOptions.length > 0 && (
                        <section className="af-section">
                            <h3 className="af-section-title">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                                    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                                    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                                </svg>
                                {t('adv_sort_by')}
                            </h3>
                            <div className="af-sort-grid">
                                {sortOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        className={`af-sort-btn ${sortBy === opt.value ? "active" : ""}`}
                                        onClick={() => onSortChange(opt.value)}
                                    >
                                        {opt.icon && <span>{opt.icon}</span>}
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Categories */}
                    {categories && (
                        <section className="af-section">
                            <h3 className="af-section-title">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/>
                                    <rect x="2" y="14" width="7" height="7"/><rect x="15" y="14" width="7" height="7"/>
                                </svg>
                                {t('adv_category')}
                            </h3>
                            <div className="af-chip-row">
                                {categories.map(cat => (
                                    <button
                                        key={cat.value}
                                        className={`af-chip ${activeCategory === cat.value ? "active" : ""}`}
                                        onClick={() => onCategoryChange(cat.value)}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Genres */}
                    {genres.length > 0 && (
                        <section className="af-section">
                            <h3 className="af-section-title">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 8v4l3 3"/>
                                </svg>
                                {t('adv_genres')}
                                {activeGenres.length > 0 && (
                                    <span className="af-genre-count">{activeGenres.length} {t('adv_selected')}</span>
                                )}
                            </h3>
                            <div className="af-chip-row af-chip-wrap">
                                {genres.map(genre => (
                                    <button
                                        key={genre}
                                        className={`af-chip ${activeGenres.includes(genre) ? "active" : ""}`}
                                        onClick={() => onGenreToggle(genre)}
                                    >
                                        {activeGenres.includes(genre) && (
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                        )}
                                        {genre}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Footer */}
                <div className="af-footer">
                    <span className="af-result-count">
                        {t('adv_found')}: <strong>{resultCount}</strong>
                    </span>
                    <button className="af-apply-btn" onClick={onClose}>
                        {t('adv_apply')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdvancedFilter;
