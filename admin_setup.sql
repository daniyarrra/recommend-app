-- Функция проверки, является ли вызывающий запрос администратором
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_status boolean;
BEGIN
    SELECT is_admin INTO admin_status FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(admin_status, false);
END;
$$;

-- 1. Удаление пользователя (Admin)
CREATE OR REPLACE FUNCTION admin_delete_user(target_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Удаляем связанные данные
    BEGIN DELETE FROM public.notifications WHERE user_id = target_uid OR actor_id = target_uid; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DELETE FROM public.follows WHERE follower_id = target_uid OR following_id = target_uid; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DELETE FROM public.ratings WHERE user_id = target_uid; EXCEPTION WHEN OTHERS THEN END;
    BEGIN DELETE FROM public.watchlist WHERE user_id = target_uid; EXCEPTION WHEN OTHERS THEN END;
    
    -- Удаляем профиль
    BEGIN DELETE FROM public.profiles WHERE id = target_uid; EXCEPTION WHEN OTHERS THEN END;

    -- Удаляем из системы аутентификации
    DELETE FROM auth.users WHERE id = target_uid;
END;
$$;

-- 2. Бан / Разбан (Admin)
CREATE OR REPLACE FUNCTION admin_set_ban(target_uid uuid, ban_status boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    UPDATE public.profiles SET is_banned = ban_status WHERE id = target_uid;
END;
$$;

-- 3. Назначение / Снятие прав администратора (Admin)
CREATE OR REPLACE FUNCTION admin_set_role(target_uid uuid, make_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    UPDATE public.profiles SET is_admin = make_admin WHERE id = target_uid;
END;
$$;

-- 4. Удаление отзыва (Admin)
CREATE OR REPLACE FUNCTION admin_delete_review(target_review_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    DELETE FROM public.ratings WHERE id = target_review_id;
END;
$$;
