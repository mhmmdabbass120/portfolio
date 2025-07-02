import React, { useEffect, useRef, useState } from 'react';
import { useTerminal } from '../hooks/useTerminal';

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
  const { output, currentInput, cursorPosition, prompt, isTyping, clear, notification } = useTerminal();
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showBootSequence, setShowBootSequence] = useState(true);
  const [bootComplete, setBootComplete] = useState(false);
  const [lastOutputLength, setLastOutputLength] = useState(0);
  const [currentTheme, setCurrentTheme] = useState('');

  useEffect(() => {
    // Boot sequence animation
    const bootTimer = setTimeout(() => {
      setShowBootSequence(false);
      setTimeout(() => setBootComplete(true), 500);
    }, 6000);

    return () => clearTimeout(bootTimer);
  }, []);

  useEffect(() => {
    // Only auto-scroll when new output is actually added (not when typing)
    if (terminalRef.current && output.length > lastOutputLength) {
      const scrollElement = terminalRef.current;
      const isNearBottom = scrollElement.scrollHeight - scrollElement.clientHeight <= scrollElement.scrollTop + 100;
      
      if (isNearBottom) {
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }, 50);
      }
      setLastOutputLength(output.length);
    }
  }, [output.length, lastOutputLength]);

  useEffect(() => {
    // Keep input focused but don't interfere with scrolling
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only focus if clicking in terminal area, not on scrollbar
      if (inputRef.current && !isTyping && bootComplete && 
          terminalRef.current && terminalRef.current.contains(target)) {
        e.preventDefault();
        // Prevent any scrolling when focusing the input
        const currentScrollTop = terminalRef.current.scrollTop;
        inputRef.current.focus({ preventScroll: true });
        // Restore scroll position if it changed
        setTimeout(() => {
          if (terminalRef.current) {
            terminalRef.current.scrollTop = currentScrollTop;
          }
        }, 0);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isTyping, bootComplete]);

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
    // Download the PDF resume
    const link = document.createElement('a');
    link.href = '/Mohammad_Abbass_Resume.pdf';
    link.download = 'Mohammad_Abbass_Resume.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (showBootSequence) {
    return (
      <div className="min-h-screen bg-terminal-bg text-terminal-text p-4 flex items-center justify-center boot-container">
        <div className="text-center boot-content">
          <div className="ascii-art mb-8 text-terminal-accent glowing-ascii">
            <pre className="text-lg font-mono">
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
          </div>
          <div className="boot-sequence text-terminal-accent glowing-text">
            <div className="mb-2 boot-item" style={{ animationDelay: '0.5s' }}>🔐 INITIALIZING SECURE TERMINAL...</div>
            <div className="mb-2 boot-item" style={{ animationDelay: '1s' }}>🛡️ LOADING CYBERSECURITY PROTOCOLS...</div>
            <div className="mb-2 boot-item" style={{ animationDelay: '1.5s' }}>🚀 ESTABLISHING CONNECTION...</div>
            <div className="loading-bar mt-4 boot-item" style={{ animationDelay: '2s' }}>
              <div className="bg-terminal-border h-2 rounded">
                <div className="bg-terminal-accent h-2 rounded animate-pulse glowing-progress" style={{
                  width: '100%',
                  animation: 'loadingBar 3s ease-in-out'
                }}></div>
              </div>
            </div>
            <div className="mt-4 text-sm text-terminal-muted typing-welcome" style={{ animationDelay: '2.5s' }}>
              <TypeWriter text="Welcome to Mohammad Abbass Terminal" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-terminal-bg text-terminal-text relative overflow-hidden ${currentTheme}`}>
      {/* Matrix background animation */}
      <div className="matrix-rain"></div>
      <div className="matrix-rain-2"></div>
      <div className="matrix-rain-3"></div>
      
      <div className="max-w-6xl mx-auto relative z-10 p-4">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#00aa00', textShadow: '0 0 8px rgba(0, 170, 0, 0.4)' }}>
            Welcome to Mohammad Abbass Portfolio
          </h1>
          <div className="text-terminal-text max-w-3xl mx-auto">
            <p className="mb-4 text-lg">
              🚀 Interactive Terminal Portfolio Experience
            </p>
            <p className="mb-4">
              This is a fully functional terminal interface showcasing my skills, projects, and experience 
              in cybersecurity and software development. Navigate through my digital world using real terminal commands!
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6 text-sm">
              <div className="bg-terminal-bg/50 border border-terminal-border rounded-lg p-4">
                <span className="text-terminal-accent font-semibold">💻 How to Navigate:</span>
                <p className="mt-2">Type "help" to see all available commands</p>
              </div>
              <div className="bg-terminal-bg/50 border border-terminal-border rounded-lg p-4">
                <span className="text-terminal-accent font-semibold">🔍 Explore:</span>
                <p className="mt-2">Use "ls" and "cd" to browse directories</p>
              </div>
              <div className="bg-terminal-bg/50 border border-terminal-border rounded-lg p-4">
                <span className="text-terminal-accent font-semibold">🎯 Pro Tip:</span>
                <p className="mt-2">Try "sudo access secrets" for a surprise!</p>
              </div>
            </div>
          </div>
        </div>

        <div className="terminal-window">
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
            <div className="text-sm text-terminal-muted">
              root@abbass-portfolio ~ Mohammad Abbass Terminal v2.0
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
              <span className="ml-2 text-terminal-text typing-text relative">
                <span>{currentInput.substring(0, cursorPosition)}</span>
                <span className="ml-2">{currentInput.substring(cursorPosition)}</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Footer Section */}
        <div className="mt-8 text-center">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-terminal-bg/30 border border-terminal-border rounded-lg p-4">
              <h3 className="text-terminal-accent font-semibold mb-2">🎓 Education</h3>
              <p className="text-sm">CS @ LIU University</p>
              <p className="text-xs text-terminal-muted">GPA: 3.7/4.0</p>
            </div>
            <div className="bg-terminal-bg/30 border border-terminal-border rounded-lg p-4">
              <h3 className="text-terminal-accent font-semibold mb-2">🛡️ Expertise</h3>
              <p className="text-sm">Cybersecurity</p>
              <p className="text-xs text-terminal-muted">Ethical Hacking & AI</p>
            </div>
            <div className="bg-terminal-bg/30 border border-terminal-border rounded-lg p-4">
              <h3 className="text-terminal-accent font-semibold mb-2">🏆 Experience</h3>
              <p className="text-sm">CTF Learning</p>
              <p className="text-xs text-terminal-muted">Security Internship</p>
            </div>
            <div className="bg-terminal-bg/30 border border-terminal-border rounded-lg p-4">
              <h3 className="text-terminal-accent font-semibold mb-2">📧 Connect</h3>
              <p className="text-sm">Ready to collaborate?</p>
              <p className="text-xs text-terminal-muted">Type "cat contact.txt"</p>
            </div>
          </div>
          
          <div className="text-terminal-muted text-sm">
            <p className="mb-2">
              Built with React, TypeScript, and Terminal Magic ✨
            </p>
            <p>
              © 2025 Mohammad Abbass - Cybersecurity , AI/ML , & Full-Stack Developer
            </p>
          </div>
        </div>
        
        {/* Hidden input for capturing keystrokes */}
        <input
          ref={inputRef}
          className="opacity-0 absolute pointer-events-none"
          style={{
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            width: '1px',
            height: '1px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            zIndex: -1,
            textTransform: 'none'
          }}
          autoFocus
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          inputMode="text"
          enterKeyHint="done"
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
          value=""
          onChange={() => {}} // Handled by useTerminal hook
          onInput={(e) => {
            // Additional mobile handling
            const target = e.target as HTMLInputElement;
            if (target.value) {
              // Force clear the input to prevent accumulation
              target.value = '';
            }
          }}
          onFocus={(e) => {
            // Prevent any scroll behavior when input gets focus
            e.preventDefault();
            const target = e.target as HTMLInputElement;
            target.blur();
            target.focus({ preventScroll: true });
          }}
        />
      </div>
    </div>
  );
};
