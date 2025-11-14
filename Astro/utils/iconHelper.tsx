import {
  FolderIcon,
  FileIcon,
  ReactIcon,
  TypeScriptIcon,
  JavaScriptIcon,
  HTMLIcon,
  CSSIcon,
  JSONIcon,
  MarkdownIcon,
} from '../Components/Icons';
import type { FileTreeNode } from './fileTree';

export const getIconForNode = (node: FileTreeNode) => {
  if (node.children) {
    return FolderIcon;
  }

  const extension = node.path.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jsx':
    case 'tsx':
      return ReactIcon;
    case 'ts':
      return TypeScriptIcon;
    case 'js':
      return JavaScriptIcon;
    case 'html':
      return HTMLIcon;
    case 'css':
      return CSSIcon;
    case 'json':
      return JSONIcon;
    case 'md':
      return MarkdownIcon;
    default:
      return FileIcon;
  }
};