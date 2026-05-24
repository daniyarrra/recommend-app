-- Добавляем колонку folder в таблицу watchlist
-- Запустите этот SQL в Supabase SQL Editor

ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS folder TEXT DEFAULT NULL;

-- Готово! Теперь каждый элемент watchlist может быть привязан к папке.
