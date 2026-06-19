export const conversations = [
  {
    id: 1,
    type: "direct",
    name: "Arjun Mehta",
    avatar: "AM",
    lastMessage: "Hey! Are you joining the hackathon team?",
    lastTime: "3 hours ago",
    unread: 2,
    online: true,
    messages: [
      { id: 1, sender: "Arjun Mehta", avatar: "AM", content: "Hi Priya! 👋", time: "10:30 AM", isOwn: false },
      { id: 2, sender: "You", avatar: "PS", content: "Hey Arjun! What's up?", time: "10:32 AM", isOwn: true },
      { id: 3, sender: "Arjun Mehta", avatar: "AM", content: "Are you free this weekend? We're forming a team for TechSpark Hackathon", time: "10:33 AM", isOwn: false },
      { id: 4, sender: "You", avatar: "PS", content: "Oh that sounds awesome! What's the theme?", time: "10:35 AM", isOwn: true },
      { id: 5, sender: "Arjun Mehta", avatar: "AM", content: "It's open theme this year. I was thinking we could build something with AI. Maybe an education tool?", time: "10:36 AM", isOwn: false },
      { id: 6, sender: "Arjun Mehta", avatar: "AM", content: "We need one more person for a team of 4. Sneha is already in.", time: "10:36 AM", isOwn: false },
      { id: 7, sender: "You", avatar: "PS", content: "Count me in! 🙌 Let's plan it out tomorrow?", time: "10:40 AM", isOwn: true },
      { id: 8, sender: "Arjun Mehta", avatar: "AM", content: "Perfect! I'll set up a group chat. Also, can you bring your ML models from last semester's project?", time: "10:42 AM", isOwn: false },
      { id: 9, sender: "Arjun Mehta", avatar: "AM", content: "Hey! Are you joining the hackathon team?", time: "1:15 PM", isOwn: false }
    ]
  },
  {
    id: 2,
    type: "group",
    name: "Tech Club General",
    avatar: "TC",
    lastMessage: "Don't forget to register for the workshop!",
    lastTime: "1 hour ago",
    unread: 5,
    online: false,
    memberCount: 342,
    messages: [
      { id: 1, sender: "Arjun Mehta", avatar: "AM", content: "Hey everyone! TechSpark registrations are now open 🎉", time: "9:00 AM", isOwn: false },
      { id: 2, sender: "Sneha Reddy", avatar: "SR", content: "Already registered! So excited!", time: "9:15 AM", isOwn: false },
      { id: 3, sender: "Karan Singh", avatar: "KS", content: "What's the tech stack requirement?", time: "9:20 AM", isOwn: false },
      { id: 4, sender: "Arjun Mehta", avatar: "AM", content: "No restrictions on tech stack. Use whatever you're comfortable with.", time: "9:22 AM", isOwn: false },
      { id: 5, sender: "You", avatar: "PS", content: "This is going to be amazing! Can't wait 🚀", time: "9:30 AM", isOwn: true },
      { id: 6, sender: "Rohit Gupta", avatar: "RG", content: "Don't forget to register for the workshop!", time: "11:30 AM", isOwn: false }
    ]
  },
  {
    id: 3,
    type: "direct",
    name: "Dr. Rajesh Kumar",
    avatar: "RK",
    lastMessage: "Please submit your assignment by Friday.",
    lastTime: "Yesterday",
    unread: 0,
    online: false,
    messages: [
      { id: 1, sender: "Dr. Rajesh Kumar", avatar: "RK", content: "Dear Priya, I wanted to let you know that your project proposal looks excellent.", time: "Yesterday, 2:00 PM", isOwn: false },
      { id: 2, sender: "You", avatar: "PS", content: "Thank you, Professor! I've been working hard on refining the methodology section.", time: "Yesterday, 2:15 PM", isOwn: true },
      { id: 3, sender: "Dr. Rajesh Kumar", avatar: "RK", content: "The methodology is solid. I have a few suggestions — can you visit during office hours?", time: "Yesterday, 2:20 PM", isOwn: false },
      { id: 4, sender: "You", avatar: "PS", content: "Of course! I'll come by tomorrow at 3 PM if that works?", time: "Yesterday, 2:25 PM", isOwn: true },
      { id: 5, sender: "Dr. Rajesh Kumar", avatar: "RK", content: "Perfect. Also, please submit your assignment by Friday.", time: "Yesterday, 2:30 PM", isOwn: false }
    ]
  },
  {
    id: 4,
    type: "group",
    name: "Hackathon Team Alpha",
    avatar: "HA",
    lastMessage: "Let's meet at the cafe at 5",
    lastTime: "2 hours ago",
    unread: 0,
    online: false,
    memberCount: 4,
    messages: [
      { id: 1, sender: "Arjun Mehta", avatar: "AM", content: "Team! Let's finalize our project idea today.", time: "11:00 AM", isOwn: false },
      { id: 2, sender: "Sneha Reddy", avatar: "SR", content: "I was thinking — an AI-powered study planner?", time: "11:05 AM", isOwn: false },
      { id: 3, sender: "You", avatar: "PS", content: "That's a great idea! I can handle the ML recommendation engine.", time: "11:10 AM", isOwn: true },
      { id: 4, sender: "Karan Singh", avatar: "KS", content: "I'll do the backend. Let's use Node + MongoDB.", time: "11:15 AM", isOwn: false },
      { id: 5, sender: "Arjun Mehta", avatar: "AM", content: "Let's meet at the cafe at 5", time: "12:00 PM", isOwn: false }
    ]
  },
  {
    id: 5,
    type: "direct",
    name: "Kavya Sharma",
    avatar: "KV",
    lastMessage: "Thanks for the info! Will check it out.",
    lastTime: "2 days ago",
    unread: 0,
    online: true,
    messages: [
      { id: 1, sender: "Kavya Sharma", avatar: "KV", content: "Hey Priya! I heard you're interested in startups?", time: "2 days ago, 4:00 PM", isOwn: false },
      { id: 2, sender: "You", avatar: "PS", content: "Hi Kavya! Yes, I've been exploring some ideas.", time: "2 days ago, 4:10 PM", isOwn: true },
      { id: 3, sender: "Kavya Sharma", avatar: "KV", content: "You should check out E-Cell! We're hosting a pitch competition next week.", time: "2 days ago, 4:12 PM", isOwn: false },
      { id: 4, sender: "You", avatar: "PS", content: "That sounds interesting! How do I register?", time: "2 days ago, 4:15 PM", isOwn: true },
      { id: 5, sender: "Kavya Sharma", avatar: "KV", content: "I'll send you the link. You can register solo or with a team.", time: "2 days ago, 4:16 PM", isOwn: false },
      { id: 6, sender: "You", avatar: "PS", content: "Thanks for the info! Will check it out.", time: "2 days ago, 4:20 PM", isOwn: true }
    ]
  }
];
