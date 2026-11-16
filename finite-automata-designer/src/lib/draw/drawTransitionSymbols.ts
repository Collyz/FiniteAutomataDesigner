// The draw-only page has no alphabet: transition labels are free-form text, so
// they are never checked against a set of symbols or for determinism.

import { TransitionLabelInputValidator } from "@/lib/validation/TransitionLabelInputValidator";

// Always empty. The draw-only page doesn't define an alphabet, but the shared
// canvas code and the exporters still expect one.
export const alphabet: ReadonlySet<string> = new Set<string>();

/**
 * Transition label validator that accepts every keystroke, so any text can be
 * typed onto an Arrow or SelfArrow.
 */
export class FreeformTransitionLabelValidator extends TransitionLabelInputValidator {
  constructor() {
    super(new Set<string>());
  }

  public override handleChar(): boolean {
    return true;
  }

  public override handleBackspace(): boolean {
    return true;
  }
}

export const transitionLabelInputValidator = new FreeformTransitionLabelValidator();
