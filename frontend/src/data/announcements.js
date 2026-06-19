export const announcements = [
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
  },
  {
    id: 3,
    title: "Library Hours Extended for Exam Season",
    content: "Starting June 16th, the central library will be open from 7 AM to 11 PM to support students during exam preparation. Additional reading rooms on the 3rd floor will also be available.",
    author: "Central Library",
    authorAvatar: "CL",
    department: "Library Services",
    date: "June 12, 2026",
    priority: "normal",
    aiSummary: "Library open 7 AM-11 PM starting June 16th. Extra reading rooms on 3rd floor."
  },
  {
    id: 4,
    title: "Guest Lecture: Future of Quantum Computing",
    content: "We are pleased to announce a guest lecture by Dr. Sarah Mitchell from MIT on 'The Future of Quantum Computing' on June 24th at 3 PM in the Grand Auditorium. All students and faculty are invited to attend.",
    author: "Dr. Neha Gupta",
    authorAvatar: "NG",
    department: "Computer Science",
    date: "June 11, 2026",
    priority: "normal",
    aiSummary: "Guest lecture by MIT's Dr. Sarah Mitchell on Quantum Computing — June 24, 3 PM, Grand Auditorium."
  },
  {
    id: 5,
    title: "Campus Wi-Fi Maintenance",
    content: "Scheduled maintenance for campus Wi-Fi will take place on June 17th from 2 AM to 6 AM. Internet services may be intermittent during this period. We apologize for the inconvenience.",
    author: "IT Department",
    authorAvatar: "IT",
    department: "IT Services",
    date: "June 10, 2026",
    priority: "low",
    aiSummary: "Wi-Fi maintenance on June 17, 2-6 AM. Expect intermittent connectivity."
  }
];

export const stats = {
  totalEvents: 248,
  activeClubs: 32,
  activeUsers: 4520,
  upcomingSessions: 18,
  totalRegistrations: 12850,
  weeklyEngagement: [
    { day: "Mon", events: 12, users: 340 },
    { day: "Tue", events: 8, users: 280 },
    { day: "Wed", events: 15, users: 420 },
    { day: "Thu", events: 10, users: 310 },
    { day: "Fri", events: 18, users: 480 },
    { day: "Sat", events: 22, users: 520 },
    { day: "Sun", events: 6, users: 190 }
  ],
  monthlyRegistrations: [
    { month: "Jan", count: 450 },
    { month: "Feb", count: 620 },
    { month: "Mar", count: 780 },
    { month: "Apr", count: 540 },
    { month: "May", count: 890 },
    { month: "Jun", count: 1050 }
  ],
  categoryDistribution: [
    { name: "Technical", value: 35 },
    { name: "Cultural", value: 25 },
    { name: "Sports", value: 15 },
    { name: "Workshop", value: 12 },
    { name: "Seminar", value: 8 },
    { name: "Hackathon", value: 5 }
  ],
  topClubs: [
    { name: "Tech Club", members: 342, events: 28 },
    { name: "Cultural Committee", members: 256, events: 22 },
    { name: "Social Service League", members: 203, events: 15 },
    { name: "Sports Council", members: 189, events: 18 },
    { name: "Code Club", members: 167, events: 14 }
  ]
};

export const testimonials = [
  {
    id: 1,
    name: "Aisha Khan",
    role: "Computer Science, 3rd Year",
    avatar: "AK",
    text: "CampusPulse completely changed how I experience campus life. I discovered clubs I never knew existed and haven't missed a single event this semester!",
    rating: 5
  },
  {
    id: 2,
    name: "Dr. Meena Iyer",
    role: "Professor, Mathematics",
    avatar: "MI",
    text: "As a professor, I love how easy it is to communicate with students and manage events. The announcement feature with AI summaries saves me so much time.",
    rating: 5
  },
  {
    id: 3,
    name: "Rohan Desai",
    role: "President, AI Research Group",
    avatar: "RD",
    text: "Managing our club has never been easier. CampusPulse helps us reach more students, organize events effortlessly, and grow our community.",
    rating: 5
  },
  {
    id: 4,
    name: "Nisha Patel",
    role: "Electrical Engineering, 2nd Year",
    avatar: "NP",
    text: "The AI recommendations are spot-on! It suggested a workshop that perfectly aligned with my interests, and I ended up meeting my project teammates there.",
    rating: 4
  }
];
