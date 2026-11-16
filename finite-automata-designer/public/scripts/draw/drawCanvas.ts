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
// npm run build:draw

// All canvas behavior shared with the DFSM and NDFSM designers lives in
// canvasUtil/fsmCanvas.ts. This file supplies the draw-only pieces: there is
// no alphabet, no determinism check, and nothing to run, so any FSM can be
// drawn purely as a diagram. It also exposes the database save/load hooks on
// window.

import { alphabet, transitionLabelInputValidator } from "@/lib/draw/drawTransitionSymbols";
import { Importer } from "./importing/importer";
import { initFsmCanvas, clearAutomaton } from "../canvasUtil/fsmCanvas";
import { circles } from "../Shapes/Circle";
import { arrows } from "../Shapes/Arrow";
import { startState, entryArrows } from "../Shapes/EntryArrow";
import { serializeEntryArrow } from "@/lib/shared/serializer/serializeEntryArrow";
import { deserializeEntryArrow } from "@/lib/shared/deserializer/deserializeEntryArrow";
import { serializeFA } from "@/lib/shared/serializer/serializeFA";
import { deserializeFA } from "@/lib/shared/deserializer/deserializeFA";
import { SerializedFA } from "@/lib/shared/types";

// Holds the draw function of the currently mounted canvas so that a drawing
// loaded from the database can trigger a repaint.
let drawRef: (() => void) | null = null;

// Drawing data that arrived before the canvas finished mounting.
let pendingDrawing: SerializedFA | null = null;

window.loadDRAWIntoCanvas = function(
  data: SerializedFA
){

  if(!drawRef){
    pendingDrawing = data;
    return;
  }

  loadSerializedDrawing(data);
}

window.exportDRAW = function(){
  // The serializer stores each arrow's transition set, which the DFSM/NDFSM
  // pages fill in when a label is committed. Labels here are free-form text, so
  // store each one whole as a single entry. The deserializer joins the entries
  // back with ",", so the label is restored exactly as typed.
  for (const arrow of arrows) {
    arrow.transition = arrow.text === "" ? new Set() : new Set([arrow.text]);
  }

  const serialized = serializeFA(
    new Set(alphabet),
    circles,
    arrows,
    startState
  );
  serialized.entryArrows = entryArrows.map(serializeEntryArrow);
  return serialized;
}

window.resetDRAWEditor = function () {
  const canvas = document.getElementById(
    "DRAWCanvas"
  ) as HTMLCanvasElement | null;

  if (!canvas) {
    return;
  }

  clearAutomaton(canvas, drawRef ?? undefined);
};

initFsmCanvas({
  automatonLabel: "FSM",
  canvasId: "DRAWCanvas",
  // Every transition label is accepted as typed
  commitTransition: () => true,
  normalizeTransitionLabels: false,
  // The draw-only page has no alphabet; these only satisfy the shared config
  getAlphabet: () => new Set(alphabet),
  setAlphabet: () => {},
  dispatchAlphabetUpdated: () => {},
  getValidator: () => transitionLabelInputValidator,
  createImporter: (circs, arrs, data, draw) => new Importer(circs, arrs, data, draw),
  onCanvasReady: (draw) => {
    drawRef = draw;

    if(pendingDrawing){
      loadSerializedDrawing(pendingDrawing);
      pendingDrawing = null;
      draw();
    }
  },
  disabled: false,
  // Unlimited entry arrows, overall and per state
  multipleEntryArrows: true, 
});

function loadSerializedDrawing(data: SerializedFA){
  const canvas = document.getElementById("DRAWCanvas") as HTMLCanvasElement;

  clearAutomaton(canvas);

  // The saved alphabet is ignored: the draw-only page doesn't have one
  const deserialized = deserializeFA(data);

  circles.push(...deserialized.circles);

  arrows.push(...deserialized.arrows);

  // Drawings saved before multiple entry arrows were supported only have the
  // single entryArrow field; load it into the list too so it isn't lost
  if (deserialized.entryArrow) {
    entryArrows.push(deserialized.entryArrow);
  }

  // Map each state's id to its state, so saved entry arrows can find their target
  const circleMap = new Map(deserialized.circles.map(circle => [circle.id, circle]));
  for (const savedEntryArrow of data.entryArrows ?? []) {
    const entryArrow = deserializeEntryArrow(savedEntryArrow, circleMap);
    if (entryArrow) {
      entryArrows.push(entryArrow);
    }
  }

  if(drawRef){
    drawRef();
  }
}
