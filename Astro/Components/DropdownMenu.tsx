import React, { useState, useRef, useEffect, ReactNode } from 'react';

export interface DropdownMenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface Separator {
  isSeparator: true;
}

export type MenuItem = DropdownMenuItem | Separator;

interface DropdownMenuProps {
  trigger: ReactNode;
  items: MenuItem[];
  position?: 'bottom' | 'top';
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, items, position = 'bottom' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(prev => !prev)}>
        {trigger}
      </div>
      {isOpen && (
        <div className={`absolute z-40 ${position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 w-56 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-2xl shadow-slate-500/10 dark:shadow-black/20 p-1.5 animate-in fade-in-5 zoom-in-95`}>
           <ul className="flex flex-col">
            {items.map((item, index) => {
              if ('isSeparator' in item) {
                return <li key={`sep-${index}`} className="h-px bg-slate-200 dark:bg-slate-700 my-1.5 mx-1.5" />;
              }
              const IconComponent = item.icon;
              return (
                <li key={index}>
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
      )}
    </div>
  );
};