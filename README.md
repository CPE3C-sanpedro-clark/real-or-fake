# Verifake

🌐 Live at: https://ver1f3ke.com

A web-based misinformation detection and sentiment analysis platform.
Paste a statement, upload an image, or enter an article title —
Verifake will tell you whether the information checks out and
how it reads emotionally.

---

## Features

- **Statement Verification** — Checks if a given statement is factually accurate
- **Sentiment Analysis** — Classifies input as positive, negative, or neutral
- **Image Checking** — Detects misinformation or manipulation in uploaded images
- **Article Title Checking** — Evaluates the credibility of article headlines

---

## Tech Stack

| Layer      | Technology          |
|------------|---------------------|
| Frontend   | React.js, CSS       |
| Backend    | Node.js, Express    |
| Database   | MySQL               |

---

## Getting Started

### Prerequisites

- Node.js v20+
- MySQL 8+
- npm

### Installation

```terminal
# Clone the repository
git clone https://github.com/your-username/verifake.git
cd real-or-fake

# Install backend dependencies
npm install


### Environment Setup

Create a `.env` file in the `root` directory:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=realdb
PORT=3000
```

### Running the App

```terminal
# Start the backend and frontend
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## Usage

1. Enter a statement in the input field and click **Verify**
2. View the fact-check result and sentiment classification
3. Upload an image or paste an article title for additional checks

---

## License

MIT © Verifake
