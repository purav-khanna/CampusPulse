# CampusPulse

CampusPulse is a comprehensive, MERN-stack campus engagement platform designed to streamline student activities, club operations, and event management. It provides role-based dashboard consoles that empower Students, Club Leaders, Professors, and Administrators to interact and manage campus events, announcements, and chat channels seamlessly.

🌐 Live Demo

🚀 Live Website: https://campuspulse-lt6p.onrender.com

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





# 🎓 CampusPulse

**CampusPulse** is an AI-powered campus engagement platform built using the MERN Stack. It helps students, professors, club leaders, and administrators stay connected through events, announcements, communities, real-time chat, and intelligent campus insights.

## 🌐 Live Demo

🚀 **Live Website:** https://campuspulse-lt6p.onrender.com

---

## 📌 Overview

CampusPulse centralizes all campus activities into a single platform where students can discover events, join clubs, receive announcements, communicate with peers, and interact with an AI-powered campus assistant.

The platform provides dedicated dashboards for different user roles, ensuring a personalized and efficient experience for every user.

---

## ✨ Features

### 🎯 Role-Based Dashboards

* Student Dashboard
* Professor Dashboard
* Club Leader Dashboard
* Admin Dashboard

### 📅 Event Management

* Create and manage campus events
* Event registration system
* Attendance tracking
* Event capacity management

### 🏛️ Club Management

* Create and manage clubs
* Join and leave clubs
* Club announcements
* Member management system

### 💬 Real-Time Chat

* Direct messaging
* Club conversations
* Real-time communication using Socket.io

### 📢 Announcements

* Campus-wide announcements
* Club-specific announcements
* Department notices

### 🤖 AI Assistant

* Gemini-powered campus assistant
* Campus information support
* Intelligent recommendations
* Smart engagement features

### 🔔 Notifications

* Event updates
* Club activities
* Registration confirmations
* Important campus alerts

### 📊 Analytics & Insights

* Student engagement metrics
* Club growth statistics
* Event participation reports

---

## 👥 User Roles

### 👨‍🎓 Student

* Browse events and clubs
* Register for events
* Join communities
* Chat with members
* Receive announcements

### 👑 Club Leader

* Manage club activities
* Create events
* Publish announcements
* Manage club members
* View club analytics

### 👨‍🏫 Professor

* Supervise clubs
* Review activities
* Publish academic announcements
* Monitor engagement

### 🛡️ Admin

* Manage platform users
* Monitor system activity
* Access administrative controls
* Manage campus-wide operations

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* React Router DOM
* Lucide React
* Recharts
* Vanilla CSS

### Backend

* Node.js
* Express.js
* Socket.io
* Multer

### Database

* MongoDB Atlas

### AI Integration

* Google Gemini API

### Deployment

* Render
* GitHub

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/purav-khanna/CampusPulse.git
cd CampusPulse
```

### Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### Environment Variables

#### Backend (.env)

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)

```env
VITE_BACKEND_URL=http://localhost:5000
VITE_API_BASE_URL=/api
```

### Run Application

```bash
npm run dev
```

---

## 📱 Responsive Design

CampusPulse is fully responsive and optimized for:

* Desktop 💻
* Laptop 🖥️
* Tablet 📱
* Mobile Devices 📲

---

## 📸 Screenshots

Add screenshots of:

* Home Page
* Student Dashboard
* Professor Dashboard
* Club Leader Dashboard
* Events Page
* Clubs Page
* Chat System
* AI Assistant

---

## 🔮 Future Enhancements

* Google Calendar Integration
* QR-Based Attendance System
* Club Funding & Budget Management
* Mobile Application
* Advanced Analytics Dashboard
* AI Event Recommendations
* Push Notifications

---

## 👨‍💻 Developer

**Purav Khanna**

GitHub: https://github.com/purav-khanna

---

## ⭐ Support

If you like this project, please give it a ⭐ on GitHub.
