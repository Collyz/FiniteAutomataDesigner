// The alphabet defines every character that can be used in the DFA.

import { TransitionLabelInputValidator } from "@/lib/validation/TransitionLabelInputValidator";

// For easier usage, it has been defined as a Set.
export let alphabet: Set<string> = new Set(["0","1"]);
export const epsilonSymbol: string = "\\epsilon"; // Symbol representing epsilon transitions
export let nfaTransitionSymbols: Set<string> = new Set([...alphabet, epsilonSymbol]); // Separator for multiple transition symbols

export let transitionLabelInputValidator: TransitionLabelInputValidator = new TransitionLabelInputValidator(nfaTransitionSymbols); // Input validator for transition labels
// Since the alphabet is being imported, it cannot be reassigned
// directly. So, this is a setter method for it.
export function setAlphabet(newAlphabet: Set<string>){
     // Input validator for transition labels
    nfaTransitionSymbols = new Set([...newAlphabet, epsilonSymbol]); // Update separator set with new alphabet and epsilon symbol
    alphabet = newAlphabet;
    transitionLabelInputValidator = new TransitionLabelInputValidator(nfaTransitionSymbols);
}