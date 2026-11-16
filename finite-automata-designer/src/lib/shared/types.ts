import type { DbAutomatonType } from "@/lib/automata/automatonTypes";

export type SerializedCircle = {
    id: string;
    x: number;
    y: number;
    isAccept: boolean;
    text: string;
}

export type SerializedArrow = {
    id: string;
    from: string;
    to: string;
    transition: string[];

    // Attributes for Arrow
    parallelPart?: number;
    perpendicularPart?: number;
    lineAngleAdjust?: number;

    // Attributes for SelfArrow
    anchorAngle?: number;

}

export type SerializedEntryArrow = {
    startState?: string;
    deltaX?: number;
    deltaY?: number;
    startPoint?: {x: number, y: number};
}

export type SerializedFA = {
    alphabet: string[];
    circles: SerializedCircle[];
    arrows: SerializedArrow[];
    entryArrow: SerializedEntryArrow;
    entryArrows?: SerializedEntryArrow[];
}

export interface CreateAutomaton {
    user_id: string;
    name?: string | null;
    description?: string | null;
    // Stored values in the database keep the legacy DFA/NFA names so existing
    // rows stay valid; the UI maps them to DFSM/NDFSM at the display boundary.
    // Drawings from the draw-only page are stored as "DRAW".
    type: DbAutomatonType;
    automaton: SerializedFA;
}

export interface FiniteAutomaton extends CreateAutomaton {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}