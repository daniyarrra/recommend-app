CREATE TABLE IF NOT EXISTS public.items (
    id BIGINT PRIMARY KEY,
    title JSONB NOT NULL,
    description JSONB,
    category TEXT,
    genre TEXT,
    director JSONB,
    "cast" JSONB,
    image TEXT,
    trailer_url TEXT,
    preview_url TEXT,
    artist TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.deleted_items (
    item_id BIGINT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Для простоты локальной разработки отключаем RLS для этих таблиц, 
-- так как ими управляет бэкенд на Python.
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_items DISABLE ROW LEVEL SECURITY;
