export {};

declare global {
  interface Window {
    /** Loads a serialized automaton object into the DFSM canvas. */
    loadDFSMIntoCanvas: (projectId: string | null, automaton: SerializedFA) => void;

    /** Loads a serialized automaton object into the NDFSM canvas. */
    loadNDFSMIntoCanvas: (projectId: string | null, automaton: SerializedFA) => void;

    /** Serializes the current DFSM canvas state and returns it. */
    exportDFSM: () => SerializedFA;

    /** Serializes the current NDFSM canvas state and returns it. */
    exportNDFSM: () => SerializedFA;


    getCurrentDFSMProjectId: () => (string | null);

    getCurrentNDFSMProjectId: () => (string | null);

  }
}
