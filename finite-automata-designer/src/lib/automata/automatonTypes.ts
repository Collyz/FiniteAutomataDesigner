// Editor types are what the UI/routes use; database types are what the
// finite_automata.type column stores. DFSM/NDFSM keep the legacy DFA/NFA
// database names so existing rows stay valid; draw-only drawings are "DRAW"
// in both.

export type EditorType = "DFSM" | "NDFSM" | "DRAW";

export type DbAutomatonType = "DFA" | "NFA" | "DRAW";

export const EDITOR_TO_DB_TYPE: Record<EditorType, DbAutomatonType> = {
    DFSM: "DFA",
    NDFSM: "NFA",
    DRAW: "DRAW",
};

export const DB_TO_EDITOR_TYPE: Record<DbAutomatonType, EditorType> = {
    DFA: "DFSM",
    NFA: "NDFSM",
    DRAW: "DRAW",
};

// Short name shown on project cards, filters, and the editor title
export const EDITOR_TYPE_LABEL: Record<EditorType, string> = {
    DFSM: "DFSM",
    NDFSM: "NDFSM",
    DRAW: "Drawing",
};

// Ex: /dfsm, /ndfsm, /draw
export function editorRoute(type: EditorType): string {
    return `/${type.toLowerCase()}`;
}
