import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data.json');

// SHA-256 Hashing helper
export function hashPassword(password) {
  if (!password) return '';
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper to check if file exists and read it
export function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      initializeDb();
    }
    let raw = fs.readFileSync(DB_FILE, 'utf8');
    let db = JSON.parse(raw);
    
    let dbChanged = false;
    if (!db.registrationsMigrated) {
      migrateRegistrations(db);
      dbChanged = true;
    }
    
    if (!db.passwordsMigrated) {
      // Load current db from memory/file and migrate
      db.users.forEach(u => {
        if (!u.passwordHash) {
          u.passwordHash = hashPassword('password123');
        }
      });
      db.passwordsMigrated = true;
      dbChanged = true;
    }

    if (!db.user_settings) {
      db.user_settings = [];
      dbChanged = true;
    }

    if (!db.joinRequests) {
      db.joinRequests = [
        { id: 'jr1', clubId: 1, userId: 101, name: 'Rahul Sharma', department: 'CSE', year: '3rd Year', avatar: 'RS', status: 'pending', requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'jr2', clubId: 1, userId: 102, name: 'Nisha Verma', department: 'IT', year: '2nd Year', avatar: 'NV', status: 'pending', requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'jr3', clubId: 1, userId: 103, name: 'Dev Patel', department: 'ECE', year: '4th Year', avatar: 'DP', status: 'pending', requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() }
      ];
      dbChanged = true;
    }

    // Migration: Auto-create clubs for Club Leaders without a clubId
    let leadersMigrated = false;
    if (db.users) {
      db.users.forEach(u => {
        const isLeader = u.role && (u.role.toLowerCase() === 'clubleader' || u.role.toLowerCase() === 'club_leader');
        if (isLeader && !u.clubId) {
          const defaultClubId = Date.now() + Math.floor(Math.random() * 1000);
          const defaultClub = {
            id: defaultClubId,
            name: `${u.name}'s Club`,
            logo: u.name ? u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'CL',
            category: 'Technical',
            description: `Welcome to ${u.name}'s Club. Managed by ${u.name}.`,
            longDescription: `Welcome to ${u.name}'s Club. Managed by ${u.name}. This club was automatically initialized for the club leader.`,
            memberCount: 1,
            color: '#6366f1',
            founded: new Date().getFullYear().toString(),
            president: u.name,
            presidentAvatar: u.name ? u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'CL',
            tags: ['general', 'technical'],
            isJoined: true,
            events: [],
            leaderId: u.id,
            ownerId: u.id
          };
          if (!db.clubs) db.clubs = [];
          db.clubs.push(defaultClub);
          u.clubId = defaultClubId;
          if (!u.joinedClubs) u.joinedClubs = [];
          u.joinedClubs.push(defaultClubId);
          leadersMigrated = true;
        }
      });
    }
    if (leadersMigrated) {
      dbChanged = true;
    }

    if (!db.messagesMigrated) {
      if (!db.messages) db.messages = [];
      db.messages.forEach(m => {
        if (m.isRead === undefined) {
          m.isRead = m.readStatus === 'read';
        }
        if (m.text === undefined) {
          m.text = m.message || '';
        }
        if (m.timestamp === undefined) {
          m.timestamp = m.createdAt || new Date().toISOString();
        }
      });
      db.messagesMigrated = true;
      dbChanged = true;
    }
    // Migration: ensure events have creatorId, announcements have authorId, and users have empty arrays
    let extraMigrated = false;
    if (db.events) {
      db.events.forEach(e => {
        if (e.creatorId === undefined) {
          e.creatorId = 2; // Default to Dr. Rajesh Kumar
          extraMigrated = true;
        }
      });
    }
    if (db.announcements) {
      db.announcements.forEach(a => {
        if (a.authorId === undefined) {
          if (a.author === 'Dr. Rajesh Kumar') {
            a.authorId = 2;
          } else if (a.author === 'professor') {
            a.authorId = 1781773403397;
          } else {
            a.authorId = 2;
          }
          extraMigrated = true;
        }
      });
    }
    if (db.users) {
      db.users.forEach(u => {
        if (!u.joinedClubs) {
          u.joinedClubs = [];
          extraMigrated = true;
        }
        if (!u.registeredEvents) {
          u.registeredEvents = [];
          extraMigrated = true;
        }
        if (!u.savedEvents) {
          u.savedEvents = [];
          extraMigrated = true;
        }
      });
    }
    if (extraMigrated) {
      dbChanged = true;
    }
    
    if (dbChanged) {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    }
    
    return db;
  } catch (err) {
    console.error('Error reading database file:', err);
    return getSeedData();
  }
}

// Automatically populate registrations table to match registeredSeats
function migrateRegistrations(db) {
  if (!db.registrations) {
    db.registrations = [];
  }
  
  db.events.forEach(event => {
    const currentRegs = db.registrations.filter(r => r.eventId === event.id && r.registrationStatus === 'registered');
    const needed = (event.registeredSeats || event.registrations || 0) - currentRegs.length;
    if (needed > 0) {
      for (let i = 0; i < needed; i++) {
        db.registrations.push({
          id: Date.now() + Math.random(),
          userId: 900000 + event.id * 10000 + i,
          eventId: event.id,
          registrationStatus: 'registered'
        });
      }
    }
  });

  db.registrationsMigrated = true;
  // Use simple write since it writes db
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    console.log('Database registrations successfully migrated with mock records.');
  } catch (err) {
    console.error('Error migrating registrations database:', err);
  }
}

// Helper to write to database
export function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// Initialize database with default seed data if it doesn't exist
export function initializeDb() {
  if (fs.existsSync(DB_FILE)) {
    return;
  }
  const seed = getSeedData();
  writeDb(seed);
  console.log('Database initialized with default seed data.');
}

function getSeedData() {
  return {
    users: [
      {
        id: 1,
        name: "Priya Sharma",
        email: "priya.sharma@campus.edu",
        role: "student",
        department: "Computer Science",
        year: "3rd Year",
        bio: "Passionate about AI and web development. Love building things that matter. Currently exploring machine learning and its applications in education.",
        interests: ["AI", "Web Development", "Hackathons", "Photography"],
        joinedClubs: [1, 3, 6, 10],
        registeredEvents: [1, 2, 3],
        savedEvents: [5, 7],
        notifications: 5,
        joinedDate: "2024-08-15"
      },
      {
        id: 2,
        name: "Dr. Rajesh Kumar",
        email: "rajesh.kumar@campus.edu",
        role: "professor",
        department: "Computer Science & Engineering",
        designation: "Associate Professor",
        bio: "20+ years in academia. Research interests include distributed systems and cloud computing. Passionate about mentoring the next generation of engineers.",
        specialization: "Distributed Systems, Cloud Computing",
        courses: ["CS301 - Data Structures", "CS502 - Cloud Computing", "CS601 - Research Methodology"],
        joinedDate: "2020-01-10"
      },
      {
        id: 3,
        name: "Arjun Mehta",
        email: "arjun.mehta@campus.edu",
        role: "clubLeader",
        department: "Information Technology",
        year: "4th Year",
        bio: "President of Tech Club. Organizing hackathons and building a community of tech enthusiasts on campus.",
        club: "Tech Club",
        clubId: 1,
        joinedDate: "2023-08-20"
      },
      {
        id: 4,
        name: "Purav",
        email: "Purav123@admin.com",
        role: "admin",
        department: "Administration",
        designation: "Platform Administrator",
        bio: "Managing CampusPulse platform operations.",
        permissions: "full_access",
        joinedDate: "2023-01-01"
      }
    ],
    events: [
      {
        id: 1,
        title: "TechSpark Hackathon 2026",
        description: "A 48-hour hackathon bringing together the brightest student minds to build innovative solutions. Form teams of 2-4 and compete for exciting prizes including internship opportunities and tech gadgets. Mentors from top tech companies will be available throughout the event.",
        category: "Hackathon",
        date: "2026-06-20",
        time: "09:00 AM",
        endTime: "06:00 PM",
        venue: "Innovation Lab, Block A",
        organizer: "Tech Club",
        organizerAvatar: "TC",
        banner: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop",
        totalSeats: 200,
        registeredSeats: 156,
        tags: ["coding", "innovation", "prizes"],
        isFeatured: true,
        isApproved: true,
        registrations: 156
      },
      {
        id: 2,
        title: "AI & Machine Learning Workshop",
        description: "An intensive hands-on workshop covering the fundamentals of AI and ML. Learn about neural networks, deep learning, and practical applications. Bring your laptops with Python pre-installed. Suitable for beginners and intermediate learners.",
        category: "Workshop",
        date: "2026-06-18",
        time: "02:00 PM",
        endTime: "05:00 PM",
        venue: "Computer Science Lab 3",
        organizer: "AI Research Group",
        organizerAvatar: "AI",
        banner: "/images/ai_workshop_banner.png",
        totalSeats: 60,
        registeredSeats: 52,
        tags: ["AI", "machine-learning", "python"],
        isFeatured: true,
        isApproved: true,
        registrations: 52
      },
      {
        id: 3,
        title: "Annual Cultural Fest - Rhythm 2026",
        description: "The biggest cultural event of the year is here! Three days of music, dance, drama, and art. Featuring performances by student bands, dance troupes, and special guest artists. Open to all students and faculty.",
        category: "Cultural",
        date: "2026-06-25",
        time: "10:00 AM",
        endTime: "09:00 PM",
        venue: "Main Auditorium & Campus Grounds",
        organizer: "Cultural Committee",
        organizerAvatar: "CC",
        banner: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=400&fit=crop",
        totalSeats: 500,
        registeredSeats: 342,
        tags: ["music", "dance", "art", "festival"],
        isFeatured: true,
        isApproved: true,
        registrations: 342
      },
      {
        id: 4,
        title: "Inter-College Basketball Tournament",
        description: "The annual inter-college basketball championship. Teams from 12 colleges will compete in a knockout format. Come support your team and enjoy thrilling matches!",
        category: "Sports",
        date: "2026-06-22",
        time: "08:00 AM",
        endTime: "06:00 PM",
        venue: "Sports Complex, Court 1",
        organizer: "Sports Council",
        organizerAvatar: "SC",
        banner: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop",
        totalSeats: 300,
        registeredSeats: 189,
        tags: ["basketball", "sports", "tournament"],
        isFeatured: false,
        isApproved: true,
        registrations: 189
      },
      {
        id: 5,
        title: "Startup Pitch Competition",
        description: "Got a startup idea? Present it to a panel of investors and industry leaders. Top 3 teams get seed funding and incubation support. Register your team and submit your pitch deck by June 19.",
        category: "Seminar",
        date: "2026-06-23",
        time: "11:00 AM",
        endTime: "04:00 PM",
        venue: "Entrepreneurship Cell, Block D",
        organizer: "E-Cell",
        organizerAvatar: "EC",
        banner: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=400&fit=crop",
        totalSeats: 100,
        registeredSeats: 67,
        tags: ["startup", "entrepreneurship", "pitch"],
        isFeatured: false,
        isApproved: true,
        registrations: 67
      },
      {
        id: 6,
        title: "Web Development Bootcamp",
        description: "A week-long bootcamp covering modern web development with React, Node.js, and MongoDB. By the end, you'll have built a complete full-stack application. Limited seats!",
        category: "Workshop",
        date: "2026-06-28",
        time: "10:00 AM",
        endTime: "01:00 PM",
        venue: "IT Lab 2, Block B",
        organizer: "Code Club",
        organizerAvatar: "CD",
        banner: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=400&fit=crop",
        totalSeats: 40,
        registeredSeats: 38,
        tags: ["web", "react", "fullstack"],
        isFeatured: false,
        isApproved: true,
        registrations: 38
      }
    ],
    clubs: [
      {
        id: 1,
        name: "Tech Club",
        logo: "TC",
        category: "Technical",
        description: "The largest technical community on campus. We organize hackathons, coding contests, workshops, and tech talks. Whether you're a beginner or an expert, there's a place for you.",
        longDescription: "Tech Club is the premier technology community at our campus, founded in 2018 with a mission to foster innovation and technical excellence. We host weekly coding sessions, monthly hackathons, and annual tech festivals. Our members have gone on to work at Google, Microsoft, Amazon, and various startups. We welcome students from all departments who share a passion for technology.",
        memberCount: 342,
        color: "#6366f1",
        founded: "2018",
        president: "Arjun Mehta",
        presidentAvatar: "AM",
        tags: ["coding", "hackathons", "web-dev", "AI"],
        recentActivity: "Hosted TechSpark Hackathon with 200+ participants",
        isJoined: true,
        events: [1, 6, 9],
        leaderId: 3,
        ownerId: 3
      },
      {
        id: 2,
        name: "Cultural Committee",
        logo: "CC",
        category: "Cultural",
        description: "We bring campus to life with music, dance, drama, and art. From annual fests to intimate jam sessions, we celebrate creativity in every form.",
        longDescription: "The Cultural Committee is the heart and soul of campus cultural life. We organize the annual cultural festival 'Rhythm', manage all inter-college cultural competitions, and support student artists. Our sub-cells include Music, Dance, Drama, Fine Arts, and Literary Arts.",
        memberCount: 256,
        color: "#ec4899",
        founded: "2015",
        president: "Ananya Das",
        presidentAvatar: "AD",
        tags: ["music", "dance", "drama", "art"],
        recentActivity: "Preparing for Rhythm 2026 - Annual Cultural Fest",
        isJoined: false,
        events: [3, 12],
        leaderId: null,
        ownerId: null
      },
      {
        id: 3,
        name: "Sports Council",
        logo: "SC",
        category: "Sports",
        description: "Promoting fitness and sportsmanship across campus. We manage all inter and intra-college sports events, from cricket to athletics.",
        longDescription: "The Sports Council oversees all sporting activities on campus. We manage facilities, organize tournaments, coordinate with other colleges for inter-college events, and promote fitness culture. Our teams have won multiple state-level championships.",
        memberCount: 189,
        color: "#22c55e",
        founded: "2014",
        president: "Rahul Kapoor",
        presidentAvatar: "RK",
        tags: ["cricket", "basketball", "football", "athletics"],
        recentActivity: "Inter-College Basketball Tournament coming up!",
        isJoined: true,
        events: [4, 10],
        leaderId: null,
        ownerId: null
      },
      {
        id: 7,
        name: "AI Research Group",
        logo: "AI",
        category: "Technical",
        description: "Exploring the frontiers of artificial intelligence. We conduct research projects, reading groups, and hands-on ML workshops.",
        longDescription: "The AI Research Group brings together students passionate about artificial intelligence and machine learning. We run paper reading groups, collaborative research projects, and practical ML workshops. Our members have published papers in top conferences including NeurIPS and ICML.",
        memberCount: 112,
        color: "#14b8a6",
        founded: "2020",
        president: "Dr. Neha Gupta",
        presidentAvatar: "NG",
        tags: ["AI", "machine-learning", "research", "deep-learning"],
        recentActivity: "ML Workshop with hands-on TensorFlow session",
        isJoined: false,
        events: [2],
        leaderId: null,
        ownerId: null
      }
    ],
    registrations: [
      { id: 1, userId: 1, eventId: 1, registrationStatus: "registered" },
      { id: 2, userId: 1, eventId: 2, registrationStatus: "registered" },
      { id: 3, userId: 1, eventId: 3, registrationStatus: "registered" }
    ],
    savedEvents: [
      { id: 1, userId: 1, eventId: 5 },
      { id: 2, userId: 1, eventId: 7 }
    ],
    comments: [
      { id: 1, userId: 3, eventId: 1, user: "Arjun Patel", avatar: "AP", text: "Can't wait for this! Already forming my team.", time: "2 hours ago", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { id: 2, userId: 1, eventId: 1, user: "Priya Sharma", avatar: "PS", text: "Will there be food provided during the hackathon?", time: "1 hour ago", createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
      { id: 3, userId: 3, eventId: 1, user: "Organizer", avatar: "TC", text: "Yes! Meals and snacks will be provided throughout the event.", time: "45 min ago", createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
      { id: 4, userId: 6, eventId: 2, user: "Rahul Kumar", avatar: "RK", text: "Do we need any prior ML experience?", time: "3 hours ago", createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() }
    ],
    notifications: [
      { id: 1, userId: 1, type: "event", title: "TechSpark Hackathon is tomorrow!", message: "Don't forget — the hackathon starts at 9 AM in Innovation Lab, Block A. Make sure your team is ready!", time: "10 min ago", isRead: false, icon: "calendar", link: "/events/1" },
      { id: 2, userId: 1, type: "club", title: "New post in Tech Club", message: "Arjun Mehta shared an update about the upcoming workshop series.", time: "30 min ago", isRead: false, icon: "users", link: "/clubs/1" },
      { id: 3, userId: 1, type: "announcement", title: "Professor Announcement", message: "Dr. Rajesh Kumar posted: 'Assignment 3 deadline extended to June 22nd.'", time: "1 hour ago", isRead: false, icon: "megaphone", link: "/dashboard" },
      { id: 4, userId: 1, type: "registration", title: "Registration Confirmed", message: "You're registered for AI & Machine Learning Workshop on June 18th.", time: "2 hours ago", isRead: true, icon: "check-circle", link: "/events/2" }
    ],
    announcements: [
      {
        id: 1,
        title: "Assignment 3 Deadline Extended",
        content: "Due to multiple requests, the deadline for Assignment 3 (Data Structures) has been extended to June 22nd, 2026. Please make sure to submit your solutions via the portal before 11:59 PM.",
        author: "Dr. Rajesh Kumar",
        authorAvatar: "RK",
        department: "Computer Science",
        date: "June 14, 2026",
        priority: "high",
        aiSummary: "Assignment 3 deadline moved to June 22nd. Submit via portal by 11:59 PM."
      },
      {
        id: 2,
        title: "Mid-Semester Exam Schedule Released",
        content: "The mid-semester examination schedule for all departments has been published. Exams will begin on July 7th and conclude on July 15th. Please check the examination portal for your specific schedule and seat assignments.",
        author: "Examination Cell",
        authorAvatar: "EC",
        department: "Administration",
        date: "June 13, 2026",
        priority: "high",
        aiSummary: "Mid-sem exams from July 7-15. Check portal for schedule and seat numbers."
      }
    ],
    resources: [
      {
        id: 1,
        title: "Web Dev Bootcamp",
        description: "A comprehensive guide to full-stack web development. Perfect for beginners and intermediate developers. Covers HTML, CSS, JavaScript, React, Node.js, Express, and MongoDB.",
        type: "Course / Tutorial",
        author: "Code Club",
        rating: 4.9,
        reviews: 124,
        difficulty: "Beginner to Advanced",
        duration: "6 Weeks",
        topics: [
          "HTML5 & CSS3: Semantic markup, flexbox, grid, and animations",
          "JavaScript (ES6+): Closures, async/await, and DOM manipulation",
          "React: Hooks, state management (Redux/Context), and routing",
          "Node.js & Express: Building RESTful APIs and middleware",
          "MongoDB: Mongoose schemas, queries, and aggregations",
          "Deployment: Deploying to Vercel, Render, and AWS"
        ],
        materials: [
          { name: "Syllabus Guide (PDF)", url: "#" },
          { name: "Starter Github Repo", url: "#" },
          { name: "Video Playlist (YouTube)", url: "#" },
          { name: "Discord Support Server", url: "#" }
        ],
        tags: ["web", "react", "node", "fullstack"]
      }
    ],
    joinRequests: [
      { id: 'jr1', clubId: 1, userId: 101, name: 'Rahul Sharma', department: 'CSE', year: '3rd Year', avatar: 'RS', status: 'pending', requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'jr2', clubId: 1, userId: 102, name: 'Nisha Verma', department: 'IT', year: '2nd Year', avatar: 'NV', status: 'pending', requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'jr3', clubId: 1, userId: 103, name: 'Dev Patel', department: 'ECE', year: '4th Year', avatar: 'DP', status: 'pending', requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() }
    ]
  };
}
