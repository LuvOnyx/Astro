import React, { useState, useCallback, useContext, createContext, ReactNode } from 'react';

export interface ContextMenuItem {
  label: string;
  action: () => void;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  disabled?: boolean;
}

export interface Separator {
  isSeparator: true;
}

export type MenuItem = ContextMenuItem | Separator;

interface ContextMenuState {
  isVisible: boolean;
  position: { x: number; y: number };
  items: MenuItem[];
}

interface ContextMenuContextType {
  showContextMenu: (event: React.MouseEvent, items: MenuItem[]) => void;
  hideContextMenu: () => void;
  contextMenuState: ContextMenuState;
}

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

export const ContextMenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contextMenuState, setContextMenuState] = useState<ContextMenuState>({
    isVisible: false,
    position: { x: 0, y: 0 },
    items: [],
  });

  const showContextMenu = useCallback((event: React.MouseEvent, items: MenuItem[]) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenuState({
      isVisible: true,
      position: { x: event.clientX, y: event.clientY },
      items,
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    if (contextMenuState.isVisible) {
      setContextMenuState(prev => ({ ...prev, isVisible: false }));
    }
  }, [contextMenuState.isVisible]);

  return (
    <ContextMenuContext.Provider value={{ showContextMenu, hideContextMenu, contextMenuState }}>
        <div onContextMenuCapture={hideContextMenu} onClick={hideContextMenu} style={{height: '100%', width: '100%'}}>
            {children}
        </div>
    </ContextMenuContext.Provider>
  );
};

export const useContextMenu = (): ContextMenuContextType => {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  }
  return context;
};
