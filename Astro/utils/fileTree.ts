import type { AppFile } from '../types';

export interface FileTreeNode {
  name: string;
  path: string;
  content?: string;
  children?: FileTreeNode[];
}

export function buildFileTree(files: AppFile[]): FileTreeNode[] {
  const root: FileTreeNode = { name: 'root', path: '', children: [] };

  files.forEach(file => {
    const parts = file.path.split('/');
    let currentNode = root;

    parts.forEach((part, index) => {
      if (!currentNode.children) {
        currentNode.children = [];
      }

      let childNode = currentNode.children.find(node => node.name === part);

      if (!childNode) {
        const isLastPart = index === parts.length - 1;
        const nodePath = parts.slice(0, index + 1).join('/');
        
        childNode = {
          name: part,
          path: nodePath,
        };

        if (isLastPart) {
          childNode.content = file.content;
        } else {
          childNode.children = [];
        }
        
        currentNode.children.push(childNode);
      }
      
      currentNode = childNode;
    });
  });

  // Sort children: folders first, then files, all alphabetically
  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      const aIsFolder = !!a.children;
      const bIsFolder = !!b.children;
      if (aIsFolder !== bIsFolder) {
        return aIsFolder ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(node => {
      if (node.children) {
        sortNodes(node.children);
      }
    });
  };

  if (root.children) {
    sortNodes(root.children);
  }

  return root.children || [];
}