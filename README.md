# 📚 Past Exam & Resource Hub

A modern, fast, and secure platform for university students to share, find, and rank academic resources like past exams, lecture notes, and assignments. Built with the cutting-edge Next.js 16 App Router.

## ✨ Features

- **Dynamic Resource Uploads:** Seamlessly upload PDFs using UploadThing infrastructure.
- **Auto-resolving Courses:** Users can assign resources to any course code. The backend intelligently auto-generates missing courses and universities on the fly to prevent database conflicts.
- **Interactive Ranking System:** A Reddit-style voting mechanism combined with download tracking dynamically calculates a `Score` for each resource (`Upvotes * 3 + Downloads - Downvotes * 2`), ensuring the highest-quality materials surface first.
- **Glassmorphism UI & Premium Aesthetics:** Designed with Tailwind CSS v4, featuring stunning gradients, frosted-glass effects, and highly polished responsive layouts.
- **Secure Authentication:** Passwordless and social logins powered by Better Auth.
- **Discussion Boards:** Built-in comment system on every resource for collaborative learning snippet debates.

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Styling:** Tailwind CSS v4 + Shadcn UI + Lucide Icons
- **Database:** PostgreSQL (Neon Serverless)
- **ORM:** Drizzle ORM
- **Authentication:** Better Auth
- **File Storage:** UploadThing v7

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd resource-hub
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Local Environment
Create a `.env.local` file in the root directory and add your keys:

```env
# Database
DATABASE_URL="postgresql://[user]:[password]@[host]/[dbname]?sslmode=require"

# Authentication
BETTER_AUTH_SECRET="your-super-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# File Uploads (v7 format required)
UPLOADTHING_TOKEN="eyJ..."
```

*(Note: Ensure your UploadThing Token is correctly formatted from the v7 dashboard. The legacy `SECRET` and `APP_ID` are no longer supported).*

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📖 Database Schema

- `users` / `sessions` / `accounts`: Handled by Better Auth.
- `universities` & `courses`: Relational setup mapping unique course codes to generic or specific universities.
- `resources`: The core entity storing file metadata, scores, and relational keys.
- `votes`: Prevents duplicate voting with a unique compound index on `(user_id, resource_id)`.
- `comments`: Allows hierarchical or flat discussions on resources.

## 🤝 Contributing

Contributions are welcome! If you're adding new features or fixing bugs, please ensure your changes pass TypeScript checks and maintain the premium UI aesthetic.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
