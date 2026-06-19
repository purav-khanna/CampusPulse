import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { apiService } from '../../services/api';
import { getAvatarInitials, getAvatarGradient } from '../../utils/gemini';
import { 
  Search, Send, ArrowLeft, Paperclip, Smile, MessageCircle, 
  Plus, Check, CheckCheck, FileText, Loader2, X, Info, ExternalLink,
  ChevronUp, ChevronDown
} from 'lucide-react';
import '../../components/ui/Components.css';
import './Chat.css';

export default function Chat() {
  const { user, toggleJoinClub } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const {
    conversationsList,
    setConversationsList,
    activeMessages,
    setActiveMessages,
    typingUsers,
    socketRef,
    fetchConversations
  } = useChat();

  // Chat states
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Search inside conversation states
  const [msgFilter, setMsgFilter] = useState('');
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // File Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Global user search states
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Profile modal state
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Refs for scrolling and timeouts
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const [isTypingLocal, setIsTypingLocal] = useState(false);

  // Clean up search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // activeConvoId maps directly to conversationId URL parameter
  const activeConvoId = conversationId;
  const activeConvo = useMemo(() => {
    return conversationsList.find(c => String(c.id) === String(activeConvoId)) || null;
  }, [conversationsList, activeConvoId]);

  // Scroll to bottom of message list on changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeConvoId]);

  // Keyboard typing handlers to broadcast typing indicators
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    if (!activeConvo) return;

    if (!isTypingLocal) {
      setIsTypingLocal(true);
      socketRef.current?.emit('typing', {
        conversationId: activeConvo.id,
        userId: user.id,
        userName: user.name,
        isTyping: true
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingLocal(false);
      socketRef.current?.emit('typing', {
        conversationId: activeConvo.id,
        userId: user.id,
        userName: user.name,
        isTyping: false
      });
    }, 2000);
  };

  const handleTyping = (state) => {
    setIsTypingLocal(state);
    socketRef.current?.emit('typing', {
      conversationId: activeConvo?.id,
      userId: user.id,
      userName: user.name,
      isTyping: state
    });
  };

  // Handle posting a message
  const handleSend = async () => {
    if (!messageInput.trim() && !uploadedFile) return;
    if (!activeConvo) return;

    const msgData = {
      conversationId: activeConvo.id,
      senderId: user.id,
      receiverId: activeConvo.type === 'direct' ? activeConvo.otherUserId : null,
      message: messageInput.trim(),
      fileUrl: uploadedFile?.fileUrl || null,
      fileName: uploadedFile?.fileName || null,
      fileType: uploadedFile?.fileType || null
    };

    try {
      // Send message to REST API
      const sentMsg = await apiService.postChatMessage(msgData);

      // Append own message locally optimistically
      const formatted = {
        id: sentMsg.messageId,
        senderId: user.id,
        sender: user.name,
        avatar: user.avatar || getAvatarInitials(user.name),
        content: sentMsg.message,
        fileUrl: sentMsg.fileUrl,
        fileName: sentMsg.fileName,
        fileType: sentMsg.fileType,
        time: 'Just now',
        isOwn: true,
        readStatus: sentMsg.readStatus
      };

      setActiveMessages(prev => {
        if (prev.some(m => m.id === formatted.id)) return prev;
        return [...prev, formatted];
      });

      // Update conversation lastMessage in sidebar list
      setConversationsList(prev => prev.map(c => {
        if (c.id === activeConvo.id) {
          return {
            ...c,
            lastMessage: sentMsg.message || 'File attachment',
            lastTime: 'Just now',
            lastMessageAt: new Date().toISOString()
          };
        }
        return c;
      }).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)));

      // Clear inputs
      setMessageInput('');
      setUploadedFile(null);
      handleTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle staging files for sharing
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await apiService.uploadChatFile(formData);
      setUploadedFile({
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileType: data.fileType
      });
    } catch (error) {
      console.error('File upload failed:', error);
      alert('File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  // Convert roles to friendly display labels
  const getReadableRole = (role) => {
    if (role === 'student') return 'Student';
    if (role === 'professor') return 'Professor';
    if (role === 'clubLeader') return 'Club Leader';
    if (role === 'admin') return 'Admin';
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : '';
  };

  // Global user & club search triggers with 300ms debounce
  const handleSearchUsers = (query) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await apiService.searchChatUsers(query, user.id);
        setSearchResults(data);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSearchResultClick = async (result) => {
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);

    if (result.type === 'user') {
      try {
        const convo = await apiService.startConversation(user.id, result.id);
        await fetchConversations();
        navigate(`/chat/${convo.id}`);
      } catch (err) {
        console.error('Failed to start conversation:', err);
      }
    } else if (result.type === 'club') {
      const isJoined = user.joinedClubs?.includes(result.id);
      if (isJoined) {
        const matchedConvo = conversationsList.find(c => c.clubId === result.id);
        if (matchedConvo) {
          navigate(`/chat/${matchedConvo.id}`);
        }
      } else {
        if (window.confirm(`Would you like to join the ${result.name} club and enter its group chat?`)) {
          await toggleJoinClub(result.id);
          setTimeout(async () => {
            const list = await fetchConversations();
            const clubConvo = list.find(c => c.clubId === result.id);
            if (clubConvo) {
              navigate(`/chat/${clubConvo.id}`);
            }
          }, 300);
        }
      }
    }
  };

  // Show profile details card in modal
  const handleShowProfile = async (profileData) => {
    try {
      const results = await apiService.searchChatUsers(profileData.name, user.id);
      const matched = results.find(r => r.name.toLowerCase() === profileData.name.toLowerCase());
      if (matched) {
        setSelectedProfile(matched);
      } else {
        setSelectedProfile({
          ...profileData,
          email: `${profileData.name.toLowerCase().replace(/\s+/g, '.')}@campus.edu`
        });
      }
    } catch {
      setSelectedProfile({
        ...profileData,
        email: `${profileData.name.toLowerCase().replace(/\s+/g, '.')}@campus.edu`
      });
    }
  };

  // Filter conversations sidebar list
  const filteredConversations = conversationsList.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.lastMessage && c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Search matches inside current conversation
  const searchMatches = useMemo(() => {
    if (!msgFilter.trim()) return [];
    const q = msgFilter.toLowerCase();
    return activeMessages.filter(m => 
      (m.content && m.content.toLowerCase().includes(q)) ||
      (m.sender && m.sender.toLowerCase().includes(q)) ||
      (m.time && m.time.toLowerCase().includes(q)) ||
      (m.fileName && m.fileName.toLowerCase().includes(q))
    ).map(m => m.id);
  }, [activeMessages, msgFilter]);

  // Sync scroll positioning to active search match
  useEffect(() => {
    if (searchMatches.length > 0 && searchMatches[currentMatchIndex]) {
      const targetId = searchMatches[currentMatchIndex];
      const el = document.getElementById(`msg-${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('search-match-active');
        setTimeout(() => {
          el.classList.remove('search-match-active');
        }, 2000);
      }
    }
  }, [currentMatchIndex, searchMatches]);

  const filteredMessages = activeMessages;

  // Delivery ticks helper
  const renderTicks = (msg) => {
    if (!msg.isOwn) return null;
    if (msg.readStatus === 'read') {
      return <CheckCheck size={14} className="tick-read" />;
    } else if (msg.readStatus === 'delivered') {
      return <CheckCheck size={14} className="tick-delivered" />;
    }
    return <Check size={14} className="tick-sent" />;
  };

  // Safe markdown text highlighter & link parser
  const handleMessageLinkClick = (e, path) => {
    e.preventDefault();
    navigate(path);
  };

  const wrapHighlight = (text, query) => {
    if (!query || !text) return [text];
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={index} className="chat-highlight">{part}</mark> 
        : part
    );
  };

  const parseBoldText = (text, query) => {
    const parts = [];
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      const plain = text.substring(lastIndex, match.index);
      if (plain) {
        parts.push(...wrapHighlight(plain, query));
      }
      parts.push(<strong key={match.index}>{wrapHighlight(match[1], query)}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    
    const remaining = text.substring(lastIndex);
    if (remaining) {
      parts.push(...wrapHighlight(remaining, query));
    }
    
    return parts;
  };

  const renderMessageContent = (text, query) => {
    if (!text) return null;

    const parts = [];
    let lastIndex = 0;
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      const plainText = text.substring(lastIndex, match.index);
      if (plainText) {
        parts.push(...parseBoldText(plainText, query));
      }
      const label = match[1];
      const path = match[2];
      parts.push(
        <a 
          key={match.index} 
          href={path} 
          onClick={(e) => handleMessageLinkClick(e, path)}
          className="chat-message-link"
        >
          {highlightText(label, query)}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }

    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(...parseBoldText(remainingText, query));
    }

    return <>{parts}</>;
  };

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={index} className="chat-highlight">{part}</mark> 
        : part
    );
  };

  // Determine typing users string
  const getTypingString = () => {
    if (!activeConvo) return '';
    const activeTyping = typingUsers[activeConvo.id];
    if (!activeTyping || Object.keys(activeTyping).length === 0) return '';
    
    const names = Object.values(activeTyping);
    if (activeConvo.type === 'direct') {
      return 'typing...';
    }
    if (names.length === 1) {
      return `${names[0]} is typing...`;
    }
    return `${names.length} people are typing...`;
  };

  const typingString = getTypingString();

  return (
    <div className="chat-page" style={{ position: 'relative' }}>
      {/* Conversations Sidebar List */}
      <div className={`chat-sidebar ${activeConvo ? 'hidden' : ''}`}>
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-header-top">
            <h2>💬 Messages</h2>
            <button 
              className="btn btn-primary btn-sm btn-icon chat-new-btn" 
              title="Start New Chat"
              onClick={() => setShowSearchModal(true)}
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="chat-sidebar-search">
            <Search size={16} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search conversations..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>
        <div className="chat-list">
          {filteredConversations.length > 0 ? (
            filteredConversations.map(convo => (
              <div 
                key={convo.id} 
                className={`chat-list-item ${activeConvoId === convo.id ? 'active' : ''}`} 
                onClick={() => {
                  navigate(`/chat/${convo.id}`);
                }}
              >
                <div className="chat-list-avatar">
                  <div 
                    className="avatar avatar-md" 
                    style={{ 
                      background: convo.type === 'ai' 
                        ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
                        : convo.type === 'group' 
                          ? 'var(--accent-500)' 
                          : getAvatarGradient(convo.name) 
                    }}
                  >
                    {convo.avatar}
                  </div>
                  {convo.type === 'direct' && convo.online && <span className="online-dot" />}
                </div>
                <div className="chat-list-info">
                  <h4>
                    {convo.name} 
                    <span className="last-time">{convo.lastTime}</span>
                  </h4>
                  <p className={typingUsers[convo.id] && Object.keys(typingUsers[convo.id]).length > 0 ? 'typing-text' : ''}>
                    {typingUsers[convo.id] && Object.keys(typingUsers[convo.id]).length > 0 
                      ? 'typing...' 
                      : convo.lastMessage}
                  </p>
                </div>
                {convo.unread > 0 && <span className="chat-list-unread">{convo.unread > 99 ? '99+' : convo.unread}</span>}
              </div>
            ))
          ) : (
            <div className="chat-list-empty">
              <MessageCircle size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
              <p>No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Conversation Window */}
      {activeConvo ? (
        <div className="chat-main">
          {/* Header */}
          <div className="chat-main-header">
            <button className="chat-back-btn btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/chat')}>
              <ArrowLeft size={18} />
            </button>
            <div 
              className="avatar avatar-md clickable-avatar" 
              style={{ 
                background: activeConvo.type === 'ai' 
                  ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' 
                  : activeConvo.type === 'group' 
                    ? 'var(--accent-500)' 
                    : getAvatarGradient(activeConvo.name) 
              }}
              onClick={() => {
                if (activeConvo.type === 'direct') {
                  handleShowProfile({ id: activeConvo.otherUserId, name: activeConvo.name, role: activeConvo.role, department: activeConvo.department });
                }
              }}
            >
              {activeConvo.avatar}
            </div>
            <div 
              className="chat-header-info" 
              onClick={() => {
                if (activeConvo.type === 'direct') {
                  handleShowProfile({ id: activeConvo.otherUserId, name: activeConvo.name, role: activeConvo.role, department: activeConvo.department });
                }
              }}
            >
              <h3>{activeConvo.name}</h3>
              <p className={typingString ? 'typing-indicator-header' : ''}>
                {typingString 
                  ? typingString 
                  : activeConvo.type === 'ai' 
                    ? '🤖 Campus Assistant' 
                    : activeConvo.type === 'group' 
                      ? `${activeConvo.memberCount || 0} members` 
                      : activeConvo.online 
                        ? '🟢 Online' 
                        : 'Offline'}
              </p>
            </div>

            {/* Inner Chat Search Trigger */}
            <div className="chat-header-actions">
              <button 
                className={`btn btn-ghost btn-icon btn-sm ${showMsgSearch ? 'active' : ''}`} 
                onClick={() => { setShowMsgSearch(!showMsgSearch); setMsgFilter(''); setCurrentMatchIndex(0); }}
                title="Search Messages"
              >
                <Search size={18} />
              </button>
            </div>
          </div>

          {/* Inline Message Search Bar */}
          {showMsgSearch && (
            <div className="chat-message-search-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
              <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
              <input 
                type="text" 
                placeholder="Search text, sender, or date..." 
                value={msgFilter} 
                onChange={(e) => { setMsgFilter(e.target.value); setCurrentMatchIndex(0); }} 
                style={{ flex: 1, border: 'none', background: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '14px' }}
              />
              {msgFilter && (
                <>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                    {searchMatches.length > 0 ? `${currentMatchIndex + 1} of ${searchMatches.length}` : 'No results'}
                  </span>
                  {searchMatches.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        className="btn btn-ghost btn-xs btn-icon" 
                        onClick={() => setCurrentMatchIndex(prev => (prev > 0 ? prev - 1 : searchMatches.length - 1))}
                        title="Previous match"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button 
                        className="btn btn-ghost btn-xs btn-icon" 
                        onClick={() => setCurrentMatchIndex(prev => (prev < searchMatches.length - 1 ? prev + 1 : 0))}
                        title="Next match"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  )}
                  <button className="btn btn-ghost btn-xs btn-icon" onClick={() => { setMsgFilter(''); setCurrentMatchIndex(0); }}>
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Messages Listing */}
          <div className="chat-messages-container">
            
            <div className="chat-messages">
              {filteredMessages.map(msg => (
                <div key={msg.id} id={`msg-${msg.id}`} className={`chat-message ${msg.isOwn ? 'own' : ''}`}>
                  {!msg.isOwn && (
                    <div 
                      className="avatar avatar-sm clickable-avatar" 
                      style={{ background: getAvatarGradient(msg.sender) }}
                      onClick={() => handleShowProfile({ name: msg.sender, role: 'Student' })}
                    >
                      {msg.avatar || getAvatarInitials(msg.sender)}
                    </div>
                  )}
                  <div className="chat-message-content-wrapper">
                    {!msg.isOwn && activeConvo.type === 'group' && (
                      <div 
                        className="chat-message-sender" 
                        onClick={() => handleShowProfile({ name: msg.sender })}
                      >
                        {highlightText(msg.sender, msgFilter)}
                      </div>
                    )}
                    <div className="chat-message-bubble">
                      {/* Text content parsed for links and bold marks */}
                      {msg.content && (
                        <div className="chat-message-text">
                          {renderMessageContent(msg.content, msgFilter)}
                        </div>
                      )}

                      {/* File attachment sharing display */}
                      {msg.fileUrl && (
                        <div className="chat-message-attachment-card">
                          {msg.fileType?.startsWith('image/') ? (
                            <div className="image-attachment-wrapper">
                               <img 
                                 src={msg.fileUrl} 
                                 alt={msg.fileName} 
                                 className="attachment-image"
                                 onClick={() => window.open(msg.fileUrl, '_blank')} 
                               />
                               <div className="attachment-overlay">
                                 <span className="file-name-tag">{msg.fileName}</span>
                                 <a href={msg.fileUrl} download={msg.fileName} target="_blank" rel="noreferrer">
                                   <ExternalLink size={14} />
                                 </a>
                               </div>
                            </div>
                          ) : (
                            <div className="doc-attachment-card">
                              <FileText size={20} className="doc-icon" />
                              <div className="doc-info">
                                <span className="doc-name">{msg.fileName}</span>
                                <span className="doc-meta">{msg.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                              </div>
                              <a href={msg.fileUrl} download={msg.fileName} target="_blank" rel="noreferrer" className="doc-download-btn">
                                <ExternalLink size={16} />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="chat-message-meta">
                      <span className="chat-message-time">{highlightText(msg.time, msgFilter)}</span>
                      {renderTicks(msg)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Staged attachment preview list */}
          {uploadedFile && (
            <div className="staged-attachment-preview">
              {uploadedFile.fileType?.startsWith('image/') ? (
                <div className="staged-img-preview">
                  <img src={uploadedFile.fileUrl} alt="staged image" />
                  <button className="btn btn-danger btn-xs btn-icon remove-staged" onClick={() => setUploadedFile(null)}>
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="staged-doc-preview">
                  <FileText size={16} className="doc-icon" />
                  <span className="doc-name">{uploadedFile.fileName}</span>
                  <button className="btn btn-ghost btn-xs btn-icon remove-staged" onClick={() => setUploadedFile(null)}>
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Input Area */}
          <div className="chat-input-area">
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />
            <button 
              className={`btn btn-ghost btn-icon ${uploading ? 'disabled' : ''}`}
              onClick={handleFileClick}
              disabled={uploading}
              title="Attach File"
            >
              {uploading ? <Loader2 className="animate-spin" size={18} /> : <Paperclip size={18} />}
            </button>
            <input
              type="text" 
              className="form-input" 
              placeholder="Type a message..."
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="btn btn-ghost btn-icon" title="Emojis"><Smile size={18} /></button>
            <button className="btn btn-primary btn-icon" onClick={handleSend} title="Send"><Send size={18} /></button>
          </div>
        </div>
      ) : (
        <div className="chat-empty">
          <MessageCircle size={56} style={{ opacity: 0.25 }} />
          <h3>No conversation selected</h3>
          <p>Click on an existing conversation or start a new one to begin messaging.</p>
        </div>
      )}

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="chat-search-modal-backdrop" onClick={() => setShowSearchModal(false)}>
          <div className="chat-search-modal" onClick={e => e.stopPropagation()}>
            <div className="chat-search-modal-header">
              <h3>New Conversation</h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowSearchModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="chat-search-modal-body">
              <div className="chat-sidebar-search">
                <Search size={16} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search by name, email or username..." 
                  value={searchQuery}
                  onChange={e => handleSearchUsers(e.target.value)}
                  autoFocus
                />
              </div>
              
              <div className="search-results-list">
                {searching ? (
                  <div className="search-loading">
                    <Loader2 className="animate-spin" size={20} />
                    <p>Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(result => (
                    <div key={`${result.type}-${result.id}`} className="search-result-item" onClick={() => handleSearchResultClick(result)}>
                      <div className="chat-list-avatar">
                        <div className="avatar avatar-md" style={{ background: result.color || getAvatarGradient(result.name) }}>
                          {result.avatar}
                        </div>
                        {result.type === 'user' && result.online && <span className="online-dot" />}
                      </div>
                      <div className="search-result-info">
                        <h4>{result.name}</h4>
                        <p>{result.type === 'club' ? 'Club' : `${getReadableRole(result.role)} • ${result.department}`}</p>
                      </div>
                    </div>
                  ))
                ) : searchQuery.trim() !== '' ? (
                  <p className="no-search-results">No users found</p>
                ) : (
                  <p className="search-prompt">Type to find members or communities...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Detail Preview Modal */}
      {selectedProfile && (
        <div className="profile-preview-backdrop" onClick={() => setSelectedProfile(null)}>
          <div className="profile-preview-card" onClick={e => e.stopPropagation()}>
            <button className="profile-close-btn btn btn-ghost btn-sm btn-icon" onClick={() => setSelectedProfile(null)}>
              <X size={18} />
            </button>
            <div className="profile-card-header" style={{ background: getAvatarGradient(selectedProfile.name) }}>
              <div className="profile-card-avatar" style={{ background: getAvatarGradient(selectedProfile.name) }}>
                {selectedProfile.avatar || getAvatarInitials(selectedProfile.name)}
              </div>
            </div>
            <div className="profile-card-body">
              <h3>{selectedProfile.name}</h3>
              <span className="profile-badge">{selectedProfile.role || 'STUDENT'}</span>
              
              <div className="profile-info-list">
                <div className="profile-info-item">
                  <Info size={16} className="info-icon" />
                  <div>
                    <label>Department / Category</label>
                    <span>{selectedProfile.department || 'Computer Science'}</span>
                  </div>
                </div>
                <div className="profile-info-item">
                  <MessageCircle size={16} className="info-icon" />
                  <div>
                    <label>Email</label>
                    <span>{selectedProfile.email || `${selectedProfile.name.toLowerCase().replace(/\s+/g, '.')}@campus.edu`}</span>
                  </div>
                </div>
              </div>
              
              {selectedProfile.id !== user.id && (
                <button 
                  className="btn btn-primary btn-block profile-msg-btn" 
                  onClick={() => {
                    handleSearchResultClick({ type: 'user', id: selectedProfile.id, name: selectedProfile.name });
                    setSelectedProfile(null);
                  }}
                >
                  Send Message
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
