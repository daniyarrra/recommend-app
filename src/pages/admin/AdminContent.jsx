import { useState } from "react";
import API from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";
import { useCatalog, useInvalidateCatalog } from "../../hooks/useCatalog";

const CATEGORIES = ["Все", "Фильмы", "Сериалы", "Книги", "Музыка"];

const emptyItem = {
    title_ru: "", title_en: "", title_kz: "", genre: "", category: "Фильмы",
    description_ru: "", description_en: "", description_kz: "",
    image: "", trailer_url: "", preview_url: "", artist: "", is_featured: false,
    cast: [], director: []
};

const AdminContent = () => {
    const { t, language } = useLanguage();
    const { data: items = [], isLoading: loading, refetch } = useCatalog(language);
    const invalidateCatalog = useInvalidateCatalog();
    const [search, setSearch] = useState("");
    const [filterCat, setFilterCat] = useState("Все");
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ ...emptyItem });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const refreshCatalog = async () => {
        await invalidateCatalog();
        await refetch();
    };

    const openCreate = () => {
        setEditItem(null);
        setForm({ ...emptyItem });
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditItem(item);
        const tObj = item.raw_title || item.title;
        const dObj = item.raw_description || item.description;

        setForm({
            title_ru: typeof tObj === 'object' ? (tObj?.ru || "") : (tObj || ""),
            title_en: typeof tObj === 'object' ? (tObj?.en || "") : "",
            title_kz: typeof tObj === 'object' ? (tObj?.kz || "") : "",
            genre: item.genre || "",
            category: item.category || "Фильмы",
            description_ru: typeof dObj === 'object' ? (dObj?.ru || "") : (dObj || ""),
            description_en: typeof dObj === 'object' ? (dObj?.en || "") : "",
            description_kz: typeof dObj === 'object' ? (dObj?.kz || "") : "",
            image: item.image || "",
            trailer_url: item.trailer_url || "",
            preview_url: item.preview_url || "",
            artist: item.artist || "",
            cast: Array.isArray(item.cast) ? item.cast : (item.cast ? [{name: item.cast, photo: ''}] : []),
            director: Array.isArray(item.director) ? item.director : (item.director ? [{name: item.director, photo: ''}] : []),
            is_featured: item.is_featured || false
        });
        setShowModal(true);
    };

    const handleAIFill = async () => {
        if (!form.title_ru || !form.category) {
            alert("Сначала введите название в поле (RU) и выберите категорию");
            return;
        }
        setAiLoading(true);
        try {
            const res = await API.post("/admin/ai-fill", { title: form.title_ru, category: form.category });
            setForm(prev => ({
                ...prev,
                title_ru: res.data.title_ru || prev.title_ru,
                title_en: res.data.title_en || prev.title_en,
                title_kz: res.data.title_kz || prev.title_kz,
                genre: res.data.genre || prev.genre,
                description_ru: res.data.description_ru || prev.description_ru,
                description_en: res.data.description_en || prev.description_en,
                description_kz: res.data.description_kz || prev.description_kz,
            }));
        } catch (err) {
            console.error(err);
            alert("Ошибка ИИ. Проверьте консоль или API ключ.");
        }
        setAiLoading(false);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setUploading(true);
        try {
            const res = await API.post("/admin/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setForm({ ...form, image: res.data.url });
        } catch (err) {
            console.error("Upload error:", err);
            alert("Ошибка загрузки изображения");
        }
        setUploading(false);
    };

    const handleSave = async () => {
        if (!form.title_ru || !form.genre || !form.category) {
            alert(t('admin_fill_required'));
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form };
            if (editItem) {
                await API.put(`/admin/items/${editItem.id}`, payload);
            } else {
                await API.post("/admin/items", payload);
            }
            setShowModal(false);
            await refreshCatalog();
        } catch (err) {
            console.error(err);
            alert(t('admin_save_error'));
        }
        setSaving(false);
    };

    const handleDelete = async (item) => {
        try {
            await API.delete(`/admin/items/${item.id}`);
            setConfirmDelete(null);
            await refreshCatalog();
        } catch (err) {
            console.error(err);
            alert(t('admin_delete_error'));
        }
    };

    const filtered = items.filter(item => {
        const matchSearch = item.title?.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCat === "Все" || item.category === filterCat;
        return matchSearch && matchCat;
    });

    if (loading) {
        return <div className="admin-loading"><div className="loading-spinner"></div><span>{t('loading')}</span></div>;
    }

    return (
        <div>
            <div className="admin-page-header">
                <h1>{t('admin_content')}</h1>
                <p>{t('admin_content_desc')}</p>
            </div>

            <div className="admin-table-container">
                <div className="admin-table-toolbar">
                    <div className="admin-search">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input placeholder={t('admin_search_content')} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div className="admin-filter-tabs">
                            {CATEGORIES.map(cat => (
                                <button key={cat} className={`admin-filter-tab ${filterCat === cat ? 'active' : ''}`}
                                    onClick={() => setFilterCat(cat)}>{cat}</button>
                            ))}
                        </div>
                        <button className="admin-btn admin-btn-primary" onClick={openCreate}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            {t('admin_add_item')}
                        </button>
                    </div>
                </div>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>{t('admin_col_title')}</th>
                            <th>{t('admin_col_category')}</th>
                            <th>{t('admin_col_genre')}</th>
                            <th>{t('admin_col_actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(item => (
                            <tr key={item.id}>
                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{item.id}</td>
                                <td>
                                    <div className="admin-item-cell">
                                        {item.image && <img src={item.image} alt="" className="admin-item-poster" />}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                            <span>{item.title}</span>
                                            {item.is_featured && <span className="admin-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '0.65rem' }}>★ Featured</span>}
                                        </div>
                                    </div>
                                </td>
                                <td><span className="admin-badge admin-badge-category">{item.category}</span></td>
                                <td style={{ color: 'var(--text-secondary)' }}>{item.genre}</td>
                                <td>
                                    <div className="admin-actions">
                                        <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => openEdit(item)}>
                                            {t('admin_edit')}
                                        </button>
                                        <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => setConfirmDelete(item)}>
                                            {t('delete_btn')}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <div className="admin-empty"><p>{t('admin_no_content')}</p></div>}
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <h2>{editItem ? t('admin_edit_item') : t('admin_add_item')}</h2>
                        <p>{editItem ? t('admin_edit_item_desc') : t('admin_add_item_desc')}</p>

                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label className="admin-form-label">{t('admin_col_category')} *</label>
                                <select className="admin-form-input admin-form-select" value={form.category}
                                    onChange={e => setForm({...form, category: e.target.value})}>
                                    <option value="Фильмы">Фильмы</option>
                                    <option value="Сериалы">Сериалы</option>
                                    <option value="Книги">Книги</option>
                                    <option value="Музыка">Музыка</option>
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">{t('admin_col_genre')} *</label>
                                <input className="admin-form-input" value={form.genre}
                                    onChange={e => setForm({...form, genre: e.target.value})} placeholder="Sci-Fi, Drama..." />
                            </div>
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-form-label">{t('admin_col_title')} (RU) *</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="admin-form-input" value={form.title_ru}
                                    onChange={e => setForm({...form, title_ru: e.target.value})} placeholder="Интерстеллар" style={{ flex: 1 }} />
                                <button className="admin-btn admin-btn-primary" onClick={handleAIFill} disabled={aiLoading} style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                                    {aiLoading ? "Загрузка..." : "✨ Сгенерировать ИИ"}
                                </button>
                            </div>
                        </div>
                        <div className="admin-form-group">
                            <label className="admin-form-label">{t('admin_col_title')} (EN)</label>
                            <input className="admin-form-input" value={form.title_en}
                                onChange={e => setForm({...form, title_en: e.target.value})} placeholder="Interstellar" />
                        </div>
                        <div className="admin-form-group">
                            <label className="admin-form-label">{t('admin_col_title')} (KZ)</label>
                            <input className="admin-form-input" value={form.title_kz}
                                onChange={e => setForm({...form, title_kz: e.target.value})} placeholder="Интерстеллар" />
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-form-label">{t('admin_desc_ru')}</label>
                            <textarea className="admin-form-input admin-form-textarea" value={form.description_ru}
                                onChange={e => setForm({...form, description_ru: e.target.value})} />
                        </div>
                        <div className="admin-form-group">
                            <label className="admin-form-label">{t('admin_desc_en')}</label>
                            <textarea className="admin-form-input admin-form-textarea" value={form.description_en}
                                onChange={e => setForm({...form, description_en: e.target.value})} />
                        </div>
                        <div className="admin-form-group">
                            <label className="admin-form-label">{t('admin_desc_kz')}</label>
                            <textarea className="admin-form-input admin-form-textarea" value={form.description_kz}
                                onChange={e => setForm({...form, description_kz: e.target.value})} />
                        </div>

                        <div className="admin-form-group">
                            <label className="admin-form-label">{t('admin_image_url')}</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="admin-form-input" value={form.image}
                                    onChange={e => setForm({...form, image: e.target.value})} placeholder="https://..." style={{ flex: 1 }} />
                                <label className="admin-btn admin-btn-ghost" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    {uploading ? "..." : "Загрузить"}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
                                </label>
                            </div>
                        </div>

                        {(form.category === "Фильмы" || form.category === "Сериалы") && (
                            <>
                                <div className="admin-form-group">
                                    <label className="admin-form-label">{t('admin_trailer_url')}</label>
                                    <input className="admin-form-input" value={form.trailer_url}
                                        onChange={e => setForm({...form, trailer_url: e.target.value})} placeholder="https://www.youtube.com/embed/..." />
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        Режиссер
                                        <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => setForm({...form, director: [...form.director, {name: '', photo: ''}]})}>+ Добавить</button>
                                    </label>
                                    {form.director.map((d, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                            <input className="admin-form-input" value={d.name} onChange={e => { const nd = [...form.director]; nd[i].name = e.target.value; setForm({...form, director: nd}) }} placeholder="Имя" style={{ flex: 1, margin: 0 }} />
                                            <input className="admin-form-input" value={d.photo} onChange={e => { const nd = [...form.director]; nd[i].photo = e.target.value; setForm({...form, director: nd}) }} placeholder="URL фото" style={{ flex: 1, margin: 0 }} />
                                            <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => { const nd = form.director.filter((_, idx) => idx !== i); setForm({...form, director: nd}) }}>X</button>
                                        </div>
                                    ))}
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        Актерский состав
                                        <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => setForm({...form, cast: [...form.cast, {name: '', photo: ''}]})}>+ Добавить</button>
                                    </label>
                                    {form.cast.map((c, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                            <input className="admin-form-input" value={c.name} onChange={e => { const nc = [...form.cast]; nc[i].name = e.target.value; setForm({...form, cast: nc}) }} placeholder="Имя" style={{ flex: 1, margin: 0 }} />
                                            <input className="admin-form-input" value={c.photo} onChange={e => { const nc = [...form.cast]; nc[i].photo = e.target.value; setForm({...form, cast: nc}) }} placeholder="URL фото" style={{ flex: 1, margin: 0 }} />
                                            <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => { const nc = form.cast.filter((_, idx) => idx !== i); setForm({...form, cast: nc}) }}>X</button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {form.category === "Музыка" && (
                            <>
                                <div className="admin-form-group">
                                    <label className="admin-form-label">{t('admin_artist')}</label>
                                    <input className="admin-form-input" value={form.artist}
                                        onChange={e => setForm({...form, artist: e.target.value})} />
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-form-label">{t('admin_preview_url')}</label>
                                    <input className="admin-form-input" value={form.preview_url}
                                        onChange={e => setForm({...form, preview_url: e.target.value})} />
                                </div>
                            </>
                        )}
                        
                        <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                            <input type="checkbox" id="is_featured" checked={form.is_featured} 
                                onChange={e => setForm({...form, is_featured: e.target.checked})} 
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                            <label htmlFor="is_featured" className="admin-form-label" style={{ margin: 0, cursor: 'pointer', color: 'var(--text-primary)' }}>
                                Показывать в главном слайдере на главной странице (Featured)
                            </label>
                        </div>

                        <div className="admin-modal-actions">
                            <button className="admin-btn admin-btn-ghost" onClick={() => setShowModal(false)}>{t('admin_cancel')}</button>
                            <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? t('saving') : t('admin_save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {confirmDelete && (
                <div className="admin-modal-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <h2>{t('admin_confirm_title')}</h2>
                        <p>{t('admin_confirm_delete_item')}<br/><strong>{confirmDelete.title}</strong></p>
                        <div className="admin-modal-actions">
                            <button className="admin-btn admin-btn-ghost" onClick={() => setConfirmDelete(null)}>{t('admin_cancel')}</button>
                            <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(confirmDelete)}>{t('delete_btn')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminContent;
