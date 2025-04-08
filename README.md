# Final-year-visual-chatgpt
# 🧠 Visual ChatGPT (TypeScript + Express.js)

A full-stack Visual ChatGPT system built entirely using **TypeScript**, with a backend powered by **Express.js**. It combines language and vision capabilities using Hugging Face models to generate, understand, and interact with visual data.

---

## 🚀 Features

- 🧾 Text-to-Image Generation via API  
- 🖼️ Image Captioning and Understanding  
- 🔁 Visual ↔ Text conversation  
- ⚙️ Backend in **Express.js**, fully typed with TypeScript  
- 📦 Modular, scalable architecture  
- 🌐 API-first design for easy integration with frontend/UI  

---

## 🛠️ Tech Stack

| Layer       | Tech                          |
|-------------|-------------------------------|
| Backend     | Express.js (TypeScript)       |
| AI Models   | Hugging Face Transformers     |
| Language    | TypeScript                    |
| API Access  | REST (Hugging Face APIs)      |
     

---

## 📁 Project Structure

.
├── backend
│   ├── node_modules
│   ├── src
│   │   ├── uploads/
│   │   └── index.ts
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── Frontend
│   ├── node_modules
│   ├── public/
│   ├── src
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── bun.lockb
│   ├── components.json
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── .gitignore
│
└── README.md


## ⚙️ Cloning, Installation & Running

This project is divided into two main folders:

- `backend/` → Express.js server (TypeScript)
- `Frontend/` → Vite + React frontend (TypeScript)

Follow the steps below to clone the project, install dependencies, and run both servers.

---

### 🔁 1. Clone the Repository

```bash
git clone https://github.com/MJLakshmi2002/Final-year-visual-chatgpt.git
cd Final-year-visual-chatgpt

cd backend

# Install backend dependencies
npm install

#Add access token in .env file
#To run Backend
npm run dev

cd Frontend

# Install frontend dependencies
npm install
#To run Frontend
npm run dev

##🤝 Contributing
Pull requests and feedback are welcome! Fork the repo, make your improvements, and open a PR.

