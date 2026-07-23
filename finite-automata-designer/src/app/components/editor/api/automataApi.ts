import { SerializedFA } from "@/lib/shared/types";

export const automataApi = {
    DFSM: {
        loadFAIntoCanvas: (data: SerializedFA) => window.loadDFSMIntoCanvas(data),
        exportFA: () => window.exportDFSM(),
        clearCanvas: () => window.clearDFSMCanvas(),
    },
    NDFSM: {
        loadFAIntoCanvas: (data: SerializedFA) => window.loadNDFSMIntoCanvas(data),
        exportFA: () => window.exportNDFSM(),
        clearCanvas: () => window.clearNDFSMCanvas(),
    },
} as const;