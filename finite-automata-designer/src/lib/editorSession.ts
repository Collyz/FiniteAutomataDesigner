import { EditorSession } from "@/types/editorSession";

export function getEditorSession(type: "DFSM" | "NDFSM") {
    const key = `${type.toLowerCase()}-session`;

    const stored = sessionStorage.getItem(key);

    if (!stored) {
        return null;
    }

    return JSON.parse(stored) as EditorSession;
}


export function setEditorSession(
    type: "DFSM" | "NDFSM",
    session: EditorSession
) {
    const key = `${type.toLowerCase()}-session`;

    sessionStorage.setItem(
        key,
        JSON.stringify(session)
    );
}


export function clearEditorSession(
    type: "DFSM" | "NDFSM"
) {
    const key = `${type.toLowerCase()}-session`;

    sessionStorage.removeItem(key);
}