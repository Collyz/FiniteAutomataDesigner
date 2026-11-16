import { EditorSession } from "@/types/editorSession";
import { EditorType } from "@/lib/automata/automatonTypes";

export function getEditorSession(type: EditorType) {
    const key = `${type.toLowerCase()}-session`;

    const stored = sessionStorage.getItem(key);

    if (!stored) {
        return null;
    }

    return JSON.parse(stored) as EditorSession;
}


export function setEditorSession(
    type: EditorType,
    session: EditorSession
) {
    const key = `${type.toLowerCase()}-session`;

    sessionStorage.setItem(
        key,
        JSON.stringify(session)
    );
}


export function clearEditorSession(
    type: EditorType
) {
    const key = `${type.toLowerCase()}-session`;

    sessionStorage.removeItem(key);
}

// Clears the DFSM, NDFSM, and draw-only session entries. Call this on sign-out so the next person 
// to use this tab doesn't get dropped into the previous user's last-opened project.
export function clearAllEditorSessions() {
    (["DFSM", "NDFSM", "DRAW"] as const).forEach(clearEditorSession);
}