import React, { useState, useRef, useEffect } from 'react';
import type { FileTreeNode } from '../utils/fileTree';
import { ChevronRightIcon, TrashIcon, EditIcon } from './Icons';
import { getIconForNode } from '../utils/iconHelper';
import { useContextMenu, type MenuItem } from '../hooks/useContextMenu';

interface FileTreeProps {
  nodes: FileTreeNode[];
  activeFilePath: string | null;
  onSelectFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => boolean;
  unsavedFilePaths: Set<string>;
}

const FileTreeItem: React.FC<{ 
    node: FileTreeNode; 
    activeFilePath: string | null; 
    onSelectFile: (path: string) => void;
    onDeleteFile: (path: string) => void;
    onRenameFile: (oldPath: string, newPath: string) => boolean;
    unsavedFilePaths: Set<string>;
}> = ({ node, activeFilePath, onSelectFile, onDeleteFile, onRenameFile, unsavedFilePaths }) => {
  const isFolder = !!node.children;
  const [isOpen, setIsOpen] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showContextMenu } = useContextMenu();

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleToggle = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(node.path);
    }
  };

  const handleRename = () => {
    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== node.name) {
      const lastSlashIndex = node.path.lastIndexOf('/');
      const parentPath = lastSlashIndex === -1 ? '' : node.path.substring(0, lastSlashIndex);
      const newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;
      const success = onRenameFile(node.path, newPath);
      if (!success) {
        setName(node.name); // Revert if rename failed
      }
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setName(node.name);
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRename();
    else if (e.key === 'Escape') handleCancelRename();
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteFile(node.path);
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    const items: MenuItem[] = [
      { label: 'Rename', icon: EditIcon, action: () => setIsRenaming(true) },
      { isSeparator: true },
      { label: 'Delete', icon: TrashIcon, action: () => onDeleteFile(node.path) },
    ];
    showContextMenu(e, items);
  }

  const isSelected = !isFolder && activeFilePath === node.path;
  const isUnsaved = unsavedFilePaths.has(node.path);
  const Icon = getIconForNode(node);

  return (
    <li className="text-sm">
      <div
        onClick={!isRenaming ? handleToggle : undefined}
        onContextMenu={!isRenaming ? handleContextMenu : undefined}
        className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150 relative ${
            isSelected && !isRenaming
            ? 'bg-blue-600/10 dark:bg-slate-800 text-blue-700 dark:text-slate-100 font-medium'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
        } ${isRenaming ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
      >
        {isFolder && (
          <ChevronRightIcon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
        )}
        <Icon className={`w-4 h-4 flex-shrink-0 ${isFolder ? '' : 'ml-4'}`} />

        {isRenaming ? (
            <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleRename}
                className="flex-grow bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 outline-none border-none p-0"
            />
        ) : (
            <>
                <span className="truncate flex-1 pr-6">{node.name}</span>
                {isUnsaved && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-auto flex-shrink-0 mr-2" aria-label="Unsaved changes"></div>}
                 <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleDelete}
                        className="p-1 rounded text-slate-500 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400"
                        aria-label={`Delete ${isFolder ? 'folder' : 'file'}`}
                        title={`Delete ${isFolder ? 'folder' : 'file'}`}
                    >
                        <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </>
        )}
      </div>
      {isFolder && isOpen && node.children && (
        <ul className="pl-4">
          {node.children.map(child => (
            <FileTreeItem key={child.path} node={child} activeFilePath={activeFilePath} onSelectFile={onSelectFile} onDeleteFile={onDeleteFile} onRenameFile={onRenameFile} unsavedFilePaths={unsavedFilePaths} />
          ))}
        </ul>
      )}
    </li>
  );
};


export const FileTree: React.FC<FileTreeProps> = ({ nodes, activeFilePath, onSelectFile, onDeleteFile, onRenameFile, unsavedFilePaths }) => {
  return (
    <ul className="flex flex-col gap-1 p-2">
      {nodes.map(node => (
        <FileTreeItem key={node.path} node={node} activeFilePath={activeFilePath} onSelectFile={onSelectFile} onDeleteFile={onDeleteFile} onRenameFile={onRenameFile} unsavedFilePaths={unsavedFilePaths} />
      ))}
    </ul>
  );
};
