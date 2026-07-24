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

// All canvas behavior shared with the DFSM designer lives in
// canvasUtil/fsmCanvas.ts. This file only supplies the NDFSM-specific pieces.

import { commitTransition, ndfsmAlgo } from "../../../src/lib/ndfsm/ndfsmAlgo";
import { alphabet, setAlphabet, transitionLabelInputValidator } from "../../../src/lib/ndfsm/ndfsmTransitionSymbols";
import { Importer } from "./importing/importer";
import { clearAutomaton, initFsmCanvas } from "../canvasUtil/fsmCanvas";
import { SerializedFA } from "@/lib/shared/types";
import { serializeFA } from "@/lib/shared/serializer/serializeFA";
import { circles } from "../Shapes/Circle";
import { arrows } from "../Shapes/Arrow";
import { setStartState, startState } from "../Shapes/EntryArrow";
import { deserializeFA } from "@/lib/shared/deserializer/deserializeFA";

let drawRef: (() => void) | null = null;

let pendingNDFSM: SerializedFA | null = null;

window.loadNDFSMIntoCanvas = function(
  data: SerializedFA
){

  if(!drawRef){
    pendingNDFSM = data;
    return;
  }

  loadSerializedNDFSM(data);
}

window.exportNDFSM = function(){
  return serializeFA(
    alphabet,
    circles,
    arrows,
    startState,
  );
}

window.resetNDFSMEditor = function () {
    const canvas = document.getElementById(
        "NDFSMCanvas"
    ) as HTMLCanvasElement | null;

    if (!canvas) {
        return;
    }

    clearAutomaton(canvas, drawRef ?? undefined);

    setAlphabet(new Set(["0", "1"]));

    dispatchAlphabetUpdated();

    const alphabetLabel = document.getElementById(
        "alphabetLabel"
    ) as HTMLLabelElement | null;

    if (alphabetLabel) {
        alphabetLabel.textContent = "Alphabet: {0,1}";
    }

};

initFsmCanvas({
  automatonLabel: "NDFSM",
  canvasId: "NDFSMCanvas",
  runBtnId: "ndfsmRunBtn",
  runAlgo: ndfsmAlgo,
  commitTransition,
  getAlphabet: () => alphabet,
  setAlphabet,
  dispatchAlphabetUpdated,
  getValidator: () => transitionLabelInputValidator,
  createImporter: (circs, arrs, data, draw) => new Importer(circs, arrs, data, draw),
  onCanvasReady: (draw) => {
    drawRef = draw;

    if(pendingNDFSM){
      loadSerializedNDFSM(pendingNDFSM);
      pendingNDFSM = null;
      draw();
    }
  }
});

function loadSerializedNDFSM(data: SerializedFA){
  const canvas = document.getElementById("NDFSMCanvas") as HTMLCanvasElement;

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
  window.dispatchEvent(new CustomEvent("ndfsmAlphabetUpdated", {
      detail: {
        alphabet: Array.from(alphabet)
      }
    })
  );
}