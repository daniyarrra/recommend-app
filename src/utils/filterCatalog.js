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

export function getItemSearchText(item, translateCategory, translateGenre) {
    const parts = [
        item.title,
        item.artist,
        translateCategory?.(item.category),
    ];

    if (translateGenre) {
        parseGenres(item.genre).forEach(g => parts.push(translateGenre(g)));
    } else {
        parts.push(item.genre);
    }

    appendText(parts, item.raw_title);

    (item.cast || []).forEach((person) => parts.push(person.name));
    (item.director || []).forEach((person) => parts.push(person.name));

    return normalizeText(parts.join(" "));
}

function tokenize(query) {
    const tokens = normalizeText(query).split(/\s+/).filter(Boolean);
    // Deduplicate tokens so "ла ла ленд" → ["ла", "ленд"]
    return [...new Set(tokens)];
}

function scoreItem(item, tokens, translateCategory, translateGenre) {
    const title = normalizeText(item.title);

    // Also check raw_title (all language variants) for title matching
    const rawTitleParts = [];
    appendText(rawTitleParts, item.raw_title);
    const rawTitle = normalizeText(rawTitleParts.join(" "));

    const genresText = translateGenre
        ? parseGenres(item.genre).map(g => translateGenre(g)).join(" ")
        : item.genre;
    const genre = normalizeText(genresText);
    const artist = normalizeText(item.artist);

    let score = 0;
    let allMatch = true;

    for (const token of tokens) {
        let tokenScore = 0;

        if (title.startsWith(token)) tokenScore += 15;
        else if (title.includes(token)) tokenScore += 10;

        if (rawTitle.includes(token)) tokenScore += 8;
        if (genre.includes(token)) tokenScore += 6;
        if (artist.includes(token)) tokenScore += 8;

        if (tokenScore === 0) {
            // Token didn't match anything important — exclude item entirely
            allMatch = false;
            break;
        }
        score += tokenScore;
    }

    return allMatch ? score : 0;
}

export function filterBySearch(items, query, translateCategory, translateGenre) {
    const tokens = tokenize(query);
    if (tokens.length === 0) {
        return items;
    }

    return items
        .map((item) => ({
            item,
            score: scoreItem(item, tokens, translateCategory, translateGenre),
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
        .split(/[,/]|(?:\s+and\s+)|(?:\s+&\s+)/i)
        .map((part) => part.trim())
        .filter(Boolean);
}

export function getUniqueGenres(items, translateGenre) {
    const seen = new Map();

    items.forEach((item) => {
        parseGenres(item.genre).forEach((genre) => {
            const translated = translateGenre ? translateGenre(genre) : genre;
            const key = normalizeText(translated);
            if (!seen.has(key)) {
                seen.set(key, translated);
            }
        });
    });

    return [...seen.values()].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
    );
}

export function matchesGenreFilter(item, activeGenre, allGenresLabel = "all", translateGenre) {
    if (!activeGenre || activeGenre === "all" || activeGenre === allGenresLabel) {
        return true;
    }

    const target = normalizeText(activeGenre);
    const genres = parseGenres(item.genre).map(g => normalizeText(translateGenre ? translateGenre(g) : g));

    return genres.some((genre) => genre === target || genre.includes(target));
}
