export interface EditorSession {
    mode: "saved" | "new";
    projectId?: string;
}