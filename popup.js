document.addEventListener('DOMContentLoaded', () => {
    const mainView = document.getElementById('main-view');
    const loadingView = document.getElementById('loading-view');
    const resultsView = document.getElementById('results-view');

    const getInsightsBtn = document.getElementById('get-insights-btn');
    const getStepsBtn = document.getElementById('get-steps-btn');
    const backBtn = document.getElementById('back-btn');
    const resultsContent = document.getElementById('results-content');

    const showView = (viewToShow) => {
        [mainView, loadingView, resultsView].forEach(view => {
            view.classList.remove('active');
        });
        viewToShow.classList.add('active');
    };

    const scrapeProblemDetails = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // More robust selector for the title
                const titleElement = document.querySelector('div a.text-label-1');
                
                // Selector for the problem description container
                const descriptionElement = document.querySelector('div.elfjS');

                // More robust selector for topic tags by looking for the specific URL pattern
                const tagElements = Array.from(document.querySelectorAll('a[href^="/tag/"]'));

                if (!titleElement || !descriptionElement) {
                    return { error: "Could not find problem title or description. LeetCode's layout may have changed." };
                }

                const title = titleElement.innerText.trim();
                const description = descriptionElement.innerText;
                const tags = tagElements.map(tag => tag.innerText);

                if (tags.length === 0) {
                     return { error: "Could not find any topic tags for this problem." };
                }

                return { title, description, tags };
            }
        });

        return results[0].result;
    };

    getInsightsBtn.addEventListener('click', async () => {
        showView(loadingView);
        const problemData = await scrapeProblemDetails();
        if (problemData.error) {
            resultsContent.innerHTML = `<div class="error">${problemData.error}</div>`;
            showView(resultsView);
        } else {
            chrome.runtime.sendMessage({ type: 'getInsights', data: problemData });
        }
    });

    getStepsBtn.addEventListener('click', async () => {
        showView(loadingView);
        const problemData = await scrapeProblemDetails();
        if (problemData.error) {
            resultsContent.innerHTML = `<div class="error">${problemData.error}</div>`;
            showView(resultsView);
        } else {
            chrome.runtime.sendMessage({ type: 'getSteps', data: problemData });
        }
    });

    backBtn.addEventListener('click', () => {
        showView(mainView);
        resultsContent.innerHTML = '';
    });

    chrome.runtime.onMessage.addListener((message) => {
        const { type, data } = message;
        if (type === 'resultsReady') {
            resultsContent.innerHTML = data;
            showView(resultsView);
        } else if (type === 'generationError') {
            resultsContent.innerHTML = `<div class="error"><strong>API Error:</strong> ${data}</div>`;
            showView(resultsView);
        }
    });
});

