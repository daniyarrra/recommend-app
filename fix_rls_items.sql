-- Включаем RLS обратно
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_items ENABLE ROW LEVEL SECURITY;

-- Удаляем старые правила (если есть)
DROP POLICY IF EXISTS "Allow all on items" ON public.items;
DROP POLICY IF EXISTS "Allow all on deleted_items" ON public.deleted_items;

-- Создаем жесткое правило: разрешаем ВСЕМ (anon и authenticated) делать ЧТО УГОДНО (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Allow all on items" ON public.items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on deleted_items" ON public.deleted_items FOR ALL USING (true) WITH CHECK (true);
