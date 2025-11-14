
import type { AppFile } from '../types';

// Helper to get the directory for a given file type
const getDirectoryForType = (fileType: string): string => {
    switch (fileType) {
        case 'component': return 'src/components/';
        case 'page': return 'src/pages/';
        case 'hook': return 'src/hooks/';
        case 'util': return 'src/utils/';
        case 'style': return 'src/styles/';
        default: return 'src/';
    }
};

// Tool implementation for updating the file tree
export function executeUpdateFileTree(
    currentFiles: AppFile[],
    args: { operation: 'add_or_update' | 'delete', files: { path: string, content?: string, fileType?: string }[] }
): AppFile[] {
    let updatedFiles = [...currentFiles];
    const { operation, files: filesToProcess } = args;

    if (operation === 'add_or_update') {
        filesToProcess.forEach(file => {
            let finalPath = file.path;
            // If fileType is provided and path is just a filename, construct the full path
            if (file.fileType && !file.path.includes('/')) {
                finalPath = getDirectoryForType(file.fileType) + file.path;
            }

            const existingFileIndex = updatedFiles.findIndex(f => f.path === finalPath);
            if (existingFileIndex > -1) {
                // Update existing file
                updatedFiles[existingFileIndex] = { ...updatedFiles[existingFileIndex], content: file.content ?? '' };
            } else {
                // Add new file
                updatedFiles.push({ path: finalPath, content: file.content ?? '' });
            }
        });
    } else if (operation === 'delete') {
        const pathsToDelete = new Set(filesToProcess.map(f => f.path));
        updatedFiles = updatedFiles.filter(f => !pathsToDelete.has(f.path));
    }

    return updatedFiles;
}

// Tool implementation for installing packages
export function executeInstallPackage(
    currentFiles: AppFile[],
    args: { packages: string, dev?: boolean }
): AppFile[] {
    const packageJsonIndex = currentFiles.findIndex(f => f.path === 'package.json');
    if (packageJsonIndex === -1) {
        console.warn('install_package tool called but no package.json was found.');
        return currentFiles;
    }

    try {
        const packageJsonFile = currentFiles[packageJsonIndex];
        const packageJson = JSON.parse(packageJsonFile.content);
        const dependencyType = args.dev ? 'devDependencies' : 'dependencies';

        if (!packageJson[dependencyType]) {
            packageJson[dependencyType] = {};
        }
        
        const packages = args.packages.split(' ').filter(Boolean);
        packages.forEach(pkg => {
            const atIndex = pkg.lastIndexOf('@');
            if (atIndex > 0) { // Check > 0 to not match scoped packages like @google/genai
                const name = pkg.substring(0, atIndex);
                const version = pkg.substring(atIndex + 1);
                packageJson[dependencyType][name] = version;
            } else {
                packageJson[dependencyType][pkg] = 'latest'; // or a default version
            }
        });

        const updatedPackageJsonFile = {
            ...packageJsonFile,
            content: JSON.stringify(packageJson, null, 2)
        };

        const updatedFiles = [...currentFiles];
        updatedFiles[packageJsonIndex] = updatedPackageJsonFile;
        return updatedFiles;

    } catch (e) {
        console.error('Failed to parse package.json or install package:', e);
        return currentFiles; // Return original files on error
    }
}

// Tool implementation for executing a command
export async function executeCommand(
    command: string
): Promise<{ success: boolean, output: string }> {
    try {
        const response = await fetch('/api/commands/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command }),
        });
        const result = await response.json();

        if (!response.ok) {
            return { success: false, output: result.error || 'Unknown server error.' };
        }
        return { success: true, output: result.output };
    } catch (error) {
        console.error('Error executing command via API:', error);
        return { success: false, output: `Failed to connect to local server bridge: ${(error as Error).message}` };
    }
}
