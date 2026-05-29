import { useQuery, useQueryClient } from "@tanstack/react-query";
import API from "../services/api";

const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 30 * 60 * 1000;

export const catalogKeys = {
    all: ["catalog"],
    list: (lang) => ["catalog", lang],
    item: (id, lang) => ["catalog", "item", String(id), lang],
};

async function fetchCatalog(lang = "ru") {
    const res = await API.get(`/items?lang=${lang}`);
    if (!Array.isArray(res.data)) {
        throw new Error("API did not return an array");
    }
    return res.data;
}

async function fetchCatalogItem(id, lang = "ru") {
    const res = await API.get(`/items/${id}?lang=${lang}`);
    return res.data;
}

export function useCatalog(lang = "ru") {
    return useQuery({
        queryKey: catalogKeys.list(lang),
        queryFn: () => fetchCatalog(lang),
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
    });
}

export function useCatalogItem(id, lang = "ru") {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: catalogKeys.item(id, lang),
        queryFn: () => fetchCatalogItem(id, lang),
        enabled: Boolean(id),
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        placeholderData: () => {
            const catalog = queryClient.getQueryData(catalogKeys.list(lang));
            return catalog?.find((item) => String(item.id) === String(id));
        },
    });
}

export function useCatalogItemsByIds(ids, lang = "ru") {
    const query = useCatalog(lang);
    const idSet = new Set((ids || []).map(Number));

    return {
        ...query,
        data: (query.data || []).filter((item) => idSet.has(item.id)),
    };
}

export function useInvalidateCatalog() {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: catalogKeys.all });
}
