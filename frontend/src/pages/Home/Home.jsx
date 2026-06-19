import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Users, MessageCircle, Star, MapPin, Clock, ArrowRight,
  Zap, Shield, Brain, Sparkles, Target, BookOpen, Layers,
  ChevronRight, ArrowUpRight, Search, Bell, Info
} from 'lucide-react';
import RotatingWordFlip from '../../components/common/RotatingWordFlip';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import '../../components/ui/Components.css';
import './Home.css';
import HandDrawnUnderline from '../../components/common/HandDrawnUnderline';

// Custom Animated Counter Component
function AnimatedCounter({ end, duration = 2000, suffix = "" }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Trigger only once
        }
      },
      { threshold: 0.35 } // 30-40% visibility trigger
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTimestamp = null;
    const endValue = parseInt(end, 10);
    if (isNaN(endValue)) return;

    // Smooth EaseInOutCubic curve: slight acceleration at start, gentle slowdown near final value
    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = easeInOutCubic(progress);
      
      setCount(Math.floor(easeProgress * endValue));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(endValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [isVisible, end, duration]);

  return (
    <span
      ref={elementRef}
      className={`stat-counter-animate ${isVisible ? 'animate-visible' : ''}`}
    >
      {count}{suffix}
    </span>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('student');
  const [contactEmail, setContactEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Form Submissions
  const handleSubscribe = (e) => {
    e.preventDefault();
    if (contactEmail) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setContactEmail('');
      }, 3000);
    }
  };

  return (
    <div className="landing-page-wrapper">
      <Navbar />
      
      {/* HERO SECTION */}
      <section className="premium-hero">
        {/* Subtle Dotted Grid Background */}
        <div className="hero-dotted-grid"></div>
        <div className="hero-glow-orb hero-orb-blue"></div>
        <div className="hero-glow-orb hero-orb-purple"></div>

        <div className="landing-container hero-inner">
          <div className="hero-text-side">
            <div className="hero-intelligence-badge">
              <Sparkles size={14} className="badge-sparkle" />
              <span>Next-Gen Campus Intelligence</span>
            </div>
            
            <h1 className="hero-main-title">
              Elevate Your Campus<br />
              Experience with <HandDrawnUnderline>AI</HandDrawnUnderline>
            </h1>
            
            <div className="hero-word-flip-row">
              <span className="flip-label">Discover</span>
              <RotatingWordFlip />
            </div>

            <p className="hero-lead-text">
              CampusPulse keeps students, professors, and clubs connected through intelligent event discovery, real-time updates, and AI-powered engagement.
            </p>

            <div className="hero-cta-buttons">
              <Link to="/signup" className="btn btn-primary btn-hero-primary">
                Join CampusPulse <ChevronRight size={16} />
              </Link>
              <a href="#features" className="btn btn-secondary btn-hero-secondary">
                Learn More
              </a>
            </div>
          </div>

          {/* RIGHT HERO VISUAL */}
          <div className="hero-visual-side">
            <div className="hero-visual-container">
              {/* Premium Floating Base Card */}
              <div className="visual-card-wrapper">
                <img 
                  src="/campus_aerial.png" 
                  alt="Modern Aerial University Campus" 
                  className="visual-campus-image"
                />
                <div className="visual-image-overlay"></div>
              </div>

              {/* Floating Glassmorphism AI Indicators */}
              <div className="floating-indicator chip-event-alert animate-float-slow">
                <div className="indicator-pulse pulse-red"></div>
                <Bell size={14} className="indicator-icon text-red" />
                <span>Event Alert</span>
              </div>

              <div className="floating-indicator chip-new-workshop animate-float-medium">
                <div className="indicator-pulse pulse-blue"></div>
                <BookOpen size={14} className="indicator-icon text-blue" />
                <span>New Workshop</span>
              </div>

              <div className="floating-indicator chip-club-update animate-float-fast">
                <div className="indicator-pulse pulse-purple"></div>
                <Users size={14} className="indicator-icon text-purple" />
                <span>Club Update</span>
              </div>

              <div className="floating-indicator chip-ai-match animate-float-delay">
                <div className="indicator-pulse pulse-teal"></div>
                <Sparkles size={14} className="indicator-icon text-teal" />
                <span>AI Match</span>
              </div>

              <div className="floating-indicator chip-recommendation animate-float-slower">
                <div className="indicator-pulse pulse-indigo"></div>
                <Brain size={14} className="indicator-icon text-indigo" />
                <span>AI Recommendation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE BENTO GRID SECTION */}
      <section id="features" className="bento-features-section">
        <div className="landing-container">
          <div className="section-header-centered">
            <h2 className="bento-title">Tailored for the Modern <HandDrawnUnderline>Student</HandDrawnUnderline></h2>
            <p className="bento-subtitle">Everything you need to stay connected with campus life.</p>
          </div>

          <div className="bento-grid-container">
            {/* Card 1: AI Event Matching (70%) */}
            <div className="bento-card bento-card-70 bento-card-ai-matching">
              <div className="bento-card-content">
                <div className="bento-card-header">
                  <div className="bento-icon-box bg-purple-glow">
                    <Brain size={24} className="bento-icon text-indigo" />
                  </div>
                  <span className="bento-badge">Smart Engine</span>
                </div>
                <div className="bento-card-body">
                  <h3>AI Event Matching</h3>
                  <p>AI recommends events based on interests, branch, and activity history. Spend less time searching and more time experiencing.</p>
                </div>
              </div>
              <div className="bento-card-visual bento-event-matching-visual">
                <div className="match-tag-pill">Coding 💻</div>
                <div className="match-tag-pill highlight">Design 🎨</div>
                <div className="match-tag-pill">Robotics 🤖</div>
                <div className="match-tag-pill highlight">Startup 🚀</div>
              </div>
            </div>

            {/* Card 2: Smart Community Discovery (30%) */}
            <div className="bento-card bento-card-30 bento-card-mint-gradient">
              <div className="bento-card-content">
                <div className="bento-card-header">
                  <div className="bento-icon-box bg-white-glow">
                    <Users size={24} className="bento-icon text-teal" />
                  </div>
                </div>
                <div className="bento-card-body">
                  <h3>Smart Community Discovery</h3>
                  <p>Find your people faster. Connect with clubs and students that share your pulse.</p>
                </div>
              </div>
              <div className="bento-card-visual bento-community-visual">
                <div className="avatar-overlap-group">
                  <div className="club-avatar-circle">GD</div>
                  <div className="club-avatar-circle alt">AI</div>
                  <div className="club-avatar-circle">DE</div>
                  <div className="club-avatar-circle plus-badge">+42</div>
                </div>
              </div>
            </div>

            {/* Card 3: Personalized Resource Hub (30%) */}
            <div className="bento-card bento-card-30 bento-card-blue-tint">
              <div className="bento-card-content">
                <div className="bento-card-header">
                  <div className="bento-icon-box bg-white-glow">
                    <Layers size={24} className="bento-icon text-blue" />
                  </div>
                </div>
                <div className="bento-card-body">
                  <h3>Personalized Resource Hub</h3>
                  <p>Academic tools tailored to you. From AI study guides to library reservations, everything you need is one click away.</p>
                </div>
              </div>
              <div className="bento-card-visual bento-resource-visual">
                <div className="doc-item"><span className="doc-dot-purple"></span> Physics_Notes.pdf</div>
                <div className="doc-item"><span className="doc-dot-teal"></span> React_Bootcamp_Syllabus.pdf</div>
              </div>
            </div>

            {/* Card 4: Stats Card (70%) */}
            <div className="bento-card bento-card-70 bento-stats-card">
              <div className="bento-stats-grid">
                <div className="bento-stat-column">
                  <span className="stat-number-large"><AnimatedCounter end="85" duration={2000} suffix="%" /></span>
                  <span className="stat-label-small">Higher Engagement</span>
                </div>
                <div className="bento-stat-column">
                  <span className="stat-number-large"><AnimatedCounter end="12" duration={1800} suffix="h" /></span>
                  <span className="stat-label-small">Time Saved Weekly</span>
                </div>
                <div className="bento-stat-column">
                  <span className="stat-number-large"><AnimatedCounter end="500" duration={2200} suffix="+" /></span>
                  <span className="stat-label-small">Active Communities</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section className="core-features-section">
        <div className="landing-container">
          <div className="section-header-centered">
            <h2 className="bento-title">Core Ecosystem Features</h2>
            <p className="bento-subtitle">Seamless integration across all layers of campus life.</p>
          </div>

          <div className="core-features-grid">
            {/* Card 1: Events */}
            <div className="core-feature-card">
              <div className="core-card-header">
                <Calendar className="core-icon text-indigo" size={24} />
                <h3>Events</h3>
              </div>
              <ul className="core-feature-list">
                <li><ChevronRight size={14} /> Upcoming Events Feed</li>
                <li><ChevronRight size={14} /> Quick One-Click Registration</li>
                <li><ChevronRight size={14} /> Integrated Event Calendar</li>
                <li><ChevronRight size={14} /> AI-Powered Reminders</li>
              </ul>
              <div className="core-card-bg-gradient bg-indigo-grad"></div>
            </div>

            {/* Card 2: Clubs */}
            <div className="core-feature-card">
              <div className="core-card-header">
                <Users className="core-icon text-purple" size={24} />
                <h3>Clubs</h3>
              </div>
              <ul className="core-feature-list">
                <li><ChevronRight size={14} /> Club Discovery Engine</li>
                <li><ChevronRight size={14} /> One-Click Join Requests</li>
                <li><ChevronRight size={14} /> Real-Time Club updates</li>
                <li><ChevronRight size={14} /> Member Directories</li>
              </ul>
              <div className="core-card-bg-gradient bg-purple-grad"></div>
            </div>

            {/* Card 3: Chat */}
            <div className="core-feature-card">
              <div className="core-card-header">
                <MessageCircle className="core-icon text-teal" size={24} />
                <h3>Chat</h3>
              </div>
              <ul className="core-feature-list">
                <li><ChevronRight size={14} /> Real-Time Group Messaging</li>
                <li><ChevronRight size={14} /> Dedicated Club Channels</li>
                <li><ChevronRight size={14} /> Event-Specific Threads</li>
                <li><ChevronRight size={14} /> Professor announcements</li>
              </ul>
              <div className="core-card-bg-gradient bg-teal-grad"></div>
            </div>

            {/* Card 4: AI Assistant */}
            <div className="core-feature-card">
              <div className="core-card-header">
                <Brain className="core-icon text-blue" size={24} />
                <h3>AI Assistant</h3>
              </div>
              <ul className="core-feature-list">
                <li><ChevronRight size={14} /> Event Recommendations</li>
                <li><ChevronRight size={14} /> Intelligent Club Suggestions</li>
                <li><ChevronRight size={14} /> Natural Language Smart Search</li>
                <li><ChevronRight size={14} /> Notice & Announcements Summary</li>
              </ul>
              <div className="core-card-bg-gradient bg-blue-grad"></div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE PLATFORM PREVIEW */}
      <section className="live-preview-section">
        <div className="landing-container">
          <div className="section-header-centered">
            <h2 className="bento-title">Live Platform Preview</h2>
            <p className="bento-subtitle">Experience the unified dashboard designed for multiple campus personas.</p>
          </div>

          <div className="preview-tabs-row">
            <button 
              className={`preview-tab-btn ${activeTab === 'student' ? 'active' : ''}`}
              onClick={() => setActiveTab('student')}
            >
              👩‍🎓 Student View
            </button>
            <button 
              className={`preview-tab-btn ${activeTab === 'professor' ? 'active' : ''}`}
              onClick={() => setActiveTab('professor')}
            >
              👨‍🏫 Professor View
            </button>
          </div>

          {/* Realistic Dashboard Mockup */}
          <div className="dashboard-mockup-frame">
            <div className="mockup-header-bar">
              <div className="mockup-window-controls">
                <span className="dot-red"></span>
                <span className="dot-yellow"></span>
                <span className="dot-green"></span>
              </div>
              <div className="mockup-url-field">campuspulse.edu/dashboard</div>
            </div>
            
            <div className="mockup-body-wrapper">
              {activeTab === 'student' && (
                <div className="mockup-content animate-fade-in">
                  <div className="mockup-welcome-row">
                    <div>
                      <h3>Welcome back, Sarah Miller!</h3>
                      <p>Sophomore · Computer Science Department</p>
                    </div>
                    <span className="mockup-user-badge">Student View</span>
                  </div>

                  <div className="mockup-widgets-grid">
                    {/* Widget 1: Upcoming Events */}
                    <div className="mockup-widget">
                      <h4 className="widget-title">📅 Upcoming Events</h4>
                      <div className="widget-list">
                        <div className="widget-list-item">
                          <strong>Vite 2026 Developer Conf</strong>
                          <span>Tomorrow · 3:00 PM · Science Hall A</span>
                        </div>
                        <div className="widget-list-item">
                          <strong>AI Ethics Seminar</strong>
                          <span>Jun 18 · 10:00 AM · Auditorium</span>
                        </div>
                      </div>
                    </div>

                    {/* Widget 2: Recommended Clubs */}
                    <div className="mockup-widget">
                      <h4 className="widget-title">🏛️ Recommended Clubs</h4>
                      <div className="widget-list">
                        <div className="widget-list-item">
                          <strong>Coding Club</strong>
                          <span>98% Match · 150 active members</span>
                        </div>
                        <div className="widget-list-item">
                          <strong>Design Guild</strong>
                          <span>94% Match · 85 active members</span>
                        </div>
                      </div>
                    </div>

                    {/* Widget 3: AI Suggestions */}
                    <div className="mockup-widget bg-indigo-tint">
                      <h4 className="widget-title text-indigo"><Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} /> AI Suggestions</h4>
                      <div className="widget-list">
                        <div className="widget-list-item bg-transparent" style={{ border: '1px dashed var(--primary-200)' }}>
                          <strong>Hackathon TechSpark</strong>
                          <span>Based on interest in Javascript and React</span>
                        </div>
                        <div className="widget-list-item bg-transparent" style={{ border: '1px dashed var(--primary-200)' }}>
                          <strong>UI/UX Guild Meetup</strong>
                          <span>Based on design study goals</span>
                        </div>
                      </div>
                    </div>

                    {/* Widget 4: Notifications */}
                    <div className="mockup-widget">
                      <h4 className="widget-title">🔔 Recent Notifications</h4>
                      <div className="widget-list">
                        <div className="widget-list-item">
                          <strong>Dr. Aris (CS-202)</strong>
                          <span>New assignment notice published.</span>
                        </div>
                        <div className="widget-list-item">
                          <strong>Robotics Club</strong>
                          <span>Your signup request has been approved!</span>
                        </div>
                      </div>
                    </div>

                    {/* Widget 5: Saved Events */}
                    <div className="mockup-widget">
                      <h4 className="widget-title">💾 Saved Events</h4>
                      <div className="widget-list">
                        <div className="widget-list-item">
                          <strong>Spring Hackathon</strong>
                          <span>Starts Jun 24 · 240 registered</span>
                        </div>
                        <div className="widget-list-item">
                          <strong>Figma Fundamentals Workshop</strong>
                          <span>Starts Jun 28 · 92 registered</span>
                        </div>
                      </div>
                    </div>

                    {/* Widget 6: Event Calendar */}
                    <div className="mockup-widget">
                      <h4 className="widget-title">🗓️ Event Calendar</h4>
                      <div className="widget-list">
                        <div className="widget-list-item">
                          <strong>Monday:</strong>
                          <span>Vite 2026 Developer Conf · 3:00 PM</span>
                        </div>
                        <div className="widget-list-item">
                          <strong>Thursday:</strong>
                          <span>AI Ethics Seminar · 10:00 AM</span>
                        </div>
                      </div>
                    </div>

                    {/* Widget 7: Community Activity Feed */}
                    <div className="mockup-widget" style={{ gridColumn: 'span 2' }}>
                      <h4 className="widget-title">💬 Community Activity Feed</h4>
                      <div className="widget-list">
                        <div className="widget-list-item" style={{ borderLeft: '3px solid var(--primary-500)', background: 'var(--bg-tertiary)' }}>
                          <strong>Sarah Miller (You)</strong>
                          <span>"Anyone going to the Vite Conf tomorrow? Let's carpool from the West Gate!"</span>
                        </div>
                        <div className="widget-list-item" style={{ borderLeft: '3px solid var(--secondary-400)', background: 'var(--bg-tertiary)' }}>
                          <strong>David Chen</strong>
                          <span>"Robotics lab is open late tonight for project testing. Stop by for spare servos."</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'professor' && (
                <div className="mockup-content animate-fade-in">
                  <div className="mockup-welcome-row">
                    <div>
                      <h3>Greetings, Dr. Elizabeth Aris!</h3>
                      <p>Senior Professor · Department of Computer Science & Engineering</p>
                    </div>
                    <span className="mockup-user-badge bg-purple-glow">Professor View</span>
                  </div>

                  <div className="mockup-widgets-grid">
                    {/* Widget 1: Create Event */}
                    <div className="mockup-widget">
                      <h4 className="widget-title">📝 Create Event</h4>
                      <div className="mockup-announcement-form">
                        <input type="text" className="mockup-form-input" placeholder="Event Name (e.g. Algorithms Review)..." defaultValue="AI Lab Open House" />
                        <input type="text" className="mockup-form-input" placeholder="Date & Time..." defaultValue="Jun 22 · 2:00 PM" />
                        <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end', marginTop: '4px' }}>Create & Publish</button>
                      </div>
                    </div>

                    {/* Widget 2: Student Registrations */}
                    <div className="mockup-widget">
                      <h4 className="widget-title">👥 Recent Student Registrations</h4>
                      <div className="widget-list">
                        <div className="widget-list-item" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>Sarah Miller</strong>
                            <p style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>CS Sophomore</p>
                          </div>
                          <span className="badge badge-success">Vite Conf</span>
                        </div>
                        <div className="widget-list-item" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>David Chen</strong>
                            <p style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>EE Junior</p>
                          </div>
                          <span className="badge badge-indigo">AI Seminar</span>
                        </div>
                      </div>
                    </div>

                    {/* Widget 3: Announcements Feed */}
                    <div className="mockup-widget">
                      <h4 className="widget-title">📢 Post Announcement</h4>
                      <div className="mockup-announcement-form">
                        <input type="text" className="mockup-form-input" placeholder="Subject..." defaultValue="Assignment 3 Extension" />
                        <textarea className="mockup-form-textarea" placeholder="Type details..." defaultValue="Extended to Friday midnight. Please review lab groups."></textarea>
                        <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end' }}>Broadcast Notice</button>
                      </div>
                    </div>

                    {/* Widget 4: Club Management */}
                    <div className="mockup-widget">
                      <h4 className="widget-title">🏛️ Supervised Club Management</h4>
                      <div className="widget-list">
                        <div className="widget-list-item">
                          <strong>Robotics Association (Faculty Advisor)</strong>
                          <span>42 active members · Next meeting: Jun 25</span>
                        </div>
                        <div className="widget-list-item">
                          <strong>Coding Syndicate (Club Mentor)</strong>
                          <span>150 active members · Next meeting: Tomorrow</span>
                        </div>
                      </div>
                    </div>

                    {/* Widget 5: Attendance Insights */}
                    <div className="mockup-widget">
                      <h4 className="widget-title">📊 Class Attendance Insights</h4>
                      <div className="mockup-chart-placeholder">
                        <div className="bar-val" style={{ height: '75%' }}><span>75%</span></div>
                        <div className="bar-val" style={{ height: '90%' }}><span>90%</span></div>
                        <div className="bar-val" style={{ height: '65%' }}><span>65%</span></div>
                        <div className="bar-val" style={{ height: '98%' }}><span>98%</span></div>
                      </div>
                      <div className="chart-labels" style={{ marginTop: '4px' }}>
                        <span>CS-101</span><span>CS-202</span><span>AI-501</span><span>DE-302</span>
                      </div>
                    </div>

                    {/* Widget 6: Event Analytics */}
                    <div className="mockup-widget">
                      <h4 className="widget-title">📈 Event Registration Analytics</h4>
                      <div className="widget-list">
                        <div className="widget-list-item">
                          <strong>Vite Conf 2026:</strong>
                          <span>145 / 150 seats occupied (96% filled)</span>
                        </div>
                        <div className="widget-list-item">
                          <strong>AI Ethics Seminar:</strong>
                          <span>88 / 100 seats occupied (88% filled)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="premium-testimonials-section">
        <div className="landing-container">
          <div className="section-header-centered">
            <h2 className="bento-title">Hear from the <HandDrawnUnderline>Pulse</HandDrawnUnderline></h2>
            <p className="bento-subtitle">How CampusPulse is transforming engagement across universities.</p>
          </div>
        </div>

        {/* Sliding Infinite Testimonial Carousel */}
        <div className="testimonials-infinite-track">
          <div className="testimonials-track-inner">
            {/* Slide group 1 */}
            {[
              {
                avatar: "👨‍💻",
                name: "Alex Thorne",
                course: "B.Tech Computer Science",
                feedback: "CampusPulse completely changed how I track event schedules. The AI recommended a hackathon I didn't know about, and our team ended up taking first place!"
              },
              {
                avatar: "🎨",
                name: "Mia Patel",
                course: "B.Des Communication Design",
                feedback: "As a club leader, discovering new members was a massive hurdle. CampusPulse matches design students with our club automatically based on their skills!"
              },
              {
                avatar: "👩‍🏫",
                name: "Dr. Jonathan Briggs",
                course: "Associate Professor, EE",
                feedback: "Reaching students with announcements was always scattered. Posting assignments on CampusPulse guarantees instant notifications, boosting submissions."
              }
            ].map((t, idx) => (
              <div className="premium-testimonial-card" key={idx}>
                <div className="testimonial-card-header">
                  <span className="testimonial-stars-glow">⭐⭐⭐⭐⭐</span>
                </div>
                <p className="testimonial-body-text">"{t.feedback}"</p>
                <div className="testimonial-user-profile">
                  <div className="testimonial-avatar">{t.avatar}</div>
                  <div>
                    <h4>{t.name}</h4>
                    <p>{t.course}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Slide group 2 (duplicate for infinite scroll) */}
            {[
              {
                avatar: "👨‍💻",
                name: "Alex Thorne",
                course: "B.Tech Computer Science",
                feedback: "CampusPulse completely changed how I track event schedules. The AI recommended a hackathon I didn't know about, and our team ended up taking first place!"
              },
              {
                avatar: "🎨",
                name: "Mia Patel",
                course: "B.Des Communication Design",
                feedback: "As a club leader, discovering new members was a massive hurdle. CampusPulse matches design students with our club automatically based on their skills!"
              },
              {
                avatar: "👩‍🏫",
                name: "Dr. Jonathan Briggs",
                course: "Associate Professor, EE",
                feedback: "Reaching students with announcements was always scattered. Posting assignments on CampusPulse guarantees instant notifications, boosting submissions."
              }
            ].map((t, idx) => (
              <div className="premium-testimonial-card" key={`dup-${idx}`}>
                <div className="testimonial-card-header">
                  <span className="testimonial-stars-glow">⭐⭐⭐⭐⭐</span>
                </div>
                <p className="testimonial-body-text">"{t.feedback}"</p>
                <div className="testimonial-user-profile">
                  <div className="testimonial-avatar">{t.avatar}</div>
                  <div>
                    <h4>{t.name}</h4>
                    <p>{t.course}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="premium-cta-banner-section">
        <div className="landing-container">
          <div className="cta-banner-card animate-scale-in">
            <div className="cta-dotted-overlay"></div>
            <div className="cta-gradient-orb"></div>
            
            <div className="cta-content-inner">
              <h2 className="cta-main-headline">Ready to Find Your <HandDrawnUnderline>Pulse</HandDrawnUnderline>?</h2>
              <p className="cta-description">
                Join thousands of students already discovering opportunities, workshops, hackathons, and clubs through CampusPulse.
              </p>
              
              <div className="cta-button-row">
                <Link to="/signup" className="btn btn-cta-primary">
                  Join CampusPulse
                </Link>
                <a href="mailto:support@campuspulse.edu" className="btn btn-cta-secondary">
                  Contact Us
                </a>
              </div>

              {/* Newsletter subscription form */}
              <form onSubmit={handleSubscribe} className="cta-subscribe-form">
                <input 
                  type="email" 
                  value={contactEmail} 
                  onChange={(e) => setContactEmail(e.target.value)} 
                  placeholder="Enter your campus email..." 
                  className="cta-subscribe-input"
                  required 
                />
                <button type="submit" className="btn-subscribe">
                  {subscribed ? 'Subscribed!' : 'Stay Updated'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
