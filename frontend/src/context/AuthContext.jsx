import { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount and sync with server
  useEffect(() => {
    const syncUser = async () => {
      const cachedUser = localStorage.getItem('campuspulse_user');
      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        setUser(parsed);
        setIsAuthenticated(true);
        try {
          const freshUser = await apiService.getProfileMe(parsed.id);
          setUser(freshUser);
          localStorage.setItem('campuspulse_user', JSON.stringify(freshUser));
        } catch (err) {
          console.error('Failed to sync user session with server:', err);
        }
      }
      setLoading(false);
    };
    syncUser();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await apiService.login(email, password);
      setUser(data.user);
      setIsAuthenticated(true);
      localStorage.setItem('campuspulse_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      console.error('Login failed:', err);
      alert(err.message || 'Login failed. Check credentials.');
      throw err;
    }
  };

  const signup = async (userData) => {
    try {
      const data = await apiService.signup(userData);
      setUser(data.user);
      setIsAuthenticated(true);
      localStorage.setItem('campuspulse_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      console.error('Signup failed:', err);
      alert(err.message || 'Signup failed.');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('campuspulse_user');
  };

  const registerForEvent = async (eventId, status = 'registered') => {
    if (!user) return;

    // Optimistic Update
    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedEvents = status === 'registered'
        ? [...(prevUser.registeredEvents || []), eventId]
        : (prevUser.registeredEvents || []).filter(id => id !== eventId);
      
      const updatedUser = {
        ...prevUser,
        registeredEvents: Array.from(new Set(updatedEvents))
      };
      localStorage.setItem('campuspulse_user', JSON.stringify(updatedUser));
      return updatedUser;
    });

    try {
      if (status === 'registered') {
        await apiService.registerEvent(eventId, user.id);
      } else {
        await apiService.unregisterEvent(eventId, user.id);
      }
    } catch (err) {
      console.error('Registration API failed:', err);
      // Revert cache & state
      alert('Failed to update registration on server.');
    }
  };

  const toggleSaveEvent = async (eventId, isSaved) => {
    if (!user) return;

    // Optimistic Update
    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedSaved = isSaved
        ? [...(prevUser.savedEvents || []), eventId]
        : (prevUser.savedEvents || []).filter(id => id !== eventId);
      
      const updatedUser = {
        ...prevUser,
        savedEvents: Array.from(new Set(updatedSaved))
      };
      localStorage.setItem('campuspulse_user', JSON.stringify(updatedUser));
      return updatedUser;
    });

    try {
      if (isSaved) {
        await apiService.saveEvent(eventId, user.id);
      } else {
        await apiService.unsaveEvent(eventId, user.id);
      }
    } catch (err) {
      console.error('Save event API failed:', err);
    }
  };

  const toggleJoinClub = async (clubId) => {
    if (!user) return;

    const isJoined = user.joinedClubs?.includes(clubId);

    // Optimistic Update
    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedClubs = isJoined
        ? (prevUser.joinedClubs || []).filter(id => id !== clubId)
        : [...(prevUser.joinedClubs || []), clubId];
      
      const updatedUser = {
        ...prevUser,
        joinedClubs: Array.from(new Set(updatedClubs))
      };
      localStorage.setItem('campuspulse_user', JSON.stringify(updatedUser));
      return updatedUser;
    });

    try {
      const data = await apiService.joinClub(clubId, user.id);
      setUser(prev => {
        const u = { ...prev, joinedClubs: data.joinedClubs };
        localStorage.setItem('campuspulse_user', JSON.stringify(u));
        return u;
      });
    } catch (err) {
      console.error('Join club API failed:', err);
    }
  };

  const updateUserLocalState = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('campuspulse_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, signup, logout, registerForEvent, toggleSaveEvent, toggleJoinClub, updateUserLocalState }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);


