export const getLanguageFromPath = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'js':
        case 'jsx':
            return 'jsx';
        case 'ts':
        case 'tsx':
            return 'tsx';
        case 'css':
            return 'css';
        case 'html':
            return 'markup';
        case 'json':
            return 'json';
        case 'md':
            return 'markdown';
        case 'sh':
        case 'bash':
            return 'bash';
        case 'py':
            return 'python';
        case 'java':
            return 'java';
        case 'yml':
        case 'yaml':
            return 'yaml';
        default:
            return 'plaintext';
    }
};
