function normalizeText(value) {
    return String(value || "").toLowerCase().trim();
}

function appendText(parts, value) {
    if (!value) return;

    if (typeof value === "string") {
        parts.push(value);
        return;
    }

    if (typeof value === "object") {
        Object.values(value).forEach((entry) => appendText(parts, entry));
    }
}

export function getItemSearchText(item, translateCategory) {
    const parts = [
        item.title,
        item.genre,
        item.description,
        item.artist,
        translateCategory?.(item.category),
    ];

    appendText(parts, item.raw_title);
    appendText(parts, item.raw_description);

    (item.cast || []).forEach((person) => parts.push(person.name));
    (item.director || []).forEach((person) => parts.push(person.name));

    return normalizeText(parts.join(" "));
}

function tokenize(query) {
    return normalizeText(query).split(/\s+/).filter(Boolean);
}

function scoreItem(item, tokens, translateCategory) {
    const haystack = getItemSearchText(item, translateCategory);
    const title = normalizeText(item.title);
    const genre = normalizeText(item.genre);
    const description = normalizeText(item.description);
    const artist = normalizeText(item.artist);

    let score = 0;

    for (const token of tokens) {
        if (!haystack.includes(token)) {
            return 0;
        }

        if (title.includes(token)) score += 10;
        if (genre.includes(token)) score += 6;
        if (artist.includes(token)) score += 8;
        if (description.includes(token)) score += 2;

        if (!title.includes(token) && !genre.includes(token) && !artist.includes(token) && !description.includes(token)) {
            score += 1;
        }
    }

    return score;
}

export function filterBySearch(items, query, translateCategory) {
    const tokens = tokenize(query);
    if (tokens.length === 0) {
        return items;
    }

    return items
        .map((item) => ({
            item,
            score: scoreItem(item, tokens, translateCategory),
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item);
}

export function parseGenres(genre) {
    if (!genre) {
        return [];
    }

    return String(genre)
        .split(/[,/&]|(?:\s+and\s+)/i)
        .map((part) => part.trim())
        .filter(Boolean);
}

export function getUniqueGenres(items) {
    const seen = new Map();

    items.forEach((item) => {
        parseGenres(item.genre).forEach((genre) => {
            const key = normalizeText(genre);
            if (!seen.has(key)) {
                seen.set(key, genre);
            }
        });
    });

    return [...seen.values()].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
    );
}

export function matchesGenreFilter(item, activeGenre, allGenresLabel = "all") {
    if (!activeGenre || activeGenre === "all" || activeGenre === allGenresLabel) {
        return true;
    }

    const target = normalizeText(activeGenre);
    const genres = parseGenres(item.genre).map(normalizeText);

    return genres.some((genre) => genre === target || genre.includes(target));
}
