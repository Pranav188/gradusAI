// A simple library to convert Markdown to HTML.
// Using try-catch for the import in case of network issues.
try {
  self.importScripts("https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js");
} catch (e) {
  console.error("Failed to load marked library:", e);
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { type, data } = message;
    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'getInsights') {
        systemPrompt = `You are a world-class programming tutor and computer science professor. Your goal is to provide a concise, easy-to-understand revision guide on specific topics for a user preparing for coding interviews. Use markdown for formatting, including bold text for headers and bullet points for lists. Structure the response clearly for each topic.`;
        userPrompt = `Based on these LeetCode problem topics: **${data.tags.join(', ')}**, provide a brief revision guide. For each topic, explain:\n1. **What it is:** A single, clear sentence.\n2. **Key Idea:** The most important concept or main principle.\n3. **Common Use Cases:** 1-2 examples of where it's applied.`;
    } else if (type === 'getSteps') {
        systemPrompt = `You are an expert algorithmic thinker and problem solver. Your goal is to break down a complex programming problem into a clear, step-by-step logical approach that a human can follow. **You must not, under any circumstances, write any code.** Focus purely on the thought process, data structures, and algorithmic strategy. Use markdown formatting with a numbered list for the steps. Start directly with the first step.`;
        userPrompt = `Here is a LeetCode problem:\n\n**Title:** ${data.title}\n\n**Description:**\n${data.description}\n\nProvide a step-by-step logical guide to solve this problem. Do not write any code.`;
    }

    if (systemPrompt && userPrompt) {
        callGeminiAPI(systemPrompt, userPrompt, data.apiKey);
    }
    
    return true; // Indicates an asynchronous response is expected.
});

async function callGeminiAPI(systemPrompt, userPrompt, apiKey) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
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
        const textContent = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (textContent) {
            // Check if the marked library was loaded successfully before using it.
            if (self.marked) {
                // Convert the Markdown response to HTML before sending to the popup
                const htmlContent = self.marked.parse(textContent);
                chrome.runtime.sendMessage({ type: 'resultsReady', data: htmlContent });
            } else {
                 // Fallback to plain text if marked is not available.
                chrome.runtime.sendMessage({ type: 'resultsReady', data: `<pre>${textContent}</pre>` });
            }
        } else {
            throw new Error("Could not extract content from the API response.");
        }
    } catch (error) {
        console.error("Gemini API Error:", error);
        chrome.runtime.sendMessage({ type: 'generationError', data: error.message });
    }
}

