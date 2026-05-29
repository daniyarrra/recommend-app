export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, history } = req.body;
        const lang = req.query.lang || 'ru';
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(200).json({ 
                reply: "API ключ не настроен в Vercel.", 
                items: [] 
            });
        }

        // We need to fetch catalog from backend to send to AI
        let catalogSummary = "Catalog is temporarily unavailable.";
        let items = [];
        try {
            // Call the render backend to get items
            const backendUrl = process.env.REACT_APP_API_URL || "https://recommend-api-cawe.onrender.com";
            const itemsRes = await fetch(`${backendUrl}/items?lang=${lang}`);
            if (itemsRes.ok) {
                items = await itemsRes.json();
                const summary = items.map(i => `${i.id}: ${i.title} (${i.genre}, ${i.category})`);
                catalogSummary = summary.join("\n");
            }
        } catch (e) {
            console.error("Failed to fetch catalog:", e);
        }

        let historyText = "";
        if (history && history.length > 0) {
            historyText = "Conversation history:\n";
            history.slice(-10).forEach(msg => {
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

        // Call Gemini REST API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
            })
        });

        const geminiData = await geminiRes.json();

        if (!geminiRes.ok) {
            console.error("Gemini API Error:", geminiData);
            return res.status(200).json({ 
                reply: `Ошибка Gemini API: ${geminiData.error?.message || 'Unknown error'}`, 
                items: [] 
            });
        }

        let responseText = geminiData.candidates[0].content.parts[0].text.trim();
        if (responseText.startsWith("```json")) {
            responseText = responseText.slice(7, -3).trim();
        } else if (responseText.startsWith("```")) {
            responseText = responseText.slice(3, -3).trim();
        }

        const aiResponse = JSON.parse(responseText);

        // Populate full item details
        const recommendedItems = [];
        if (aiResponse.item_ids && Array.isArray(aiResponse.item_ids)) {
            aiResponse.item_ids.forEach(id => {
                const item = items.find(i => i.id === id);
                if (item) recommendedItems.push(item);
            });
        }

        return res.status(200).json({
            reply: aiResponse.reply || "Извините, не удалось сформировать ответ.",
            items: recommendedItems
        });

    } catch (error) {
        console.error("Vercel API Chat Error:", error);
        return res.status(200).json({ 
            reply: `Внутренняя ошибка сервера: ${error.message}`, 
            items: [] 
        });
    }
}
