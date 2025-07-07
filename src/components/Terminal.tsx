import React, { useEffect, useRef, useState } from 'react';
import { useTerminal } from '../hooks/useTerminal';
import { filesystem } from '../data/filesystem';

// TypeWriter component for typing animation
const TypeWriter = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 80); // Typing speed
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <span className="typing-text-animation">
      {displayText}
      {currentIndex < text.length && <span className="typing-cursor">|</span>}
    </span>
  );
};

export const Terminal = () => {
  const { output, currentInput, cursorPosition, prompt, isTyping, clear, notification, hasUsedTab, executeCommand, state, handleInputChange } = useTerminal();
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Android device detection for enhanced compatibility
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const [showBootSequence, setShowBootSequence] = useState(true);
  const [bootComplete, setBootComplete] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [lastOutputLength, setLastOutputLength] = useState(0);
  const [currentTheme, setCurrentTheme] = useState('');
  const [showTabHint, setShowTabHint] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [codeSnippets] = useState([
    'console.log("Hello World");',
    'console.log("Welcome to my portfolio");',
    'function hack() { return "access_granted"; }',
    'const security = "enhanced";',
    'console.log("System initialized");',
    'npm install cybersecurity-tools'
  ]);

  useEffect(() => {
    // Boot sequence animation with smooth transition
    const bootTimer = setTimeout(() => {
      // Start transition
      setIsTransitioning(true);
      
      // Fade out boot sequence
      setTimeout(() => {
      setShowBootSequence(false);
      }, 800);
      
      // Show terminal with fade-in
      setTimeout(() => {
        setShowTerminal(true);
      }, 1200);
      
      // Complete transition
      setTimeout(() => {
        setBootComplete(true);
        setIsTransitioning(false);
      }, 1800);
    }, 6000);

    return () => clearTimeout(bootTimer);
  }, []);

  useEffect(() => {
    // Simple terminal auto-scroll: only scroll when new output is added and user is near bottom
    if (terminalRef.current && output.length > lastOutputLength && bootComplete && !isTransitioning) {
      const scrollElement = terminalRef.current;
      const isNearBottom = scrollElement.scrollHeight - scrollElement.clientHeight <= scrollElement.scrollTop + 100;
      
      // Only auto-scroll if user is already near the bottom
      if (isNearBottom) {
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }, 50);
      }
      setLastOutputLength(output.length);
    }
  }, [output.length, lastOutputLength, bootComplete, isTransitioning]);

  useEffect(() => {
    // Keep input focused but don't interfere with scrolling
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only focus if clicking in terminal area, not on scrollbar
      if (inputRef.current && !isTyping && bootComplete && 
          terminalRef.current && terminalRef.current.contains(target)) {
        e.preventDefault();
        
        // Save current scroll positions before focusing
        const currentPageScroll = window.pageYOffset;
        const currentTerminalScroll = terminalRef.current.scrollTop;
        
        inputRef.current.focus({ preventScroll: true });
        
        // Restore both page and terminal scroll positions
        setTimeout(() => {
          window.scrollTo({ top: currentPageScroll, behavior: 'auto' });
          if (terminalRef.current) {
            terminalRef.current.scrollTop = currentTerminalScroll;
          }
        }, 0);
      }
    };

    // Enhanced touch events for Android compatibility
    const handleTouch = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (inputRef.current && !isTyping && bootComplete && 
          terminalRef.current && terminalRef.current.contains(target)) {
        
        // Save current scroll position for mobile
        const currentPageScroll = window.pageYOffset;
        
        // Enhanced Android focus handling
        if (isAndroid) {
          // Force focus and click for Android virtual keyboard
          inputRef.current.focus();
          inputRef.current.click();
          
          // Trigger input events to ensure keyboard shows
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
              // Simulate a small input change to wake up Android keyboard
              const evt = new Event('focus', { bubbles: true });
              inputRef.current.dispatchEvent(evt);
            }
          }, 50);
        } else {
          inputRef.current.focus({ preventScroll: true });
        }
        
        // Restore page scroll position on mobile
        setTimeout(() => {
          window.scrollTo({ top: currentPageScroll, behavior: 'auto' });
        }, 0);
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('touchstart', handleTouch);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('touchstart', handleTouch);
    };
  }, [isTyping, bootComplete]);

  useEffect(() => {
    // Auto-focus input and scroll to top when terminal loads
    if (bootComplete && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
      
      // Scroll to top of the page when terminal loads
      if (terminalRef.current) {
        terminalRef.current.scrollTop = 0;
      }
      // Also scroll the window to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [bootComplete]);



  // We no longer lock the body scrolling with a class; focusing the fixed input at top prevents jumps naturally.
  // (Left intentionally blank)

  // Handle viewport changes on mobile (virtual keyboard) - Simplified
  useEffect(() => {
    if (!bootComplete || window.innerWidth > 768) return;

    const handleViewportChange = () => {
      // Simple viewport height adjustment for mobile keyboards
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const heightDifference = windowHeight - viewportHeight;
      
      // Only adjust if keyboard is open and input is focused
      if (heightDifference > 150 && isInputFocused && terminalRef.current) {
        terminalRef.current.style.maxHeight = `${Math.min(viewportHeight * 0.7, 500)}px`;
      } else if (terminalRef.current) {
        terminalRef.current.style.maxHeight = '75vh';
      }
    };

    // Use visual viewport API if available
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => window.visualViewport.removeEventListener('resize', handleViewportChange);
    }
  }, [bootComplete, isInputFocused]);

  // Add percentage animation effect
  useEffect(() => {
    if (showBootSequence) {
      const animatePercentages = () => {
        const percentageElements = document.querySelectorAll('.percentage, .main-percentage');
        
        percentageElements.forEach((element, index) => {
          const target = parseInt(element.getAttribute('data-target') || '100');
          const delay = index * 500 + 500; // Staggered animation
          
          setTimeout(() => {
            let current = 0;
            const increment = target / 50; // 50 steps for smooth animation
            const timer = setInterval(() => {
              current += increment;
              if (current >= target) {
                current = target;
                clearInterval(timer);
              }
              element.textContent = Math.floor(current).toString();
            }, 30); // Update every 30ms
          }, delay);
        });
      };

      // Start percentage animation after component mounts
      const timer = setTimeout(animatePercentages, 100);
      return () => clearTimeout(timer);
    }
  }, [showBootSequence]);

  const renderTerminalLine = (line: string) => {
    // Handle HTML content like the Mohammad name span and help titles
    if (line.includes('<span class="mohammad-name">') || line.includes('<span class="help-title">')) {
      return (
        <span dangerouslySetInnerHTML={{ 
          __html: line
        }} />
      );
    }

    // Handle URLs (with and without http/https)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    // Handle email addresses
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    // Handle phone numbers
    const phoneRegex = /(\+\d{1,3}\s?\d{1,3}\s?\d{1,3}\s?\d{1,4})/g;
    // Handle resume download links
    const resumeRegex = /(resume\.pdf|CV\.pdf|download.*resume|resume.*download)/gi;

    let processedLine = line;
    const parts = [];
    let lastIndex = 0;

    // Find all matches for URLs, emails, phones, and resume
    const allMatches = [];
    
    let match;
    // Reset regex lastIndex to avoid issues with global regex
    resumeRegex.lastIndex = 0;
    urlRegex.lastIndex = 0;
    emailRegex.lastIndex = 0;
    phoneRegex.lastIndex = 0;
    
    // Check for resume downloads first (higher priority)
    while ((match = resumeRegex.exec(line)) !== null) {
      allMatches.push({ type: 'resume', match: match[0], index: match.index });
    }
    
    while ((match = urlRegex.exec(line)) !== null) {
      // Skip if this URL is already covered by resume regex
      const isResumeLink = allMatches.some(m => 
        m.type === 'resume' && 
        match.index >= m.index && 
        match.index < m.index + m.match.length
      );
      if (!isResumeLink) {
        allMatches.push({ type: 'url', match: match[0], index: match.index });
      }
    }
    
    while ((match = emailRegex.exec(line)) !== null) {
      allMatches.push({ type: 'email', match: match[0], index: match.index });
    }
    
    while ((match = phoneRegex.exec(line)) !== null) {
      allMatches.push({ type: 'phone', match: match[0], index: match.index });
    }

    // Sort matches by index
    allMatches.sort((a, b) => a.index - b.index);
    
    // Debug: log what we found
    if (allMatches.length > 0) {
      console.log('Found matches in line:', line, allMatches);
    }

    // Process each match
    allMatches.forEach((item, i) => {
      // Add text before the match
      if (item.index > lastIndex) {
        parts.push(line.substring(lastIndex, item.index));
      }

      // Add the clickable element
      if (item.type === 'url') {
        parts.push(
          <a 
            key={`link-${i}`}
            href={item.match} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline transition-colors cursor-pointer"
            style={{ 
              textShadow: '0 0 4px rgba(96, 165, 250, 0.5)',
              zIndex: 1000,
              position: 'relative'
            }}
            onClick={(e) => {
              e.preventDefault();
              console.log('URL clicked:', item.match);
              window.open(item.match, '_blank', 'noopener,noreferrer');
            }}
          >
            {item.match}
          </a>
        );
      } else if (item.type === 'email') {
        parts.push(
          <a 
            key={`email-${i}`}
            href={`mailto:${item.match}`}
            className="text-cyan-400 hover:text-cyan-300 underline transition-colors cursor-pointer"
            style={{ 
              textShadow: '0 0 4px rgba(34, 211, 238, 0.5)',
              zIndex: 1000,
              position: 'relative'
            }}
            onClick={(e) => {
              console.log('Email clicked:', item.match);
            }}
          >
            {item.match}
          </a>
        );
      } else if (item.type === 'phone') {
        // Create WhatsApp link for phone numbers
        const phoneNumber = item.match.replace(/\s/g, ''); // Remove spaces
        const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}`;
        parts.push(
          <a 
            key={`phone-${i}`}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 underline transition-colors cursor-pointer"
            style={{ 
              textShadow: '0 0 4px rgba(74, 222, 128, 0.5)',
              zIndex: 1000,
              position: 'relative'
            }}
            title="Open in WhatsApp"
            onClick={(e) => {
              console.log('Phone clicked:', item.match, 'WhatsApp URL:', whatsappUrl);
            }}
          >
            {item.match}
          </a>
        );
      } else if (item.type === 'resume') {
        parts.push(
          <button 
            key={`resume-${i}`}
            onClick={() => downloadResume()}
            className="text-yellow-400 hover:text-yellow-300 underline transition-colors cursor-pointer bg-transparent border-none p-0 font-inherit"
            style={{ textShadow: '0 0 4px rgba(251, 191, 36, 0.5)' }}
            title="Download Resume"
          >
            {item.match}
          </button>
        );
      }

      lastIndex = item.index + item.match.length;
    });

    // Add remaining text
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    // If no matches found, return original line
    if (allMatches.length === 0) {
      return line;
    }

    return <span>{parts}</span>;
  };

  const switchTheme = (theme: string) => {
    setCurrentTheme(theme);
  };

  const downloadResume = () => {
    // Open CV in new window and trigger print dialog for Word document download
    const cvWindow = window.open('/Mohammad_Abbass_CV.html', '_blank');
    if (cvWindow) {
      cvWindow.addEventListener('load', () => {
        setTimeout(() => {
          cvWindow.print();
        }, 500);
      });
    }
  };

  if (showBootSequence && !isTransitioning) {
    return (
      <div className="min-h-screen bg-terminal-bg text-terminal-text px-3 py-6 sm:p-4 flex items-center justify-center boot-container">
        {/* Subtle background pattern */}
        <div className="circuit-bg opacity-30"></div>
        
        <div className="text-center boot-content w-full max-w-4xl relative z-10">
          <div className="ascii-art mb-8 sm:mb-8 text-green-400 glowing-ascii">
            {/* Desktop ASCII Art */}
            <pre className="hidden md:block text-base lg:text-lg font-mono whitespace-pre">
{`
 ███▄ ▄███▓ ▒█████   ██░ ██  ▄▄▄       ███▄ ▄███▓███▄ ▄███▓▄▄▄      ▓█████▄ 
▓██▒▀█▀ ██▒▒██▒  ██▒▓██░ ██▒▒████▄    ▓██▒▀█▀ ██▒▓██▒▀█▀ ██▒████▄    ▒██▀ ██▌
▓██    ▓██░▒██░  ██▒▒██▀▀██░▒██  ▀█▄  ▓██    ▓██░▓██    ▓██░██  ▀█▄  ░██   █▌
▒██    ▒██ ▒██   ██░░▓█ ░██ ░██▄▄▄▄██ ▒██    ▒██ ▒██    ▒██ ██▄▄▄▄██ ░▓█▄   ▌
▒██▒   ░██▒░ ████▓▒░░▓█▒░██▓ ▓█   ▓██▒▒██▒   ░██▒▒██▒   ░██▒▓█   ▓██▒░▒████▓ 
░ ▒░   ░  ░░ ▒░▒░▒░  ▒ ░░▒░▒ ▒▒   ▓▒█░░  ░      ░░  ░      ░ ▒   ▒▒   ░ ▒  ▒ 
░  ░      ░  ░ ▒ ▒░  ▒ ░▒░ ░  ▒   ▒▒ ░░  ░      ░          ░        ░  ░   ░    
                                                                      ░      
`}
            </pre>
            
            {/* Tablet ASCII Art */}
            <pre className="hidden sm:block md:hidden text-xs font-mono whitespace-pre">
{`
███▄ ▄███▓ ▒█████   ██░ ██  ▄▄▄       ███▄ ▄███▓███▄ ▄███▓▄▄▄      ▓█████▄ 
▓██▒▀█▀ ██▒▒██▒  ██▒▓██░ ██▒▒████▄    ▓██▒▀█▀ ██▒▓██▒▀█▀ ██▒████▄    ▒██▀ ██▌
▓██    ▓██░▒██░  ██▒▒██▀▀██░▒██  ▀█▄  ▓██    ▓██░▓██    ▓██░██  ▀█▄  ░██   █▌
▒██    ▒██ ▒██   ██░░▓█ ░██ ░██▄▄▄▄██ ▒██    ▒██ ▒██    ▒██ ██▄▄▄▄██ ░▓█▄   ▌
▒██▒   ░██▒░ ████▓▒░░▓█▒░██▓ ▓█   ▓██▒▒██▒   ░██▒▒██▒   ░██▒▓█   ▓██▒░▒████▓
`}
            </pre>
            
            {/* Mobile ASCII Art */}
            <div className="block sm:hidden">
              <div className="text-3xl font-bold mb-3 tracking-wider glowing-ascii">
                MOHAMMAD
              </div>
              <div className="text-2xl font-bold tracking-widest glowing-ascii">
                ABBASS
              </div>
            </div>
          </div>
          
          <div className="boot-sequence text-terminal-accent glowing-text px-3 sm:px-2">
            <div className="mb-4 sm:mb-4 boot-item text-sm sm:text-sm md:text-base flex justify-between boot-line leading-relaxed" style={{ animationDelay: '0.5s' }}>
              <span className="flex-1 pr-2"><span className="text-terminal-accent">{'>'}</span> Initializing secure terminal...</span>
              <span className="text-terminal-muted text-xs sm:text-sm shrink-0">
                [<span className="percentage" data-target="100">0</span>%] 
                <span className="status-ok ml-1">[OK]</span>
              </span>
            </div>
            <div className="mb-4 sm:mb-4 boot-item text-sm sm:text-sm md:text-base flex justify-between boot-line leading-relaxed" style={{ animationDelay: '1s' }}>
              <span className="flex-1 pr-2"><span className="text-terminal-accent">{'>'}</span> Loading cybersecurity protocols...</span>
              <span className="text-terminal-muted text-xs sm:text-sm shrink-0">
                [<span className="percentage" data-target="100">0</span>%] 
                <span className="status-ok ml-1">[OK]</span>
              </span>
            </div>
            <div className="mb-4 sm:mb-4 boot-item text-sm sm:text-sm md:text-base flex justify-between boot-line leading-relaxed" style={{ animationDelay: '1.5s' }}>
              <span className="flex-1 pr-2"><span className="text-terminal-accent">{'>'}</span> Establishing connection...</span>
              <span className="text-terminal-muted text-xs sm:text-sm shrink-0">
                [<span className="percentage" data-target="100">0</span>%] 
                <span className="status-ok ml-1">[OK]</span>
              </span>
            </div>
            <div className="mb-4 sm:mb-4 boot-item text-sm sm:text-sm md:text-base flex justify-between boot-line leading-relaxed" style={{ animationDelay: '2s' }}>
              <span className="flex-1 pr-2"><span className="text-terminal-accent">{'>'}</span> Compiling portfolio interface...</span>
              <span className="text-terminal-muted text-xs sm:text-sm shrink-0">
                [<span className="percentage" data-target="100">0</span>%] 
                <span className="status-ok ml-1">[OK]</span>
              </span>
            </div>

            
            <div className="loading-bar mt-8 sm:mt-8 boot-item px-4 sm:px-8" style={{ animationDelay: '2s' }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm sm:text-xs text-terminal-muted font-medium">Loading Progress:</span>
                <span className="text-sm sm:text-xs text-terminal-accent font-bold">
                  <span className="main-percentage" data-target="100">0</span>%
                </span>
              </div>
              <div className="bg-terminal-border h-3 sm:h-2 rounded relative overflow-hidden">
                <div className="bg-terminal-accent h-3 sm:h-2 rounded glowing-progress animated-progress-bar" style={{
                  width: '0%',
                  animation: 'loadingBarFill 3s ease-in-out forwards'
                }}></div>
              </div>
            </div>
            
            <div className="mt-8 sm:mt-8 text-sm sm:text-sm text-terminal-muted typing-welcome px-3" style={{ animationDelay: '3.2s' }}>
              <TypeWriter text="Welcome to Mohammad Abbass Terminal" />
            </div>
            
            {/* Clean status indicators */}
            <div className="mt-8 flex justify-center space-x-4 sm:space-x-6 text-sm sm:text-xs opacity-75" style={{ animationDelay: '3.5s' }}>
              <div className="boot-item flex items-center space-x-2">
                <span className="w-3 h-3 sm:w-2 sm:h-2 bg-terminal-accent rounded-full animate-pulse"></span>
                <span className="text-terminal-muted font-medium">SECURE</span>
              </div>
              <div className="boot-item flex items-center space-x-2">
                <span className="w-3 h-3 sm:w-2 sm:h-2 bg-terminal-accent rounded-full animate-pulse"></span>
                <span className="text-terminal-muted font-medium">READY</span>
              </div>
              <div className="boot-item flex items-center space-x-2">
                <span className="w-3 h-3 sm:w-2 sm:h-2 bg-terminal-accent rounded-full animate-pulse"></span>
                <span className="text-terminal-muted font-medium">ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Transition overlay
  if (isTransitioning) {
    return (
      <div className="min-h-screen bg-terminal-bg text-terminal-text flex items-center justify-center transition-container">
        <div className="transition-overlay">
          {/* Boot sequence fade-out */}
          {showBootSequence && (
            <div className="absolute inset-0 flex items-center justify-center boot-fade-out">
              <div className="circuit-bg opacity-30"></div>
              <div className="text-center boot-content w-full max-w-4xl relative z-10 transition-boot-out">
                <div className="ascii-art mb-8 sm:mb-8 text-green-400 glowing-ascii">
                  <div className="block sm:hidden">
                    <div className="text-3xl font-bold mb-3 tracking-wider glowing-ascii">
                      MOHAMMAD
                    </div>
                    <div className="text-2xl font-bold tracking-widest glowing-ascii">
                      ABBASS
                    </div>
                  </div>
                </div>
                <div className="text-center text-terminal-accent">
                  <div className="loading-dots">
                    <span>Initializing Terminal Interface</span>
                    <span className="dots">
                      <span>.</span><span>.</span><span>.</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Terminal fade-in */}
          {showTerminal && (
            <div className="absolute inset-0 terminal-fade-in">
              <div className="matrix-rain opacity-50"></div>
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="terminal-loading mb-6">
                    <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-4 animate-pulse">
                      ⚡ TERMINAL READY ⚡
                    </div>
                    <div className="bg-terminal-border h-1 w-64 mx-auto rounded overflow-hidden">
                      <div className="bg-terminal-accent h-1 loading-bar-final"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-terminal-bg text-terminal-text relative overflow-hidden ${currentTheme} py-4 sm:py-6 ${bootComplete ? 'terminal-entrance' : ''}`}>
      {/* Matrix background animation */}
      <div className="matrix-rain"></div>
      <div className="matrix-rain-2"></div>
      <div className="matrix-rain-3"></div>
      
      {/* Horizontal flying text - left to right and right to left */}
      <div className="matrix-rain-horizontal-lr"></div>
      <div className="matrix-rain-horizontal-lr-2"></div>
      <div className="matrix-rain-horizontal-rl"></div>
      <div className="matrix-rain-horizontal-rl-2"></div>
      
      {/* Floating code snippets */}
      {codeSnippets.map((code, index) => (
        <div
          key={`code-${index}`}
          className="floating-code"
          style={{
            left: `${(index * 15 + 10)}%`,
            animationDelay: `${index * 3}s`,
          }}
        >
          {code}
        </div>
      ))}
      
      <div className="max-w-6xl mx-auto relative z-10 p-4 pt-8 sm:pt-12 lg:pt-16">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8 text-center px-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 animate-glow-pulse" style={{ color: '#00aa00', textShadow: '0 0 8px rgba(0, 170, 0, 0.4)' }}>
            Welcome to Mohammad Abbass Portfolio
          </h1>
          <div className="text-terminal-text max-w-3xl mx-auto">
            <p className="mb-3 sm:mb-4 text-base sm:text-lg animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              🚀 Interactive Terminal Portfolio Experience
            </p>
            <p className="mb-4 text-sm sm:text-base leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              This is a fully functional terminal interface showcasing my skills, projects, and experience 
              in cybersecurity and software development. Navigate through my digital world using real terminal commands!
            </p>
            <p className="mb-4 text-xs sm:text-sm text-terminal-muted opacity-75 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
              💻 <em>For the best experience, use your laptop or desktop computer</em>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6 text-xs sm:text-sm">
              <div className="bg-terminal-bg/50 border border-terminal-border rounded-lg p-3 sm:p-4 animate-slide-in-left hover-enhance animate-hover-slide-glow cursor-pointer" style={{ animationDelay: '0.8s' }}>
                <span className="text-terminal-accent font-semibold animate-text-glow">💻 How to Navigate:</span>
                <p className="mt-1 sm:mt-2">Type "help" to see all available commands</p>
              </div>
              <div className="bg-terminal-bg/50 border border-terminal-border rounded-lg p-3 sm:p-4 animate-slide-in-up hover-enhance animate-hover-pulse-color cursor-pointer" style={{ animationDelay: '1s' }}>
                <span className="text-terminal-accent font-semibold animate-text-glow">🔍 Explore:</span>
                <p className="mt-1 sm:mt-2">Use "ls" and "cd" to browse directories</p>
              </div>
              <div className="bg-terminal-bg/50 border border-terminal-border rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1 animate-slide-in-right hover-enhance animate-hover-shake cursor-pointer" style={{ animationDelay: '1.2s' }}>
                <span className="text-terminal-accent font-semibold animate-text-glow">🎯 Pro Tip:</span>
                <p className="mt-1 sm:mt-2">Try "sudo access secrets" for a surprise!</p>
              </div>
            </div>
          </div>
        </div>

        <div className="terminal-window animate-fade-in-up" style={{ animationDelay: '1.6s' }}>
          <div className="terminal-header">
            <div className="terminal-buttons">
              <button 
                className="terminal-button close" 
                onClick={() => switchTheme('theme-red')}
                title="Red Theme"
              ></button>
              <button 
                className="terminal-button minimize" 
                onClick={() => switchTheme('theme-yellow')}
                title="Yellow Theme"
              ></button>
              <button 
                className="terminal-button maximize" 
                onClick={() => switchTheme('')}
                title="Green Theme (Default)"
              ></button>
            </div>
            <div className="text-xs sm:text-sm text-terminal-muted hidden sm:block">
              root@abbass-portfolio ~ Mohammad Abbass Terminal v2.0
            </div>
            <div className="text-xs sm:text-sm text-terminal-muted sm:hidden">
              Terminal v2.0
            </div>
            <div className="text-xs text-terminal-muted">
              <button onClick={clear} className="hover:text-terminal-accent transition-colors">
                [clear]
              </button>
            </div>
          </div>
          
          {/* Notification Display */}
          {notification && (
            <div className="notification-bar bg-terminal-accent/20 border border-terminal-accent text-terminal-accent px-4 py-2 text-sm animate-fade-in">
              {notification}
            </div>
          )}
          
          {/* Tab Hint Notification */}
          {showTabHint && bootComplete && !hasUsedTab && (
            <div className="tab-hint-bar bg-blue-900/20 border border-blue-400/50 text-blue-300 px-3 py-1 text-xs animate-slide-in-up mb-2 flex items-center justify-between" style={{ animationDelay: '2s' }}>
              <span>
                💡 <strong>Pro Tip:</strong> Press <kbd className="bg-blue-800/50 px-1 py-0.5 rounded text-xs border border-blue-400/30 mx-1">Tab</kbd> to autocomplete commands and filenames!
              </span>
              <button 
                onClick={() => setShowTabHint(false)}
                className="ml-3 text-blue-300 hover:text-blue-100 transition-colors"
                title="Dismiss hint"
              >
                ✕
              </button>
            </div>
          )}
          
          <div 
            ref={terminalRef}
            className="terminal-content"
          >
            {output.map((line, index) => (
              <div key={index} className="output animate-fade-in">
                {renderTerminalLine(line)}
              </div>
            ))}
            
            <div className="flex items-center mt-2">
              <span className="prompt" style={{ color: '#00cc00', textShadow: '0 0 4px rgba(0, 204, 0, 0.3)' }}>{prompt}</span>
              <span className="ml-2 text-terminal-text relative">
                <span>{currentInput.substring(0, cursorPosition)}</span>
                <span className="cursor-blink">|</span>
                <span>{currentInput.substring(cursorPosition)}</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Footer Section */}
        <div className="mt-6 sm:mt-8 text-center px-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="info-box bg-terminal-bg/30 border border-terminal-border rounded-lg p-3 sm:p-4 cursor-pointer" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-terminal-accent font-semibold mb-1 sm:mb-2 text-sm sm:text-base animate-text-glow">🎓 Education</h3>
              <p className="text-xs sm:text-sm">B.S. in CS @ LIU University</p>
              <p className="text-xs text-terminal-muted">GPA: 3.7/4.0 (Graduate)</p>
            </div>
            <div className="info-box bg-terminal-bg/30 border border-terminal-border rounded-lg p-3 sm:p-4 cursor-pointer" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-terminal-accent font-semibold mb-1 sm:mb-2 text-sm sm:text-base animate-text-glow">🛡️ Learning</h3>
              <p className="text-xs sm:text-sm">Cybersecurity</p>
              <p className="text-xs text-terminal-muted">Ethical Hacking & AI</p>
            </div>
            <div className="info-box bg-terminal-bg/30 border border-terminal-border rounded-lg p-3 sm:p-4 cursor-pointer" style={{ animationDelay: '0.6s' }}>
              <h3 className="text-terminal-accent font-semibold mb-1 sm:mb-2 text-sm sm:text-base animate-text-glow">🏆 Experience</h3>
              <p className="text-xs sm:text-sm">CTF Learning</p>
              <p className="text-xs text-terminal-muted">Security Internship</p>
            </div>
            <div className="info-box bg-terminal-bg/30 border border-terminal-border rounded-lg p-3 sm:p-4 cursor-pointer" style={{ animationDelay: '0.8s' }}>
              <h3 className="text-terminal-accent font-semibold mb-1 sm:mb-2 text-sm sm:text-base animate-text-glow">📧 Connect</h3>
              <p className="text-xs sm:text-sm">Ready to collaborate?</p>
              <p className="text-xs text-terminal-muted">Type "cat contact.txt"</p>
            </div>
          </div>
          
          {/* Visual File Browser Section */}
          <div className="mt-8 sm:mt-12 px-2 animate-fade-in-up" style={{ animationDelay: '1.6s' }}>
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-2 text-terminal-accent animate-text-glow">
                🖱️ Visual File Explorer
              </h2>
              <p className="text-sm sm:text-base text-terminal-muted">
                Don't like typing commands? Simply click on any directory or file below!
              </p>
              <p className="text-xs sm:text-sm text-terminal-muted mt-1 opacity-75">
                📁 Directories: Navigate • 📄 Files: View content (auto-scroll to terminal)
              </p>
            </div>
            
            {/* Current Path Display */}
            <div className="mb-4 text-center">
              <span className="text-terminal-accent font-semibold">Current Location: </span>
              <span className="text-terminal-text">
                ~/{state.currentPath.length === 0 ? '' : state.currentPath.join('/')}
              </span>
            </div>
            
            {/* File Browser Grid */}
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                {/* Back Button (if not in root) */}
                {state.currentPath.length > 0 && (
                  <div 
                    key="back"
                    className="file-item bg-terminal-bg/50 border border-terminal-border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-terminal-accent/10 hover:border-terminal-accent transition-all duration-300 hover:scale-105"
                    data-type="directory"
                    onClick={() => executeCommand('cd ..')}
                  >
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl mb-2">⬅️</div>
                      <div className="text-xs sm:text-sm text-terminal-accent font-semibold truncate">
                        Back
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Current Directory Contents */}
                {(() => {
                  // Get current directory contents
                  let current: any = filesystem;
                  for (const path of state.currentPath) {
                    if (current[path] && current[path].children) {
                      current = current[path].children;
                    }
                  }
                  
                  return Object.entries(current || {})
                    .filter(([name, item]: [string, any]) => !item.hidden)
                    .map(([name, item]: [string, any]) => (
                      <div 
                        key={name}
                        className="file-item bg-terminal-bg/50 border border-terminal-border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-terminal-accent/10 hover:border-terminal-accent transition-all duration-300 hover:scale-105"
                        data-type={item.type}
                        onClick={() => {
                          if (item.type === 'directory') {
                            executeCommand(`cd ${name}`);
                          } else {
                            executeCommand(`cat ${name}`);
                            // Scroll to terminal after a brief delay to let the command execute
                            setTimeout(() => {
                              // First scroll the terminal into view
                              terminalRef.current?.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'start' 
                              });
                              // Then scroll to the bottom of the terminal content to show the new output
                              setTimeout(() => {
                                if (terminalRef.current) {
                                  terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
                                }
                              }, 500);
                            }, 100);
                          }
                        }}
                      >
                        <div className="text-center">
                          <div className="text-2xl sm:text-3xl mb-2">
                            {item.type === 'directory' ? '📁' : '📄'}
                          </div>
                          <div className="text-xs sm:text-sm text-terminal-text font-semibold truncate" title={name}>
                            {name}
                          </div>
                          <div className="text-xs text-terminal-muted mt-1">
                            {item.type === 'directory' ? 'Directory' : 'File'}
                          </div>
                        </div>
                      </div>
                    ));
                })()}
              </div>
              
              {/* Quick Actions */}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => executeCommand('ls')}
                  className="bg-terminal-bg/60 border border-terminal-border rounded-lg px-3 py-2 text-xs sm:text-sm text-terminal-accent hover:bg-terminal-accent/10 hover:border-terminal-accent transition-all duration-300"
                >
                  📋 List Contents
                </button>
                <button
                  onClick={() => executeCommand('pwd')}
                  className="bg-terminal-bg/60 border border-terminal-border rounded-lg px-3 py-2 text-xs sm:text-sm text-terminal-accent hover:bg-terminal-accent/10 hover:border-terminal-accent transition-all duration-300"
                >
                  📍 Show Location
                </button>
                <button
                  onClick={() => executeCommand('help')}
                  className="bg-terminal-bg/60 border border-terminal-border rounded-lg px-3 py-2 text-xs sm:text-sm text-terminal-accent hover:bg-terminal-accent/10 hover:border-terminal-accent transition-all duration-300"
                >
                  ❓ Show Help
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-terminal-muted text-xs sm:text-sm px-2 animate-fade-in-up mt-8" style={{ animationDelay: '1.8s' }}>
            <p className="mb-1 sm:mb-2 animate-fade-in-up" style={{ animationDelay: '2s' }}>
              Built with React, TypeScript, and Terminal Magic ✨
            </p>
            <p className="text-xs sm:text-sm animate-fade-in-up" style={{ animationDelay: '2.2s' }}>
              © 2025 Mohammad Abbass - Aspiring Cybersecurity & AI/ML Professional, Full-Stack Developer
            </p>
          </div>
        </div>
        
        {/* Enhanced Android-compatible input field */}
        <input
          ref={inputRef}
          type="text"
          className="fixed opacity-0 pointer-events-auto"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: '1px',
            height: '1px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            zIndex: 9999,
            fontSize: '16px', // Prevents zoom on iOS
            textTransform: 'none',
            color: 'transparent',
            caretColor: 'transparent',
            transform: 'translate(-50%, -50%)',
            overflow: 'hidden',
            // Enhanced Android compatibility
            touchAction: 'manipulation',
            userSelect: 'text',
            WebkitUserSelect: 'text',
            WebkitTapHighlightColor: 'transparent',
            WebkitAppearance: 'none',
            appearance: 'none'
          }}
          // Enhanced Android attributes
          autoFocus
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="done"
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
          // Android composition support
          lang="en"
          dir="ltr"
          
          // Controlled input value
          value={currentInput}
          
          // Enhanced change handlers for Android
          onChange={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const newValue = e.target.value;
            if (newValue !== currentInput) {
              handleInputChange(newValue);
            }
          }}
          
          onInput={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const target = e.target as HTMLInputElement;
            const newValue = target.value;
            
            // Force update for Android virtual keyboards
            if (newValue !== currentInput) {
              handleInputChange(newValue);
            }
          }}
          
          // Enhanced keyboard handling
          onKeyDown={(e) => {
            e.stopPropagation();
            
            if (e.key === 'Enter') {
              e.preventDefault();
              const input = currentInput.trim();
              if (input) {
                handleInputChange('');
                executeCommand(input);
              }
            } else if (e.key === 'Tab') {
              e.preventDefault();
              // Handle tab completion
            } else if (e.key === 'Backspace' && !currentInput) {
              e.preventDefault();
            }
          }}
          
          onKeyUp={(e) => {
            // Additional key handling for Android
            e.stopPropagation();
          }}
          
          // Enhanced focus handling
          onFocus={(e) => {
            const target = e.target as HTMLInputElement;
            target.style.opacity = '0';
            setIsInputFocused(true);
            
            // Ensure Android keyboards work
            setTimeout(() => {
              target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }, 100);
          }}
          
          onBlur={(e) => {
            const target = e.target as HTMLInputElement;
            target.style.opacity = '0';
            setIsInputFocused(false);
          }}
          
          // Enhanced touch handling for Android
          onTouchStart={(e) => {
            e.currentTarget.focus();
          }}
          
          onTouchEnd={(e) => {
            e.currentTarget.focus();
          }}
          
          // Critical Android composition event handling
          onCompositionStart={(e) => {
            // Android is starting text composition
            e.stopPropagation();
          }}
          
          onCompositionUpdate={(e) => {
            // Android is updating composition
            e.stopPropagation();
            const target = e.target as HTMLInputElement;
            const newValue = target.value;
            if (newValue !== currentInput) {
              handleInputChange(newValue);
            }
          }}
          
          onCompositionEnd={(e) => {
            // Android finished text composition
            e.stopPropagation();
            const target = e.target as HTMLInputElement;
            const newValue = target.value;
            if (newValue !== currentInput) {
              handleInputChange(newValue);
            }
          }}
          

        />
      </div>
    </div>
  );
};
