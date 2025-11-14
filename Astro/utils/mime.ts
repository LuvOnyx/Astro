export const getMimeType = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'html':
        return 'text/html';
      case 'css':
        return 'text/css';
      case 'js':
      case 'mjs':
        return 'application/javascript';
      case 'json':
        return 'application/json';
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'gif':
        return 'image/gif';
      case 'svg':
        return 'image/svg+xml';
      case 'ico':
        return 'image/x-icon';
      case 'webp':
        return 'image/webp';
      case 'ts':
      case 'tsx':
        // Browsers don't run TS directly, but for viewing it's text
        return 'text/plain';
      case 'md':
        return 'text/markdown';
      default:
        return 'text/plain';
    }
  };
