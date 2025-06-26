import { TerminalState, FileSystemItem } from '../types/terminal';

export interface Command {
  description: string;
  execute: (
    args: string[],
    state: TerminalState,
    getCurrentDirectory: () => FileSystemItem | null,
    setState: React.Dispatch<React.SetStateAction<TerminalState>>
  ) => Promise<string | string[] | null>;
}

export const commands: Record<string, Command> = {
  help: {
    description: 'Show available commands',
    execute: async () => {
      return [
        '🌟 Available commands:',
        '═══════════════════════════════════════════════════',
        '',
        '<span class="help-title">📁 Navigation:</span>',
        '  ls [dir]    - List directory contents',
        '  cd <dir>    - Change directory (use cd .. to go back)',
        '  pwd         - Show current directory path',
        '',
        '<span class="help-title">📄 File Operations:</span>',
        '  cat <file>  - Display file contents',
        '  find <name> - Search for files/directories',
        '',
        '<span class="help-title">🔧 System:</span>',
        '  whoami      - Display detailed profile',
        '  clear       - Clear terminal screen',
        '  history     - Show command history',
        '  neofetch    - System information display',
        '',
        '<span class="help-title">🎮 Fun & Interactive:</span>',
        '  matrix      - Enter the Matrix',
        '  hack        - Simulate hacking sequence',
        '  fortune     - Random cybersecurity quote',
        '  skills      - Quick access to skills directory',
        '  projects    - Quick access to projects directory',

        '',
        '<span class="help-title">🔐 Security:</span>',
        '  sudo <cmd>  - Execute command with elevated privileges',
        '',
        '<span class="help-title">💡 Pro Tips:</span>',
        '  • Use Tab for autocomplete (coming soon)',
        '  • Use ↑↓ arrows for command history',
        '  • Try typing "sudo access secrets" for a surprise!',
        '  • Navigate to different directories with cd and ls',
        '',
        '🎯 Easter Eggs: Try finding hidden directories and commands!',
        ''
      ];
    }
  },

  ls: {
    description: 'List directory contents',
    execute: async (args, state, getCurrentDirectory) => {
      let targetDir = getCurrentDirectory();
      let dirName = '';
      
      // If an argument is provided, try to navigate to that directory
      if (args.length > 0) {
        const targetName = args[0];
        dirName = targetName;
        
        if (!targetDir || !targetDir[targetName]) {
          return [
            `❌ ls: cannot access '${targetName}': No such file or directory`,
            '',
            '💡 Tip: Use "ls" to see available directories first',
            ''
          ];
        }
        
        if (targetDir[targetName].type !== 'directory') {
          return [
            `❌ ls: cannot access '${targetName}': Not a directory`,
            '',
            `🔍 Try: cat ${targetName}`,
            ''
          ];
        }
        
        targetDir = targetDir[targetName].children;
      }
      
      if (!targetDir) return ['❌ Error: Invalid directory', ''];

      const items = Object.entries(targetDir)
        .filter(([name, item]) => !item.hidden) // Hide hidden files unless specifically accessed
        .map(([name, item]) => {
          const type = item.type;
          const icon = type === 'directory' ? '📁' : type === 'executable' ? '⚡' : '📄';
          const colorClass = type === 'directory' ? 'folder' : type === 'executable' ? 'executable' : 'file';
          return `${icon} ${name}`;
        });

      const header = dirName ? 
        `📂 Contents of ${dirName}:` : 
        `📂 Current directory (${state.currentPath.length === 0 ? '~' : '~/' + state.currentPath.join('/')}) contents:`;
        
      if (items.length === 0) {
        return [header, '', '📭 Directory is empty', ''];
      }
      
      return [
        header,
        '═'.repeat(50),
        '',
        ...items,
        '',
        `📊 Total items: ${items.length}`,
        '💡 Use "cd <directory>" to navigate or "cat <file>" to view',
        ''
      ];
    }
  },

  cd: {
    description: 'Change directory',
    execute: async (args, state, getCurrentDirectory, setState) => {
      if (args.length === 0) {
        setState(prev => ({ ...prev, currentPath: [] }));
        return [
          '🏠 Changed to home directory (~)',
          '',
          '💡 Use "ls" to see what\'s available',
          ''
        ];
      }

      const target = args[0];
      
      if (target === '..') {
        if (state.currentPath.length > 0) {
          const newPath = state.currentPath.slice(0, -1);
          setState(prev => ({ 
            ...prev, 
            currentPath: newPath 
          }));
          const pathStr = newPath.length === 0 ? '~' : `~/${newPath.join('/')}`;
          return [
            `📁 Changed to parent directory: ${pathStr}`,
            '',
            '💡 Use "ls" to see current directory contents',
            ''
          ];
        }
        return [
          '🏠 Already at root directory (~)',
          '',
          '💡 Use "ls" to see available directories',
          ''
        ];
      }

      const currentDir = getCurrentDirectory();
      if (!currentDir || !currentDir[target]) {
        return [
          `❌ cd: ${target}: No such file or directory`,
          '',
          '🔍 Available directories:',
          ...Object.entries(currentDir || {})
            .filter(([, item]) => item.type === 'directory' && !item.hidden)
            .map(([name]) => `  📁 ${name}`),
          ''
        ];
      }

      if (currentDir[target].type !== 'directory') {
        return [
          `❌ cd: ${target}: Not a directory`,
          '',
          `💡 Try: cat ${target} (to view file contents)`,
          ''
        ];
      }

      setState(prev => ({ 
        ...prev, 
        currentPath: [...prev.currentPath, target] 
      }));
      
      const newPath = `~/${[...state.currentPath, target].join('/')}`;
      return [
        `✅ Changed directory to: ${newPath}`,
        '',
        '💡 Use "ls" to explore this directory',
        ''
      ];
    }
  },

  pwd: {
    description: 'Print working directory',
    execute: async (args, state) => {
      const path = state.currentPath.length === 0 ? '~' : `~/${state.currentPath.join('/')}`;
      return [
        `📍 Current directory: ${path}`,
        '',
        '🗂️ Directory structure:',
        `   ${state.currentPath.length === 0 ? 'Home (~)' : state.currentPath.map((p, i) => '  '.repeat(i + 1) + `└── ${p}`).join('\n   ')}`,
        ''
      ];
    }
  },

  cat: {
    description: 'Display file contents',
    execute: async (args, state, getCurrentDirectory) => {
      if (args.length === 0) {
        return ['cat: missing file operand', ''];
      }

      const filename = args[0];
      const currentDir = getCurrentDirectory();
      
      if (!currentDir || !currentDir[filename]) {
        return [`cat: ${filename}: No such file or directory`, ''];
      }

      const file = currentDir[filename];
      if (file.type === 'directory') {
        return [`cat: ${filename}: Is a directory`, ''];
      }

      // Handle both string and array content
      const content = file.content || 'File is empty';
      
      if (Array.isArray(content)) {
        return [...content, ''];
      } else {
        // Split string content into lines for proper terminal display
        const lines = content.split('\n');
        return [...lines, ''];
      }
    }
  },

  whoami: {
    description: 'Display detailed profile',
    execute: async () => {
      return [
        '👤 Mohammad Abbass - Full Profile',
        '═══════════════════════════════════════════════════════',
        '',
        '🎓 Education:',
        '   • Bachelor in Computer Science - LIU University',
        '   • GPA: 3.7/4.0 - Dean\'s List Honor Student',
        '   • Currently pursuing Master\'s in Cybersecurity',
        '',
        '🛡️ Specializations:',
        '   • Cybersecurity & Ethical Hacking',
        '   • Artificial Intelligence & Machine Learning',
        '   • Full-Stack Web Development',
        '   • Network Security & Cryptography',
        '',
        '💻 Technical Arsenal:',
        '   Languages: Java, C++, Python, Dart, JavaScript',
        '   Frameworks: React, Flutter, Node.js, Express',
        '   Security: Penetration Testing, CTF Competitions',
        '   AI/ML: Neural Networks, Deep Learning',
        '',
        '🏆 Achievements & Experience:',
        '   • Participated in Lebanon\'s biggest CTF competition',
        '   • Cybersecurity Internship at Expertbot',
        '   • Senior Project: Travelista (Full-stack travel platform)',
        '   • Mobile App: Skill Swapper (Flutter-based)',
        '',
        '🚀 What Drives Me:',
        '   I\'m passionate about protecting digital infrastructures',
        '   and leveraging AI to solve complex problems. As a',
        '   hardworking and dedicated developer, I thrive on',
        '   challenges that push the boundaries of technology.',
        '',
        '   My goal is to bridge the gap between cybersecurity',
        '   and artificial intelligence, creating safer and',
        '   smarter digital experiences for everyone.',
        '',
        '🎯 Current Focus:',
        '   • Advanced penetration testing techniques',
        '   • AI-powered security solutions',
        '   • Contributing to open-source security tools',
        '',
        '💡 Philosophy:',
        '   "Security isn\'t just about protection - it\'s about',
        '   enabling innovation with confidence."',
        '',
        '📧 Ready to collaborate? Type "cat contact.txt"',
        ''
      ];
    }
  },

  clear: {
    description: 'Clear terminal screen',
    execute: async () => {
      return null;
    }
  },

  history: {
    description: 'Show command history',
    execute: async (args, state) => {
      if (state.history.length === 0) {
        return ['No commands in history', ''];
      }
      
      return [...state.history.map((cmd, index) => `${index + 1}  ${cmd}`), ''];
    }
  },

  find: {
    description: 'Search for files and directories',
    execute: async (args, state, getCurrentDirectory) => {
      if (args.length === 0) {
        return ['find: missing search term', ''];
      }

      const searchTerm = args[0].toLowerCase();
      const results: string[] = [];
      
      const searchRecursive = (dir: FileSystemItem | null, path: string[]) => {
        if (!dir) return;
        
        Object.entries(dir).forEach(([name, item]) => {
          if (name.toLowerCase().includes(searchTerm)) {
            const fullPath = path.length === 0 ? name : `${path.join('/')}/${name}`;
            const icon = item.type === 'directory' ? '📁' : item.type === 'executable' ? '⚡' : '📄';
            results.push(`${icon} ${fullPath}`);
          }
          
          if (item.type === 'directory' && item.children) {
            searchRecursive(item.children, [...path, name]);
          }
        });
      };

      const filesystem = getCurrentDirectory();
      searchRecursive(filesystem, []);
      
      return results.length > 0 ? [...results, ''] : [`No files found matching "${searchTerm}"`, ''];
    }
  },

  neofetch: {
    description: 'Display system information',
    execute: async () => {
      return [
        '                   -`                    mohammad@portfolio',
        '                  .o+`                   ───────────────────',
        '                 `ooo/                   OS: Arch Linux',
        '                `+oooo:                  Host: Terminal Portfolio',
        '               `+oooooo:                 Kernel: Node.js v18.0.0',
        '               -+oooooo+:                Uptime: Always online',
        '             `/:-:++oooo+:               Shell: Custom Terminal',
        '            `/++++/+++++++:              Resolution: Responsive',
        '           `/++++++++++++++:             WM: React 18',
        '          `/+++ooooooooo+++:             Theme: Matrix Green',
        '         ./ooosssso++osssssso+`          Icons: Lucide React',
        '        .oossssso-````/ossssss+`         Terminal: Lovable',
        '       -osssssso.      :ssssssso.        CPU: JavaScript V8',
        '      :osssssss/        osssso+++.       GPU: CSS Animations',
        '     /ossssssss/        +ssssooo/-       Memory: Optimized',
        '   `/ossssso+/:-        -:/+osssso+-     Disk: Cloud Storage',
        '  `+sso+:-`                 `.-/+oso:    ',
        ' `++:.                           `-/+/',
        ' .`                                 `/',
        '',
        '🎯 Portfolio Stats:',
        '   Languages: 6+    Projects: 6+',
        '   Skills: Expert  Coffee: ∞',
        ''
      ];
    }
  },

  fortune: {
    description: 'Display random cybersecurity wisdom',
    execute: async () => {
      const fortunes = [
        '🔐 "The only truly secure system is one that is powered off, cast in a block of concrete and sealed in a lead-lined room." - Gene Spafford',
        '🛡️ "Security is a process, not a product." - Bruce Schneier',
        '⚡ "The weakest link in the security chain is the human element." - Kevin Mitnick',
        '🎯 "Hackers are breaking the systems for profit. Before, it was about intellectual curiosity and pursuit of knowledge and thrill." - Kevin Mitnick',
        '🔍 "The best defense against social engineering is to educate yourself of its existence." - Kevin Mitnick',
        '💻 "Privacy is not something that I\'m merely entitled to, it\'s an absolute prerequisite." - Marlon Brando',
        '🚀 "The goal is to turn data into information, and information into insight." - Carly Fiorina',
        '🧠 "Intelligence is the ability to adapt to change." - Stephen Hawking',
        '⚔️ "In cybersecurity, the more you know, the more you realize you don\'t know." - Anonymous',
        '🎪 "The Internet is the largest experiment in anarchy that we have ever had." - Eric Schmidt'
      ];
      
      const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      return [
        '🔮 Cybersecurity Fortune:',
        '═══════════════════════════════════════════════════',
        '',
        randomFortune,
        '',
        '💡 Stay curious, stay secure! 🛡️',
        ''
      ];
    }
  },

  skills: {
    description: 'Quick access to skills directory',
    execute: async (args, state, getCurrentDirectory, setState) => {
      // Navigate to skills directory
      setState(prev => ({ ...prev, currentPath: ['skills'] }));
      return [
        '🚀 Navigated to skills directory!',
        '',
        '📂 Available skill categories:',
        '  📄 technical-skills.txt   - Programming & frameworks',
        '  📄 soft-skills.txt        - Leadership & teamwork',
        '  📄 certifications.txt     - Achievements & certs',
        '',
        '💡 Use "cat <filename>" to view detailed skills',
        '💡 Use "cd .." to go back to home directory',
        ''
      ];
    }
  },

  projects: {
    description: 'Quick access to projects directory',
    execute: async (args, state, getCurrentDirectory, setState) => {
      setState(prev => ({ ...prev, currentPath: ['projects'] }));
      return [
        '📁 Navigated to projects directory',
        '',
        '🚀 Explore my featured projects:',
        '  • smart-phish - AI-powered phishing detection',
        '  • anomalox - Network anomaly detection system',
        '  • malware-detector - ML malware classification',
        '  • travelista - Travel planning platform',
        '  • skill-swapper - Flutter mobile app',
        '  • pizza-hut - E-commerce & loyalty platform',
        '',
        '💡 Use "ls" to see all projects or "cd <project>" to explore',
        ''
      ];
    }
  },



  matrix: {
    description: 'Enter the Matrix',
    execute: async () => {
      return [
        '🌿 Entering the Matrix...',
        '',
        '01001000 01100101 01101100 01101100 01101111',
        '01010111 01101111 01110010 01101100 01100100',
        '01001000 01100001 01100011 01101011 01100101 01110010',
        '',
        '🔴 You take the red pill - you stay in Wonderland,',
        '    and I show you how deep the rabbit hole goes...',
        '',
        '🔵 You take the blue pill - the story ends,',
        '    you wake up and believe whatever you want...',
        '',
        '⚡ Welcome to the real world, Neo.',
        '',
        'Reality.exe has stopped working.',
        'Simulation.dll loaded successfully.',
        '',
        '🎭 "There is no spoon." - The Matrix',
        ''
      ];
    }
  },

  hack: {
    description: 'Simulate hacking sequence',
    execute: async () => {
      return [
        '🔓 Initiating advanced penetration sequence...',
        '',
        '[████████████████████████████████] 100%',
        '',
        '📡 Connecting to target mainframe...',
        '🔐 Bypassing multi-layer firewall...',
        '🛡️ Exploiting buffer overflow vulnerability...',
        '💾 Accessing encrypted database...',
        '🔍 Performing SQL injection...',
        '🎯 Root access acquired...',
        '🗝️ Extracting sensitive data...',
        '',
        '✅ PENETRATION TEST SUCCESSFUL',
        '',
        '⚠️  ETHICAL HACKING SIMULATION COMPLETE ⚠️',
        '',
        'Just kidding! This is Mohammad\'s cybersecurity portfolio 😄',
        'But I do perform real penetration testing! 🛡️',
        '',
        '🏆 Want to see real skills? Check out my projects!',
        ''
      ];
    }
  },

  sudo: {
    description: 'Execute commands with elevated privileges',
    execute: async (args, state, getCurrentDirectory, setState) => {
      if (args.length === 0) {
        return ['sudo: no command specified', ''];
      }

      if (args[0] === 'access' && args[1] === 'secrets') {
        return [
          '🔐 Accessing classified information...',
          '',
          '⚠️  AUTHORIZED PERSONNEL ONLY ⚠️',
          '🛡️  SECURITY CLEARANCE: LEVEL 5',
          '',
          '🎯 CTF Flag: flag{hire_mohammad_abbass_now}',
          '🏆 Congratulations! You found the hidden flag!',
          '',
          '🚀 Elite Hacker Status: UNLOCKED',
          '💎 Secret Achievement: Portfolio Master',
          '',
          '📧 Impressed? Let\'s connect!',
          '   Email: mhmmdabbass@gmail.com',
          '   Phone: +961 76 764 263',
          '',
          '💼 Ready to hire a cybersecurity expert?',
          '    Type "cat resume.pdf" to download my CV!',
          ''
        ];
      }

      return [`sudo: ${args.join(' ')}: command not found`, ''];
    }
  }
};
