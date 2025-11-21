# AI Chartered Accountant (Simple Web App)

A lightweight, mobile-responsive web application that acts as an AI Tax Assistant. Built with HTML, CSS, and JavaScript using the Google Gemini API.

## Features
- **Smart Answers:** Powered by Google Gemini (Flash model) for fast, accurate tax advice.
- **Mobile Responsive:** Looks great on phones and desktops.
- **Secure Setup:** API Key is stored in the user's browser (LocalStorage), not in the code.
- **Topics Covered:** GST, Income Tax (ITR), 80C Deductions, and general finance.

## How to Host on Netlify (Free)

1.  **Prepare your file:**
    Ensure you have the `index.html` file ready in a folder.

2.  **Deploy:**
    - Log in to [Netlify](https://app.netlify.com/).
    - Go to the "Sites" tab.
    - Drag and drop your folder containing `index.html` into the upload area.

3.  **Use:**
    - Open the link Netlify gives you.
    - Click the "Settings" (Gear) icon or wait for the popup.
    - Paste your Google Gemini API Key.
    - Start asking tax questions!

## Environment Variables
*Note: This project uses a client-side setup for simplicity.*
- **Variable Name:** `GEMINI_API_KEY` (Handled via the UI popup in this version).

## License
Free for educational use.