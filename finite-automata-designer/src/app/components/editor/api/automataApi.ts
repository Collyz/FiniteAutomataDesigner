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
        getAlphabet: () => {
            if(typeof window.getDFSMAlphabet === "function"){
                return window.getDFSMAlphabet()
            }
            else{
                return [] as string[];
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
        getAlphabet: () => {
            if(typeof window.getNDFSMAlphabet === "function"){
                return window.getNDFSMAlphabet()
            }
            else{
                return [] as string[];
            }
        },
    },
} as const;