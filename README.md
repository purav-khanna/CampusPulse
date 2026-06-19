# CampusPulse

CampusPulse is a comprehensive, MERN-stack campus engagement platform designed to streamline student activities, club operations, and event management. It provides role-based dashboard consoles that empower Students, Club Leaders, Professors, and Administrators to interact and manage campus events, announcements, and chat channels seamlessly.

---

## 🚀 Key Features

- **Role-Based Consoles**: Custom experiences and workspaces for Students, Club Leaders, Professors, and Admins.
- **Dynamic Event Scheduling**: Register, manage capacity, and track student attendance for campus events.
- **Interactive Chat**: Real-time communication and messaging channels between students, leaders, and professors.
- **AI-Powered Analytics & Summary**: Smart insights on student engagement, announcement summarization, and roster growth metrics.
- **Announcements Feed**: Club bulletins broadcasted directly to the student dashboard.
- **Members & Roster Management**: Clean invitation systems, registration approval workflows, and role assignments.

---

## 👥 User Roles

### 👨‍🎓 Student
- Discover clubs and events on campus.
- Join clubs and register for upcoming events.
- Participate in group chat channels.
- Receive direct, real-time notifications and announcements.

### 👑 Club Leader
- Initialize and manage club details (logo, banner, description).
- Create, schedule, and delete club events.
- Publish and broadcast announcements.
- Invite students to join and manage active members.
- Review analytics and registrations.

### 👨‍🏫 Professor
- Act as Faculty Advisor to oversee club activities.
- Review and approve club creation requests.
- Track registration capacities and manage campus-wide event logs.
- Publish department-level announcements.

### 🛡️ Admin
- Central administration console to monitor all platform activity.
- System-wide configuration, metrics overview, and user account management.

---

## 💻 Tech Stack

- **Frontend**: React (Mite/Vite client), Vanilla CSS, Lucide React (Icons), Recharts (Data Visualizations), React Router DOM (v7 Routing).
- **Backend**: Express (Node.js REST API Server), Multer (File uploads), Socket.io (Real-time events).
- **AI Engine**: Google Gemini Generative AI (`@google/generative-ai`) for smart event suggestions and announcement summarizations.

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/purav-khanna/CampusPulse.git
cd CampusPulse
```

### 2. Install Dependencies
Install dependencies for both frontend and backend:
```bash
# Install root script runner dependencies (if any)
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Environment Variables Setup
Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
GEMINI_API_KEY=your_google_gemini_api_key
JWT_SECRET=your_jwt_secret_key
MONGO_URI=your_mongodb_connection_uri
```

Create a `.env` file inside the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000
```

### 4. Run the Project Locally
Run the development environment from the root directory:
```bash
# Runs frontend and backend concurrently
npm run dev
```

---

## 📊 Screenshots

*Screenshots demonstrating dashboard consoles, real-time chats, and modal wizards will be placed here.*

---

## 🔮 Future Enhancements

- **Calendar Integration**: Sync campus events directly with Google Calendar or Microsoft Outlook.
- **QR Attendance Check-in**: Scan QR codes on-site to dynamically check in students and log attendance.
- **Budgeting & Funding Tracker**: Dedicated dashboard modules for clubs to request funding and manage budgets.
