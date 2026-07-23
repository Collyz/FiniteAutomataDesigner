/*
 Portions of this file are adapted from:

 Copyright (c) 2010 Evan Wallace
 Finite State Machine Designer (https://madebyevan.com/fsm/)
 Licensed under the MIT License

 Modifications:
 Copyright (c) 2025 Mohammed Mowla and Parth Patel
 Licensed under the MIT Licenses
*/

// Command to compile this file into JS
// npm run build:canvas

// All canvas behavior shared with the NDFSM designer lives in
// canvasUtil/fsmCanvas.ts. This file supplies the DFSM-specific pieces
// plus the database save/load hooks exposed on window.

import { circles } from "../Shapes/Circle";
import { arrows } from "../Shapes/Arrow";
import { startState, setStartState } from "../Shapes/EntryArrow";
import { dfsmAlgo, transitionDeterminismCheck } from "../../../src/lib/dfsm/dfsmAlgo";
import { alphabet, setAlphabet, transitionLabelInputValidator } from "../../../src/lib/dfsm/dfsmTransitionSymbols";
import { Importer } from "./importing/importer";
import { serializeFA } from "@/lib/shared/serializer/serializeFA";
import { deserializeFA } from "@/lib/shared/deserializer/deserializeFA";
import { SerializedFA } from "@/lib/shared/types";
import { initFsmCanvas, clearAutomaton } from "../canvasUtil/fsmCanvas";

// Holds the draw function of the currently mounted canvas so that a DFSM
// loaded from the database can trigger a repaint.
let drawRef: (() => void) | null = null;

// Automaton data that arrived before the canvas finished mounting.
let pendingDFSM: SerializedFA | null = null;

window.loadDFSMIntoCanvas = function(
  data: SerializedFA
){

  if(!drawRef){
    pendingDFSM = data;
    return;
  }

  loadSerializedDFSM(data);
}

window.exportDFSM = function(){
  return serializeFA(
    alphabet,
    circles,
    arrows,
    startState
  );
}

window.clearDFSMCanvas = function () {
    const canvas = document.getElementById(
        "DFSMCanvas"
    ) as HTMLCanvasElement | null;

    if (!canvas) {
        return;
    }

    clearAutomaton(canvas);
};

initFsmCanvas({
  automatonLabel: "DFSM",
  canvasId: "DFSMCanvas",
  runBtnId: "dfsmRunBtn",
  //alphabetUpdatedEventName: "dfsmAlphabetUpdated",
  runAlgo: dfsmAlgo,
  commitTransition: transitionDeterminismCheck,
  getAlphabet: () => alphabet,
  setAlphabet,
  dispatchAlphabetUpdated,
  getValidator: () => transitionLabelInputValidator,
  createImporter: (circs, arrs, data, draw) => new Importer(circs, arrs, data, draw),
  onCanvasReady: (draw) => {
    drawRef = draw;

    if(pendingDFSM){
      loadSerializedDFSM(pendingDFSM);
      pendingDFSM = null;
      draw();
    }
  },
});

function loadSerializedDFSM(data: SerializedFA){
  const canvas = document.getElementById("DFSMCanvas") as HTMLCanvasElement;

  clearAutomaton(canvas);

  const deserialized = deserializeFA(data);

  circles.push(...deserialized.circles);

  arrows.push(...deserialized.arrows);

  setAlphabet(deserialized.alphabet);

  setStartState(deserialized.entryArrow);

  const alphabetLabel = document.getElementById("alphabetLabel") as HTMLLabelElement | null;
  if(alphabetLabel){
    alphabetLabel.textContent = "Alphabet: {"+Array.from(alphabet).join(",")+"}";
    dispatchAlphabetUpdated();
  }

  if(drawRef){
    drawRef();
  }

}

// This event notifies the page that the alphabet has been updated.
// This lets the page know if it needs to check for multi-character
// elements in the alphabet, in which case it will show a disclaimer to
// the user on how to submit input strings properly.
function dispatchAlphabetUpdated() {
  window.dispatchEvent(new CustomEvent("dfsmAlphabetUpdated", {
      detail: {
        alphabet: Array.from(alphabet)
      }
    })
  );
}
