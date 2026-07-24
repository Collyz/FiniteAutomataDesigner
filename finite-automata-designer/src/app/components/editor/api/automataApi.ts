import { SerializedFA } from "@/lib/shared/types";

export const automataApi = {
    DFSM: {
        loadFAIntoCanvas: (data: SerializedFA) => window.loadDFSMIntoCanvas(data),
        exportFA: () => window.exportDFSM(),
        clearCanvas: () => {
            if (typeof window.clearDFSMCanvas === "function") {
                window.clearDFSMCanvas();
            }
        },
    },
    NDFSM: {
        loadFAIntoCanvas: (data: SerializedFA) => window.loadNDFSMIntoCanvas(data),
        exportFA: () => window.exportNDFSM(),
        clearCanvas: () => {
            if (typeof window.clearNDFSMCanvas === "function") {
                window.clearDFSMCanvas();
            }
        },
    },
} as const;