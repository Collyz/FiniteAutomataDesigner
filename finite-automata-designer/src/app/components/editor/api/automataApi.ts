import { SerializedFA } from "@/lib/shared/types";

export const automataApi = {
    DFSM: {
        loadFAIntoCanvas: (projectId: string | null, data: SerializedFA) => window.loadDFSMIntoCanvas(projectId, data),
        exportFA: () => window.exportDFSM(),
        getCurrentProjectId: () => window.getCurrentDFSMProjectId(),
    },
    NDFSM: {
        loadFAIntoCanvas: (projectId: string | null, data: SerializedFA) => window.loadNDFSMIntoCanvas(projectId, data),
        exportFA: () => window.exportNDFSM(),
        getCurrentProjectId: () => window.getCurrentNDFSMProjectId(),
    },
} as const;