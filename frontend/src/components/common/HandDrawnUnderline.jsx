import { useEffect, useRef, useState } from 'react';
import '../ui/HandDrawnUnderline.css';

export default function HandDrawnUnderline({ children, delay = 200, duration = 900 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Trigger once
        }
      },
      { threshold: 0.15 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className={`hand-drawn-underline-wrapper ${isVisible ? 'is-visible' : ''}`}>
      <span className="hand-drawn-text">{children}</span>
      <svg
        className="hand-drawn-underline-svg"
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          className="hand-drawn-underline-path"
          d="M 3 9 Q 28 12 53 7 T 97 5"
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{
            animationDelay: `${delay}ms`,
            animationDuration: `${duration}ms`
          }}
        />
      </svg>
    </span>
  );
}
