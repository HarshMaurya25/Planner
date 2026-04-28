# 🚀 Ultimate Study & Performance Planner

A modern, mobile-first, collaborative task management application designed for students and high-performers. Built with **React**, **Vite**, **Supabase**, and **Tailwind CSS**.

## ✨ Features

### 📁 Smart Folder Management
- **Deep Hierarchy**: Organize tasks into folders with up to 5 levels of nesting.
- **Recursive Operations**: Move, duplicate, or delete entire folder trees with ease.
- **Color Coding**: Customize folders with a vibrant palette to visually categorize your work.

### 👥 Real-time Collaboration
- **Team Sharing**: Share folders with teammates for real-time synchronization.
- **Role Management**: Assign owners and members. Members can see and edit the same tasks instantly.
- **Assignment System**: Assign specific tasks to team members to keep everyone accountable.
- **Copy Mode**: Send a standalone copy of a folder to another user if you don't want real-time sync.

### 📅 Advanced Calendar & Planning
- **Interactive Calendar**: View all your deadlines and important dates in a beautiful month-view grid.
- **Marked Dates**: Highlight exam dates, birthdays, or project milestones.
- **Automatic Archiving**: Past events are automatically moved to an archive to keep your calendar clean.

### 🗑️ Smart Garbage Collection
- **24-Hour Soft Delete**: Items you delete (Folders, Tasks, Dates) are held in a soft-delete state for exactly 24 hours.
- **Auto-Purge**: The system automatically cleans up the database every 24 hours, giving you a safety net if you accidentally delete something.

### 📱 Premium UX/UI
- **Mobile First**: Fully responsive design with an intuitive mobile bottom bar.
- **Glassmorphism**: Modern UI with subtle blurs, smooth gradients, and micro-animations.
- **Quick Actions**: Bulk reset status, priority, or colors for entire folders.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons, Date-fns.
- **Styling**: Tailwind CSS (Vanilla CSS base).
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time).
- **State Management**: Zustand.

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd study-website
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Supabase
1. Create a new project on [Supabase](https://supabase.com/).
2. Run the SQL script found in `supabase/schema.sql` in the SQL Editor.
3. Copy your project URL and Anon Key.

### 4. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Run the app
```bash
npm run dev
```

## 📂 Project Structure

- `src/components`: Reusable UI components (Modals, Sidebar, etc.).
- `src/pages`: Main application views (Calendar, Tasks, Groups).
- `src/store`: Zustand state management and Supabase API logic.
- `src/lib`: Supabase client initialization.
- `supabase/`: Database schema and migration scripts.

## 📜 License
This project is for educational purposes.
