-- Этот скрипт создает функцию, которая позволяет пользователю удалить свой собственный аккаунт.
-- Функция имеет права "SECURITY DEFINER", чтобы обойти ограничения на удаление из системной таблицы auth.users

CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Удаляем пользователя из auth.users. 
    -- Supabase автоматически удалит связанные данные в других таблицах, если настроен CASCADE (например, в profiles).
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
