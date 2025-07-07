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

  const [cursorPosition, setCursorPosition] = useState(0);

  const [output, setOutput] = useState<string[]>([
    '🚀 Welcome to <span class="mohammad-name">Mohammad</span> Abbass Terminal Portfolio',
    '═════════════════════════════════════════════',
    '',
    '💻 CS Graduate | 🛡️ Cybersecurity Learner | 🤖 AI/ML Learner',
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
  const [hasUsedTab, setHasUsedTab] = useState(false);
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

  const handleTabCompletion = useCallback(() => {
    const input = state.currentInput.trim();
    const parts = input.split(' ');
    const commandName = parts[0];
    const args = parts.slice(1);
    
    // Mark that user has used Tab completion
    setHasUsedTab(true);
    
    if (parts.length === 1) {
      // Complete command names
      const availableCommands = Object.keys(commands);
      const matchingCommands = availableCommands.filter(cmd => 
        cmd.toLowerCase().startsWith(commandName.toLowerCase())
      );
      
      if (matchingCommands.length === 1) {
        // Complete the command
        setState(prev => ({ ...prev, currentInput: matchingCommands[0] + ' ' }));
        setCursorPosition(matchingCommands[0].length + 1);
      } else if (matchingCommands.length > 1) {
        // Show available options
        addOutput(`${getPrompt()} ${input}`);
        addOutput('Available commands:');
        addOutput(matchingCommands.map(cmd => `  ${cmd}`));
        addOutput('');
      }
    } else if (parts.length === 2 && (commandName === 'cd' || commandName === 'ls' || commandName === 'cat')) {
      // Complete file/directory names
      const currentDir = getCurrentDirectory();
      if (currentDir) {
        const query = args[0].toLowerCase();
        const matchingItems = Object.entries(currentDir)
          .filter(([name, item]) => !item.hidden && name.toLowerCase().startsWith(query))
          .map(([name]) => name);
        
        if (matchingItems.length === 1) {
          // Complete the file/directory name
          const completed = `${commandName} ${matchingItems[0]}`;
          setState(prev => ({ ...prev, currentInput: completed }));
          setCursorPosition(completed.length);
        } else if (matchingItems.length > 1) {
          // Show available options
          addOutput(`${getPrompt()} ${input}`);
          addOutput('Available options:');
          addOutput(matchingItems.map(item => {
            const itemData = currentDir[item];
            const icon = itemData.type === 'directory' ? '📁' : '📄';
            return `  ${icon} ${item}`;
          }));
          addOutput('');
        }
      }
    }
  }, [state.currentInput, getCurrentDirectory, getPrompt, addOutput]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isTyping) return;

    if (e.key === 'Enter') {
      const input = state.currentInput;
      setState(prev => ({ ...prev, currentInput: '' }));
      setCursorPosition(0);
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (state.history.length > 0) {
        const newIndex = state.historyIndex === -1 
          ? state.history.length - 1 
          : Math.max(0, state.historyIndex - 1);
        const newInput = state.history[newIndex] || '';
        setState(prev => ({
          ...prev,
          historyIndex: newIndex,
          currentInput: newInput
        }));
        setCursorPosition(newInput.length);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (state.historyIndex !== -1) {
        const newIndex = state.historyIndex + 1;
        if (newIndex >= state.history.length) {
          setState(prev => ({ ...prev, historyIndex: -1, currentInput: '' }));
          setCursorPosition(0);
        } else {
          const newInput = state.history[newIndex];
          setState(prev => ({
            ...prev,
            historyIndex: newIndex,
            currentInput: newInput
          }));
          setCursorPosition(newInput.length);
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setCursorPosition(prev => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setCursorPosition(prev => Math.min(state.currentInput.length, prev + 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setCursorPosition(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setCursorPosition(state.currentInput.length);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleTabCompletion();
    } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
      // Handle Ctrl+C for copy
      e.preventDefault();
      const selectedText = window.getSelection()?.toString();
      const textToCopy = selectedText || state.currentInput;
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          setNotification('📋 Copied to clipboard!');
          setTimeout(() => setNotification(null), 2000);
        }).catch(() => {
          setNotification('❌ Copy failed - clipboard not available');
          setTimeout(() => setNotification(null), 2000);
        });
      }
    } else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      // Handle Ctrl+V for paste
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        if (text) {
          const before = state.currentInput.substring(0, cursorPosition);
          const after = state.currentInput.substring(cursorPosition);
          const newInput = before + text + after;
          setState(prev => ({ ...prev, currentInput: newInput }));
          setCursorPosition(cursorPosition + text.length);
          setNotification('📋 Pasted from clipboard!');
          setTimeout(() => setNotification(null), 2000);
        }
      }).catch(() => {
        setNotification('❌ Paste failed - clipboard not available');
        setTimeout(() => setNotification(null), 2000);
      });
    } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      // Handle Ctrl+A for select all
      e.preventDefault();
      setCursorPosition(0);
      setTimeout(() => setCursorPosition(state.currentInput.length), 0);
    } else if (e.key === 'x' && (e.ctrlKey || e.metaKey)) {
      // Handle Ctrl+X for cut
      e.preventDefault();
      if (state.currentInput) {
        navigator.clipboard.writeText(state.currentInput).then(() => {
          setState(prev => ({ ...prev, currentInput: '' }));
          setCursorPosition(0);
          setNotification('✂️ Cut to clipboard!');
          setTimeout(() => setNotification(null), 2000);
        }).catch(() => {
          setNotification('❌ Cut failed - clipboard not available');
          setTimeout(() => setNotification(null), 2000);
        });
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      // Insert character at cursor position
      const before = state.currentInput.substring(0, cursorPosition);
      const after = state.currentInput.substring(cursorPosition);
      const newInput = before + e.key + after;
      setState(prev => ({ ...prev, currentInput: newInput }));
      setCursorPosition(cursorPosition + 1);
    } else if (e.key === 'Backspace') {
      if (cursorPosition > 0) {
        const before = state.currentInput.substring(0, cursorPosition - 1);
        const after = state.currentInput.substring(cursorPosition);
        setState(prev => ({ 
          ...prev, 
          currentInput: before + after
        }));
        setCursorPosition(cursorPosition - 1);
      }
    } else if (e.key === 'Delete') {
      if (cursorPosition < state.currentInput.length) {
        const before = state.currentInput.substring(0, cursorPosition);
        const after = state.currentInput.substring(cursorPosition + 1);
        setState(prev => ({ 
          ...prev, 
          currentInput: before + after
        }));
      }
    }
  }, [state, isTyping, executeCommand, cursorPosition, handleTabCompletion]);



  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    // Add paste event listener for additional paste support
    const handlePaste = (e: ClipboardEvent) => {
      if (isTyping) return;
      
      const pastedText = e.clipboardData?.getData('text');
      if (pastedText) {
        const before = state.currentInput.substring(0, cursorPosition);
        const after = state.currentInput.substring(cursorPosition);
        const newInput = before + pastedText + after;
        setState(prev => ({ ...prev, currentInput: newInput }));
        setCursorPosition(cursorPosition + pastedText.length);
        setNotification('📋 Pasted from clipboard!');
        setTimeout(() => setNotification(null), 2000);
      }
    };
    
    window.addEventListener('paste', handlePaste);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [handleKeyDown, isTyping, state.currentInput, cursorPosition]);

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
    cursorPosition,
    prompt: getPrompt(),
    isTyping,
    clear,
    executeCommand,
    inputRef,
    state,
    notification,
    hasUsedTab
  };
};
