import katex from 'katex';
import 'katex/dist/katex.min.css';

export interface LatexMatch {
  type: 'inline' | 'block';
  start: number;
  end: number;
  content: string;
  latex: string;
}

/**
 * Находит все LaTeX формулы в тексте
 */
export function findLatexFormulas(text: string): LatexMatch[] {
  const matches: LatexMatch[] = [];
  
  // Inline формулы: $...$
  const inlineRegex = /\$([^$\n]+?)\$/g;
  let match;
  while ((match = inlineRegex.exec(text)) !== null) {
    matches.push({
      type: 'inline',
      start: match.index,
      end: match.index + match[0].length,
      content: match[0],
      latex: match[1]
    });
  }
  
  // Block формулы: $$...$$
  const blockRegex = /\$\$([\s\S]*?)\$\$/g;
  while ((match = blockRegex.exec(text)) !== null) {
    matches.push({
      type: 'block',
      start: match.index,
      end: match.index + match[0].length,
      content: match[0],
      latex: match[1]
    });
  }
  
  // Сортируем по позиции
  return matches.sort((a, b) => a.start - b.start);
}

/**
 * Рендерит LaTeX формулу в HTML
 */
export function renderLatex(latex: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      errorColor: '#cc0000'
    });
  } catch (error) {
    console.error('LaTeX rendering error:', error);
    return `<span style="color: #cc0000;">LaTeX Error: ${latex}</span>`;
  }
}

/**
 * Автоматически оборачивает LaTeX команды в $ делимитеры
 */
export function autoWrapLatex(text: string): string {
  // Паттерны LaTeX команд, которые должны быть в математическом режиме
  const latexPatterns = [
    /\\frac\{[^}]*\}\{[^}]*\}/g,  // \frac{a}{b}
    /\\sqrt(?:\[[^\]]*\])?\{[^}]*\}/g,  // \sqrt{x} or \sqrt[n]{x}
    /\\(?:sin|cos|tan|log|ln|exp|lim|sum|int|prod)\b/g,  // математические функции
    /\\(?:alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|phi|omega|Gamma|Delta|Theta|Lambda|Pi|Sigma|Phi|Omega)\b/g,  // греческие буквы
    /\\(?:pm|mp|times|div|cdot|approx|neq|leq|geq|infty)\b/g,  // операторы
  ];
  
  let result = text;
  
  // Обрабатываем каждый паттерн
  for (const pattern of latexPatterns) {
    const matches = [...result.matchAll(pattern)];
    
    // Обрабатываем совпадения в обратном порядке, чтобы не сбить индексы
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const matchText = match[0];
      const matchStart = match.index!;
      const matchEnd = matchStart + matchText.length;
      
      // Проверяем, не находится ли уже внутри $ $
      const beforeMatch = result.substring(0, matchStart);
      const afterMatch = result.substring(matchEnd);
      
      // Считаем количество $ до совпадения
      const dollarsBefore = (beforeMatch.match(/\$/g) || []).length;
      
      // Если нечетное количество $, то мы уже внутри формулы
      if (dollarsBefore % 2 === 1) {
        continue;
      }
      
      // Заменяем совпадение на обернутую версию
      result = result.substring(0, matchStart) + `$${matchText}$` + result.substring(matchEnd);
    }
  }
  
  return result;
}

/**
 * Преобразует markdown форматирование в HTML
 */
export function renderMarkdown(text: string): string {
  // Protect sequences of underscores (2 or more) from being interpreted as markdown
  // We replace them with a unique placeholder that won't be touched by markdown regex
  // Using a format without underscores to avoid the placeholder itself being processed
  const underscorePlaceholder = 'XUNDERSCOREX';
  let protectedText = text.replace(/_{2,}/g, (match) => {
    return underscorePlaceholder + match.length + underscorePlaceholder;
  });

  // Protect HTML tags from markdown processing
  // This preserves tags from RichTextEditor (like <ul>, <li>, <ol>, <p>, etc.)
  const htmlTagPlaceholder = 'XHTMLTAGX';
  const htmlTags: string[] = [];
  protectedText = protectedText.replace(/<[^>]+>/g, (match) => {
    const index = htmlTags.length;
    htmlTags.push(match);
    return `${htmlTagPlaceholder}${index}${htmlTagPlaceholder}`;
  });

  let processed = protectedText
    // Жирный текст: **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Курсив: _text_ -> <em>text</em>
    .replace(/\_(.*?)\_/g, '<em>$1</em>')
    // Альтернативный курсив: *text* -> <em>text</em> (только если не часть **text**)
    .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
    // Подчеркивание: __text__ -> <u>text</u>
    .replace(/\_\_([^_]+?)\_\_/g, '<u>$1</u>')
    // Зачеркивание: ~~text~~ -> <del>text</del>
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    // Код: `text` -> <code>text</code>
    .replace(/`([^`]+?)`/g, '<code>$1</code>');

  // Restore HTML tags
  processed = processed.replace(new RegExp(`${htmlTagPlaceholder}(\\d+)${htmlTagPlaceholder}`, 'g'), (_, index) => {
    return htmlTags[parseInt(index, 10)];
  });

  // Restore underscores
  processed = processed.replace(new RegExp(`${underscorePlaceholder}(\\d+)${underscorePlaceholder}`, 'g'), (_, length) => {
    return '_'.repeat(parseInt(length, 10));
  });

  return processed;
}

/**
 * Преобразует текст с LaTeX формулами в HTML
 */
export function renderTextWithLatex(text: string): string {
  // Сначала обрабатываем markdown форматирование
  const markdownText = renderMarkdown(text);
  
  // Затем автоматически оборачиваем LaTeX команды
  const wrappedText = autoWrapLatex(markdownText);
  
  const matches = findLatexFormulas(wrappedText);
  if (matches.length === 0) {
    return wrappedText;
  }
  
  let result = '';
  let lastIndex = 0;
  
  for (const match of matches) {
    // Добавляем текст до формулы
    result += wrappedText.slice(lastIndex, match.start);
    
    // Рендерим формулу
    const rendered = renderLatex(match.latex, match.type === 'block');
    result += rendered;
    
    lastIndex = match.end;
  }
  
  // Добавляем оставшийся текст
  result += wrappedText.slice(lastIndex);
  
  return result;
}

/**
 * Валидирует LaTeX синтаксис
 */
export function validateLatex(latex: string): { isValid: boolean; error?: string } {
  try {
    katex.renderToString(latex, { throwOnError: true });
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Вставляет LaTeX формулу в текст
 */
export function insertLatexFormula(
  text: string, 
  cursorPosition: number, 
  latex: string, 
  type: 'inline' | 'block' = 'inline'
): { newText: string; newCursorPosition: number } {
  const delimiter = type === 'inline' ? '$' : '$$';
  const formula = `${delimiter}${latex}${delimiter}`;
  
  const newText = text.slice(0, cursorPosition) + formula + text.slice(cursorPosition);
  const newCursorPosition = cursorPosition + formula.length;
  
  return { newText, newCursorPosition };
}

/**
 * Базовые математические символы для toolbar
 */
export const mathSymbols = {
  basic: [
    { symbol: '\\alpha', label: 'α' },
    { symbol: '\\beta', label: 'β' },
    { symbol: '\\gamma', label: 'γ' },
    { symbol: '\\delta', label: 'δ' },
    { symbol: '\\epsilon', label: 'ε' },
    { symbol: '\\theta', label: 'θ' },
    { symbol: '\\lambda', label: 'λ' },
    { symbol: '\\mu', label: 'μ' },
    { symbol: '\\pi', label: 'π' },
    { symbol: '\\sigma', label: 'σ' },
    { symbol: '\\phi', label: 'φ' },
    { symbol: '\\omega', label: 'ω' }
  ],
  operators: [
    { symbol: '\\pm', label: '±' },
    { symbol: '\\mp', label: '∓' },
    { symbol: '\\times', label: '×' },
    { symbol: '\\div', label: '÷' },
    { symbol: '\\cdot', label: '·' },
    { symbol: '\\sqrt{}', label: '√' },
    { symbol: '\\frac{}{}', label: '⁄' },
    { symbol: '\\sum', label: '∑' },
    { symbol: '\\int', label: '∫' },
    { symbol: '\\infty', label: '∞' },
    { symbol: '\\approx', label: '≈' },
    { symbol: '\\neq', label: '≠' },
    { symbol: '\\leq', label: '≤' },
    { symbol: '\\geq', label: '≥' }
  ],
  functions: [
    { symbol: '\\sin', label: 'sin' },
    { symbol: '\\cos', label: 'cos' },
    { symbol: '\\tan', label: 'tan' },
    { symbol: '\\log', label: 'log' },
    { symbol: '\\ln', label: 'ln' },
    { symbol: '\\exp', label: 'exp' }
  ]
};
