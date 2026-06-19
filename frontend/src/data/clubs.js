export const clubs = [
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
    posts: [
      { id: 1, author: "Arjun Mehta", avatar: "AM", content: "Registration for TechSpark Hackathon is now open! Limited spots available. 🚀", time: "2 hours ago", likes: 24 },
      { id: 2, author: "Sneha Reddy", avatar: "SR", content: "Great session on React hooks today! Notes uploaded to the drive.", time: "1 day ago", likes: 18 }
    ],
    members: [
      { name: "Arjun Mehta", role: "President", avatar: "AM" },
      { name: "Sneha Reddy", role: "Vice President", avatar: "SR" },
      { name: "Karan Singh", role: "Tech Lead", avatar: "KS" },
      { name: "Priya Sharma", role: "Member", avatar: "PS" },
      { name: "Rohit Gupta", role: "Member", avatar: "RG" }
    ]
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
    posts: [
      { id: 1, author: "Ananya Das", avatar: "AD", content: "Auditions for Rhythm 2026 dance competition start next week! All genres welcome. 💃", time: "5 hours ago", likes: 31 }
    ],
    members: [
      { name: "Ananya Das", role: "President", avatar: "AD" },
      { name: "Vikram Joshi", role: "Vice President", avatar: "VJ" },
      { name: "Meera Nair", role: "Dance Lead", avatar: "MN" },
      { name: "Aditya Roy", role: "Music Lead", avatar: "AR" }
    ]
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
    posts: [
      { id: 1, author: "Rahul Kapoor", avatar: "RK", content: "Congratulations to our cricket team for winning the district championship! 🏏🏆", time: "1 day ago", likes: 56 }
    ],
    members: [
      { name: "Rahul Kapoor", role: "President", avatar: "RK" },
      { name: "Neha Singh", role: "Secretary", avatar: "NS" },
      { name: "Dev Patel", role: "Cricket Captain", avatar: "DP" }
    ]
  },
  {
    id: 4,
    name: "E-Cell",
    logo: "EC",
    category: "Entrepreneurship",
    description: "Fostering the entrepreneurial spirit. We connect aspiring entrepreneurs with mentors, investors, and resources to turn ideas into startups.",
    longDescription: "E-Cell (Entrepreneurship Cell) is dedicated to building an entrepreneurial ecosystem on campus. We organize pitch competitions, startup weekends, mentorship programs, and networking events. Several successful startups have been born from our incubation program.",
    memberCount: 145,
    color: "#f97316",
    founded: "2019",
    president: "Kavya Sharma",
    presidentAvatar: "KV",
    tags: ["startups", "business", "pitching", "innovation"],
    recentActivity: "Startup Pitch Competition registrations open",
    isJoined: false,
    events: [5],
    posts: [
      { id: 1, author: "Kavya Sharma", avatar: "KV", content: "Excited to announce our partnership with Y Combinator for mentorship sessions! 🎉", time: "3 hours ago", likes: 42 }
    ],
    members: [
      { name: "Kavya Sharma", role: "President", avatar: "KV" },
      { name: "Amit Verma", role: "Vice President", avatar: "AV" }
    ]
  },
  {
    id: 5,
    name: "Photography Club",
    logo: "PC",
    category: "Cultural",
    description: "Capturing moments, telling stories. We organize photo walks, exhibitions, and workshops for photographers of all levels.",
    longDescription: "The Photography Club brings together visual storytellers from across campus. We conduct weekly photo walks, monthly themed challenges, and host an annual photography exhibition. Our members have been featured in national photography magazines.",
    memberCount: 98,
    color: "#8b5cf6",
    founded: "2017",
    president: "Ishaan Nair",
    presidentAvatar: "IN",
    tags: ["photography", "visual-arts", "editing"],
    recentActivity: "Campus photo walk this Friday",
    isJoined: false,
    events: [8],
    posts: [],
    members: [
      { name: "Ishaan Nair", role: "President", avatar: "IN" },
      { name: "Tanya Malhotra", role: "Secretary", avatar: "TM" }
    ]
  },
  {
    id: 6,
    name: "Literary Club",
    logo: "LC",
    category: "Literature",
    description: "For lovers of words. We host book discussions, creative writing workshops, poetry slams, and our own campus literary magazine.",
    longDescription: "The Literary Club is a haven for book lovers, writers, and poetry enthusiasts. We publish a quarterly literary magazine 'Ink & Ideas', organize inter-college debate competitions, and host weekly book club meetings. Our creative writing workshops have helped many students discover their voice.",
    memberCount: 76,
    color: "#06b6d4",
    founded: "2016",
    president: "Diya Menon",
    presidentAvatar: "DM",
    tags: ["writing", "poetry", "books", "debate"],
    recentActivity: "Open Mic Night preparations underway",
    isJoined: true,
    events: [12],
    posts: [],
    members: [
      { name: "Diya Menon", role: "President", avatar: "DM" },
      { name: "Siddharth Rao", role: "Editor", avatar: "SR" }
    ]
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
    posts: [],
    members: [
      { name: "Dr. Neha Gupta", role: "Faculty Advisor", avatar: "NG" },
      { name: "Rohan Desai", role: "President", avatar: "RD" }
    ]
  },
  {
    id: 8,
    name: "CyberSec Club",
    logo: "CS",
    category: "Technical",
    description: "Defending the digital world. We learn about cybersecurity, ethical hacking, and participate in CTF competitions worldwide.",
    longDescription: "CyberSec Club focuses on cybersecurity education and practice. We organize CTF competitions, security workshops, and bug bounty programs. Our team has ranked in the top 50 globally in multiple CTF platforms.",
    memberCount: 87,
    color: "#ef4444",
    founded: "2021",
    president: "Vikrant Choudhary",
    presidentAvatar: "VC",
    tags: ["cybersecurity", "ethical-hacking", "CTF"],
    recentActivity: "CTF Challenge competition announced",
    isJoined: false,
    events: [9],
    posts: [],
    members: [
      { name: "Vikrant Choudhary", role: "President", avatar: "VC" },
      { name: "Aarav Jain", role: "Vice President", avatar: "AJ" }
    ]
  },
  {
    id: 9,
    name: "Social Service League",
    logo: "SS",
    category: "Social Service",
    description: "Making a difference, one step at a time. We organize community outreach, blood donation drives, and environmental campaigns.",
    longDescription: "The Social Service League is committed to community service and social impact. We organize blood donation camps, teach at local underprivileged schools, conduct environmental clean-up drives, and run awareness campaigns on important social issues.",
    memberCount: 203,
    color: "#f43f5e",
    founded: "2013",
    president: "Riya Agarwal",
    presidentAvatar: "RA",
    tags: ["community", "volunteering", "environment", "education"],
    recentActivity: "Blood donation camp organized - 150+ donors",
    isJoined: false,
    events: [],
    posts: [],
    members: [
      { name: "Riya Agarwal", role: "President", avatar: "RA" },
      { name: "Manish Tiwari", role: "Vice President", avatar: "MT" }
    ]
  },
  {
    id: 10,
    name: "Code Club",
    logo: "CD",
    category: "Technical",
    description: "Where code meets creativity. We build projects, participate in competitive programming, and help beginners start their coding journey.",
    longDescription: "Code Club is a welcoming community for coders of all levels. We run beginner bootcamps, competitive programming practice sessions, and collaborative open-source projects. Our members regularly participate in and win coding competitions on platforms like Codeforces and LeetCode.",
    memberCount: 167,
    color: "#a855f7",
    founded: "2019",
    president: "Tanvi Kulkarni",
    presidentAvatar: "TK",
    tags: ["competitive-programming", "open-source", "bootcamp"],
    recentActivity: "Web Development Bootcamp starting soon",
    isJoined: true,
    events: [6],
    posts: [],
    members: [
      { name: "Tanvi Kulkarni", role: "President", avatar: "TK" },
      { name: "Nikhil Rao", role: "Vice President", avatar: "NR" }
    ]
  }
];

export const clubCategories = [
  "All",
  "Technical",
  "Cultural",
  "Sports",
  "Literature",
  "Entrepreneurship",
  "Social Service"
];
