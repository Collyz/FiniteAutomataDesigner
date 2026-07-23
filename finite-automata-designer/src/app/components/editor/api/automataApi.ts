import { SerializedFA } from "@/lib/shared/types";

export const automataApi = {
    DFSM: {
        loadFAIntoCanvas: (data: SerializedFA) => window.loadDFSMIntoCanvas(data),
        exportFA: () => window.exportDFSM(),
    },
    NDFSM: {
        loadFAIntoCanvas: (data: SerializedFA) => window.loadNDFSMIntoCanvas(data),
        exportFA: () => window.exportNDFSM(),
    },
} as const;