const MAX_CATALOG_ITEMS = 150;

const DEFAULT_GEMINI_MODELS = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
];

const CATEGORY_KEYWORDS = {
    ru: {
        "Музыка": ["музык", "песн", "трек", "альбом", "послуш"],
        "Фильмы": ["фильм", "кино", "movie"],
        "Сериалы": ["сериал", "series", "сезон"],
        "Книги": ["книг", "читать", "book"],
    },
    en: {
        "Музыка": ["music", "song", "track", "album", "listen"],
        "Фильмы": ["movie", "film", "cinema"],
        "Сериалы": ["series", "show", "season"],
        "Книги": ["book", "read", "novel"],
    },
};

const MOOD_SEARCH_TERMS = {
    sad: ["груст", "печал", "тоск", "sad", "melanch", "blues", "ballad", "emotional", "slow"],
    happy: ["весел", "радост", "бодр", "happy", "upbeat", "dance", "pop", "fun"],
    scary: ["страш", "ужас", "horror", "thriller", "dark"],
    romantic: ["романт", "любов", "romance", "love"],
};

function getGeminiModels() {
    const envModel = process.env.GEMINI_MODEL?.trim();
    if (!envModel) {
        return DEFAULT_GEMINI_MODELS;
    }
    return [envModel, ...DEFAULT_GEMINI_MODELS.filter((model) => model !== envModel)];
}

function parseModelJson(raw) {
    let text = (raw || "").trim();
    if (!text) {
        throw new Error("Empty model response");
    }

    if (text.startsWith("```json")) {
        text = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    } else if (text.startsWith("```")) {
        text = text.replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    }

    try {
        return JSON.parse(text);
    } catch {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end > start) {
            return JSON.parse(text.slice(start, end + 1));
        }
        throw new Error("Invalid JSON from model");
    }
}

function isRecommendationRequest(message, lang) {
    const query = message.toLowerCase();
    const keywords = lang === "ru"
        ? ["музык", "фильм", "сериал", "книг", "посовет", "рекоменд", "подбери", "что посмотреть", "что послушать", "что почитать"]
        : ["music", "movie", "series", "book", "recommend", "suggest", "watch", "listen", "read"];

    return keywords.some((word) => query.includes(word));
}

function scoreItem(item, terms) {
    const haystack = `${item.title} ${item.genre} ${item.description || ""}`.toLowerCase();
    return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function localRecommend(message, items, lang) {
    const query = message.toLowerCase();
    const categoryKeywords = CATEGORY_KEYWORDS[lang] || CATEGORY_KEYWORDS.ru;

    let targetCategory = null;
    for (const [category, words] of Object.entries(categoryKeywords)) {
        if (words.some((word) => query.includes(word))) {
            targetCategory = category;
            break;
        }
    }

    let pool = targetCategory
        ? items.filter((item) => item.category === targetCategory)
        : [...items];

    if (pool.length === 0) {
        pool = [...items];
    }

    const moodTerms = [];
    for (const terms of Object.values(MOOD_SEARCH_TERMS)) {
        if (terms.some((term) => query.includes(term))) {
            moodTerms.push(...terms);
        }
    }

    if (moodTerms.length > 0) {
        pool.sort((a, b) => scoreItem(b, moodTerms) - scoreItem(a, moodTerms));
    } else {
        pool.sort(() => Math.random() - 0.5);
    }

    const picks = pool.slice(0, 4);
    const categoryHint = targetCategory
        ? (lang === "ru" ? ` в категории «${targetCategory}»` : ` in "${targetCategory}"`)
        : "";

    const reply = lang === "ru"
        ? `Сейчас ИИ временно недоступен — исчерпан бесплатный лимит запросов Google Gemini. Я подобрал варианты из каталога автоматически${categoryHint}. Попробуйте снова позже или подключите платный тариф в Google AI Studio.`
        : `AI is temporarily unavailable because the free Gemini quota was exceeded. I picked these items from our catalog automatically${categoryHint}. Please try again later or enable billing in Google AI Studio.`;

    return { reply, items: picks };
}

function quotaExceededMessage(lang) {
    return lang === "ru"
        ? "ИИ сейчас недоступен: исчерпан бесплатный лимит запросов Google Gemini (20–1500 в день в зависимости от модели). Попробуйте через час или завтра, либо подключите биллинг в Google AI Studio."
        : "AI is unavailable: the free Gemini request quota has been exceeded. Try again later or enable billing in Google AI Studio.";
}

async function callGeminiModel(prompt, apiKey, model) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        reply: { type: "STRING" },
                        item_ids: {
                            type: "ARRAY",
                            items: { type: "INTEGER" },
                        },
                    },
                    required: ["reply", "item_ids"],
                },
            },
        }),
    });

    const geminiData = await geminiRes.json();
    return {
        ok: geminiRes.ok,
        status: geminiRes.status,
        data: geminiData,
        model,
    };
}

async function callGeminiWithFallback(prompt, apiKey) {
    const models = getGeminiModels();
    let lastResult = null;

    for (const model of models) {
        const result = await callGeminiModel(prompt, apiKey, model);
        if (result.ok) {
            return result;
        }

        lastResult = result;
        const errorCode = result.data?.error?.code;
        const errorStatus = result.data?.error?.status;

        console.error(`Gemini ${model} failed (${result.status}):`, result.data?.error?.message);

        const canTryNextModel =
            errorCode === 429 ||
            errorCode === 404 ||
            errorStatus === "RESOURCE_EXHAUSTED" ||
            errorStatus === "NOT_FOUND";

        if (!canTryNextModel) {
            break;
        }
    }

    return lastResult;
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { message, history } = req.body;
        const lang = req.query.lang || "ru";
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(200).json({
                reply: "API ключ не настроен в Vercel.",
                items: [],
            });
        }

        let catalogSummary = "Catalog is temporarily unavailable.";
        let items = [];
        try {
            const backendUrl = process.env.REACT_APP_API_URL || "https://recommend-api-cawe.onrender.com";
            const itemsRes = await fetch(`${backendUrl}/items?lang=${lang}`);
            if (itemsRes.ok) {
                items = await itemsRes.json();
                const catalogItems = items.slice(0, MAX_CATALOG_ITEMS);
                const summary = catalogItems.map((item) => `${item.id}: ${item.title} (${item.genre}, ${item.category})`);
                catalogSummary = summary.join("\n");
                if (items.length > MAX_CATALOG_ITEMS) {
                    catalogSummary += `\n(Showing ${MAX_CATALOG_ITEMS} of ${items.length} catalog items.)`;
                }
            }
        } catch (e) {
            console.error("Failed to fetch catalog:", e);
        }

        let historyText = "";
        if (history && history.length > 0) {
            historyText = "Conversation history:\n";
            history.slice(-10).forEach((msg) => {
                const role = msg.role === "user" ? "User" : "AI";
                historyText += `${role}: ${msg.text}\n`;
            });
        }

        const prompt = `You are a helpful, highly intelligent, and enthusiastic AI assistant for the RecMedia platform.
You are capable of answering ANY question the user asks, including general knowledge, science, programming, math, casual conversation, and media recommendations.

${historyText}
User's new message: "${message}"

If the user is asking for media recommendations (movies, series, music, books), here is our catalog (ID: Title (Genre, Category)):
${catalogSummary}

Respond ONLY with a valid JSON object, with no markdown formatting or backticks.
The JSON must have two fields:
1. "reply": A natural, conversational response to the user's message in the ${lang} language. You should answer general questions fully and accurately. If they ask for recommendations, provide them and reference the catalog. Be friendly, smart, and helpful.
2. "item_ids": An array of integer IDs of up to 4 items from the catalog that best match their request. If they are NOT asking for recommendations, or if no items match, leave the array empty [].

Format:
{
  "reply": "Your detailed and smart answer here...",
  "item_ids": []
}`;

        const geminiResult = await callGeminiWithFallback(prompt, apiKey);

        if (!geminiResult?.ok) {
            const isQuotaError =
                geminiResult?.status === 429 ||
                geminiResult?.data?.error?.status === "RESOURCE_EXHAUSTED";

            if (isQuotaError && items.length > 0 && isRecommendationRequest(message, lang)) {
                const fallback = localRecommend(message, items, lang);
                return res.status(200).json(fallback);
            }

            if (isQuotaError) {
                return res.status(200).json({
                    reply: quotaExceededMessage(lang),
                    items: [],
                });
            }

            return res.status(200).json({
                reply: `Ошибка Gemini API: ${geminiResult?.data?.error?.message || "Unknown error"}`,
                items: [],
            });
        }

        const candidate = geminiResult.data.candidates?.[0];
        const responseText = candidate?.content?.parts?.[0]?.text;
        if (!responseText) {
            const blockReason = candidate?.finishReason || geminiResult.data.promptFeedback?.blockReason;

            if (items.length > 0 && isRecommendationRequest(message, lang)) {
                const fallback = localRecommend(message, items, lang);
                return res.status(200).json(fallback);
            }

            return res.status(200).json({
                reply: blockReason
                    ? `Не удалось получить ответ от модели (${blockReason}). Попробуйте переформулировать запрос.`
                    : "Не удалось получить ответ от модели. Попробуйте ещё раз.",
                items: [],
            });
        }

        let aiResponse;
        try {
            aiResponse = parseModelJson(responseText);
        } catch (parseError) {
            console.error("Failed to parse Gemini JSON:", parseError.message, responseText.slice(0, 500));
            return res.status(200).json({
                reply: responseText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim(),
                items: [],
            });
        }

        const recommendedItems = [];
        if (aiResponse.item_ids && Array.isArray(aiResponse.item_ids)) {
            aiResponse.item_ids.forEach((id) => {
                const item = items.find((entry) => entry.id === id);
                if (item) {
                    recommendedItems.push(item);
                }
            });
        }

        return res.status(200).json({
            reply: aiResponse.reply || "Извините, не удалось сформировать ответ.",
            items: recommendedItems,
        });
    } catch (error) {
        console.error("Vercel API Chat Error:", error);
        return res.status(200).json({
            reply: `Внутренняя ошибка сервера: ${error.message}`,
            items: [],
        });
    }
}
