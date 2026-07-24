export {};

declare global {
  interface Window {
    /** Loads a serialized automaton object into the DFSM canvas. */
    loadDFSMIntoCanvas: (automaton: SerializedFA) => void;

    /** Loads a serialized automaton object into the NDFSM canvas. */
    loadNDFSMIntoCanvas: (automaton: SerializedFA) => void;

    /** Serializes the current DFSM canvas state and returns it. */
    exportDFSM: () => SerializedFA;

    /** Serializes the current NDFSM canvas state and returns it. */
    exportNDFSM: () => SerializedFA;

    /** Resets the DFSM editor by erasing canvas and alphabet */
    resetDFSMEditor: () => void;

    /** Resets the NDFSM editor by erasing canvas and alphabet */
    resetNDFSMEditor: () => void;

    /** Gets the DFSM alphabet */
    getDFSMAlphabet: () => string[];

    /** Gets the NDFSM alphabet */
    getNDFSMAlphabet: () => string[];

  }
}
