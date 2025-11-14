import React, { useEffect, useRef } from 'react';
import { useContextMenu } from '../hooks/useContextMenu';

export const ContextMenu: React.FC = () => {
  const { contextMenuState, hideContextMenu } = useContextMenu();
  const { isVisible, position, items } = contextMenuState;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hideContextMenu();
      }
    };
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideContextMenu();
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('blur', hideContextMenu);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('blur', hideContextMenu);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, hideContextMenu]);

  useEffect(() => {
    if (isVisible && menuRef.current) {
      const { innerWidth, innerHeight } = window;
      const { offsetWidth, offsetHeight } = menuRef.current;
      
      let x = position.x;
      let y = position.y;

      if (x + offsetWidth > innerWidth) {
        x = innerWidth - offsetWidth - 5;
      }
      if (y + offsetHeight > innerHeight) {
        y = innerHeight - offsetHeight - 5;
      }
      if (menuRef.current) {
        menuRef.current.style.top = `${y}px`;
        menuRef.current.style.left = `${x}px`;
      }
    }
  }, [isVisible, position, items]);
  
  if (!isVisible) {
    return null;
  }

  const handleItemClick = (action: () => void) => {
    action();
    hideContextMenu();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-56 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-2xl shadow-slate-500/10 dark:shadow-black/20 p-1.5 animate-in fade-in-5 zoom-in-95"
    >
      <ul className="flex flex-col">
        {items.map((item, index) => {
          if ('isSeparator' in item) {
            return <li key={`sep-${index}`} className="h-px bg-slate-200 dark:bg-slate-700 my-1.5 mx-1.5" />;
          }
          const IconComponent = item.icon;
          return (
            <li key={item.label}>
              <button
                onClick={() => handleItemClick(item.action)}
                disabled={item.disabled}
                className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                {IconComponent && <IconComponent className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                <span className="flex-1">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
