# gradusAI
GradusAI is a Chrome extension that helps students solve LeetCode problems more effectively. Recognizing that official hints can often be confusing and create more ambiguity, the extension integrates the Google Gemini API directly into the LeetCode interface to provide clearer, more contextual guidance. It offers two levels of assistance: a quick revision of the problem's core concepts based on its official tags, and a detailed, step-by-step logical guide to the solution's algorithm. By focusing on the thought process rather than the final code, GradusAI fosters genuine understanding and empowers users to improve their problem-solving skills.

## Setup Instructions

1. Clone this repository to your local machine.
2. In the project folder, find the file named `config.example.js`.
3. Rename it to `config.js`.
4. Open `config.js` and paste in your personal Google Gemini API key.
5. Load the extension into Chrome using the "Load unpacked" button in `chrome://extensions` (make sure developer mode is toggeled on).

## Implementation

Here are some screenshots of GradusAI in action:

### Screenshot 1
![Extension Popup](screenshots/screenshot1.png)

### Screenshot 2
![LeetCode Integration](screenshots/screenshot2.png)
