# 🎟️ SnapTicket

https://snapticket.vercel.app/

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TMDB API](https://img.shields.io/badge/TMDB-API-01B4E4?style=for-the-badge&logo=the-movie-database)](https://www.themoviedb.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

## 📊 Repository Stats
![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=JJ2025-1&repo=Snaptickets&layout=compact&hide_border=true&title_color=01B4E4&text_color=ffffff&bg_color=121212)

**SnapTicket** is a premium movie ticket booking application designed for a friction-less "snap" booking experience. It combines a cinema-inspired aesthetic with modern full-stack technologies to deliver a high-performance, responsive platform for movie enthusiasts.

---

## 🌟 Key Features

### 🎬 Real-time Discovery
- **Live Sync:** Movie data is fetched directly from Supabase.
- **Dynamic Assets:** High-quality movie posters are pulled on-the-fly via the **TMDB API**, ensuring the UI always looks fresh.

### 💺 Advanced Booking Engine
- **Interactive Seat Mapping:** A visual grid with multi-tier pricing (Budget, Standard, Luxe).
- **Occupancy Management:** Instant seat status updates with double-booking prevention.

### 👤 Seamless User Experience
- **Login-Free Profiles:** Persistent user profiles (Name & Phone) stored in `localStorage` for rapid checkouts.
- **Mobile-First Design:** A fully responsive interface optimized for smartphones, tablets, and desktops.
- **Instant Digital Receipts:** Automated booking ID generation and detailed receipt views.

---

## 🛠️ Technical Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | [Next.js 15 (App Router)](https://nextjs.org/) |
| **Database** | [Supabase](https://supabase.com/) |
| **API** | [TMDB (The Movie Database)](https://www.themoviedb.org/) |
| **Styling** | Vanilla CSS (Modern CSS Modules) |
| **Language** | JavaScript (ES6+) |

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/snapticket.git
cd snapticket
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
TMDB_TOKEN=your_tmdb_bearer_token
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📁 Project Architecture

```text
C:\SnapTicket\snapticket\
├── app/
│   ├── actions.js      # Server-side logic & API integrations
│   ├── page.js         # Core application component
│   ├── globals.css     # Global theme & typography
│   └── page.module.css # Component-level modular styles
├── lib/
│   └── supabase.js     # Supabase client initialization
└── public/             # Static assets (SVG, Favicons)
```

---

## 🛡️ Engineering Standards
- **Server Actions:** All critical database operations are handled server-side for maximum security.
- **Performance:** Optimized fonts via `next/font` and efficient state management for zero layout shift.
- **Robustness:** Global error boundaries and network resilience for Supabase connection stability.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ❤️ for the Cinema community.**
