export const stripHTML = (str: string): string => {
    let cleaned = str;

    // Replace HTML entities first
    cleaned = cleaned
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // Remove ALL HTML tags (including broken/partial tags)
    cleaned = cleaned
        .replace(/<[^>]*>/g, '')     // Normal tags
        .replace(/<[^>]*$/g, '')     // Unclosed tags at end
        .replace(/^[^<]*>/g, '')     // Orphaned closing tags at start
        .replace(/>[^<]*</g, '><');  // Text between tags

    // Clean up any remaining angle brackets
    cleaned = cleaned.replace(/[<>]/g, '');

    return cleaned.trim();
};

export interface ParsedGap {
    options: string[];
    correctOption: string;
}

export const parseGap = (gapContent: string, separator: string = ','): ParsedGap => {
    const rawOptions = gapContent
        .split(separator)
        .map(s => s.trim())
        .filter(Boolean);

    // Find which option has the asterisk (*) - it's the correct one
    let correctIndex = 0;
    rawOptions.forEach((opt, idx) => {
        if (opt.includes('*')) {
            correctIndex = idx;
        }
    });

    // Clean options: remove asterisks first, then HTML tags
    const cleanedOptions = rawOptions.map(opt => stripHTML(opt.replace(/\*/g, '')));

    // Filter out empty options
    const options = cleanedOptions.filter(opt => opt && opt.trim());

    // Find the correct option - it must be in the filtered options list
    // We use the cleaned version of the option at correctIndex
    let correctOption = cleanedOptions[correctIndex];

    // If the correct option was filtered out (empty), or doesn't exist in options,
    // default to the first option
    if (!correctOption || !correctOption.trim() || !options.includes(correctOption)) {
        correctOption = options[0] || '';
    }

    return { options, correctOption };
};
