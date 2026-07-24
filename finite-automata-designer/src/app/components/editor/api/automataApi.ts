import { SerializedFA } from "@/lib/shared/types";

export const automataApi = {
    DFSM: {
        loadFAIntoCanvas: (data: SerializedFA) => window.loadDFSMIntoCanvas(data),
        exportFA: () => window.exportDFSM(),
        resetEditor: () => {
            if (typeof window.resetDFSMEditor === "function") {
                window.resetDFSMEditor();
            }
        },
    },
    NDFSM: {
        loadFAIntoCanvas: (data: SerializedFA) => window.loadNDFSMIntoCanvas(data),
        exportFA: () => window.exportNDFSM(),
        resetEditor: () => {
            if (typeof window.resetNDFSMEditor === "function") {
                window.resetNDFSMEditor();
            }
        },
    },
} as const;