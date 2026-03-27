# 🎮 GameZone — Ultra-Premium Management System

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Software Architecture](https://img.shields.io/badge/Architecture-Clean_MVC-blue.svg)](https://en.wikipedia.org/wiki/Clean_Architecture)
[![Code Review](https://img.shields.io/badge/Code_Review-Senior_Developer-orange.svg)](https://en.wikipedia.org/wiki/Code_review)

**GameZone** is a professional-grade Telegram Mini-App ecosystem designed for gaming clubs. It features a robust real-time synchronization engine, automated billing, and an ultra-premium Super Admin dashboard for managing multi-club operations.

---

## 🏛️ Project Architecture

The codebase follows a modular, scalable architecture inspired by **Clean Architecture** principles, ensuring high maintainability and stability.

### 📂 Directory Structure

```text
gamezone/
├── 🤖 bot/            # Telegram Bot (Node.js/Telegraf) - Interaction Layer
├── 📱 mini-app/       # Frontend (React/Vite) - User & Admin Interface
├── 🚀 server/         # Backend (Node.js/Express/Sequelize) - Core Logic & API
│   ├── src/
│   │   ├── api/       # Controllers, Routes, Middlewares
│   │   ├── core/      # Domain Logic & Services (Billing, Sockets)
│   │   ├── infra/     # Database (Models & Connection)
│   │   ├── config/    # Environment Configuration
│   │   └── shared/    # Common Utility functions
├── 📄 .env            # Global environment configuration
└── 📄 README.md       # Documentation
```

### ⚡ Key Features

- **Real-time Engine:** Bi-directional communication using Socket.io for immediate status updates.
- **Automated Billing:** Background services handle per-minute cost calculation and session management.
- **Super Admin Dashboard:** A glassmorphic, responsive interface for club management (CRUD, image uploads, location selection).
- **Broadcast System:** Centralized notification engine for mass-messaging club managers and players.
- **Role-Based Access Control (RBAC):** Secure authorization tiers (Super Admin, Manager, Player).

---

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js, Sequelize ORM (SQLite/PostgreSQL compatible).
- **Frontend:** React.js, Vite, Framer Motion (Animations), Leaflet (Maps).
- **Real-time:** Socket.io, WebSocket Protocol.
- **Communication:** Telegram Bot API (Mini-app integration).
- **Styling:** Vanilla CSS3 with Modern Aesthetics (Glassmorphism, Dark UI).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v20+)
- npm or yarn

### 2. Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/gamezone.git
   cd gamezone
   ```

2. **Setup Environment Variables:**
   Configure the `.env` file in the root directory following the `.env.example`.

3. **Install Dependencies:**
   ```bash
   # Root
   npm install
   
   # Server
   cd server && npm install
   
   # Mini App
   cd ../mini-app && npm install
   ```

### 3. Running the Application

**Development Mode:**
```bash
# Start Server & WebSockets
cd server && npm run dev

# Start Mini App (Frontend)
cd ../mini-app && npm run dev
```

**Production Mode:**
```bash
# Build Frontend
cd mini-app && npm run build

# Start Production Server
cd ../server && npm start
```

---

## 🛡️ Security & Reliability

- **JWT Authentication:** Stateful and secure token-based user management.
- **Async Handling:** Global error handling middleware for fail-safe request processing.
- **Data Integrity:** Sequelize transactions and audit logging for financial accuracy.

---

## 👨‍💻 Developer & Attribution

Built with passion by **Antigravity AI (Senior Architect Mode)**. 
Designed for high-performance and premium user experience.

---

## 📄 License

This project is proprietary. All rights reserved.
