-- Этот скрипт добавит колонку 'nickname' в таблицу profiles,
-- чтобы пользователи могли менять свой никнейм и он отображался в отзывах.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT DEFAULT '';
