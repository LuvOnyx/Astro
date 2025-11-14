import React from 'react';
import { DropdownMenu, type MenuItem } from './DropdownMenu';
import { PanelLeftOpenIcon } from './Icons';

interface TopMenuBarProps {
    onNewProject: () => void;
    onDownloadZip: () => void;
    onImportProject: () => void;
    onImportFromFigma: () => void;
    onImportFiles: () => void;
    onImportFolder: () => void;
    onSettings: () => void;
    toggleTheme: () => void;
    toggleProjectSidebar: () => void;
    isProjectSidebarOpen: boolean;
    toggleFileExplorer: () => void;
    toggleChatPanel: () => void;
    toggleNuiPanel: () => void;
    target: 'web' | 'fivem-nui';
    hasFiles: boolean;
}

const MenuButton: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <button className="px-3 py-1 text-sm text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition-colors">
        {children}
    </button>
);


export const TopMenuBar: React.FC<TopMenuBarProps> = ({ 
    onNewProject, 
    onDownloadZip, 
    onImportProject,
    onImportFromFigma,
    onImportFiles,
    onImportFolder,
    onSettings,
    toggleTheme, 
    toggleProjectSidebar,
    isProjectSidebarOpen,
    toggleFileExplorer, 
    toggleChatPanel, 
    toggleNuiPanel,
    target,
    hasFiles 
}) => {
    const fileMenuItems: MenuItem[] = [
        { label: 'New Project...', action: onNewProject },
        { isSeparator: true },
        { label: 'Import Project (.zip)...', action: onImportProject },
        { label: 'Import Folder...', action: onImportFolder },
        { label: 'Import Files...', action: onImportFiles },
        { label: 'Import from Figma...', action: onImportFromFigma },
        { isSeparator: true },
        { label: 'Download Project (.zip)', action: onDownloadZip, disabled: !hasFiles },
    ];

    const editMenuItems: MenuItem[] = [
        { label: 'Undo', action: () => alert('Undo clicked'), disabled: true },
        { label: 'Redo', action: () => alert('Redo clicked'), disabled: true },
        { isSeparator: true },
        { label: 'Cut', action: () => document.execCommand('cut') },
        { label: 'Copy', action: () => document.execCommand('copy') },
        { label: 'Paste', action: () => alert('Paste clicked'), disabled: true },
    ];
    
    const viewMenuItems: MenuItem[] = [
        { label: 'Toggle Theme', action: toggleTheme },
        { isSeparator: true },
        { label: isProjectSidebarOpen ? 'Hide Project Panel' : 'Show Project Panel', action: toggleProjectSidebar },
        { label: 'Toggle File Explorer', action: toggleFileExplorer, disabled: !hasFiles },
        { label: 'Toggle Chat Panel', action: toggleChatPanel },
        { label: 'Toggle NUI Controls', action: toggleNuiPanel, disabled: !hasFiles || target !== 'fivem-nui' },
    ];

    const helpMenuItems: MenuItem[] = [
        { label: 'Settings...', action: onSettings },
        { isSeparator: true },
        { label: 'About App Builder', action: () => alert('AI App Builder v1.0') },
    ];


    return (
        <nav className="h-8 flex-shrink-0 w-full bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800/80 flex items-center px-2 gap-1 z-30">
            <DropdownMenu trigger={<MenuButton>File</MenuButton>} items={fileMenuItems} />
            <DropdownMenu trigger={<MenuButton>Edit</MenuButton>} items={editMenuItems} />
            <DropdownMenu trigger={<MenuButton>View</MenuButton>} items={viewMenuItems} />
            <DropdownMenu trigger={<MenuButton>Help</MenuButton>} items={helpMenuItems} />
        </nav>
    );
};
