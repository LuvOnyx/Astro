import React from 'react';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
import vs from 'react-syntax-highlighter/dist/esm/styles/prism/vs';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import { useContextMenu, type MenuItem } from '../hooks/useContextMenu';
import { CopyIcon, CutIcon, PasteIcon } from './Icons';

// Register languages for syntax highlighting
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('javascript', jsx);
SyntaxHighlighter.registerLanguage('tsx', typescript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('html', markup);
SyntaxHighlighter.registerLanguage('markup', markup);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('markdown', markdown);

interface EditorProps {
  code: string;
  language: string;
  theme: 'light' | 'dark';
  onCodeChange: (newCode: string) => void;
}

// These styles must be consistent between the syntax highlighter and the textarea.
const editorTypographyStyles: React.CSSProperties = {
  fontFamily: `"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace`,
  fontSize: '14px',
  lineHeight: '1.5',
};

// This is used to calculate padding for the textarea
const lineNumbersWidth = '3.25em';
const basePadding = '1rem';

export const Editor: React.FC<EditorProps> = ({ code, language, theme, onCodeChange }) => {
  const style = theme === 'dark' ? vscDarkPlus : vs;
  const { showContextMenu } = useContextMenu();

  const handleContextMenu = (e: React.MouseEvent) => {
    // We rely on the textarea being the event target for execCommand to work correctly.
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() !== 'textarea') return;
      
    const items: MenuItem[] = [
      { label: 'Cut', icon: CutIcon, action: () => document.execCommand('cut') },
      { label: 'Copy', icon: CopyIcon, action: () => document.execCommand('copy') },
      { label: 'Paste', icon: PasteIcon, action: () => alert("Pasting via context menu is not yet supported. Please use Ctrl+V or Cmd+V."), disabled: true },
    ];
    showContextMenu(e, items);
  }

  return (
    // 1. This outer div is the single source of truth for scrolling.
    <div className="h-full w-full overflow-scroll bg-white dark:bg-transparent">
      {/* 2. This relative container grows with the content inside it, 
             creating a shared coordinate system for the layers. */}
      <div className="relative" onContextMenu={handleContextMenu}>
        {/* 3. The highlighter renders first, defining the size of the container. */}
        <SyntaxHighlighter
          language={language}
          style={style}
          customStyle={{
              margin: 0,
              padding: basePadding,
              backgroundColor: theme === 'dark' ? 'transparent' : undefined,
              ...editorTypographyStyles,
          }}
          codeTagProps={{
            style: editorTypographyStyles,
          }}
          showLineNumbers
          lineNumberStyle={{ 
            minWidth: lineNumbersWidth,
            ...editorTypographyStyles
          }}
        >
          {/* Adding a newline ensures the last line is fully highlighted and selectable */ }
          {code + '\n'}
        </SyntaxHighlighter>
        {/* 4. The textarea is layered on top, stretching to the full size of its
               relative parent, ensuring it covers all the code. */}
        <textarea
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className="absolute top-0 left-0 w-full h-full bg-transparent text-transparent caret-slate-800 dark:caret-slate-200 resize-none border-0 outline-none overflow-hidden"
          style={{
              ...editorTypographyStyles,
              padding: basePadding,
              paddingLeft: `calc(${basePadding} + ${lineNumbersWidth})`,
              tabSize: 4,
              MozTabSize: 4,
          }}
        />
      </div>
    </div>
  );
};
