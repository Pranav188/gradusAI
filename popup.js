document.addEventListener('DOMContentLoaded', () => {
    const mainView = document.getElementById('main-view');
    const settingsView = document.getElementById('settings-view');
    const settingsBtn = document.getElementById('settings-btn');
    const backBtn = document.getElementById('back-btn');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const insightsBtn = document.getElementById('insights-btn');
    const stepsBtn = document.getElementById('steps-btn');
    const loadingDiv = document.getElementById('loading');
    const resultsContainer = document.getElementById('results-container');
    const errorContainer = document.getElementById('error-container');

    // --- View Switching ---
    settingsBtn.addEventListener('click', () => {
        mainView.classList.add('hidden');
        settingsView.classList.remove('hidden');
        chrome.storage.sync.get('geminiApiKey', ({ geminiApiKey }) => {
            if (geminiApiKey) apiKeyInput.value = geminiApiKey;
        });
    });

    backBtn.addEventListener('click', () => {
        settingsView.classList.add('hidden');
        mainView.classList.remove('hidden');
    });

    // --- API Key Management ---
    saveKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
                // Using a more subtle confirmation instead of alert()
                saveKeyBtn.textContent = 'Saved!';
                setTimeout(() => {
                   saveKeyBtn.textContent = 'Save Key';
                   settingsView.classList.add('hidden');
                   mainView.classList.remove('hidden');
                }, 1000);
            });
        } else {
            displayError('Please enter a valid API key.');
        }
    });

    // --- Feature Buttons ---
    insightsBtn.addEventListener('click', () => handleRequest('getInsights'));
    stepsBtn.addEventListener('click', () => handleRequest('getSteps'));

    function handleRequest(type) {
        chrome.storage.sync.get('geminiApiKey', ({ geminiApiKey }) => {
            if (!geminiApiKey) {
                displayError('API Key not found. Please set it in Settings.');
                return;
            }

            prepareUIForRequest();

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].url.includes("leetcode.com/problems/")) {
                    const functionToInject = (type === 'getInsights') ? scrapeProblemTags : scrapeProblemDetails;
                    
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        function: functionToInject,
                    }).then(injectionResults => {
                        // Check if injection was successful and result is not undefined
                        if (!injectionResults || !injectionResults[0] || injectionResults[0].result === undefined) {
                            displayError("Could not execute script on the page. Try reloading the LeetCode page.");
                            return;
                        }

                        const result = injectionResults[0].result;
                        if (result.error) {
                            displayError(result.error);
                        } else {
                            // Send the scraped data and API key to the background script
                            chrome.runtime.sendMessage({ type, data: { ...result, apiKey: geminiApiKey } });
                        }
                    }).catch(err => displayError(`Injection script failed: ${err.message}`));
                } else {
                    displayError("This extension only works on LeetCode problem pages.");
                }
            });
        });
    }

    // --- UI Updates ---
    function prepareUIForRequest() {
        loadingDiv.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');
        resultsContainer.innerHTML = '';
        errorContainer.innerText = '';
    }

    function displayResults(htmlContent) {
        loadingDiv.classList.add('hidden');
        resultsContainer.innerHTML = htmlContent;
        resultsContainer.classList.remove('hidden');
    }

    function displayError(message) {
        loadingDiv.classList.add('hidden');
        errorContainer.innerText = `Error: ${message}`;
        errorContainer.classList.remove('hidden');
    }

    // --- Listen for results from background script ---
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'resultsReady') {
            displayResults(message.data);
        } else if (message.type === 'generationError') {
            displayError(message.data);
        }
    });
});

// --- Functions to be injected into the LeetCode page ---
// These are defined here but executed on the webpage itself.

function scrapeProblemTags() {
    // LeetCode's UI might change. These selectors are based on the current layout.
    const tagContainer = document.querySelector('div.mt-2.flex.flex-wrap.gap-y-3');
    if (!tagContainer) {
        return { error: "Could not find problem tags. LeetCode's layout may have changed." };
    }
    const tags = Array.from(tagContainer.querySelectorAll('a')).map(a => a.innerText);
    return tags.length > 0 ? { tags } : { error: "No tags found for this problem." };
}

function scrapeProblemDetails() {
    // Selectors are fragile and may need updating if LeetCode changes its HTML structure.
    const titleElement = document.querySelector('div[data-cy="question-title"]');
    // This is a more robust way to get the description content area.
    const descriptionParent = document.querySelector('div._1l1MA');
    
    if (!titleElement || !descriptionParent) {
        return { error: "Could not find problem title or description. LeetCode's layout may have changed." };
    }

    return {
        title: titleElement.innerText,
        description: descriptionParent.innerText
    };
}

