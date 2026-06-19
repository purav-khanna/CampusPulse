import { Router } from 'express';
import multer from 'multer';
import { readDb, writeDb, hashPassword } from '../database/db.js';
import { callGemini } from '../services/geminiService.js';
import { getIo, isUserOnline, getUserSocketId } from '../services/socketService.js';

const router = Router();

console.log("Gemini Key Loaded:", !!process.env.GEMINI_API_KEY);

router.get('/test-gemini', async (req, res) => {
  console.log('[AI REQUEST RECEIVED] GET /api/test-gemini');
  try {
    const reply = await callGemini('Reply with: Gemini Connected Successfully');
    res.json({ message: reply.trim() });
  } catch (error) {
    console.error('[GEMINI ERROR] Test route failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// AUTHENTICATION ENDPOINTS
// ----------------------------------------------------

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const db = readDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  
  if (!user) {
    return res.status(401).json({ message: 'Account not found. Please register.' });
  }
  
  // Verify password hash matches
  if (user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ message: 'Incorrect email or password' });
  }
  
  // Attach user registrations and saved events dynamically
  const userRegs = db.registrations.filter(r => r.userId === user.id && r.registrationStatus === 'registered').map(r => r.eventId);
  const userSaved = db.savedEvents.filter(s => s.userId === user.id).map(s => s.eventId);
  
  const payload = {
    ...user,
    registeredEvents: Array.from(new Set([...(user.registeredEvents || []), ...userRegs])),
    savedEvents: Array.from(new Set([...(user.savedEvents || []), ...userSaved]))
  };
  
  res.json({ user: payload, token: 'mock-jwt-token' });
});

router.post('/auth/signup', (req, res) => {
  const { name, email, password, role, department } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const db = readDb();
  
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existingUser) {
    return res.status(400).json({ message: 'Email is already registered' });
  }
  
  const newUser = {
    id: Date.now(),
    name: name.trim(),
    email: email.trim(),
    passwordHash: hashPassword(password),
    role: role || 'student',
    department: department ? department.trim() : 'Computer Science',
    joinedClubs: [],
    registeredEvents: [],
    savedEvents: [],
    notifications: 0,
    joinedDate: new Date().toISOString().split('T')[0]
  };
  
  db.users.push(newUser);
  writeDb(db);
  
  res.json({ user: newUser, token: 'mock-jwt-token' });
});

// ----------------------------------------------------
// PROFILE & SETTINGS ENDPOINTS
// ----------------------------------------------------

router.get('/profile/me', (req, res) => {
  const userId = parseInt(req.query.userId);
  if (!userId) return res.status(400).json({ message: 'User ID is required' });

  const db = readDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Attach registrations & saved events dynamically
  const userRegs = db.registrations.filter(r => r.userId === userId && r.registrationStatus === 'registered').map(r => r.eventId);
  const userSaved = db.savedEvents.filter(s => s.userId === userId).map(s => s.eventId);

  const payload = {
    ...user,
    registeredEvents: Array.from(new Set([...(user.registeredEvents || []), ...userRegs])),
    savedEvents: Array.from(new Set([...(user.savedEvents || []), ...userSaved]))
  };

  res.json(payload);
});

router.put('/profile/update', (req, res) => {
  const { userId, name, bio, department, year, interests } = req.body;
  const uId = parseInt(userId);
  if (!uId) return res.status(400).json({ message: 'User ID is required' });

  const db = readDb();
  const user = db.users.find(u => u.id === uId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (name !== undefined) user.name = name.trim();
  if (bio !== undefined) user.bio = bio.trim();
  if (department !== undefined) user.department = department.trim();
  if (year !== undefined) user.year = year;
  if (interests !== undefined) {
    user.interests = Array.isArray(interests) 
      ? interests 
      : typeof interests === 'string' 
        ? interests.split(',').map(i => i.trim()).filter(Boolean)
        : [];
  }

  writeDb(db);

  // Return refreshed user
  const userRegs = db.registrations.filter(r => r.userId === uId && r.registrationStatus === 'registered').map(r => r.eventId);
  const userSaved = db.savedEvents.filter(s => s.userId === uId).map(s => s.eventId);
  const payload = {
    ...user,
    registeredEvents: Array.from(new Set([...(user.registeredEvents || []), ...userRegs])),
    savedEvents: Array.from(new Set([...(user.savedEvents || []), ...userSaved]))
  };

  res.json({ message: 'Profile updated successfully', user: payload });
});

router.put('/profile/email', (req, res) => {
  const { userId, currentEmail, newEmail, password } = req.body;
  const uId = parseInt(userId);
  if (!uId) return res.status(400).json({ message: 'User ID is required' });

  const db = readDb();
  const user = db.users.find(u => u.id === uId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Validate password
  if (user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ message: 'Incorrect password confirmation' });
  }

  // Validate current email
  if (user.email.toLowerCase() !== currentEmail.trim().toLowerCase()) {
    return res.status(400).json({ message: 'Current email address does not match' });
  }

  // Check new email uniqueness
  const newEmailClean = newEmail.trim().toLowerCase();
  if (newEmailClean !== user.email.toLowerCase()) {
    const existing = db.users.find(u => u.email.toLowerCase() === newEmailClean);
    if (existing) {
      return res.status(400).json({ message: 'New email is already in use by another account' });
    }
  }

  user.email = newEmail.trim();
  writeDb(db);

  // Return refreshed payload
  const userRegs = db.registrations.filter(r => r.userId === uId && r.registrationStatus === 'registered').map(r => r.eventId);
  const userSaved = db.savedEvents.filter(s => s.userId === uId).map(s => s.eventId);
  const payload = {
    ...user,
    registeredEvents: Array.from(new Set([...(user.registeredEvents || []), ...userRegs])),
    savedEvents: Array.from(new Set([...(user.savedEvents || []), ...userSaved]))
  };

  res.json({ message: 'Email updated successfully', user: payload });
});

router.put('/profile/password', (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  const uId = parseInt(userId);
  if (!uId) return res.status(400).json({ message: 'User ID is required' });

  const db = readDb();
  const user = db.users.find(u => u.id === uId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Validate current password
  if (user.passwordHash !== hashPassword(currentPassword)) {
    return res.status(401).json({ message: 'Incorrect current password' });
  }

  user.passwordHash = hashPassword(newPassword);
  writeDb(db);

  res.json({ message: 'Password updated successfully' });
});

router.delete('/profile/delete', (req, res) => {
  const { userId, password } = req.body;
  const uId = parseInt(userId);
  if (!uId) return res.status(400).json({ message: 'User ID is required' });

  const db = readDb();
  const userIdx = db.users.findIndex(u => u.id === uId);
  if (userIdx === -1) return res.status(404).json({ message: 'User not found' });

  const user = db.users[userIdx];
  // Verify password
  if (user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ message: 'Incorrect password' });
  }

  // Cascading deletes
  db.users.splice(userIdx, 1);
  db.notifications = db.notifications ? db.notifications.filter(n => n.userId !== uId) : [];
  db.savedEvents = db.savedEvents ? db.savedEvents.filter(s => s.userId !== uId) : [];
  db.registrations = db.registrations ? db.registrations.filter(r => r.userId !== uId) : [];
  db.comments = db.comments ? db.comments.filter(c => c.userId !== uId) : [];
  
  if (db.messages) {
    db.messages = db.messages.filter(m => m.senderId !== uId && m.receiverId !== uId);
  }
  if (db.participants) {
    db.participants = db.participants.filter(p => p.userId !== uId);
  }
  if (db.club_members) {
    db.club_members = db.club_members.filter(cm => cm.userId !== uId);
  }
  if (db.user_settings) {
    db.user_settings = db.user_settings.filter(us => us.userId !== uId);
  }

  writeDb(db);
  res.json({ message: 'Account permanently deleted' });
});

router.get('/settings', (req, res) => {
  const userId = parseInt(req.query.userId);
  if (!userId) return res.status(400).json({ message: 'User ID is required' });

  const db = readDb();
  if (!db.user_settings) db.user_settings = [];
  
  let settings = db.user_settings.find(s => s.userId === userId);
  if (!settings) {
    // Generate default settings
    settings = {
      userId,
      notificationPreferences: { events: true, clubs: true, messages: true, announcements: true, reminders: true },
      themePreference: 'light',
      privacySettings: { profileVisibility: 'Everyone' },
      onlineStatus: true
    };
    db.user_settings.push(settings);
    writeDb(db);
  }

  res.json(settings);
});

router.put('/settings/update', (req, res) => {
  const { userId, notificationPreferences, themePreference, privacySettings, onlineStatus } = req.body;
  const uId = parseInt(userId);
  if (!uId) return res.status(400).json({ message: 'User ID is required' });

  const db = readDb();
  if (!db.user_settings) db.user_settings = [];

  let settings = db.user_settings.find(s => s.userId === uId);
  if (!settings) {
    settings = {
      userId: uId,
      notificationPreferences: notificationPreferences || { events: true, clubs: true, messages: true, announcements: true, reminders: true },
      themePreference: themePreference || 'light',
      privacySettings: privacySettings || { profileVisibility: 'Everyone' },
      onlineStatus: onlineStatus !== undefined ? onlineStatus : true
    };
    db.user_settings.push(settings);
  } else {
    if (notificationPreferences !== undefined) settings.notificationPreferences = notificationPreferences;
    if (themePreference !== undefined) settings.themePreference = themePreference;
    if (privacySettings !== undefined) settings.privacySettings = privacySettings;
    if (onlineStatus !== undefined) settings.onlineStatus = onlineStatus;
  }

  writeDb(db);
  res.json(settings);
});

// Get dynamic statistics for professor dashboard cards
router.get('/dashboard/professor-stats', (req, res) => {
  const userId = parseInt(req.query.userId);
  if (!userId) return res.status(400).json({ message: 'User ID is required' });

  const db = readDb();
  const professor = db.users.find(u => u.id === userId);
  if (!professor) return res.status(404).json({ message: 'Professor not found' });

  // CARD 1: EVENTS CREATED
  const professorEvents = db.events.filter(e => e.creatorId === userId || e.createdBy === userId);
  const professorEventIds = professorEvents.map(e => e.id);

  // CARD 2: EVENTS REGISTERED
  const registeredEventsCount = db.registrations.filter(r => r.userId === userId && r.registrationStatus === 'registered').length;

  // CARD 3: CLUBS FOUNDED
  const foundedClubs = db.clubs.filter(c => c.leaderId === userId || c.ownerId === userId);
  const foundedClubIds = foundedClubs.map(c => c.id);

  // CARD 4: CLUBS JOINED (excluding founded clubs)
  const joinedClubsRaw = db.club_members 
    ? db.club_members.filter(cm => cm.userId === userId).map(cm => cm.clubId)
    : (professor.joinedClubs || []);
  const joinedClubsCount = Array.from(new Set(joinedClubsRaw)).filter(cid => !foundedClubIds.includes(cid)).length;

  // CARD 5: ANNOUNCEMENTS
  const announcementsCount = db.announcements.filter(a => a.authorId === userId).length;

  // CARD 6: STUDENTS REACHED
  const clubMembers = db.club_members ? db.club_members.filter(cm => foundedClubIds.includes(cm.clubId)) : [];
  const clubStudentIds = clubMembers.map(cm => cm.userId);

  const eventRegistrations = db.registrations.filter(r => professorEventIds.includes(r.eventId) && r.registrationStatus === 'registered');
  const eventStudentIds = eventRegistrations.map(r => r.userId);

  const allReachedStudentIds = new Set([...clubStudentIds, ...eventStudentIds]);
  allReachedStudentIds.delete(userId);
  const studentsReached = allReachedStudentIds.size;

  // Get recent registrations with student details and event details
  const recentRegistrations = eventRegistrations
    .map(r => {
      const student = db.users.find(u => u.id === r.userId);
      const event = db.events.find(e => e.id === r.eventId);
      return {
        id: r.id,
        name: student ? student.name : 'Unknown Student',
        event: event ? event.title : 'Unknown Event',
        avatar: student ? student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'S'
      };
    })
    .reverse() // show latest registrations first
    .slice(0, 5); // limit to 5

  // Generate activities stream
  const recentActivities = [];

  // 1. Events created
  professorEvents.forEach(e => {
    recentActivities.push({
      id: `evt-create-${e.id}`,
      type: 'event_created',
      title: 'Created Event',
      description: `Created event "${e.title}"`,
      time: e.time || '10:00 AM',
      date: e.date,
      timestamp: e.id,
      link: `/events/${e.id}`
    });
  });

  // 2. Clubs created
  foundedClubs.forEach(c => {
    recentActivities.push({
      id: `club-create-${c.id}`,
      type: 'club_created',
      title: 'Founded Club',
      description: `Founded club "${c.name}"`,
      time: 'Founded',
      date: c.founded || new Date().getFullYear().toString(),
      timestamp: c.id,
      link: `/clubs/${c.id}`
    });
  });

  // 3. Announcements posted
  const professorAnnouncements = db.announcements.filter(a => a.authorId === userId);
  professorAnnouncements.forEach(a => {
    recentActivities.push({
      id: `ann-${a.id}`,
      type: 'announcement_created',
      title: 'Published Announcement',
      description: `Posted "${a.title}"`,
      time: 'Posted',
      date: a.date,
      timestamp: a.id,
      link: '/dashboard'
    });
  });

  // 4. Joined clubs
  const userJoinedClubs = db.club_members 
    ? db.club_members.filter(cm => cm.userId === userId)
    : (professor.joinedClubs || []).map(cid => ({ clubId: cid, id: cid }));
  userJoinedClubs.forEach(cm => {
    const club = db.clubs.find(c => c.id === cm.clubId);
    if (club) {
      recentActivities.push({
        id: `club-join-${cm.id}`,
        type: 'club_joined',
        title: 'Joined Club',
        description: `Joined club "${club.name}"`,
        time: 'Joined',
        date: 'Recently',
        timestamp: cm.id || club.id,
        link: `/clubs/${club.id}`
      });
    }
  });

  // 5. Registered events
  const userRegs = db.registrations.filter(r => r.userId === userId && r.registrationStatus === 'registered');
  userRegs.forEach(r => {
    const event = db.events.find(e => e.id === r.eventId);
    if (event) {
      recentActivities.push({
        id: `evt-reg-${r.id}`,
        type: 'event_registered',
        title: 'Registered for Event',
        description: `Registered for "${event.title}"`,
        time: event.time || '10:00 AM',
        date: event.date,
        timestamp: r.id,
        link: `/events/${event.id}`
      });
    }
  });

  // Sort activities by timestamp descending
  recentActivities.sort((a, b) => b.timestamp - a.timestamp);
  const topActivities = recentActivities.slice(0, 10);

  res.json({
    eventsCreated: professorEvents.length,
    eventsRegistered: registeredEventsCount,
    eventsJoined: registeredEventsCount,
    clubsFounded: foundedClubs.length,
    clubsCreated: foundedClubs.length,
    clubsJoined: joinedClubsCount,
    announcements: announcementsCount,
    announcementsCount: announcementsCount,
    studentsReached: studentsReached,
    recentRegistrations: recentRegistrations,
    recentActivities: topActivities
  });
});

// Get stats for professor dashboard
router.get('/professors/:userId/stats', (req, res) => {
  const userId = parseInt(req.params.userId);
  if (!userId) return res.status(400).json({ message: 'User ID is required' });

  const db = readDb();
  const professor = db.users.find(u => u.id === userId);
  if (!professor) return res.status(404).json({ message: 'Professor not found' });

  // Get events created by this professor
  const professorEvents = db.events.filter(e => e.creatorId === userId || e.createdBy === userId);
  const professorEventIds = professorEvents.map(e => e.id);

  // Get registrations for these events
  const eventRegistrations = db.registrations.filter(r => 
    professorEventIds.includes(r.eventId) && r.registrationStatus === 'registered'
  );

  // Get clubs owned/created by this professor
  const professorClubs = db.clubs.filter(c => c.leaderId === userId || c.ownerId === userId);
  const professorClubIds = professorClubs.map(c => c.id);

  // Get members of these clubs
  const clubMembers = db.club_members ? db.club_members.filter(cm => professorClubIds.includes(cm.clubId)) : [];

  // Calculate unique students reached (combining event registrations and club members, excluding professor themselves)
  const allReachedStudentIds = new Set([
    ...eventRegistrations.map(r => r.userId),
    ...clubMembers.map(cm => cm.userId)
  ]);
  allReachedStudentIds.delete(userId);
  const studentsReached = allReachedStudentIds.size;

  // Get announcements published by this professor
  const professorAnnouncements = db.announcements.filter(a => a.authorId === userId);

  // Get recent registrations with student details and event details
  const recentRegistrations = eventRegistrations
    .map(r => {
      const student = db.users.find(u => u.id === r.userId);
      const event = db.events.find(e => e.id === r.eventId);
      return {
        id: r.id,
        name: student ? student.name : 'Unknown Student',
        event: event ? event.title : 'Unknown Event',
        avatar: student ? student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'S'
      };
    })
    .reverse() // show latest registrations first
    .slice(0, 5); // limit to 5

  // Generate activities stream
  const recentActivities = [];

  // 1. Events created
  professorEvents.forEach(e => {
    recentActivities.push({
      id: `evt-create-${e.id}`,
      type: 'event_created',
      title: 'Created Event',
      description: `Created event "${e.title}"`,
      time: e.time || '10:00 AM',
      date: e.date,
      timestamp: e.id,
      link: `/events/${e.id}`
    });
  });

  // 2. Clubs created
  professorClubs.forEach(c => {
    recentActivities.push({
      id: `club-create-${c.id}`,
      type: 'club_created',
      title: 'Founded Club',
      description: `Founded club "${c.name}"`,
      time: 'Founded',
      date: c.founded || new Date().getFullYear().toString(),
      timestamp: c.id,
      link: `/clubs/${c.id}`
    });
  });

  // 3. Announcements posted
  professorAnnouncements.forEach(a => {
    recentActivities.push({
      id: `ann-${a.id}`,
      type: 'announcement_created',
      title: 'Published Announcement',
      description: `Posted "${a.title}"`,
      time: 'Posted',
      date: a.date,
      timestamp: a.id,
      link: '/dashboard'
    });
  });

  // 4. Joined clubs
  const userJoinedClubs = db.club_members 
    ? db.club_members.filter(cm => cm.userId === userId)
    : (professor.joinedClubs || []).map(cid => ({ clubId: cid, id: cid }));
  userJoinedClubs.forEach(cm => {
    const club = db.clubs.find(c => c.id === cm.clubId);
    if (club) {
      recentActivities.push({
        id: `club-join-${cm.id}`,
        type: 'club_joined',
        title: 'Joined Club',
        description: `Joined club "${club.name}"`,
        time: 'Joined',
        date: 'Recently',
        timestamp: cm.id || club.id,
        link: `/clubs/${club.id}`
      });
    }
  });

  // 5. Registered events
  const userRegs = db.registrations.filter(r => r.userId === userId && r.registrationStatus === 'registered');
  userRegs.forEach(r => {
    const event = db.events.find(e => e.id === r.eventId);
    if (event) {
      recentActivities.push({
        id: `evt-reg-${r.id}`,
        type: 'event_registered',
        title: 'Registered for Event',
        description: `Registered for "${event.title}"`,
        time: event.time || '10:00 AM',
        date: event.date,
        timestamp: r.id,
        link: `/events/${event.id}`
      });
    }
  });

  // Sort activities by timestamp descending
  recentActivities.sort((a, b) => b.timestamp - a.timestamp);
  const topActivities = recentActivities.slice(0, 10);

  res.json({
    eventsCreated: professorEvents.length,
    eventsJoined: userRegs.length,
    clubsCreated: professorClubs.length,
    clubsJoined: userJoinedClubs.length,
    announcementsCount: professorAnnouncements.length,
    studentsReached,
    recentRegistrations,
    recentActivities: topActivities
  });
});

// ----------------------------------------------------
// EVENT ENDPOINTS
// ----------------------------------------------------

// Helper to calculate event registration count dynamically
function getEventWithRegCount(event, db) {
  if (!event) return null;
  const registeredCount = db.registrations.filter(r => r.eventId === event.id && r.registrationStatus === 'registered').length;
  return {
    ...event,
    registeredSeats: registeredCount,
    registrations: registeredCount
  };
}

router.get('/events', (req, res) => {
  const db = readDb();
  const events = db.events.map(e => getEventWithRegCount(e, db));
  res.json(events);
});

router.get('/events/:id', (req, res) => {
  const db = readDb();
  const event = db.events.find(e => e.id === parseInt(req.params.id));
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json(getEventWithRegCount(event, db));
});

// Register current user for an event (fixes available seats, prevents duplicate, sends notification)
router.post('/events/:id/register', (req, res) => {
  const eventId = parseInt(req.params.id);
  const { userId } = req.body;
  
  if (!userId) return res.status(400).json({ message: 'User ID is required' });
  
  const db = readDb();
  const event = db.events.find(e => e.id === eventId);
  const user = db.users.find(u => u.id === parseInt(userId));
  
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  // Check if already registered in registrations table
  const alreadyRegistered = db.registrations.some(r => r.userId === user.id && r.eventId === eventId && r.registrationStatus === 'registered');
  
  if (alreadyRegistered) {
    return res.json({ message: 'Already registered', event: getEventWithRegCount(event, db) });
  }
  
  // Adjust seats
  const registeredCount = db.registrations.filter(r => r.eventId === eventId && r.registrationStatus === 'registered').length;
  if (event.totalSeats - registeredCount <= 0) {
    return res.status(400).json({ message: 'No seats available' });
  }
  
  // Record registration
  db.registrations.push({
    id: Date.now(),
    userId: user.id,
    eventId: eventId,
    registrationStatus: 'registered'
  });
  
  // Recalculate and sync db.events counts
  const newRegCount = db.registrations.filter(r => r.eventId === eventId && r.registrationStatus === 'registered').length;
  event.registeredSeats = newRegCount;
  event.registrations = newRegCount;
  
  // Create success notification automatically
  const notif = {
    id: Date.now() + 1,
    userId: user.id,
    type: 'registration',
    title: 'Registration Successful',
    message: `You have successfully registered for ${event.title}.`,
    time: 'Just now',
    isRead: false,
    icon: 'check-circle',
    link: `/events/${event.id}`
  };
  db.notifications.unshift(notif);
  
  writeDb(db);

  const io = getIo();
  if (io) {
    io.to(`user-${user.id}`).emit('notification_created', notif);
    io.to(`user-${user.id}`).emit('new-notification', {
      title: notif.title,
      message: notif.message
    });
    io.to(`user-${user.id}`).emit('event_registered', { eventId, userId: user.id });
    if (event.creatorId) {
      io.to(`user-${event.creatorId}`).emit('event_registered', { eventId, userId: user.id });
    }
  }

  res.json({ message: 'Registration successful', event: getEventWithRegCount(event, db) });
});

// Unregister from event
router.post('/events/:id/unregister', (req, res) => {
  const eventId = parseInt(req.params.id);
  const { userId } = req.body;
  
  if (!userId) return res.status(400).json({ message: 'User ID is required' });
  
  const db = readDb();
  const event = db.events.find(e => e.id === eventId);
  const user = db.users.find(u => u.id === parseInt(userId));
  
  if (!event) return res.status(404).json({ message: 'Event not found' });
  
  const regIdx = db.registrations.findIndex(r => r.userId === parseInt(userId) && r.eventId === eventId);
  if (regIdx !== -1) {
    db.registrations.splice(regIdx, 1);
    
    // Recalculate and sync db.events counts
    const newRegCount = db.registrations.filter(r => r.eventId === eventId && r.registrationStatus === 'registered').length;
    event.registeredSeats = newRegCount;
    event.registrations = newRegCount;
    
    writeDb(db);

    const io = getIo();
    if (io) {
      io.to(`user-${userId}`).emit('event_unregistered', { eventId, userId: parseInt(userId) });
      if (event.creatorId) {
        io.to(`user-${event.creatorId}`).emit('event_unregistered', { eventId, userId: parseInt(userId) });
      }
    }
  }
  
  res.json({ message: 'Unregistration successful', event: getEventWithRegCount(event, db) });
});

// Save / Favorite event
router.post('/events/:id/save', (req, res) => {
  const eventId = parseInt(req.params.id);
  const { userId } = req.body;
  
  if (!userId) return res.status(400).json({ message: 'User ID is required' });
  
  const db = readDb();
  const alreadySaved = db.savedEvents.some(s => s.userId === parseInt(userId) && s.eventId === eventId);
  
  if (!alreadySaved) {
    db.savedEvents.push({
      id: Date.now(),
      userId: parseInt(userId),
      eventId: eventId
    });
    writeDb(db);
  }
  
  res.json({ message: 'Event saved successfully' });
});

// Unsave event
router.post('/events/:id/unsave', (req, res) => {
  const eventId = parseInt(req.params.id);
  const { userId } = req.body;
  
  if (!userId) return res.status(400).json({ message: 'User ID is required' });
  
  const db = readDb();
  const saveIdx = db.savedEvents.findIndex(s => s.userId === parseInt(userId) && s.eventId === eventId);
  
  if (saveIdx !== -1) {
    db.savedEvents.splice(saveIdx, 1);
    writeDb(db);
  }
  
  res.json({ message: 'Event unsaved successfully' });
});

// ----------------------------------------------------
// DISCUSSION SYSTEM (COMMENTS) ENDPOINTS
// ----------------------------------------------------

router.get('/events/:id/comments', (req, res) => {
  const eventId = parseInt(req.params.id);
  const db = readDb();
  const eventComments = db.comments.filter(c => c.eventId === eventId);
  res.json(eventComments);
});

router.post('/events/:id/comments', (req, res) => {
  const eventId = parseInt(req.params.id);
  const { userId, message, user: userName, avatar } = req.body;
  
  if (!userId || !message) return res.status(400).json({ message: 'User ID and message are required' });
  
  const db = readDb();
  
  const newComment = {
    id: Date.now(),
    commentId: Date.now(),
    userId: parseInt(userId),
    eventId: eventId,
    user: userName || 'Anonymous',
    avatar: avatar || 'U',
    text: message,
    time: 'Just now',
    createdAt: new Date().toISOString()
  };
  
  db.comments.push(newComment);
  writeDb(db);
  
  // Retrieve comments list to return
  const eventComments = db.comments.filter(c => c.eventId === eventId);
  res.json(eventComments);
});

// ----------------------------------------------------
// CLUB ENDPOINTS
// ----------------------------------------------------

router.get('/clubs', (req, res) => {
  const db = readDb();
  res.json(db.clubs);
});

function getStaticMembers(clubId) {
  if (clubId === 1) {
    return [
      { name: "Arjun Mehta", role: "President", avatar: "AM", joinedAt: "August 20, 2023" },
      { name: "Sneha Reddy", role: "Vice President", avatar: "SR", joinedAt: "September 1, 2023" },
      { name: "Karan Singh", role: "Tech Lead", avatar: "KS", joinedAt: "October 15, 2023" },
      { name: "Priya Sharma", role: "Member", avatar: "PS", joinedAt: "August 15, 2024" },
      { name: "Rohit Gupta", role: "Member", avatar: "RG", joinedAt: "November 5, 2024" }
    ];
  } else if (clubId === 2) {
    return [
      { name: "Ananya Das", role: "President", avatar: "AD", joinedAt: "August 10, 2022" },
      { name: "Vikram Joshi", role: "Vice President", avatar: "VJ", joinedAt: "September 12, 2022" },
      { name: "Meera Nair", role: "Dance Lead", avatar: "MN", joinedAt: "January 14, 2023" },
      { name: "Aditya Roy", role: "Music Lead", avatar: "AR", joinedAt: "March 22, 2023" }
    ];
  } else if (clubId === 3) {
    return [
      { name: "Rahul Kapoor", role: "President", avatar: "RK", joinedAt: "August 5, 2022" },
      { name: "Neha Singh", role: "Secretary", avatar: "NS", joinedAt: "September 10, 2022" },
      { name: "Dev Patel", role: "Cricket Captain", avatar: "DP", joinedAt: "October 20, 2022" }
    ];
  } else if (clubId === 7) {
    return [
      { name: "Dr. Neha Gupta", role: "Faculty Advisor", avatar: "NG", joinedAt: "August 1, 2020" },
      { name: "Rohan Desai", role: "President", avatar: "RD", joinedAt: "August 15, 2020" }
    ];
  }
  return [];
}

router.get('/clubs/:id', (req, res) => {
  const db = readDb();
  const clubId = parseInt(req.params.id);
  const club = db.clubs.find(c => c.id === clubId);
  if (!club) return res.status(404).json({ message: 'Club not found' });

  // Initialize club_members relationship table if missing
  if (!db.club_members) {
    db.club_members = [];
    db.users.forEach(u => {
      if (u.joinedClubs) {
        u.joinedClubs.forEach(cid => {
          db.club_members.push({
            id: Date.now() + Math.random(),
            clubId: cid,
            userId: u.id,
            joinedAt: u.joinedDate || 'August 15, 2024'
          });
        });
      }
    });
    writeDb(db);
  }

  // Resolve members dynamically from users table
  const dynamicMembers = db.club_members
    .filter(cm => cm.clubId === club.id)
    .map(cm => {
      const u = db.users.find(usr => usr.id === cm.userId);
      if (!u) return null;
      const initials = u.name ? u.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
      return {
        userId: u.id,
        name: u.name,
        role: u.role === 'clubLeader' ? 'President' : u.role === 'professor' ? 'Faculty Advisor' : 'Member',
        avatar: initials,
        joinedAt: cm.joinedAt
      };
    })
    .filter(Boolean);

  // Merge with static default members
  const staticMembers = getStaticMembers(club.id);
  const mergedMembers = [...dynamicMembers];
  staticMembers.forEach(sm => {
    if (!mergedMembers.some(mm => mm.name.toLowerCase() === sm.name.toLowerCase())) {
      mergedMembers.push(sm);
    }
  });

  res.json({
    ...club,
    members: mergedMembers
  });
});

router.post('/clubs/:id/join', (req, res) => {
  const clubId = parseInt(req.params.id);
  const { userId } = req.body;
  
  if (!userId) return res.status(400).json({ message: 'User ID is required' });
  
  const db = readDb();
  const user = db.users.find(u => u.id === parseInt(userId));
  const club = db.clubs.find(c => c.id === clubId);
  
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!club) return res.status(404).json({ message: 'Club not found' });
  
  if (!user.joinedClubs) user.joinedClubs = [];
  if (!db.club_members) {
    db.club_members = [];
    db.users.forEach(u => {
      if (u.joinedClubs) {
        u.joinedClubs.forEach(cid => {
          db.club_members.push({
            id: Date.now() + Math.random(),
            clubId: cid,
            userId: u.id,
            joinedAt: u.joinedDate || 'August 15, 2024'
          });
        });
      }
    });
  }
  
  const joinedIdx = user.joinedClubs.indexOf(clubId);
  const memberIdx = db.club_members.findIndex(cm => cm.clubId === clubId && cm.userId === user.id);
  
  if (joinedIdx === -1) {
    // Join club
    user.joinedClubs.push(clubId);
    
    if (memberIdx === -1) {
      db.club_members.push({
        id: Date.now(),
        clubId: clubId,
        userId: user.id,
        joinedAt: 'Today'
      });
    }
    
    // Increment memberCount
    club.memberCount = (club.memberCount || 0) + 1;
    
    // Create notifications
    const notif = {
      id: Date.now(),
      userId: user.id,
      type: 'club',
      title: 'Joined Club',
      message: `Successfully joined ${club.name}.`,
      time: 'Just now',
      isRead: false,
      icon: 'users',
      link: `/clubs/${club.id}`
    };
    db.notifications.unshift(notif);

    const io = getIo();
    if (io) {
      io.to(`user-${user.id}`).emit('notification_created', notif);
      io.to(`user-${user.id}`).emit('new-notification', {
        title: notif.title,
        message: notif.message
      });
    }
  } else {
    // Leave club
    user.joinedClubs.splice(joinedIdx, 1);
    
    if (memberIdx !== -1) {
      db.club_members.splice(memberIdx, 1);
    }
    
    // Decrement memberCount
    club.memberCount = Math.max(0, (club.memberCount || 0) - 1);
  }
  
  writeDb(db);

  const io = getIo();
  if (io) {
    const isJoined = user.joinedClubs.includes(clubId);
    const eventName = isJoined ? 'club_joined' : 'club_left';
    io.to(`user-${user.id}`).emit(eventName, { clubId, userId: user.id });
    if (club.leaderId) {
      io.to(`user-${club.leaderId}`).emit(eventName, { clubId, userId: user.id });
    }
    if (club.ownerId && club.ownerId !== club.leaderId) {
      io.to(`user-${club.ownerId}`).emit(eventName, { clubId, userId: user.id });
    }
  }

  res.json({ joinedClubs: user.joinedClubs, memberCount: club.memberCount });
});

// ----------------------------------------------------
// NOTIFICATIONS ENDPOINTS
// ----------------------------------------------------

router.get('/notifications', (req, res) => {
  const userId = parseInt(req.query.userId);
  if (!userId) return res.status(400).json({ message: 'User ID is required' });
  
  const db = readDb();
  const userNotifications = db.notifications.filter(n => n.userId === userId);
  res.json(userNotifications);
});

router.post('/notifications/:id/read', (req, res) => {
  const notifId = parseInt(req.params.id);
  const db = readDb();
  const notif = db.notifications.find(n => n.id === notifId);
  if (notif) {
    notif.isRead = true;
    writeDb(db);
  }
  res.json({ message: 'Notification marked read' });
});

router.post('/notifications/read-all', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: 'User ID is required' });
  
  const db = readDb();
  db.notifications.forEach(n => {
    if (n.userId === parseInt(userId)) n.isRead = true;
  });
  writeDb(db);
  res.json({ message: 'All notifications marked read' });
});

router.delete('/notifications/:id', (req, res) => {
  const notifId = parseInt(req.params.id);
  const db = readDb();
  const idx = db.notifications.findIndex(n => n.id === notifId);
  if (idx !== -1) {
    db.notifications.splice(idx, 1);
    writeDb(db);
  }
  res.json({ message: 'Notification dismissed' });
});

// ----------------------------------------------------
// RESOURCE & COURSE ENDPOINTS
// ----------------------------------------------------

router.get('/resources', (req, res) => {
  const db = readDb();
  res.json(db.resources);
});

router.get('/resources/:id', (req, res) => {
  const db = readDb();
  const resource = db.resources.find(r => r.id === parseInt(req.params.id));
  if (!resource) return res.status(404).json({ message: 'Resource not found' });
  res.json(resource);
});

// ----------------------------------------------------
// ANNOUNCEMENT ENDPOINTS
// ----------------------------------------------------

router.get('/announcements', (req, res) => {
  const db = readDb();
  res.json(db.announcements);
});

router.post(['/announcements', '/announcements/create'], async (req, res) => {
  const { title, content, message, author, authorAvatar, department, authorId, userId, authorRole, createdAt } = req.body;
  const actualContent = message || content;
  if (!title || !actualContent) {
    return res.status(400).json({ message: 'Title and content/message are required' });
  }

  const db = readDb();
  const uId = parseInt(authorId || userId);
  const user = db.users.find(u => u.id === uId);

  let cid = user ? user.clubId : null;
  const club = cid ? db.clubs.find(c => c.id === cid) : null;

  // Try to generate AI summary using Gemini, fallback to substring
  let aiSummary = '';
  try {
    const prompt = `Summarize this university announcement into a single, concise sentence under 12 words: "${actualContent}"`;
    aiSummary = await callGemini(prompt);
    aiSummary = aiSummary.trim().replace(/^"|"$/g, '');
  } catch (err) {
    console.warn('Gemini summary failed, using local fallback:', err);
    aiSummary = actualContent.length > 80 ? actualContent.slice(0, 80) + '...' : actualContent;
  }

  const defaultInitials = user && user.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const newAnn = {
    id: Date.now(),
    title: title.trim(),
    message: actualContent.trim(),
    content: actualContent.trim(),
    author: author || (user ? user.name : 'University Member'),
    authorId: uId,
    authorRole: authorRole || (user ? user.role : 'clubLeader'),
    authorAvatar: authorAvatar || defaultInitials,
    department: department || (club ? club.name : (user && user.department ? user.department : 'General')),
    clubId: cid,
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    createdAt: createdAt || new Date().toISOString(),
    priority: 'normal',
    aiSummary
  };

  if (!db.announcements) db.announcements = [];
  db.announcements.unshift(newAnn);

  // Notify target users
  const notifyUsers = cid 
    ? db.users.filter(u => u.joinedClubs && u.joinedClubs.includes(cid))
    : db.users.filter(u => u.role === 'student' || u.role === 'clubLeader' || u.role === 'club_leader');

  if (!db.notifications) db.notifications = [];
  const io = getIo();

  notifyUsers.forEach(member => {
    const notif = {
      id: Date.now() + Math.random(),
      userId: member.id,
      type: 'announcement',
      title: club ? `${club.name}: ${title}` : 'New Announcement',
      message: actualContent.length > 100 ? actualContent.slice(0, 100) + '...' : actualContent,
      time: 'Just now',
      isRead: false,
      icon: 'megaphone',
      link: club ? `/clubs/${club.id}` : '/notifications'
    };
    db.notifications.unshift(notif);

    if (io) {
      io.to(`user-${member.id}`).emit('notification_created', notif);
      io.to(`user-${member.id}`).emit('new-notification', {
        title: notif.title,
        message: notif.message
      });
    }
  });

  writeDb(db);

  if (io) {
    io.emit('announcement_created', newAnn);
  }

  res.status(201).json(newAnn);
});

// ----------------------------------------------------
// GEMINI INTELLIGENCE API ENDPOINTS
// ----------------------------------------------------

// Local fallback recommendation engine when Gemini fails/is rate limited
function getLocalRecommendations(user, db) {
  const interests = Array.isArray(user.interests)
    ? user.interests.map(i => i.toLowerCase().trim())
    : typeof user.interests === 'string'
      ? user.interests.split(',').map(i => i.toLowerCase().trim()).filter(Boolean)
      : [];
  
  const userDept = (user.department || '').toLowerCase().trim();
  const joinedClubs = user.joinedClubs || [];
  const registeredEvents = user.registeredEvents || [];
  
  // 1. Score and filter Events
  const scoredEvents = db.events
    .filter(e => e.isApproved !== false && !registeredEvents.includes(e.id))
    .map(e => {
      let score = 0;
      const titleLower = e.title.toLowerCase();
      const descLower = e.description.toLowerCase();
      const categoryLower = e.category.toLowerCase();
      const tags = (e.tags || []).map(t => t.toLowerCase());
      
      interests.forEach(interest => {
        if (titleLower.includes(interest) || descLower.includes(interest) || categoryLower.includes(interest) || tags.includes(interest)) {
          score += 5;
        }
      });
      
      if (userDept && (titleLower.includes(userDept) || descLower.includes(userDept))) {
        score += 3;
      }
      
      if (e.isFeatured) score += 2;
      score += (e.registeredSeats || 0) / 100;
      
      return { event: e, score };
    })
    .sort((a, b) => b.score - a.score);

  // 2. Score and filter Clubs
  const scoredClubs = db.clubs
    .filter(c => !joinedClubs.includes(c.id))
    .map(c => {
      let score = 0;
      const nameLower = c.name.toLowerCase();
      const descLower = (c.description || '').toLowerCase();
      const categoryLower = (c.category || '').toLowerCase();
      const tags = (c.tags || []).map(t => t.toLowerCase());
      
      interests.forEach(interest => {
        if (nameLower.includes(interest) || descLower.includes(interest) || categoryLower.includes(interest) || tags.includes(interest)) {
          score += 5;
        }
      });
      
      if (userDept && (nameLower.includes(userDept) || descLower.includes(userDept))) {
        score += 3;
      }
      
      score += (c.memberCount || 0) / 50;
      
      return { club: c, score };
    })
    .sort((a, b) => b.score - a.score);

  // 3. Score and filter Resources
  const scoredResources = db.resources
    .map(r => {
      let score = 0;
      const titleLower = r.title.toLowerCase();
      const descLower = (r.description || '').toLowerCase();
      const tags = (r.tags || []).map(t => t.toLowerCase());
      
      interests.forEach(interest => {
        if (titleLower.includes(interest) || descLower.includes(interest) || tags.includes(interest)) {
          score += 5;
        }
      });
      
      if (userDept && (titleLower.includes(userDept) || descLower.includes(userDept))) {
        score += 3;
      }
      
      return { resource: r, score };
    })
    .sort((a, b) => b.score - a.score);

  const recommendations = [];
  
  // Pick top Event
  if (scoredEvents.length > 0) {
    const bestEvent = scoredEvents[0].event;
    recommendations.push({
      type: 'event',
      id: bestEvent.id,
      title: bestEvent.title,
      reason: `Matches your interest in ${bestEvent.category} and matches your campus pulse.`,
      icon: '📅',
      color: 'var(--primary-500)'
    });
  }
  
  // Pick top Club
  if (scoredClubs.length > 0) {
    const bestClub = scoredClubs[0].club;
    recommendations.push({
      type: 'club',
      id: bestClub.id,
      title: bestClub.name,
      reason: `Explore ${bestClub.name} to connect with peers in the ${bestClub.category} community.`,
      icon: '🏛️',
      color: 'var(--accent-500)'
    });
  }
  
  // Pick top Resource
  if (scoredResources.length > 0) {
    const bestResource = scoredResources[0].resource;
    recommendations.push({
      type: 'resource',
      id: bestResource.id,
      title: bestResource.title,
      reason: `A highly recommended ${bestResource.type} for students in your department.`,
      icon: '📚',
      color: 'var(--success-500)'
    });
  }
  
  // Fallbacks if lists are empty
  while (recommendations.length < 3) {
    recommendations.push({
      type: 'resource',
      id: 1,
      title: 'Academic Survival Guide',
      reason: 'General tips for maintaining balance and achieving academic success.',
      icon: '🧠',
      color: 'var(--warning-500)'
    });
  }
  
  return recommendations.slice(0, 3);
}

router.post('/ai/recommendations', async (req, res) => {
  console.log('[AI REQUEST RECEIVED] POST /api/ai/recommendations');
  const { user } = req.body;
  if (!user) return res.status(400).json({ message: 'User context is required' });

  const db = readDb();
  const eventsSummary = db.events.map(e => ({ id: e.id, title: e.title, category: e.category, tags: e.tags })).slice(0, 10);
  const clubsSummary = db.clubs.map(c => ({ id: c.id, name: c.name, category: c.category, tags: c.tags })).slice(0, 10);
  const resourcesSummary = db.resources.map(r => ({ id: r.id, title: r.title, type: r.type, tags: r.tags }));

  const prompt = `
    You are CampusPulse AI recommender.
    We need exactly 3 personalized recommendations for the user:
    User Profile:
    - Name: ${user.name}
    - Department: ${user.department}
    - Interests: ${JSON.stringify(user.interests || [])}
    - Joined Clubs (IDs): ${JSON.stringify(user.joinedClubs || [])}
    - Registered Events (IDs): ${JSON.stringify(user.registeredEvents || [])}

    Available Options:
    Events: ${JSON.stringify(eventsSummary)}
    Clubs: ${JSON.stringify(clubsSummary)}
    Resources: ${JSON.stringify(resourcesSummary)}

    Output exactly a JSON array containing exactly 3 objects.
    Each object must represent one recommendation, with these keys:
    - type: "event" or "club" or "resource"
    - id: the exact ID of the item from the lists above
    - title: the name/title of the recommended item
    - reason: a concise 1-sentence personalized reason (e.g. "Matches your interest in coding and previous hackathons")
    - icon: an appropriate single emoji (e.g. 🚀, 🧠, 💻, 🏛️)
    - color: a CSS color token (e.g. "var(--primary-500)" or "var(--accent-500)" or "var(--success-500)")

    Return ONLY the raw JSON array. Do not include markdown tags like \`\`\`json.
  `;

  try {
    const rawResult = await callGemini(prompt);
    const cleanJSON = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanJSON);
    res.json(parsedData);
  } catch (error) {
    console.error('[GEMINI ERROR] Gemini AI recommendations failed, falling back to local engine:', error);
    try {
      const localRecommendations = getLocalRecommendations(user, db);
      res.json(localRecommendations);
    } catch (fallbackError) {
      console.error('[FALLBACK ERROR] Local recommendations failed:', fallbackError);
      res.status(500).json({ message: 'Failed to generate recommendations' });
    }
  }
});

router.post('/ai/insight/:eventId', async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  console.log(`[AI REQUEST RECEIVED] POST /api/ai/insight/${eventId}`);
  const { user } = req.body;
  
  if (!user) return res.status(400).json({ message: 'User context is required' });
  
  const db = readDb();
  const event = db.events.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  const prompt = `
    Analyze why this university event matches the user's profile.
    User Info:
    - Department: ${user.department}
    - Interests: ${JSON.stringify(user.interests || [])}
    - Joined Clubs (IDs): ${JSON.stringify(user.joinedClubs || [])}
    
    Event Info:
    - Title: ${event.title}
    - Category: ${event.category}
    - Organizer: ${event.organizer}
    - Tags: ${JSON.stringify(event.tags || [])}
    - Description: ${event.description.substring(0, 150)}...
    
    Generate exactly one short, encouraging sentence explaining why this event matches the user.
    The response MUST start with "Recommended because..." or similar. Keep it under 20 words.
  `;

  try {
    const rawResult = await callGemini(prompt);
    const cleanResult = rawResult.trim().replace(/^"|"$/g, '');
    res.json({ insight: cleanResult });
  } catch (error) {
    console.error('[GEMINI ERROR] Gemini AI insights failed, falling back to local template:', error);
    const matchedTag = event.tags && user.interests ? event.tags.find(t => user.interests.map(i => i.toLowerCase()).includes(t.toLowerCase())) : null;
    let reason = `Recommended because it aligns with your academic department (${user.department}) and matches peer activities.`;
    if (matchedTag) {
      reason = `Recommended because you have a saved interest in ${matchedTag} and it offers great hands-on learning.`;
    }
    res.json({ insight: reason });
  }
});

router.post('/ai/search', async (req, res) => {
  console.log('[AI REQUEST RECEIVED] POST /api/ai/search');
  const { query } = req.body;
  if (!query) return res.status(400).json({ message: 'Query is required' });

  const db = readDb();
  const eventsSummary = db.events.map(e => ({ id: e.id, title: e.title, category: e.category, tags: e.tags, date: e.date, venue: e.venue }));
  const clubsSummary = db.clubs.map(c => ({ id: c.id, name: c.name, category: c.category, tags: c.tags }));
  const resourcesSummary = db.resources.map(r => ({ id: r.id, title: r.title, type: r.type, tags: r.tags }));

  const prompt = `
    You are CampusPulse AI, the natural language search assistant.
    The user is asking: "${query}"

    Search through the actual campus data:
    Events: ${JSON.stringify(eventsSummary)}
    Clubs: ${JSON.stringify(clubsSummary)}
    Resources: ${JSON.stringify(resourcesSummary)}

    Find the most relevant items (maximum 3-4 matches) matching the user's intent.
    Format your response in a very concise, structured markdown.
    You MUST provide links using this exact format:
    - Events: [Event Title](/events/id)
    - Clubs: [Club Name](/clubs/id)
    - Resources: [Resource Title](/resources/id)
    
    Explain in a few words why each match is relevant. Keep it encouraging and under 150 words.
    
    If nothing matches, politely state that you couldn't find a direct match, but suggest some related campus activities.
  `;

  try {
    const rawResult = await callGemini(prompt);
    res.json({ result: rawResult });
  } catch (error) {
    console.error('[GEMINI ERROR] Gemini AI search failed, running local query match:', error);
    const q = (query || '').toLowerCase().trim();
    const matches = [];
    
    db.events.forEach(e => {
      if (e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q)) {
        matches.push(`- **Event**: [${e.title}](/events/${e.id}) - *Relevance: Matches search query "${query}"*`);
      }
    });
    db.clubs.forEach(c => {
      if (c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q)) {
        matches.push(`- **Club**: [${c.name}](/clubs/${c.id}) - *Relevance: Matches search query "${query}"*`);
      }
    });
    db.resources.forEach(r => {
      if (r.title.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)) {
        matches.push(`- **Resource**: [${r.title}](/resources/${r.id}) - *Relevance: Matches academic topic "${query}"*`);
      }
    });
    
    let result = '';
    if (matches.length > 0) {
      result = `### Local Search Results for "${query}"\n\nI found the following items matching your search query in the local directory:\n\n` + matches.slice(0, 4).join('\n') + `\n\n*(Note: Displaying local search results as the AI service is currently at capacity)*`;
    } else {
      result = `### Local Search Results for "${query}"\n\nI couldn't find any direct matches for "${query}" in our local database. Try looking for general terms like "workshop", "coding", "hackathon", or "AI".\n\n*(Note: Showing local search results as the AI service is currently at capacity)*`;
    }
    res.json({ result });
  }
});

// ====================================================
// CHAT SYSTEM UPGRADE ENDPOINTS
// ====================================================

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${Date.now()}-${cleanName}.${ext}`);
  }
});
const upload = multer({ storage });

// Time formatter utility
function formatTime(isoStr) {
  const date = new Date(isoStr);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

function getAvatarInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  const first = parts[0].charAt(0).toUpperCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first}${last}`;
}

// AI response trigger using Gemini Service
async function triggerAIReply(conversationId, userQuery, user, db) {
  console.log(`[AI REQUEST RECEIVED] triggerAIReply for conversation ID: ${conversationId}`);
  const io = getIo();
  const convoId = conversationId;
  
  if (io) {
    io.to(`convo-${convoId}`).emit('typing', { conversationId: convoId, userId: 'ai', userName: 'CampusPulse AI', isTyping: true });
  }
  
  try {
    const eventsSummary = db.events.map(e => ({ id: e.id, title: e.title, category: e.category, tags: e.tags, date: e.date, venue: e.venue, organizer: e.organizer }));
    const clubsSummary = db.clubs.map(c => ({ id: c.id, name: c.name, category: c.category, tags: c.tags, president: c.president }));
    const announcementsSummary = db.announcements.map(a => ({ id: a.id, title: a.title, content: a.content, author: a.author, date: a.date }));
    
    // Resolve user's contextual data
    const userRegs = db.registrations.filter(r => r.userId === user?.id && r.registrationStatus === 'registered').map(r => {
      const e = db.events.find(evt => evt.id === r.eventId);
      return e ? e.title : '';
    }).filter(Boolean);

    const userSaved = db.savedEvents ? db.savedEvents.filter(s => s.userId === user?.id).map(s => {
      const e = db.events.find(evt => evt.id === s.eventId);
      return e ? e.title : '';
    }).filter(Boolean) : (user?.savedEvents || []).map(eid => {
      const e = db.events.find(evt => evt.id === eid);
      return e ? e.title : '';
    }).filter(Boolean);

    const userClubs = (user?.joinedClubs || []).map(cid => {
      const c = db.clubs.find(cl => cl.id === cid);
      return c ? c.name : '';
    }).filter(Boolean);

    const userContext = {
      name: user?.name || 'Student',
      department: user?.department || 'Computer Science',
      interests: user?.interests || [],
      joinedClubs: userClubs,
      registeredEvents: userRegs,
      savedEvents: userSaved
    };

    const systemPrompt = `
      You are CampusPulse AI, the real-time chat helper inside the CampusPulse platform.
      You are talking to ${userContext.name} from the ${userContext.department} department.
      
      Here is the user's profile context:
      - Interests: ${JSON.stringify(userContext.interests)}
      - Joined Clubs: ${JSON.stringify(userContext.joinedClubs)}
      - Registered Events: ${JSON.stringify(userContext.registeredEvents)}
      - Saved Events: ${JSON.stringify(userContext.savedEvents)}
      
      Here is the current campus database context:
      Events: ${JSON.stringify(eventsSummary)}
      Clubs: ${JSON.stringify(clubsSummary)}
      Announcements: ${JSON.stringify(announcementsSummary)}
      
      User message: "${userQuery}"
      
      Please answer the user's questions accurately using the campus context. Provide personalized campus advice, career tips, study plans, or club/event matching based on their profile.
      For example, if they have interest in Tech or Coding, point out hackathons or tech clubs. If they ask about announcements or upcoming events, give a summary of relevant items.
      Format your response in a very clean, structured markdown.
      You MUST provide links in the exact format:
      - Events: [Event Title](/events/id)
      - Clubs: [Club Name](/clubs/id)
      - Announcements: [Announcement Title](/dashboard)
      
      Keep the response concise, engaging, and under 180 words. Do not use generic answers or mention technical variables.
    `;
    
    const replyText = await callGemini(systemPrompt);
    
    // Save reply to database
    const newDb = readDb();
    const newMsg = {
      messageId: Date.now() + Math.random(),
      conversationId: convoId,
      senderId: 'ai',
      receiverId: null,
      text: replyText.trim(),
      message: replyText.trim(),
      fileUrl: null,
      fileName: null,
      fileType: null,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isRead: true,
      readStatus: 'read'
    };
    newDb.messages.push(newMsg);
    writeDb(newDb);
    
    if (io) {
      io.to(`convo-${convoId}`).emit('typing', { conversationId: convoId, userId: 'ai', userName: 'CampusPulse AI', isTyping: false });
      io.to(`convo-${convoId}`).emit('new-message', {
        id: newMsg.messageId,
        conversationId: convoId,
        senderId: 'ai',
        sender: 'CampusPulse AI',
        avatar: '🤖',
        content: newMsg.message,
        text: newMsg.text,
        time: formatTime(newMsg.createdAt),
        timestamp: newMsg.timestamp,
        isOwn: false,
        isRead: true,
        readStatus: 'read'
      });
    }
  } catch (err) {
    console.error('[GEMINI ERROR] Error generating AI reply in chat:', err);
    if (io) {
      io.to(`convo-${convoId}`).emit('typing', { conversationId: convoId, userId: 'ai', userName: 'CampusPulse AI', isTyping: false });
      
      const errMsg = {
        messageId: Date.now() + Math.random(),
        conversationId: convoId,
        senderId: 'ai',
        receiverId: null,
        text: `Gemini AI reply failed: ${err.message}`,
        message: `Gemini AI reply failed: ${err.message}`,
        fileUrl: null,
        fileName: null,
        fileType: null,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isRead: true,
        readStatus: 'read'
      };
      
      const newDb = readDb();
      newDb.messages.push(errMsg);
      writeDb(newDb);
      
      io.to(`convo-${convoId}`).emit('new-message', {
        id: errMsg.messageId,
        conversationId: convoId,
        senderId: 'ai',
        sender: 'CampusPulse AI',
        avatar: '🤖',
        content: errMsg.message,
        text: errMsg.text,
        time: formatTime(errMsg.createdAt),
        timestamp: errMsg.timestamp,
        isOwn: false,
        isRead: true,
        readStatus: 'read'
      });
    }
  }
}

// 0. User search endpoint for starting new conversations (queries real users table)
router.get('/users/search', (req, res) => {
  const query = (req.query.q || '').toLowerCase();
  const excludeUserId = parseInt(req.query.excludeUserId);
  const db = readDb();
  
  const matchedUsers = db.users
    .filter(u => {
      // Exclude logged in user
      if (excludeUserId && u.id === excludeUserId) return false;
      // Exclude admin role
      if (u.role === 'admin') return false;
      
      const nameMatch = u.name && u.name.toLowerCase().includes(query);
      const emailMatch = u.email && u.email.toLowerCase().includes(query);
      const usernameMatch = u.username && u.username.toLowerCase().includes(query);
      
      // Fallback username check (prefix of email address)
      const emailPrefix = u.email ? u.email.split('@')[0].toLowerCase() : '';
      const emailPrefixMatch = emailPrefix.includes(query);
      
      return nameMatch || emailMatch || usernameMatch || emailPrefixMatch;
    })
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department || 'Computer Science',
      avatar: u.avatar || u.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      online: isUserOnline(u.id),
      type: 'user'
    }));
    
  res.json(matchedUsers);
});

// 1. Global User Search Endpoint
router.get('/chat/search', (req, res) => {
  const query = (req.query.query || '').toLowerCase();
  const excludeUserId = parseInt(req.query.excludeUserId);
  const db = readDb();
  
  // Search users (exclude admins and current user)
  const matchedUsers = db.users
    .filter(u => u.id !== excludeUserId && u.role !== 'admin' && (u.name.toLowerCase().includes(query) || (u.department && u.department.toLowerCase().includes(query)) || u.role.toLowerCase().includes(query)))
    .map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      department: u.department,
      avatar: u.avatar || u.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      online: isUserOnline(u.id),
      type: 'user'
    }));
    
  // Search clubs
  const matchedClubs = db.clubs
    .filter(c => c.name.toLowerCase().includes(query))
    .map(c => ({
      id: c.id,
      name: c.name,
      role: 'Club',
      department: c.category,
      avatar: c.logo || c.name.substring(0, 2).toUpperCase(),
      color: c.color,
      type: 'club'
    }));
    
  res.json([...matchedUsers, ...matchedClubs]);
});

// 2. Fetch Conversations List
router.get('/chat/conversations', (req, res) => {
  const userId = parseInt(req.query.userId);
  if (!userId) return res.status(400).json({ message: 'User ID is required' });
  
  const db = readDb();
  
  if (!db.conversations) db.conversations = [];
  if (!db.participants) db.participants = [];
  if (!db.messages) db.messages = [];
  
  // Seed group conversations for clubs and events dynamically
  let dbUpdated = false;
  db.clubs.forEach(club => {
    const exists = db.conversations.some(c => c.clubId === club.id);
    if (!exists) {
      db.conversations.push({
        id: `club-${club.id}`,
        type: 'group',
        name: `${club.name} Group`,
        avatar: club.logo || club.name.substring(0, 2).toUpperCase(),
        clubId: club.id,
        color: club.color
      });
      dbUpdated = true;
    }
  });
  
  db.events.forEach(event => {
    const exists = db.conversations.some(c => c.eventId === event.id);
    if (!exists) {
      db.conversations.push({
        id: `event-${event.id}`,
        type: 'group',
        name: `${event.title} Discussion`,
        avatar: '📅',
        eventId: event.id
      });
      dbUpdated = true;
    }
  });
  
  // Seed user-specific private AI Assistant conversation
  const userAiConvoId = `ai-${userId}`;
  const userAiExists = db.conversations.some(c => c.id === userAiConvoId);
  if (!userAiExists) {
    db.conversations.push({
      id: userAiConvoId,
      type: 'ai',
      name: 'CampusPulse AI',
      avatar: '🤖',
      color: '#8b5cf6',
      createdAt: new Date().toISOString()
    });
    dbUpdated = true;
  }
  
  if (dbUpdated) {
    writeDb(db);
  }
  
  // Filter conversations
  const userConvoIds = db.participants
    .filter(p => p.userId === userId)
    .map(p => p.conversationId);
    
  const joinedClubIds = db.club_members
    ? db.club_members.filter(cm => cm.userId === userId).map(cm => cm.clubId)
    : db.users.find(u => u.id === userId)?.joinedClubs || [];
    
  const registeredEventIds = db.registrations
    .filter(r => r.userId === userId && r.registrationStatus === 'registered')
    .map(r => r.eventId);
    
  const matchedConvos = db.conversations.filter(convo => {
    if (convo.type === 'ai') {
      return convo.id.startsWith(`ai-${userId}`);
    }
    if (convo.type === 'direct') {
      return userConvoIds.includes(convo.id);
    }
    if (convo.clubId) {
      return joinedClubIds.includes(convo.clubId);
    }
    if (convo.eventId) {
      return registeredEventIds.includes(convo.eventId);
    }
    return false;
  });
  
  // Resolve meta data
  const result = matchedConvos.map(convo => {
    const convoMessages = db.messages.filter(m => m.conversationId === convo.id);
    const lastMsg = convoMessages.length > 0 ? convoMessages[convoMessages.length - 1] : null;
    const unreadCount = convoMessages.filter(m => m.senderId !== userId && !m.isRead).length;
    
    let details = { ...convo };
    
    if (convo.type === 'direct') {
      const otherParticipant = db.participants.find(p => p.conversationId === convo.id && p.userId !== userId);
      if (otherParticipant) {
        const otherUser = db.users.find(u => u.id === otherParticipant.userId);
        if (otherUser) {
          const initials = otherUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
          details.name = otherUser.name;
          details.avatar = otherUser.avatar || initials;
          details.otherUserId = otherUser.id;
          details.online = isUserOnline(otherUser.id);
          details.role = otherUser.role;
          details.department = otherUser.department;
        }
      }
    } else if (convo.type === 'group' && convo.clubId) {
      const club = db.clubs.find(c => c.id === convo.clubId);
      details.memberCount = club ? club.memberCount : 0;
    } else if (convo.type === 'group' && convo.eventId) {
      const event = db.events.find(e => e.id === convo.eventId);
      details.memberCount = event ? event.registeredSeats : 0;
    }
    
    return {
      ...details,
      lastMessage: lastMsg ? lastMsg.message : (convo.type === 'ai' ? 'How can I assist you today?' : ''),
      lastTime: lastMsg ? formatTime(lastMsg.createdAt) : '',
      unread: unreadCount,
      lastMessageAt: lastMsg ? lastMsg.createdAt : '1970-01-01T00:00:00.000Z'
    };
  });
  
  result.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  res.json(result);
});

// 3. Fetch Messages in a Conversation
router.get('/chat/conversations/:convoId/messages', (req, res) => {
  const convoId = req.params.convoId;
  const userId = parseInt(req.query.userId);
  const db = readDb();
  
  if (!db.messages) db.messages = [];
  
  const convoMessages = db.messages.filter(m => m.conversationId === convoId);
  
  // Mark unread messages as read
  let dbChanged = false;
  db.messages.forEach(msg => {
    if (msg.conversationId === convoId && msg.senderId !== userId && !msg.isRead) {
      msg.isRead = true;
      msg.readStatus = 'read';
      dbChanged = true;
    }
  });
  
  if (dbChanged) {
    writeDb(db);
    const io = getIo();
    if (io) {
      io.to(`convo-${convoId}`).emit('messages-read', { conversationId: convoId, readerId: userId });
    }
  }
  
  const formatted = convoMessages.map(m => {
    const userObj = db.users.find(u => u.id === m.senderId);
    const senderName = userObj?.name || (m.senderId === 'ai' ? 'CampusPulse AI' : 'System');
    return {
      id: m.messageId,
      senderId: m.senderId,
      sender: senderName,
      avatar: userObj?.avatar || (m.senderId === 'ai' ? '🤖' : getAvatarInitials(senderName)),
      content: m.message,
      fileUrl: m.fileUrl,
      fileName: m.fileName,
      fileType: m.fileType,
      time: formatTime(m.createdAt),
      isOwn: m.senderId === userId,
      readStatus: m.readStatus
    };
  });
  
  res.json(formatted);
});

// 4. Create New Direct Conversation
router.post('/chat/conversations', (req, res) => {
  const { senderId, receiverId } = req.body;
  if (!senderId || !receiverId) return res.status(400).json({ message: 'Sender ID and Receiver ID are required' });
  
  const sId = parseInt(senderId);
  const rId = parseInt(receiverId);
  const db = readDb();
  
  if (!db.conversations) db.conversations = [];
  if (!db.participants) db.participants = [];
  
  // Find existing
  const existingConvo = db.conversations.find(convo => {
    if (convo.type !== 'direct') return false;
    const parts = db.participants.filter(p => p.conversationId === convo.id);
    const hasSender = parts.some(p => p.userId === sId);
    const hasReceiver = parts.some(p => p.userId === rId);
    return hasSender && hasReceiver;
  });
  
  if (existingConvo) {
    return res.json(existingConvo);
  }
  
  const newConvoId = `direct-${Date.now()}`;
  const newConvo = {
    id: newConvoId,
    type: 'direct',
    createdAt: new Date().toISOString()
  };
  
  db.conversations.push(newConvo);
  db.participants.push({ id: Date.now(), conversationId: newConvoId, userId: sId });
  db.participants.push({ id: Date.now() + 1, conversationId: newConvoId, userId: rId });
  
  writeDb(db);
  res.json(newConvo);
});

// Create Custom AI Conversation
router.post('/chat/conversations/ai', (req, res) => {
  const { userId, name } = req.body;
  if (!userId) return res.status(400).json({ message: 'User ID is required' });
  
  const db = readDb();
  if (!db.conversations) db.conversations = [];
  
  const newConvoId = `ai-${userId}-${Date.now()}`;
  const newConvo = {
    id: newConvoId,
    type: 'ai',
    name: name || `AI Chat ${new Date().toLocaleDateString()}`,
    avatar: '🤖',
    color: '#8b5cf6',
    createdAt: new Date().toISOString()
  };
  
  db.conversations.push(newConvo);
  writeDb(db);
  res.json(newConvo);
});

// 5. Post message REST Route (with Socket triggers and Gemini Assist hooks)
router.post('/chat/messages', async (req, res) => {
  const { conversationId, senderId, receiverId, message, fileUrl, fileName, fileType } = req.body;
  const sId = parseInt(senderId) || senderId; // 'ai' or user ID
  const rId = parseInt(receiverId) || null;
  
  const db = readDb();
  if (!db.messages) db.messages = [];
  
  const io = getIo();
  let isRead = false;
  if (io && rId) {
    const convoRoom = io.sockets.adapter.rooms.get(`convo-${conversationId}`);
    const recipientSocketId = getUserSocketId(rId);
    if (convoRoom && recipientSocketId && convoRoom.has(recipientSocketId)) {
      isRead = true;
    }
  }
  
  const newMsg = {
    messageId: Date.now() + Math.random(),
    conversationId,
    senderId: sId,
    receiverId: rId,
    text: message,
    message, // Keep for backward compatibility
    fileUrl,
    fileName,
    fileType,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(), // Keep for backward compatibility
    isRead,
    readStatus: isRead ? 'read' : 'sent'
  };
  
  db.messages.push(newMsg);
  writeDb(db);
  
  if (io) {
    const userObj = db.users.find(u => u.id === newMsg.senderId);
    const senderName = userObj?.name || (newMsg.senderId === 'ai' ? 'CampusPulse AI' : 'System');
    const socketMsg = {
      id: newMsg.messageId,
      conversationId,
      senderId: newMsg.senderId,
      sender: senderName,
      avatar: userObj?.avatar || (newMsg.senderId === 'ai' ? '🤖' : getAvatarInitials(senderName)),
      content: newMsg.message,
      text: newMsg.text,
      fileUrl: newMsg.fileUrl,
      fileName: newMsg.fileName,
      fileType: newMsg.fileType,
      time: formatTime(newMsg.createdAt),
      timestamp: newMsg.timestamp,
      isOwn: false,
      isRead: newMsg.isRead,
      readStatus: newMsg.readStatus
    };

    io.to(`convo-${conversationId}`).emit('new-message', socketMsg);
    
    // Also emit to the receiver's personal user room if they are not in the room convo-${conversationId}
    if (rId) {
      const convoRoom = io.sockets.adapter.rooms.get(`convo-${conversationId}`);
      const recipientSocketId = getUserSocketId(rId);
      if (!convoRoom || !recipientSocketId || !convoRoom.has(recipientSocketId)) {
        io.to(`user-${rId}`).emit('new-message', socketMsg);
      }
    }
  }
  
  if (conversationId.startsWith('ai-') && sId !== 'ai') {
    const userObj = db.users.find(u => u.id === parseInt(sId));
    triggerAIReply(conversationId, message, userObj, db);
  }
  
  res.json(newMsg);
});

// 6. Media / File Upload Route
router.post('/chat/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  res.json({
    fileUrl: `/uploads/${req.file.filename}`,
    fileName: req.file.originalname,
    fileType: req.file.mimetype
  });
});

// 7. Clear Conversation Messages Route
router.delete('/chat/conversations/:convoId/clear', (req, res) => {
  const convoId = req.params.convoId;
  const db = readDb();
  if (db.messages) {
    db.messages = db.messages.filter(m => m.conversationId !== convoId);
    writeDb(db);
  }
  res.json({ message: 'Conversation cleared successfully' });
});

// ============================================================
// CLUB LEADER ENDPOINTS
// ============================================================

// Aggregate dashboard data for a club leader
router.get('/clubs/:id/leader-dashboard', (req, res) => {
  const userId = parseInt(req.query.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const db = readDb();
  
  // Find all clubs managed by this leader
  const managedClubs = db.clubs.filter(c => c.leaderId === userId || c.ownerId === userId || c.createdBy === userId);
  const managedClubIds = managedClubs.map(c => c.id);
  const managedClubNames = managedClubs.map(c => c.name);

  // If the leader has no clubs managed, we still want to return a dashboard state
  if (managedClubs.length === 0) {
    return res.json({ 
      hasClub: false,
      clubs: [],
      clubsCount: 0,
      eventsCreated: 0,
      activeMembers: 0,
      announcementsPosted: 0,
      pendingRequestsCount: 0,
      unreadMessagesCount: 0,
      events: [],
      members: [],
      joinRequests: [],
      announcements: [],
      analytics: {
        totalMembers: 0,
        newMembersThisWeek: 0,
        eventRegistrations: 0,
        mostActiveClub: 'N/A',
        engagementRate: 0,
        memberGrowth: [],
        eventParticipation: []
      }
    });
  }

  // 1. Members: unique users who have any managedClubIds in joinedClubs
  const membersMap = new Map();
  db.users.forEach(u => {
    if (u.joinedClubs && u.joinedClubs.some(cid => managedClubIds.includes(cid))) {
      // Find which club(s) they are in
      const userClubs = managedClubs.filter(c => u.joinedClubs.includes(c.id)).map(c => c.name);
      membersMap.set(u.id, {
        id: u.id,
        name: u.name,
        email: u.email,
        department: u.department,
        year: u.year,
        role: u.role,
        avatar: u.name ? u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??',
        joinedDate: u.joinedDate,
        clubName: userClubs.join(', ')
      });
    }
  });
  const members = Array.from(membersMap.values());

  // 2. Events created by leader or organized by managed clubs
  const leaderEvents = db.events.filter(e => 
    e.creatorId === userId || e.createdBy === userId || managedClubNames.includes(e.organizer)
  );

  // 3. Announcements posted by leader or by managed clubs
  const announcements = (db.announcements || []).filter(a => 
    a.authorId === userId || (a.clubId && managedClubIds.includes(a.clubId)) || managedClubNames.includes(a.department)
  );

  // 4. Pending join requests for managed clubs
  const joinRequests = (db.joinRequests || []).filter(jr => 
    managedClubIds.includes(jr.clubId) && jr.status === 'pending'
  );

  // 5. Statistics
  const clubsCount = managedClubs.length;
  const eventsCreated = db.events.filter(e => e.creatorId === userId || e.createdBy === userId).length;
  const activeMembers = managedClubs.reduce((sum, c) => sum + db.users.filter(u => u.joinedClubs && u.joinedClubs.includes(c.id)).length, 0);
  const announcementsPosted = (db.announcements || []).filter(a => a.authorId === userId || a.createdBy === userId).length;
  const pendingRequestsCount = joinRequests.length;

  // 6. Clubs List details (Clubs managed with member counts, event counts, pending requests)
  const clubsListDetails = managedClubs.map(club => {
    const clubMembersCount = db.users.filter(u => u.joinedClubs && u.joinedClubs.includes(club.id)).length;
    const clubEventsCount = db.events.filter(e => e.organizer === club.name).length;
    const clubPendingRequestsCount = (db.joinRequests || []).filter(jr => jr.clubId === club.id && jr.status === 'pending').length;
    return {
      ...club,
      memberCount: clubMembersCount,
      eventsCount: clubEventsCount,
      pendingRequests: clubPendingRequestsCount
    };
  });

  // 7. Calculate Analytics
  // New members joined in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newMembersThisWeek = members.filter(m => {
    if (!m.joinedDate) return false;
    const joined = new Date(m.joinedDate);
    return joined >= sevenDaysAgo;
  }).length;

  // Event Registrations
  const eventRegistrations = leaderEvents.reduce((sum, e) => sum + (e.registeredSeats || e.registrations || 0), 0);
  const totalCapacity = leaderEvents.reduce((sum, e) => sum + (e.totalSeats || 0), 0);
  const engagementRate = totalCapacity > 0 ? Math.round((eventRegistrations / totalCapacity) * 100) : 0;

  // Most Active Club
  let mostActiveClub = 'N/A';
  let maxScore = -1;
  clubsListDetails.forEach(c => {
    const score = c.memberCount * 2 + c.eventsCount * 5;
    if (score > maxScore) {
      maxScore = score;
      mostActiveClub = c.name;
    }
  });

  // Recharts Member Growth data
  const totalMemberCount = managedClubs.reduce((sum, c) => sum + (c.memberCount || 0), 0);
  const memberGrowth = [
    { month: 'Jan', members: Math.round(totalMemberCount * 0.7) },
    { month: 'Feb', members: Math.round(totalMemberCount * 0.75) },
    { month: 'Mar', members: Math.round(totalMemberCount * 0.8) },
    { month: 'Apr', members: Math.round(totalMemberCount * 0.85) },
    { month: 'May', members: Math.round(totalMemberCount * 0.92) },
    { month: 'Jun', members: totalMemberCount }
  ];

  const eventParticipation = leaderEvents.map(e => ({
    name: e.title.length > 20 ? e.title.slice(0, 20) + '…' : e.title,
    registered: e.registeredSeats || e.registrations || 0,
    capacity: e.totalSeats || 0
  }));

  res.json({
    hasClub: true,
    club: managedClubs[0],
    clubs: clubsListDetails,
    members,
    events: leaderEvents,
    announcements,
    joinRequests,
    clubsCount,
    eventsCreated,
    activeMembers,
    announcementsPosted,
    pendingRequestsCount,
    activeEventCount: leaderEvents.filter(e => new Date(e.date) >= new Date()).length,
    analytics: {
      totalMembers: activeMembers,
      newMembersThisWeek,
      eventRegistrations,
      mostActiveClub,
      engagementRate,
      memberGrowth,
      eventParticipation
    }
  });
});

// Create event under a club
router.post('/clubs/:id/events', (req, res) => {
  const clubId = parseInt(req.params.id);
  const db = readDb();
  const club = db.clubs.find(c => c.id === clubId);
  if (!club) return res.status(404).json({ message: 'Club not found' });

  const { title, description, category, date, time, endTime, venue, totalSeats, tags, imageUrl, registrationDeadline, userId } = req.body;
  if (!title || !date) return res.status(400).json({ message: 'Title and date are required' });

  const cat = category || 'Workshop';
  const defaultImages = {
    Technical: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop',
    Workshop: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=400&fit=crop',
    Sports: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop',
    Cultural: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=400&fit=crop'
  };
  const finalImage = imageUrl || defaultImages[cat] || 'https://images.unsplash.com/photo-1492534513006-37715f336a39?w=800&h=400&fit=crop';
  const uId = parseInt(userId || club.leaderId);

  const newEvent = {
    id: Date.now(),
    title,
    description: description || '',
    category: cat,
    date,
    time: time || '10:00 AM',
    endTime: endTime || '',
    venue: venue || 'TBD',
    organizer: club.name,
    organizerAvatar: club.logo,
    banner: finalImage,
    imageUrl: finalImage,
    totalSeats: parseInt(totalSeats) || 50,
    registeredSeats: 0,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
    isFeatured: false,
    isApproved: true,
    registrations: 0,
    creatorId: uId,
    createdBy: uId,
    registrationDeadline: registrationDeadline || ''
  };

  db.events.push(newEvent);

  if (!club.events) club.events = [];
  club.events.push(newEvent.id);

  writeDb(db);

  const io = getIo();
  if (io) {
    io.emit('event_created', newEvent);
    io.emit('event_registered', { eventId: newEvent.id, userId: uId });
    io.emit('notification_updated');
  }

  res.status(201).json(newEvent);
});

// Create a general event (For Professors or Club Leaders)
router.post(['/events', '/events/create'], (req, res) => {
  const db = readDb();
  const { title, description, category, date, time, endTime, venue, location, totalSeats, maxSeats, tags, registrationDeadline, imageUrl, banner, userId, createdBy, clubId } = req.body;
  if (!title || !date) return res.status(400).json({ message: 'Title and date are required' });

  const uId = parseInt(userId || createdBy);
  if (isNaN(uId)) {
    return res.status(400).json({ message: 'User ID or Creator ID is required' });
  }
  const user = db.users.find(u => u.id === uId);

  const cat = category || 'Workshop';
  const defaultImages = {
    Technical: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop',
    Workshop: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=400&fit=crop',
    Sports: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop',
    Cultural: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=400&fit=crop'
  };
  const finalImage = banner || imageUrl || defaultImages[cat] || 'https://images.unsplash.com/photo-1492534513006-37715f336a39?w=800&h=400&fit=crop';
  const finalVenue = location || venue || 'TBD';
  const finalSeats = parseInt(maxSeats || totalSeats) || 50;

  let cid = clubId ? parseInt(clubId) : null;
  if (!cid && user && user.clubId) {
    cid = user.clubId;
  }
  const club = cid ? db.clubs.find(c => c.id === cid) : null;

  const newEvent = {
    id: Date.now(),
    title,
    description: description || '',
    category: cat,
    date,
    time: time || '10:00 AM',
    endTime: endTime || '',
    venue: finalVenue,
    location: finalVenue,
    organizer: club ? club.name : (user ? `${user.name} (${user.department})` : 'University'),
    organizerAvatar: club ? club.logo : (user ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'UN'),
    banner: finalImage,
    imageUrl: finalImage,
    totalSeats: finalSeats,
    maxSeats: finalSeats,
    registeredSeats: 0,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
    isFeatured: false,
    isApproved: true,
    registrations: 0,
    creatorId: uId,
    createdBy: uId,
    createdAt: new Date().toISOString(),
    registrationDeadline: registrationDeadline || ''
  };

  db.events.push(newEvent);

  if (club) {
    if (!club.events) club.events = [];
    club.events.push(newEvent.id);
  }

  writeDb(db);

  const io = getIo();
  if (io) {
    io.emit('event_created', newEvent);
    io.emit('event_registered', { eventId: newEvent.id, userId: uId });
    io.emit('notification_updated');
  }

  res.status(201).json(newEvent);
});

// Update event
router.put('/events/:id/update', (req, res) => {
  const eventId = parseInt(req.params.id);
  const db = readDb();
  const event = db.events.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  const { title, description, category, date, time, endTime, venue, totalSeats, tags, imageUrl, registrationDeadline, userId } = req.body;
  const uId = parseInt(userId);

  // Validate permissions: Only creator can edit
  if (uId && event.creatorId !== uId && event.createdBy !== uId) {
    return res.status(403).json({ message: 'Access denied: Only the creator can edit this event' });
  }

  if (title) event.title = title;
  if (description !== undefined) event.description = description;
  if (category) event.category = category;
  if (date) event.date = date;
  if (time) event.time = time;
  if (endTime !== undefined) event.endTime = endTime;
  if (venue) event.venue = venue;
  if (totalSeats) event.totalSeats = parseInt(totalSeats);
  if (tags) event.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
  if (registrationDeadline !== undefined) event.registrationDeadline = registrationDeadline;
  
  if (imageUrl !== undefined) {
    event.imageUrl = imageUrl;
    event.banner = imageUrl;
  }

  writeDb(db);

  const io = getIo();
  if (io) {
    io.emit('event_registered', { eventId, userId: uId });
  }

  res.json(event);
});

// Helper to log content deletions for moderation audit trail
function logDeletion(db, userId, userRole, itemType, itemId, itemTitle) {
  if (!db.auditLogs) {
    db.auditLogs = [];
  }
  db.auditLogs.push({
    id: Date.now() + Math.random(),
    deletedBy: userId,
    deletedByRole: userRole,
    deletedAt: new Date().toISOString(),
    deletedItemType: itemType,
    deletedItemId: itemId,
    deletedItemTitle: itemTitle
  });
}

// Delete event
router.delete('/events/:id/delete', (req, res) => {
  const eventId = parseInt(req.params.id);
  const userId = parseInt(req.query.userId || req.body.userId);
  if (!userId) return res.status(400).json({ message: 'User ID is required' });

  const db = readDb();
  const idx = db.events.findIndex(e => e.id === eventId);
  if (idx === -1) return res.status(404).json({ message: 'Event not found' });

  const event = db.events[idx];
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Student cannot delete
  if (user.role === 'student') {
    return res.status(403).json({ message: 'Access denied: Students cannot delete events' });
  }

  const isOwner = event.creatorId === userId || event.createdBy === userId;
  const isModerator = user.role === 'professor' || user.role === 'admin';

  if (!isOwner && !isModerator) {
    return res.status(403).json({ message: 'Access denied: You are not authorized to delete this event' });
  }

  const removed = db.events.splice(idx, 1)[0];

  // Log deletion in moderation history
  logDeletion(db, userId, user.role, 'event', eventId, event.title);

  // Remove from club events array
  db.clubs.forEach(c => {
    if (c.events) c.events = c.events.filter(eid => eid !== eventId);
  });

  // Remove registrations and notify registered users
  if (db.registrations) {
    const registeredUsers = db.registrations.filter(r => r.eventId === eventId && r.registrationStatus === 'registered');
    
    const io = getIo();
    registeredUsers.forEach(r => {
      const notif = {
        id: Date.now() + Math.random(),
        userId: r.userId,
        type: 'event',
        title: 'Event Cancelled',
        message: `The event "${event.title}" has been cancelled by the organizer.`,
        time: 'Just now',
        isRead: false,
        icon: 'bell',
        link: '/notifications'
      };
      if (!db.notifications) db.notifications = [];
      db.notifications.unshift(notif);

      if (io) {
        io.to(`user-${r.userId}`).emit('notification_created', notif);
        io.to(`user-${r.userId}`).emit('new-notification', {
          title: notif.title,
          message: notif.message
        });
      }
    });

    db.registrations = db.registrations.filter(r => r.eventId !== eventId);
  }

  // Remove from saved events
  if (db.savedEvents) {
    db.savedEvents = db.savedEvents.filter(s => s.eventId !== eventId);
  }

  writeDb(db);

  const io = getIo();
  if (io) {
    io.emit('event_registered', { eventId, userId });
    io.emit('event_deleted', { eventId });
  }

  res.json({ message: 'Event deleted', event: removed });
});

// Get registrations for an event (attendee names and emails)
router.get('/events/:id/registrations', (req, res) => {
  const eventId = parseInt(req.params.id);
  const db = readDb();
  const event = db.events.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  if (!db.registrations) db.registrations = [];
  const eventRegs = db.registrations.filter(r => r.eventId === eventId && r.registrationStatus === 'registered');
  const userIds = eventRegs.map(r => r.userId);
  
  const attendees = db.users
    .filter(u => userIds.includes(u.id))
    .map(u => ({
      id: u.id,
      name: u.name || 'Anonymous Student',
      email: u.email || 'N/A',
      department: u.department || 'N/A',
      year: u.year || 'N/A',
      avatar: u.name ? u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??'
    }));

  res.json(attendees);
});

// Get club members
router.get('/clubs/:id/members', (req, res) => {
  const clubId = parseInt(req.params.id);
  const db = readDb();
  const club = db.clubs.find(c => c.id === clubId);
  if (!club) return res.status(404).json({ message: 'Club not found' });

  const clubMemberships = db.club_members || [];
  const members = db.users
    .filter(u => u.joinedClubs && u.joinedClubs.includes(clubId))
    .map(u => {
      const membership = clubMemberships.find(cm => cm.clubId === clubId && cm.userId === u.id);
      return {
        id: u.id, name: u.name, email: u.email, department: u.department,
        year: u.year, role: u.role, bio: u.bio,
        avatar: u.name ? u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??',
        memberRole: u.id === (db.users.find(lu => lu.clubId === clubId && lu.role === 'clubLeader')?.id) ? 'President' : 'Member',
        joinedDate: membership ? membership.joinedAt : u.joinedDate
      };
    });

  res.json(members);
});

// Update member role (promote/remove)
router.post('/clubs/:id/members/:memberId/role', (req, res) => {
  const clubId = parseInt(req.params.id);
  const memberId = parseInt(req.params.memberId);
  const { role } = req.body; // 'moderator', 'student', or 'remove'
  const db = readDb();

  const user = db.users.find(u => u.id === memberId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const club = db.clubs.find(c => c.id === clubId);

  if (role === 'remove') {
    if (user.joinedClubs) {
      user.joinedClubs = user.joinedClubs.filter(cid => cid !== clubId);
    }
    if (club) club.memberCount = Math.max(0, (club.memberCount || 1) - 1);
    
    if (db.club_members) {
      db.club_members = db.club_members.filter(cm => !(cm.clubId === clubId && cm.userId === memberId));
    }

    // Create notifications for the kicked user
    const notif = {
      id: Date.now(),
      userId: memberId,
      type: 'club',
      title: 'Removed from Club',
      message: `You have been removed from ${club?.name || 'the club'}.`,
      time: 'Just now',
      isRead: false,
      icon: 'user-x',
      link: '/clubs'
    };
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift(notif);
    
    const io = getIo();
    if (io) {
      io.to(`user-${memberId}`).emit('notification_created', notif);
      io.to(`user-${memberId}`).emit('club_left', { clubId, userId: memberId });
      if (club?.leaderId) {
        io.to(`user-${club.leaderId}`).emit('club_left', { clubId, userId: memberId });
      }
    }
  } else if (role === 'moderator' || role === 'student') {
    user.role = role;
    
    // Create notification
    const notif = {
      id: Date.now(),
      userId: memberId,
      type: 'club',
      title: role === 'moderator' ? 'Promoted to Moderator' : 'Demoted to Student',
      message: role === 'moderator' 
        ? `You have been promoted to Moderator in ${club?.name}.` 
        : `Your role has been changed to Student in ${club?.name}.`,
      time: 'Just now',
      isRead: false,
      icon: 'shield',
      link: `/clubs/${clubId}`
    };
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift(notif);
    
    const io = getIo();
    if (io) {
      io.to(`user-${memberId}`).emit('notification_created', notif);
      io.to(`user-${memberId}`).emit('club_joined', { clubId, userId: memberId });
      if (club?.leaderId) {
        io.to(`user-${club.leaderId}`).emit('club_joined', { clubId, userId: memberId });
      }
    }
  }

  writeDb(db);
  res.json({ message: role === 'remove' ? 'Member removed' : 'Role updated', userId: memberId, role });
});

// Get pending join requests
router.get('/clubs/:id/join-requests', (req, res) => {
  const clubId = parseInt(req.params.id);
  const db = readDb();
  const requests = (db.joinRequests || []).filter(jr => jr.clubId === clubId && jr.status === 'pending');
  res.json(requests);
});

// Handle join request (approve/reject)
router.post('/clubs/:id/join-requests/:requestId', (req, res) => {
  const clubId = parseInt(req.params.id);
  const requestId = req.params.requestId;
  const { action } = req.body; // 'approve' or 'reject'
  const db = readDb();

  if (!db.joinRequests) db.joinRequests = [];
  const jr = db.joinRequests.find(r => r.id === requestId && r.clubId === clubId);
  if (!jr) return res.status(404).json({ message: 'Join request not found' });

  jr.status = action === 'approve' ? 'approved' : 'rejected';
  const club = db.clubs.find(c => c.id === clubId);

  if (action === 'approve') {
    if (club) club.memberCount = (club.memberCount || 0) + 1;
    
    // Add user to club
    const student = db.users.find(u => u.id === jr.userId);
    if (student) {
      if (!student.joinedClubs) student.joinedClubs = [];
      if (!student.joinedClubs.includes(clubId)) {
        student.joinedClubs.push(clubId);
      }
    }
    
    if (!db.club_members) db.club_members = [];
    const memberExists = db.club_members.some(cm => cm.clubId === clubId && cm.userId === jr.userId);
    if (!memberExists) {
      db.club_members.push({
        id: Date.now(),
        clubId: clubId,
        userId: jr.userId,
        joinedAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      });
    }
    
    // Create notification
    const notif = {
      id: Date.now(),
      userId: jr.userId,
      type: 'club',
      title: 'Join Request Approved',
      message: `Your request to join ${club?.name || 'the club'} has been approved!`,
      time: 'Just now',
      isRead: false,
      icon: 'users',
      link: `/clubs/${clubId}`
    };
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift(notif);
    
    const io = getIo();
    if (io) {
      io.to(`user-${jr.userId}`).emit('notification_created', notif);
      io.to(`user-${jr.userId}`).emit('club_joined', { clubId, userId: jr.userId });
      if (club?.leaderId) {
        io.to(`user-${club.leaderId}`).emit('club_joined', { clubId, userId: jr.userId });
      }
    }
  } else {
    // Rejected request: create notification
    const notif = {
      id: Date.now(),
      userId: jr.userId,
      type: 'club',
      title: 'Join Request Rejected',
      message: `Your request to join ${club?.name || 'the club'} was not approved.`,
      time: 'Just now',
      isRead: false,
      icon: 'x-circle',
      link: `/clubs`
    };
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift(notif);
    
    const io = getIo();
    if (io) {
      io.to(`user-${jr.userId}`).emit('notification_created', notif);
      io.to(`user-${jr.userId}`).emit('club_left', { clubId, userId: jr.userId });
      if (club?.leaderId) {
        io.to(`user-${club.leaderId}`).emit('club_left', { clubId, userId: jr.userId });
      }
    }
  }

  writeDb(db);
  res.json({ message: `Request ${action}d`, request: jr });
});

// Post club announcement
router.post('/clubs/:id/announcements', async (req, res) => {
  const clubId = parseInt(req.params.id);
  const db = readDb();
  const club = db.clubs.find(c => c.id === clubId);
  if (!club) return res.status(404).json({ message: 'Club not found' });

  const { title, content, author, authorAvatar } = req.body;
  if (!title || !content) return res.status(400).json({ message: 'Title and content are required' });

  // Create announcement
  const newAnnouncement = {
    id: Date.now(),
    title,
    content,
    author: author || club.president || 'Club Leader',
    authorAvatar: authorAvatar || club.logo,
    department: club.name,
    clubId,
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    priority: 'normal',
    aiSummary: content.length > 80 ? content.slice(0, 80) + '...' : content
  };

  if (!db.announcements) db.announcements = [];
  db.announcements.unshift(newAnnouncement);

  // Create notifications for all club members
  const clubMembers = db.users.filter(u => u.joinedClubs && u.joinedClubs.includes(clubId));
  if (!db.notifications) db.notifications = [];
  clubMembers.forEach(member => {
    db.notifications.push({
      id: Date.now() + Math.random(),
      userId: member.id,
      type: 'announcement',
      title: `${club.name}: ${title}`,
      message: content.length > 100 ? content.slice(0, 100) + '...' : content,
      time: 'Just now',
      isRead: false,
      icon: 'megaphone',
      link: `/clubs/${club.id}`
    });
  });

  writeDb(db);

  // Broadcast via socket if available
  try {
    const io = getIo();
    if (io) {
      clubMembers.forEach(member => {
        const memberNotif = db.notifications.find(n => n.userId === member.id && n.title === `${club.name}: ${title}`);
        if (memberNotif) {
          io.to(`user-${member.id}`).emit('notification_created', memberNotif);
        }
        io.to(`user-${member.id}`).emit('new-notification', {
          title: `${club.name}: ${title}`,
          message: content.length > 100 ? content.slice(0, 100) + '...' : content
        });
      });
      io.emit('announcement_created', newAnnouncement);
    }
  } catch (e) { /* socket not ready, skip */ }

  res.status(201).json(newAnnouncement);
});

router.post(['/clubs', '/clubs/create'], (req, res) => {
  const { name, clubName, description, category, department, userId, createdBy, logo, banner, createdAt } = req.body;
  const actualName = clubName || name;
  if (!actualName) {
    return res.status(400).json({ message: 'Club name is required' });
  }

  const uId = parseInt(userId || createdBy);
  if (isNaN(uId)) {
    return res.status(400).json({ message: 'Valid user ID is required' });
  }

  const db = readDb();
  
  const user = db.users.find(u => u.id === uId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Validate allowed roles
  if (user.role !== 'professor' && user.role !== 'clubLeader' && user.role !== 'club_leader' && user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Unauthorized role for club operations' });
  }

  const newlyCreatedClubId = Date.now();
  const newClub = {
    id: newlyCreatedClubId,
    name: actualName.trim(),
    clubName: actualName.trim(),
    logo: logo || (actualName ? actualName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'CL'),
    banner: banner || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
    category: category || 'Technical',
    description: description || '',
    longDescription: description || '',
    department: department || 'Computer Science',
    memberCount: 1,
    color: '#6366f1',
    founded: new Date().getFullYear().toString(),
    president: user.name,
    presidentAvatar: user.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'CL',
    tags: ['general'],
    isJoined: true,
    events: [],
    leaderId: uId,
    ownerId: uId,
    createdBy: uId,
    createdAt: createdAt || new Date().toISOString()
  };

  if (!db.clubs) db.clubs = [];
  db.clubs.push(newClub);

  user.clubId = newlyCreatedClubId;
  if (user.role !== 'professor') {
    user.role = 'clubLeader';
  }

  if (!user.joinedClubs) user.joinedClubs = [];
  if (!user.joinedClubs.includes(newlyCreatedClubId)) {
    user.joinedClubs.push(newlyCreatedClubId);
  }

  writeDb(db);

  const io = getIo();
  if (io) {
    io.emit('club_created', newClub);
    io.emit('notification_updated');
  }

  res.status(201).json({ club: newClub, user });
});

// Update a club
router.put('/clubs/:id/update', (req, res) => {
  const clubId = parseInt(req.params.id);
  const { name, description, category, department, logo, banner, userId } = req.body;
  const db = readDb();
  const club = db.clubs.find(c => c.id === clubId);
  if (!club) return res.status(404).json({ message: 'Club not found' });

  const uId = parseInt(userId);
  const user = db.users.find(u => u.id === uId);
  if (!user || (user.role !== 'professor' && user.role !== 'clubLeader' && user.role !== 'club_leader' && user.role !== 'admin')) {
    return res.status(403).json({ message: 'Access denied: Only professors or club leaders can perform club operations' });
  }

  if (uId && club.leaderId !== uId && club.ownerId !== uId) {
    return res.status(403).json({ message: 'Access denied: Only the owner/leader can update this club' });
  }

  if (name) {
    club.name = name.trim();
  }
  if (description !== undefined) {
    club.description = description;
    club.longDescription = description;
  }
  if (category) club.category = category;
  if (department) club.department = department;
  if (logo) club.logo = logo;
  if (banner) club.banner = banner;

  writeDb(db);
  res.json({ message: 'Club updated successfully', club });
});

// Delete a club
router.delete('/clubs/:id/delete', (req, res) => {
  const clubId = parseInt(req.params.id);
  const userId = parseInt(req.query.userId || req.body.userId);
  if (!userId) return res.status(400).json({ message: 'User ID is required' });

  const db = readDb();

  const idx = db.clubs.findIndex(c => c.id === clubId);
  if (idx === -1) return res.status(404).json({ message: 'Club not found' });

  const club = db.clubs[idx];
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Student cannot delete clubs
  if (user.role === 'student') {
    return res.status(403).json({ message: 'Access denied: Students cannot delete clubs' });
  }

  const isOwner = club.leaderId === userId || club.ownerId === userId || club.createdBy === userId;
  const isModerator = user.role === 'professor' || user.role === 'admin';

  if (!isOwner && !isModerator) {
    return res.status(403).json({ message: 'Access denied: You are not authorized to delete this club' });
  }

  // Log deletion in moderation history
  logDeletion(db, userId, user.role, 'club', clubId, club.name);

  // Remove club
  db.clubs.splice(idx, 1);

  // Clean up users: remove clubId and from joinedClubs
  db.users.forEach(u => {
    if (u.clubId === clubId) {
      u.clubId = null;
      if (u.role === 'clubLeader') {
        u.role = 'student'; // Revert back to student if no longer leading
      }
    }
    if (u.joinedClubs) {
      u.joinedClubs = u.joinedClubs.filter(cid => cid !== clubId);
    }
  });

  // Clean up club_members relationships
  if (db.club_members) {
    db.club_members = db.club_members.filter(cm => cm.clubId !== clubId);
  }

  // Clean up join requests
  if (db.joinRequests) {
    db.joinRequests = db.joinRequests.filter(jr => jr.clubId !== clubId);
  }

  // Get and clean up events belonging to this club
  const clubEventIds = club.events || [];
  const eventsToDelete = db.events.filter(e => e.organizer === club.name || clubEventIds.includes(e.id));
  const eventIdsToDelete = eventsToDelete.map(e => e.id);

  // Delete events
  db.events = db.events.filter(e => !eventIdsToDelete.includes(e.id));

  // Delete event registrations
  if (db.registrations) {
    db.registrations = db.registrations.filter(r => !eventIdsToDelete.includes(r.eventId));
  }

  // Delete saved events entries
  if (db.savedEvents) {
    db.savedEvents = db.savedEvents.filter(s => !eventIdsToDelete.includes(s.eventId));
  }

  // Delete announcements belonging to the club
  if (db.announcements) {
    db.announcements = db.announcements.filter(a => a.clubId !== clubId && a.department !== club.name);
  }

  writeDb(db);

  const io = getIo();
  if (io) {
    io.emit('club_deleted', { clubId });
    io.emit('notification_updated');
  }

  res.json({ message: 'Club and associated events/announcements deleted successfully' });
});

// Invite a user to join a club
router.post('/clubs/:id/invite', (req, res) => {
  const clubId = parseInt(req.params.id);
  const { userId, email } = req.body;
  const db = readDb();
  const club = db.clubs.find(c => c.id === clubId);
  if (!club) return res.status(404).json({ message: 'Club not found' });
  
  let targetUser = null;
  if (userId) {
    targetUser = db.users.find(u => u.id === parseInt(userId));
  } else if (email) {
    targetUser = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  }
  
  if (!targetUser) return res.status(404).json({ message: 'Student not found' });
  
  // Create invitation notification
  const notif = {
    id: Date.now(),
    userId: targetUser.id,
    type: 'club',
    title: 'Club Invitation',
    message: `You have been invited to join ${club.name}!`,
    time: 'Just now',
    isRead: false,
    icon: 'users',
    link: `/clubs/${club.id}`
  };
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift(notif);
  writeDb(db);
  
  const io = getIo();
  if (io) {
    io.to(`user-${targetUser.id}`).emit('notification_created', notif);
    io.to(`user-${targetUser.id}`).emit('new-notification', { title: notif.title, message: notif.message });
  }
  res.json({ message: 'Invitation sent successfully' });
});

// Create/Fetch Club Group Chat
router.post('/clubs/:id/group-chat', (req, res) => {
  const clubId = parseInt(req.params.id);
  const db = readDb();
  const club = db.clubs.find(c => c.id === clubId);
  if (!club) return res.status(404).json({ message: 'Club not found' });
  
  if (!db.conversations) db.conversations = [];
  let convo = db.conversations.find(c => c.clubId === clubId);
  if (!convo) {
    convo = {
      id: `club-${clubId}`,
      type: 'group',
      name: `${club.name} Group`,
      avatar: club.logo || club.name.substring(0, 2).toUpperCase(),
      clubId: clubId,
      color: club.color || '#6366f1'
    };
    db.conversations.push(convo);
    writeDb(db);
  }
  res.json({ conversation: convo });
});

// Edit announcement
router.put('/announcements/:id/update', (req, res) => {
  const announcementId = parseInt(req.params.id);
  const userId = parseInt(req.body.userId);
  const { title, content, department } = req.body;
  if (!userId) return res.status(400).json({ message: 'User ID is required' });

  const db = readDb();
  const idx = db.announcements.findIndex(a => a.id === announcementId);
  if (idx === -1) return res.status(404).json({ message: 'Announcement not found' });

  const announcement = db.announcements[idx];
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.role === 'student') {
    return res.status(403).json({ message: 'Access denied: Students cannot update announcements' });
  }

  const isOwner = announcement.authorId === userId || announcement.createdBy === userId;
  const isModerator = user.role === 'professor' || user.role === 'admin';

  if (!isOwner && !isModerator) {
    return res.status(403).json({ message: 'Access denied: You are not authorized to update this announcement' });
  }

  if (title !== undefined) announcement.title = title.trim();
  if (content !== undefined) announcement.content = content.trim();
  if (department !== undefined) announcement.department = department.trim();

  writeDb(db);

  const io = getIo();
  if (io) {
    io.emit('announcement_created');
    io.emit('notification_updated');
  }

  res.json({ message: 'Announcement updated successfully', announcement });
});

// Delete announcement
router.delete('/announcements/:id/delete', (req, res) => {
  const announcementId = parseInt(req.params.id);
  const userId = parseInt(req.query.userId || req.body.userId);
  if (!userId) return res.status(400).json({ message: 'User ID is required' });

  const db = readDb();
  const idx = db.announcements.findIndex(a => a.id === announcementId);
  if (idx === -1) return res.status(404).json({ message: 'Announcement not found' });

  const announcement = db.announcements[idx];
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.role === 'student') {
    return res.status(403).json({ message: 'Access denied: Students cannot delete announcements' });
  }

  const isOwner = announcement.authorId === userId || announcement.createdBy === userId;
  const isModerator = user.role === 'professor' || user.role === 'admin';

  if (!isOwner && !isModerator) {
    return res.status(403).json({ message: 'Access denied: You are not authorized to delete this announcement' });
  }

  const removed = db.announcements.splice(idx, 1)[0];

  // Log deletion in moderation history
  logDeletion(db, userId, user.role, 'announcement', announcementId, announcement.title);

  writeDb(db);

  const io = getIo();
  if (io) {
    io.emit('announcement_deleted', { announcementId });
    io.emit('notification_updated');
  }

  res.json({ message: 'Announcement deleted successfully', announcement: removed });
});


export default router;

