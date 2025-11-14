import prettier from 'prettier';
import babel from 'prettier/plugins/babel';
import estree from 'prettier/plugins/estree';
import html from 'prettier/plugins/html';
import postcss from 'prettier/plugins/postcss';
import markdown from 'prettier/plugins/markdown';

const getParser = (path: string): string | null => {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
            return 'babel-ts'; // babel-ts handles all of these
        case 'json':
            return 'json';
        case 'css':
            return 'css';
        case 'html':
            return 'html';
        case 'md':
            return 'markdown';
        default:
            return null;
    }
}

export async function formatCode(path: string, content: string): Promise<string> {
    const parser = getParser(path);
    if (!parser) {
        return content; // Don't format unsupported file types
    }

    try {
        const formattedContent = await prettier.format(content, {
            parser,
            plugins: [babel, estree, html, postcss, markdown],
            // Prettier options
            printWidth: 80,
            tabWidth: 2,
            useTabs: false,
            semi: true,
            singleQuote: true,
            trailingComma: 'es5',
            bracketSpacing: true,
            jsxSingleQuote: false,
            arrowParens: 'always',
        });
        return formattedContent;
    } catch (error) {
        console.warn(`Could not format file "${path}". It may contain syntax errors.`, error);
        return content; // Return original content on formatting error
    }
}
