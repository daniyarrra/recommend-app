-- Этот скрипт добавит колонку 'bio' (описание) в таблицу profiles,
-- чтобы пользователи могли писать информацию о себе.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
