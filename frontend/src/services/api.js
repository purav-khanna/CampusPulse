const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `API request failed with status ${response.status}`);
  }

  return response.json();
}

export const apiService = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  signup: (userData) => request('/auth/signup', { method: 'POST', body: userData }),

  // Events
  getEvents: () => request('/events'),
  getEvent: (id) => request(`/events/${id}`),
  registerEvent: (id, userId) => request(`/events/${id}/register`, { method: 'POST', body: { userId } }),
  unregisterEvent: (id, userId) => request(`/events/${id}/unregister`, { method: 'POST', body: { userId } }),
  saveEvent: (id, userId) => request(`/events/${id}/save`, { method: 'POST', body: { userId } }),
  unsaveEvent: (id, userId) => request(`/events/${id}/unsave`, { method: 'POST', body: { userId } }),

  // Comments
  getComments: (eventId) => request(`/events/${eventId}/comments`),
  postComment: (eventId, userId, message, user, avatar) => request(`/events/${eventId}/comments`, { 
    method: 'POST', 
    body: { userId, message, user, avatar } 
  }),

  // Clubs
  getClubs: () => request('/clubs'),
  getClub: (id) => request(`/clubs/${id}`),
  joinClub: (id, userId) => request(`/clubs/${id}/join`, { method: 'POST', body: { userId } }),

  // Notifications
  getNotifications: (userId) => request(`/notifications?userId=${userId}`),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: (userId) => request('/notifications/read-all', { method: 'POST', body: { userId } }),
  dismissNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),

  // Resources
  getResources: () => request('/resources'),
  getResource: (id) => request(`/resources/${id}`),

  // Announcements
  getAnnouncements: () => request('/announcements'),
  postAnnouncement: (data) => request('/announcements/create', { method: 'POST', body: data }),

  // AI Insights & Search
  getAIRecommendations: (user) => request('/ai/recommendations', { method: 'POST', body: { user } }),
  getEventInsight: (eventId, user) => request(`/ai/insight/${eventId}`, { method: 'POST', body: { user } }),
  searchAI: (query) => request('/ai/search', { method: 'POST', body: { query } }),

  // Chat system
  searchChatUsers: (query, excludeId) => request(`/users/search?q=${query}&excludeUserId=${excludeId}`),
  getConversations: (userId) => request(`/chat/conversations?userId=${userId}`),
  getConversationMessages: (convoId, userId) => request(`/chat/conversations/${convoId}/messages?userId=${userId}`),
  startConversation: (senderId, receiverId) => request('/chat/conversations', { method: 'POST', body: { senderId, receiverId } }),
  postChatMessage: (msgData) => request('/chat/messages', { method: 'POST', body: msgData }),
  uploadChatFile: (formData) => fetch(`${BASE_URL}/chat/upload`, { method: 'POST', body: formData }).then(r => {
    if (!r.ok) throw new Error('File upload failed');
    return r.json();
  }),

  // Profile and Settings system
  getProfileMe: (userId) => request(`/profile/me?userId=${userId}`),
  updateProfile: (profileData) => request('/profile/update', { method: 'PUT', body: profileData }),
  updateEmail: (emailData) => request('/profile/email', { method: 'PUT', body: emailData }),
  updatePassword: (pwData) => request('/profile/password', { method: 'PUT', body: pwData }),
  deleteAccount: (userId, password) => request('/profile/delete', { method: 'DELETE', body: { userId, password } }),
  getUserSettings: (userId) => request(`/settings?userId=${userId}`),
  updateUserSettings: (settingsData) => request('/settings/update', { method: 'PUT', body: settingsData }),
  clearConversationMessages: (convoId) => request(`/chat/conversations/${convoId}/clear`, { method: 'DELETE' }),
  startAIConversation: (userId, name) => request('/chat/conversations/ai', { method: 'POST', body: { userId, name } }),
  
  // Club Leader APIs
  getClubLeaderDashboard: (clubId, userId) => request(`/clubs/${clubId}/leader-dashboard?userId=${userId}`),
  createClub: (clubData) => request('/clubs/create', { method: 'POST', body: clubData }),
  createClubEvent: (clubId, eventData) => request(`/clubs/${clubId}/events`, { method: 'POST', body: eventData }),
  inviteMember: (clubId, inviteData) => request(`/clubs/${clubId}/invite`, { method: 'POST', body: inviteData }),
  createGroupChat: (clubId) => request(`/clubs/${clubId}/group-chat`, { method: 'POST' }),
  
  // Professor APIs
  getProfessorStats: (userId) => request(`/professors/${userId}/stats`),
  getProfessorDashboardStats: (userId) => request(`/dashboard/professor-stats?userId=${userId}`),
  createEvent: (eventData) => request('/events/create', { method: 'POST', body: eventData }),
  updateEvent: (eventId, data) => request(`/events/${eventId}/update`, { method: 'PUT', body: data }),
  deleteEvent: (eventId, userId) => request(`/events/${eventId}/delete?userId=${userId}`, { method: 'DELETE' }),
  updateClub: (clubId, clubData) => request(`/clubs/${clubId}/update`, { method: 'PUT', body: clubData }),
  deleteClub: (clubId, userId) => request(`/clubs/${clubId}/delete?userId=${userId}`, { method: 'DELETE' }),
  updateAnnouncement: (id, data) => request(`/announcements/${id}/update`, { method: 'PUT', body: data }),
  deleteAnnouncement: (id, userId) => request(`/announcements/${id}/delete?userId=${userId}`, { method: 'DELETE' }),
  getClubMembers: (clubId) => request(`/clubs/${clubId}/members`),
  updateMemberRole: (clubId, memberId, role) => request(`/clubs/${clubId}/members/${memberId}/role`, { method: 'POST', body: { role } }),
  getJoinRequests: (clubId) => request(`/clubs/${clubId}/join-requests`),
  handleJoinRequest: (clubId, requestId, action) => request(`/clubs/${clubId}/join-requests/${requestId}`, { method: 'POST', body: { action } }),
  postClubAnnouncement: (clubId, data) => request(`/clubs/${clubId}/announcements`, { method: 'POST', body: data }),
  getEventRegistrations: (eventId) => request(`/events/${eventId}/registrations`)
};
export default apiService;
