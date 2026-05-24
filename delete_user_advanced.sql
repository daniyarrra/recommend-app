-- Улучшенная версия функции для удаления аккаунта.
-- Она сначала стирает все ваши лайки, подписки и уведомления,
-- чтобы база данных не ругалась на связанные данные (Foreign Key Error).

CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Удаляем все связи пользователя в публичных таблицах (если таблицы существуют)
    -- Мы используем блок DO, чтобы игнорировать ошибки, если какой-то таблицы нет
    
    BEGIN DELETE FROM public.notifications WHERE user_id = auth.uid() OR actor_id = auth.uid(); EXCEPTION WHEN OTHERS THEN END;
    BEGIN DELETE FROM public.follows WHERE follower_id = auth.uid() OR following_id = auth.uid(); EXCEPTION WHEN OTHERS THEN END;
    BEGIN DELETE FROM public.ratings WHERE user_id = auth.uid(); EXCEPTION WHEN OTHERS THEN END;
    BEGIN DELETE FROM public.watchlist WHERE user_id = auth.uid(); EXCEPTION WHEN OTHERS THEN END;
    
    -- Удаляем сам публичный профиль
    BEGIN DELETE FROM public.profiles WHERE id = auth.uid(); EXCEPTION WHEN OTHERS THEN END;

    -- Наконец, удаляем пользователя из системной таблицы аутентификации
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
