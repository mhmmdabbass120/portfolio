export interface FileSystemItem {
  name?: string;
  type: 'file' | 'directory' | 'executable';
  content?: string | string[];
  executable?: boolean;
  hidden?: boolean;
  children?: { [key: string]: FileSystemItem };
}

export interface TerminalState {
  currentPath: string[];
  history: string[];
  historyIndex: number;
  isAuthenticated: boolean;
  currentInput: string;
}

export interface Command {
  name: string;
  description: string;
  usage: string;
  execute: (args: string[], state: TerminalState) => Promise<string> | string;
}
