// CampusPulse Frontend Gemini AI Service Layer
import apiService from './api';

export const geminiService = {
  /**
   * Fetches personalized AI recommendations for the user
   * @param {Object} user 
   * @returns {Promise<Array>}
   */
  getAIRecommendations: async (user) => {
    return apiService.getAIRecommendations(user);
  },

  /**
   * Fetches AI insights for a specific event
   * @param {string|number} eventId 
   * @param {Object} user 
   * @returns {Promise<Object>}
   */
  getEventInsight: async (eventId, user) => {
    return apiService.getEventInsight(eventId, user);
  },

  /**
   * Performs a natural language AI search
   * @param {string} query 
   * @returns {Promise<Object>}
   */
  searchAI: async (query) => {
    return apiService.searchAI(query);
  }
};

export default geminiService;
