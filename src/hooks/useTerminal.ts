import { useState, useCallback, useRef, useEffect } from 'react';
import { TerminalState, FileSystemItem } from '../types/terminal';
import { filesystem } from '../data/filesystem';
import { commands } from '../utils/commands';

export const useTerminal = () => {
  const [state, setState] = useState<TerminalState>({
    currentPath: [],
    history: [],
    historyIndex: -1,
    isAuthenticated: false,
    currentInput: ''
  });

  const [output, setOutput] = useState<string[]>([
    '🚀 Welcome to <span class="mohammad-name">Mohammad</span> Abbass Terminal Portfolio',
    '═════════════════════════════════════════════',
    '',
    '💻 CS Student | 🛡️ Cybersecurity | 🤖 AI/ML Enthusiast',
    '',
    '🎯 Type "help" to see available commands',
    '🔍 Type "ls" to explore the filesystem',
    '🚩 Find the hidden secrets folder for a surprise!',
    '',
    '───────────────────────────────────────────────',
    ''
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getCurrentDirectory = useCallback((): FileSystemItem | null => {
    let current: any = filesystem;
    for (const path of state.currentPath) {
      if (current[path] && current[path].children) {
        current = current[path].children;
      } else {
        return null;
      }
    }
    return current;
  }, [state.currentPath]);

  const getPrompt = useCallback(() => {
    const path = state.currentPath.length === 0 ? '~' : `~/${state.currentPath.join('/')}`;
    return `root@abbass:${path}$`;
  }, [state.currentPath]);

  const addOutput = useCallback((text: string | string[], typing: boolean = false) => {
    const lines = Array.isArray(text) ? text : [text];
    
    if (typing) {
      setIsTyping(true);
      // Simulate typing effect
      let index = 0;
      const typeNextLine = () => {
        if (index < lines.length) {
          setOutput(prev => [...prev, lines[index]]);
          index++;
          setTimeout(typeNextLine, 100);
        } else {
          setIsTyping(false);
        }
      };
      typeNextLine();
    } else {
      setOutput(prev => [...prev, ...lines]);
    }
  }, []);

  const executeCommand = useCallback(async (input: string) => {
    if (!input.trim()) return;

    const [commandName, ...args] = input.trim().split(' ');
    const command = commands[commandName];

    // Add command to output
    addOutput(`${getPrompt()} ${input}`);

    // Add to history
    setState(prev => ({
      ...prev,
      history: [...prev.history, input],
      historyIndex: -1
    }));

    if (command) {
      try {
        const result = await command.execute(args, state, getCurrentDirectory, setState);
        if (result) {
          addOutput(result, commandName === 'matrix' || commandName === 'hack');
        }
      } catch (error) {
        addOutput(`Error: ${error}`, false);
      }
    } else {
      addOutput(`Command not found: ${commandName}. Type 'help' for available commands.`);
    }
  }, [state, getCurrentDirectory, getPrompt, addOutput]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isTyping) return;

    if (e.key === 'Enter') {
      const input = state.currentInput;
      setState(prev => ({ ...prev, currentInput: '' }));
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (state.history.length > 0) {
        const newIndex = state.historyIndex === -1 
          ? state.history.length - 1 
          : Math.max(0, state.historyIndex - 1);
        setState(prev => ({
          ...prev,
          historyIndex: newIndex,
          currentInput: prev.history[newIndex] || ''
        }));
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (state.historyIndex !== -1) {
        const newIndex = state.historyIndex + 1;
        if (newIndex >= state.history.length) {
          setState(prev => ({ ...prev, historyIndex: -1, currentInput: '' }));
        } else {
          setState(prev => ({
            ...prev,
            historyIndex: newIndex,
            currentInput: prev.history[newIndex]
          }));
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Auto-complete logic could go here
    } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
      // Handle Ctrl+C for copy
      e.preventDefault();
      if (state.currentInput) {
        navigator.clipboard.writeText(state.currentInput).then(() => {
          setNotification('📋 Copied to clipboard!');
          setTimeout(() => setNotification(null), 2000);
        }).catch(console.error);
      }
    } else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      // Handle Ctrl+V for paste
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        setState(prev => ({ ...prev, currentInput: prev.currentInput + text }));
        setNotification('📋 Pasted from clipboard!');
        setTimeout(() => setNotification(null), 2000);
      }).catch(console.error);
    } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      // Handle Ctrl+A for select all
      e.preventDefault();
      // In a real terminal, this would select all text in the current line
      // For now, we'll just select the current input
      if (inputRef.current) {
        inputRef.current.select();
      }
    } else if (e.key.length === 1) {
      setState(prev => ({ ...prev, currentInput: prev.currentInput + e.key }));
    } else if (e.key === 'Backspace') {
      setState(prev => ({ 
        ...prev, 
        currentInput: prev.currentInput.slice(0, -1) 
      }));
    }
  }, [state, isTyping, executeCommand, inputRef]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    // Add paste event listener
    const handlePaste = (e: ClipboardEvent) => {
      if (isTyping) return;
      
      const pastedText = e.clipboardData?.getData('text');
      if (pastedText) {
        setState(prev => ({ ...prev, currentInput: prev.currentInput + pastedText }));
        setNotification('📋 Pasted from clipboard!');
        setTimeout(() => setNotification(null), 2000);
      }
    };
    
    window.addEventListener('paste', handlePaste);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [handleKeyDown, isTyping]);

  useEffect(() => {
    // Focus on mount but prevent scrolling
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, []);

  const clear = useCallback(() => {
    setOutput([]);
  }, []);

  return {
    output,
    currentInput: state.currentInput,
    prompt: getPrompt(),
    isTyping,
    clear,
    executeCommand,
    inputRef,
    state,
    notification
  };
};
