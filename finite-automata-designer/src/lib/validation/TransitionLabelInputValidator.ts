import { Trie } from "../data-structures";
/**
 * TransitionLabelInputValidator
 *
 * This component performs incremental, prefix-based validation of transition
 * labels as the user types. It intentionally does NOT tokenize input or emit
 * symbols. Instead, it enforces that every keystroke keeps the current input
 * as a valid prefix of some symbol in the user-defined alphabet.
 *
 * Design rationale:
 * - Input is committed by UI interaction (arrow deselection), not by syntax.
 * - Invalid symbols are prevented at the point of entry, eliminating the need
 *   for post-hoc validation or token streams.
 * - Multi-character symbols, overlapping prefixes, and escape sequences are
 *   naturally supported via a Trie.
 *
 * This design mirrors editor-style validation rather than compiler-style
 * lexing, which better fits an interactive automata editor.
 *
 * Responsibilities:
 * - Maintain a buffer for the *current symbol* being typed
 * - Validate keystrokes using a Trie (prefix-based)
 * - Allow commas as separators
 * - Support backspace
 *
 * Non-responsibilities:
 * - Token emission
 * - Commit logic
 * - Escape replacement (handled elsewhere)
 */
export class TransitionLabelInputValidator {
  private trie: Trie;
  private buffer: string = "";

  constructor(alphabet: Set<string>) {
    this.trie = new Trie();

    for (const symbol of alphabet) {
      this.trie.insert(symbol);
    }
  }

  /**
   * Returns true if the character is allowed to be typed.
   * If allowed, internal state is updated.
   */
  public handleChar(char: string): boolean {
    console.log("Handling char:", char);
    // Always allow commas — they separate symbols
    if (char === ",") {
      this.resetBuffer();
      console.log("Comma typed, buffer reset");
      return true;
    }

    const nextBuffer = this.buffer + char;
    console.log("New buffer to check:", nextBuffer);

    // Check prefix validity
    if (this.trie.isPrefix(nextBuffer)) {
      this.buffer = nextBuffer;
      console.log("Valid prefix, buffer updated:", this.buffer);
      return true;
    }

    // Invalid prefix → reject keystroke
    console.log("Invalid prefix, keystroke rejected");
    return false;
  }

  /**
   * Handles backspace.
   * Returns true if backspace should be allowed.
   */
  public handleBackspace(currentText: string): boolean {
    if (currentText.length === 0) {
      this.resetBuffer();
      return true;
    }

    const lastChar = currentText[currentText.length - 1];

    // If we backspaced over a comma, rebuild buffer
    if (lastChar === ",") {
      this.rebuildBufferFromText(currentText.slice(0, -1));
      return true;
    }

    // Normal character backspace
    this.buffer = this.buffer.slice(0, -1);
    return true;
  }

  /**
   * Clears the internal buffer.
   * Call this when:
   * - Arrow is deselected
   * - Arrow selection changes
   */
  public resetBuffer(): void {
    this.buffer = "";
  }

  public getBuffer(): string {
    return this.buffer;
  }

  public setBuffer(newBuffer: string): void {
    this.rebuildBufferFromText(newBuffer);
  }

  public getTrie(): Trie {
    return this.trie;
  }

  /**
   * Rebuilds buffer based on the text after backspacing a comma.
   * We only care about the *current symbol* (after last comma).
   */
  private rebuildBufferFromText(text: string): void {
    const parts = text.split(",");
    this.buffer = parts.length > 0
      ? parts[parts.length - 1]
      : "";
  }

}
