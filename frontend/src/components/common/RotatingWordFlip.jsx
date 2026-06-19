import { useState, useEffect, useRef, useCallback } from 'react';
import '../landing/RotatingWordFlip.css';

const WORDS = ['Events', 'Clubs', 'Hackathons', 'Workshops', 'Communities', 'Opportunities'];
const FLIP_DURATION = 700; // ms
const DELAY = 2500; // ms between flips

export default function RotatingWordFlip() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'flipping'
  const [width, setWidth] = useState('auto');
  const sizerRef = useRef(null);
  const currentRef = useRef(null);

  // Measure the current word on mount
  useEffect(() => {
    if (currentRef.current) {
      setWidth(currentRef.current.offsetWidth + 'px');
    }
  }, []);

  const doFlip = useCallback(() => {
    const nextIndex = (currentIndex + 1) % WORDS.length;

    // Pre-measure next word width
    if (sizerRef.current) {
      sizerRef.current.textContent = WORDS[nextIndex];
      setWidth(sizerRef.current.offsetWidth + 'px');
    }

    setPhase('flipping');

    // After animation completes, update index and reset
    setTimeout(() => {
      setCurrentIndex(nextIndex);
      setPhase('idle');
    }, FLIP_DURATION);
  }, [currentIndex]);

  useEffect(() => {
    const timer = setInterval(doFlip, DELAY + FLIP_DURATION);
    return () => clearInterval(timer);
  }, [doFlip]);

  const currentWord = WORDS[currentIndex];
  const nextWord = WORDS[(currentIndex + 1) % WORDS.length];

  return (
    <span className="rotating-word-container">
      {/* Invisible sizer to measure word widths */}
      <span className="rotating-word-sizer" ref={sizerRef} aria-hidden="true">
        {currentWord}
      </span>

      <span className="rotating-word-width-wrapper" style={{ width }}>
        <span className="rotating-word-inner">
          {phase === 'idle' && (
            <span className="rotating-word idle" ref={currentRef}>
              {currentWord}
            </span>
          )}
          {phase === 'flipping' && (
            <>
              <span className="rotating-word exit" key={`exit-${currentIndex}`}>
                {currentWord}
              </span>
              <span className="rotating-word enter" key={`enter-${currentIndex + 1}`}>
                {nextWord}
              </span>
            </>
          )}
        </span>
      </span>
    </span>
  );
}
