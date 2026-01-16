import { transitionLabelInputValidator } from "../../../public/scripts/alphabet";

// A discriminated union type that represents either:
// 1. A successful parse with an array of tokens
// 2. A failed parse with an error message
export type ParseResult =
    | { success: true; tokens: string[] }
    | { success: false; error: string };

// Main function that converts a row input string into
// tokens according to the alphabet and delimiter rules.
export function parseInputString(
    input: string,
    alphabet: Set<string>
): ParseResult {

    // Remove leading and trailing whitespace from the input
    const trimmed = input.trim();

    if (trimmed.length === 0) {
        return { success: true, tokens: [] };
    }

    // Check for presence of commas
    const hasComma = trimmed.includes(",");

    // Check if the input contains ANY whitespace characters.
    // \s matches spaces, tabs, and newlines.
    const hasWhitespace = /\s/.test(trimmed);

    // If both commas and spaces are used, reject the input
    // to avoid ambiguous tokenization.
    if (hasComma && hasWhitespace) {
        return {
            success: false,
            error:
                "Input string contains both commas and whitespace as separators. Please use only one type of separator.",
        };
    }

    // This array will store the final list of tokens
    let tokens: string[] = [];

    // Case 1: Comma-separated input
    if (hasComma) {

        // Split the string at commas
        tokens = trimmed
            .split(",")
            // Remove
            .map((s) => s.trim())
            // Remove empty tokens (e.g., consecutive commas like ",,")
            .filter(Boolean);
    }
    // Case 2: Whitespace-separated input
    else if (hasWhitespace) {

        // Split the string at any whitespace character(s)
        tokens = trimmed
            .split(/\s+/)
            // Remove empty tokens (in case of multiple spaces)
            .filter(Boolean);
    }
    // Case 3: No separators, treat each character as a token
    else {
        
        // Check if all alphabet symbols are single characters
        const allSingleChar: boolean = [...alphabet].every((sym) => sym.length === 1);
        
        // If multiple-character symbols exist in the alphabet,
        // check to see if the input can form valid symbols.
        // This handles the edge case where the input only
        // contains one element, which also happens to be
        // a multi-character symbol.
        if (!allSingleChar) {
            transitionLabelInputValidator.reset();

            // Validate the entire input as a single token
            for(const char of trimmed){
                if(!transitionLabelInputValidator.handleChar(char)){
                    return {
                        success: false,
                        error: `The element '${trimmed}' is not in the alphabet. This input is invalid. Please check if you need to use spaces or commas between symbols in your input.`,
                    };
                }
            }
            tokens.push(trimmed);
            transitionLabelInputValidator.reset();
        }
        else{
            // Split the input into individual characters
            tokens = trimmed.split("");
        }

        
    }

    let notDefined: Array<string> = [];

    // Validate that each token is in the alphabet
    for (const token of tokens) {
        // If a token is not in the alphabet, return an error
        if (!alphabet.has(token)) {
            notDefined.push(token);
        }
    }


    if(notDefined.length == 1){
        return {
                success: false,
                error: `Symbol '${notDefined[0]}' is not in the alphabet. This input is invalid.`,
            };
    }
    else if(notDefined.length > 1){
        return {
                success: false,
                error: `Symbols '${notDefined.toString()}' are not in the alphabet. This input is invalid.`,
            };
    }
    else{
        // If everything is valid, return the list of tokens
        return { success: true, tokens };
    }
    
}