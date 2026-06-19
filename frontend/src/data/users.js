export const users = {
  student: {
    id: 1,
    name: "Priya Sharma",
    email: "priya.sharma@campus.edu",
    role: "student",
    avatar: "PS",
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
  professor: {
    id: 2,
    name: "Dr. Rajesh Kumar",
    email: "rajesh.kumar@campus.edu",
    role: "professor",
    avatar: "RK",
    department: "Computer Science & Engineering",
    designation: "Associate Professor",
    bio: "20+ years in academia. Research interests include distributed systems and cloud computing. Passionate about mentoring the next generation of engineers.",
    specialization: "Distributed Systems, Cloud Computing",
    courses: ["CS301 - Data Structures", "CS502 - Cloud Computing", "CS601 - Research Methodology"],
    joinedDate: "2020-01-10"
  },
  clubLeader: {
    id: 3,
    name: "Arjun Mehta",
    email: "arjun.mehta@campus.edu",
    role: "clubLeader",
    avatar: "AM",
    department: "Information Technology",
    year: "4th Year",
    bio: "President of Tech Club. Organizing hackathons and building a community of tech enthusiasts on campus.",
    club: "Tech Club",
    clubId: 1,
    joinedDate: "2023-08-20"
  },
  admin: {
    id: 4,
    name: "Purav",
    email: "Purav123@admin.com",
    role: "admin",
    avatar: "P",
    department: "Administration",
    designation: "Platform Administrator",
    bio: "Managing CampusPulse platform operations.",
    permissions: "full_access",
    joinedDate: "2023-01-01"
  }
};

export const allUsers = [
  { id: 1, name: "Priya Sharma", avatar: "PS", role: "student", department: "Computer Science" },
  { id: 2, name: "Dr. Rajesh Kumar", avatar: "RK", role: "professor", department: "CSE" },
  { id: 3, name: "Arjun Mehta", avatar: "AM", role: "student", department: "IT" },
  { id: 5, name: "Sneha Reddy", avatar: "SR", role: "student", department: "CSE" },
  { id: 6, name: "Rahul Kapoor", avatar: "RK", role: "student", department: "Mechanical" },
  { id: 7, name: "Ananya Das", avatar: "AD", role: "student", department: "Arts" },
  { id: 8, name: "Kavya Sharma", avatar: "KV", role: "student", department: "Business" },
  { id: 9, name: "Dr. Neha Gupta", avatar: "NG", role: "professor", department: "CSE" },
  { id: 10, name: "Vikrant Choudhary", avatar: "VC", role: "student", department: "CSE" },
  { id: 11, name: "Diya Menon", avatar: "DM", role: "student", department: "English" },
  { id: 12, name: "Ishaan Nair", avatar: "IN", role: "student", department: "Design" }
];
