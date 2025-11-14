
import { FunctionDeclaration, Type } from '@google/genai';

export const installPackage: FunctionDeclaration = {
  name: 'install_package',
  description: 'Install npm packages by adding them to package.json. Use this to add new dependencies to the project.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      packages: {
        type: Type.STRING,
        description: 'A space-separated list of packages to install (e.g., "react-router-dom clsx tailwind-merge"). Version can be specified with @ (e.g., "react@^18.2.0").',
      },
      dev: {
        type: Type.BOOLEAN,
        description: 'Set to true if these are development dependencies.',
      },
    },
    required: ['packages'],
  },
};

export const updateFileTree: FunctionDeclaration = {
    name: 'update_file_tree',
    description: 'Add, update, or delete files in the project structure. The primary tool for file manipulation. Adheres to standard project structures (e.g., components in src/components).',
    parameters: {
        type: Type.OBJECT,
        properties: {
            operation: {
                type: Type.STRING,
                description: 'The operation to perform: "add_or_update" or "delete".',
                enum: ['add_or_update', 'delete']
            },
            files: {
                type: Type.ARRAY,
                description: 'An array of files to process. For "delete", only the path is required.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        path: {
                            type: Type.STRING,
                            description: 'The path of the file. Can be a full path like "src/components/Button.tsx" or just a filename like "Button.tsx" if fileType is specified.',
                        },
                        content: {
                            type: Type.STRING,
                            description: 'The full content of the file. Not required for "delete" operation.',
                        },
                        fileType: {
                           type: Type.STRING,
                           description: 'Optional. A hint for directory organization (e.g., "component", "page", "hook", "util", "style"). If provided with a filename, the tool will place it in the correct standard directory.',
                           enum: ['component', 'page', 'hook', 'util', 'style', 'other']
                        }
                    },
                    required: ['path'],
                }
            }
        },
        required: ['operation', 'files'],
    }
};

export const executeCommand: FunctionDeclaration = {
  name: 'execute_command',
  description: 'Execute a terminal/shell command on the user\'s local machine via the server bridge. This tool is powerful and should be used with caution. It can be used to run dev servers, install global dependencies, or interact with the file system outside the project scope.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      command: {
        type: Type.STRING,
        description: 'The command to execute (e.g., "npm run dev", "ls -la", "dir C:\\Users").',
      },
    },
    required: ['command'],
  },
};

export const toolDeclarations: FunctionDeclaration[] = [
    installPackage,
    updateFileTree,
    executeCommand,
];
