# <p align="center">🎟️ SnapTicket - Premium Cinema Experience</p>

<p align="center">
  <img src="https://snapticket.vercel.app/favicon.ico" width="100" height="100">
</p>

<p align="center">
  <a href="https://snapticket.vercel.app/">
    <img src="https://img.shields.io/badge/Live_Demo-SnapTicket-ffc400?style=for-the-badge&logo=vercel" alt="Live Demo">
  </a>
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase">
</p>

---

## 📸 App Preview

<p align="center">
  <img src="public/images/hero_banner.png" alt="SnapTicket Hero Section" width="100%" style="border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
</p>

> **Note:** Above is the cinematic hero section featuring high-quality posters and a seamless booking interface.

---

## <font color="#ffc400">✨ Core Features</font>

### 🎬 Real-time Movie Discovery
*   **Live Sync:** Movie data fetched directly from Supabase.
*   **Dynamic Posters:** High-resolution assets pulled via TMDB API.

### 💺 Advanced Seat Engine
*   **Interactive Mapping:** Visual grid with multi-tier pricing (**Prime** & **Classic**).
*   **Occupancy Control:** Real-time seat status updates and double-booking prevention.

### 👤 Frictionless UX
*   **Rapid Checkout:** Persistent user profiles stored in `localStorage`.
*   **Instant Receipts:** Automatic booking ID generation and digital receipt views.
*   **Mobile-First:** Fully responsive design for all devices.

---

## <font color="#3ECF8E">🛠️ Technical Excellence</font>

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router) |
| **Database** | Supabase (Postgres) |
| **Styling** | Vanilla CSS (Modern CSS Modules) |
| **API** | TMDB (The Movie Database) |
| **Auth/State** | LocalStorage & Server Actions |

---

## 🚀 Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/JJ2025-1/snapticket.git
   npm install
   ```

2. **Environment Setup**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   TMDB_TOKEN=your_token
   ```

3. **Launch**
   ```bash
   npm run dev
   ```

---

<p align="center">
  <b>Built with ❤️ for the Global Cinema Community.</b><br>
  <i>Empowering movie buffs with a "snap" booking experience.</i>
</p>
