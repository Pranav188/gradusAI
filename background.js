import { API_KEY } from "./config";



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { type, data } = message;
    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'getInsights') {
        systemPrompt = `You are a world-class programming tutor. Your goal is to provide a concise, easy-to-understand revision guide. Use HTML for formatting, including <strong> tags for headers and <ul>/<li> tags for lists. IMPORTANT: Do not wrap your response in a markdown code block like \`\`\`html.`;
        userPrompt = `Based on these LeetCode problem topics: <strong>${data.tags.join(', ')}</strong>, provide a brief revision guide. For each topic, explain:\n1. <strong>What it is:</strong> A single, clear sentence.\n2. <strong>Key Idea:</strong> The most important concept.\n3. <strong>Common Use Cases:</strong> 1-2 examples of where it's applied.`;
    } else if (type === 'getSteps') {
        systemPrompt = `You are an expert algorithmic thinker. Your goal is to break down a problem into a clear, step-by-step logical approach. **You must not, under any circumstances, write any code.** Use HTML formatting with <ol> and <li> tags for the steps, and <strong> tags for emphasis. IMPORTANT: Do not wrap your response in a markdown code block. Start directly with the first <li> item.`;
        userPrompt = `Here is a LeetCode problem:\n\n<strong>Title:</strong> ${data.title}\n\n<strong>Description:</strong>\n${data.description}\n\nProvide a step-by-step logical guide to solve this problem. Do not write any code.`;
    }

    if (systemPrompt && userPrompt) {
        callGeminiAPI(systemPrompt, userPrompt);
    }
    
    return true; 
});

async function callGeminiAPI(systemPrompt, userPrompt) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    const payload = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }]
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || `HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        let htmlContent = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (htmlContent) {
            htmlContent = htmlContent.replace(/^```html\n/, '').replace(/\n```$/, '');
            chrome.runtime.sendMessage({ type: 'resultsReady', data: htmlContent });
        } else {
            throw new Error("Could not extract content from the API response.");
        }
    } catch (error) {
        console.error("Gemini API Error:", error);
        chrome.runtime.sendMessage({ type: 'generationError', data: error.message });
    }
}

