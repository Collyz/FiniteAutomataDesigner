export type ParseResult =
    | { success: true; tokens: string[] }
    | { success: false; error: string };

export function parseInputString(
    input: string,
    alphabet: Set<string>
): ParseResult {
    // Split by commas or whitespace
    const trimmed = input.trim();

    if (trimmed.length === 0) {
        return { success: false, error: "Input string is empty." };
    }

    const hasComma = trimmed.includes(",");
    const hasWhitespace = /\s/.test(trimmed);

    if (hasComma && hasWhitespace) {
        return {
            success: false,
            error:
                "Input string contains both commas and whitespace as separators. Please use only one type of separator.",
        };
    }

    let tokens: string[] = [];

    if (hasComma) {
        tokens = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    }
    else if (hasWhitespace) {
        tokens = trimmed.split(/\s+/).filter(Boolean);
    }
    else {
        const allSingleChar = [...alphabet].every((sym) => sym.length === 1);
        if (allSingleChar) {
            return { 
                success: false,
                error: "Input string must separate symbols with commas or spaces." 
            };
        }
        tokens = trimmed.split("");
    }

    for (const token of tokens) {
        if (!alphabet.has(token)) {
            return {
                success: false,
                error: `Symbol '${token}' is not in the alphabet.`,
            };
        }
    }

    return { success: true, tokens };
}