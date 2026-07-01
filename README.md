# PDF Signature & Watermark Studio

A robust web application designed to securely handle document signing, watermarking, and text embedding. Working with PDF manipulation in the browser is a complex technical challenge, and this project represents a massive amount of hard work, trial and error, and problem-solving to get the file processing exactly right.

## 🚀 Key Features

*   **Digital Signatures:** Place a signature directly onto the document. This is perfect for signing examples like NDAs, lease agreements, or freelance contracts.
*   **Custom Watermarking:** Protect your intellectual property by overlaying text across the document. You can easily add examples like "CONFIDENTIAL", "DRAFT", or "DO NOT COPY".
*   **Permanent Text Burning:** Unlike simple visual overlays, this app permanently embeds and flattens the text directly into the PDF's core data so it cannot be easily edited or removed by the recipient.

## 🛠️ Built With

This project was built using modern web technologies to ensure fast performance and reliable document processing:

*   **React** (User Interface)
*   **Vite** (Build Tool and Development Server)
*   **pdf-lib** (Core PDF manipulation, flattening, and text burning)
*   **pdfjs-dist** (PDF rendering)
*   **Tailwind CSS** (Styling and layout)

## 💻 Getting Started

If you want to run a local copy of this project on your own machine, follow these steps:

1. Clone this repository to your computer.
2. Open your terminal and navigate into the project folder.
3. Run `npm install` to download all necessary dependencies.
4. Run `npm run dev` to start the local development server.
5. Open the local address (usually `http://localhost:3000` or `http://localhost:5173`) in your web browser.