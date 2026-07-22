/*
 Portions of this file are adapted from:

 Copyright (c) 2010 Evan Wallace
 Finite State Machine Designer (https://madebyevan.com/fsm/)
 Licensed under the MIT License

 Modifications:
 Copyright (c) 2025 Mohammed Mowla and Parth Patel
 Licensed under the MIT Licenses
*/

// Shared controller for the DFSM and NDFSM designer canvases.
// Everything common to both canvases lives here; the per-automaton entry
// points (dfsm/dfsmCanvas.ts and ndfsm/ndfsmCanvas.ts) supply the differences
// through an FsmCanvasConfig.

import { Circle, circles} from "../Shapes/Circle";
import { Arrow, arrows} from "../Shapes/Arrow";
import { SelfArrow} from "../Shapes/SelfArrow";
import { EntryArrow, startState, setStartState} from "../Shapes/EntryArrow";
import { TemporaryArrow} from "../Shapes/TemporaryArrow";
import { snapToPadding} from "../Shapes/draw";
import { saveAsSVG, saveAsLaTeX, toggle_visiblity } from "./canvasUtil";
import type { TransitionLabelInputValidator } from "@/lib/validation/TransitionLabelInputValidator";
import { showToast } from "@/lib/toast";

export interface FsmImporter {
  convert(): boolean;
}

export interface FsmCanvasConfig {
  // "DFSM" or "NDFSM" — used in export headers and user-facing messages
  automatonLabel: string;
  // id of the <canvas> element for this automaton's page
  canvasId: string;
  // id of the Run button for this automaton's page
  runBtnId: string;
  // Runs the automaton against an input string
  runAlgo: (input: string) => void;
  // Validates/commits a finished transition label. Returns false when rejected.
  commitTransition: (arrow: Arrow | SelfArrow | null) => boolean;
  // The alphabet and validator are reassignable module bindings, so they must
  // be read through getters rather than captured once.
  getAlphabet: () => Set<string>;
  setAlphabet: (alphabet: Set<string>) => void;
  dispatchAlphabetUpdated: () => void;
  getValidator: () => TransitionLabelInputValidator;
  // Builds the importer used to load an exported SVG/LaTeX document
  createImporter: (
    circles: Circle[],
    arrows: (Arrow | SelfArrow)[],
    data: string,
    draw: () => void
  ) => FsmImporter;
  // Called every time the canvas is (re)mounted, right after the first repaint
  onCanvasReady?: (draw: () => void) => void;
}

// Empties the automaton and wipes the canvas.
// Returns false when no 2d context is available.
export function clearAutomaton(canvas: HTMLCanvasElement | null): boolean {
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      arrows.length = 0;
      circles.length = 0;
      setStartState(null);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return true;
    }
  }
  return false;
}

// Returns true if no input or focusable element is active meaning the document body has focus.
function canvasHasFocus() {
  return (document.activeElement || document.body) == document.body;
}

// Check if the mouse click is inside the canvas
const isInsideCanvas = (event: MouseEvent, canvas: HTMLCanvasElement) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;

  return (
    x >= rect.left &&
    x <= rect.right &&
    y >= rect.top &&
    y <= rect.bottom
  );
}

export function initFsmCanvas(config: FsmCanvasConfig) {

  // The previously edited object, which is determined by the object that was last
  // under typing mode.
  // This variable is crucial to determine when the transition determinism check
  // needs to be ran, since exiting typing mode on an Arrow or SelfArrow will
  // indicate that the user has submitted their transition.
  let lastEditedArrow: Arrow | SelfArrow | null = null;

  let selectedObj: Circle | EntryArrow | Arrow | SelfArrow | null = null; // Currently selected object
  const hightlightSelected = 'blue'; // Blue highlight for objects for regular selection
  const base = 'black'; // Black highlight for objects to indicate that they are not being selected
  let dragging = false; // True dragging objects is enabled, false otherwise
  let startClick: {x: number, y: number} | null = null;
  let tempArrow: TemporaryArrow | Arrow | SelfArrow | EntryArrow | null = null; // A new arrow being created

  function setupCanvas(canvas: HTMLCanvasElement, signal: AbortSignal) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { draw: () => {} };

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Iterate through ALL circles and draw each one
      for (let circle = 0; circle < circles.length; circle++) {
        ctx.lineWidth= 1;
        ctx.fillStyle = ctx.strokeStyle = (circles[circle] == selectedObj) ? hightlightSelected : base;
        circles[circle].draw(ctx);
      }

      // Iterate through ALL Arrows and SelfArrows and draw each one
      for (let arrow = 0; arrow < arrows.length; arrow++) {
        ctx.lineWidth = 1;
        ctx.fillStyle = ctx.strokeStyle = (arrows[arrow] == selectedObj) ? hightlightSelected : base;
        arrows[arrow].draw(ctx);
      }

      // If there is an EntryArrow, then draw it
      if(startState){
        ctx.lineWidth = 1;
        ctx.fillStyle = ctx.strokeStyle = (startState == selectedObj) ? hightlightSelected : base;
        startState.draw(ctx);
      }

      // If there is a TemporaryArrow being created, then draw it
      if (tempArrow != null) {
        ctx.lineWidth = 1;
        ctx.fillStyle = ctx.strokeStyle = base;
        tempArrow.draw(ctx);
      }
    }

    /* Event Handlers */
    // If a mouse button is pressed down
    canvas.addEventListener('mousedown', (event: MouseEvent) => {
      event.preventDefault();

      const mouse = getMousePos(event);

      // Check if the mouse has clicked on an object.
      // If true, then selectedObj will be updated.
      const nextSelected = mouseCollision(mouse.x, mouse.y);
      selectedObj = nextSelected;
      dragging = false;
      startClick = mouse;

      finalizeEditedArrow(nextSelected);

      // Update the previously edited object here
      if(selectedObj instanceof Arrow ||
        selectedObj instanceof SelfArrow){
        lastEditedArrow = selectedObj;
        config.getValidator().setBuffer(selectedObj.text);
      }


      // Read the modifier straight off the mouse event: the browser stamps it on
      // every click, so it works even when focus is stuck on another element
      // (e.g. the import button right after importing an SVG/LaTeX file).
      if (selectedObj != null) {
        if (event.shiftKey && selectedObj instanceof Circle) {
          // Draw a SelfArrow to the selected circle
          tempArrow = new SelfArrow(selectedObj, mouse);
        } else {
          dragging = true;
          if (selectedObj instanceof Circle || selectedObj instanceof SelfArrow) {
            selectedObj.setMouseStart(mouse.x, mouse.y);
          }
        }
      } else if (event.shiftKey) {
        // Cosmetic arrow logic for interactive response
        tempArrow = new TemporaryArrow(mouse, mouse);
      }
      draw();
    });

    // If mouse is double-clicked
    canvas.addEventListener('dblclick', (event) => {
      const mouse = getMousePos(event);
      selectedObj = mouseCollision(mouse.x, mouse.y);

      // If the mouse double-clicks an empty space, then
      // create a new Circle.
      if (selectedObj == null) {
        selectedObj = new Circle(mouse.x, mouse.y);
        circles.push(selectedObj);
        draw();
      }
      // If the mouse double-clicks a Circle, then make that
      // Circle an accept state
      else if (selectedObj instanceof Circle) {
        selectedObj.isAccept = !selectedObj.isAccept;
        draw();
      }
    });

    // If mouse moves
    canvas.addEventListener('mousemove', (event) => {
      const mouse = getMousePos(event);

      // If a new TemporaryArrow has been created, the
      // canvas must draw where it is going
      if (tempArrow != null) {
        let targetCircle = mouseCollision(mouse.x, mouse.y);
        if (!(targetCircle instanceof Circle)) {
          targetCircle = null;
        }

        if (selectedObj == null && startClick != null) {
          if (targetCircle != null && targetCircle instanceof Circle) {
            tempArrow = new EntryArrow(targetCircle, startClick);
          } else {
            tempArrow = new TemporaryArrow(startClick, mouse);
          }
        } else {
          if (targetCircle == selectedObj && targetCircle instanceof Circle) {
            tempArrow = new SelfArrow(targetCircle, mouse);
          } else if (targetCircle != null && selectedObj instanceof Circle && targetCircle instanceof Circle) {
            tempArrow = new Arrow(selectedObj, targetCircle);
          } else if (selectedObj instanceof Circle) {
            tempArrow = new TemporaryArrow(selectedObj.closestPointOnCircle(mouse.x, mouse.y), mouse);
          }
        }
        draw();
      }

      if (dragging) {
        selectedObj?.setAnchorPoint(mouse.x, mouse.y);
        if (selectedObj instanceof Circle) {
          snapAlignCircle(selectedObj);
        }
        draw();
      }
    });

    // If the mouse was originally clicked and now
    // the user let go
    canvas.addEventListener('mouseup', () =>{
      dragging = false;

      if (tempArrow != null) {
        if(!(tempArrow instanceof TemporaryArrow)) {
          // When adding the tempArrow to the arrows array,
          // Check if a self arrow points to the selected circle already

          if (tempArrow instanceof SelfArrow) {
            // Check to see if the circle that you are trying to
            // create the SelfArrow on already has one
            if (!tempArrow.circle.loop) {
              // If the SelfArrow doesn't already exist for a state,
              // but it is being created, then add it for that state
              selectedObj = tempArrow;
              lastEditedArrow = selectedObj;
              arrows.push(tempArrow);

              // Set the pointer for the loop variable of the Circle
              // to the newly created SelfArrow
              tempArrow.circle.loop = tempArrow;

              // Add the arrow into the outArrows Set of its starting node
              tempArrow.circle.outArrows.add(tempArrow);
            }
          }
          else if (tempArrow instanceof EntryArrow) {
            // If the EntryArrow doesn't already exist, then
            // create one and set it as the new start state
            if (startState === null) {
              selectedObj = tempArrow;
              setStartState(tempArrow);
            }
          }
          // If the tempArrow isn't a SelfArrow or an EntryArrow
          // then it must be a regular arrow
          else {
            selectedObj = tempArrow;
            lastEditedArrow = selectedObj;
            arrows.push(tempArrow);

            // Add the arrow into the outArrows Set of its starting node
            tempArrow.startCircle.outArrows.add(tempArrow);
          }
        }
        tempArrow = null;
      }

      draw();
    });

    // This disables the default context menu on the canvas, since it was getting annoying
    // having to press Esc every time I right-clicked on an object when I wanted to type.
    canvas.addEventListener('contextmenu', event => event.preventDefault());

    // Whenever a key is pressed on the user's keyboard
    document.addEventListener('keydown', (event) => {
      // If the document body is not focused, don't detect key inputs
      if (!canvasHasFocus()) {
        return true;
      }

      // If we are currently selecting an object AND
      // if the currently selected object has a "text"
      // attribute, we will enter this if-statement
      if (selectedObj != null) {
        if('text' in selectedObj){

          // This is for backspacing one letter at a time
          if(event.key === 'Backspace') {
            // If the currently selected object is an Arrow or SelfArrow,
            // then the validator buffer must stay in sync with the text
            if (selectedObj instanceof Arrow || selectedObj instanceof SelfArrow) {
              if (config.getValidator().handleBackspace(selectedObj.text)) {
                selectedObj.text = selectedObj.text.slice(0, -1);
              }
            }
            else {
              selectedObj.text = selectedObj.text.slice(0, -1);
            }
            draw();
          }


          // We will only allow characters of length 1 to be typed on the arrows
          else if(event.key.length === 1){
            if((selectedObj instanceof Arrow || selectedObj instanceof SelfArrow)){

              // If the current object that is being typed on is an Arrow or SelfArrow,
              // then we will check if the character being typed is defined in the alphabet.
              // If not, we will alert the user.

              if (config.getValidator().handleChar(event.key)) {
                selectedObj.text += event.key;
              } else {
                showToast(`'${config.getValidator().getBuffer() + event.key}' is not defined in the alphabet!`, { color: "red", duration: 6000 });
              }
            }
            // Else, the selectedObj must be Circle, which we can type anything for
            // as long as the key we're pressing is of length 1 (so we can't press
            // enter or anything like that)
            else{
              selectedObj.text += event.key;
            }
          }
        }

        // If the "Delete" key is pressed on your keyboard
        if (event.key === 'Delete') {

          // Iterate through all circles that are present
          for (let circ = 0; circ < circles.length; circ++) {
            // If a circle is selected when "Delete" is pressed,
            // then delete that specific circle
            if (circles[circ] == selectedObj) {
              circles.splice(circ--, 1);
            }
          }

          // If the EntryArrow is the selected objected or if the circle that the
          // EntryArrow points to is the selected object, then delete the EntryArrow
          if(startState == selectedObj || startState?.pointsToCircle == selectedObj){
            setStartState(null);
          }

          // Iterate through all arrows that are present
          for (let i = 0; i < arrows.length; i++) {
            const arrow = arrows[i];

            // If an arrow is selected when "Delete" is pressed,
            // then delete that specific arrow
            if (arrow == selectedObj) {
              deleteArrow(arrow,i--);
            }

            // If an arrow is a SelfArrow (looped arrow)
            if (arrow instanceof SelfArrow) {

              // If the circle that the SelfArrow is looped
              // on is the object being currently selected, then
              // delete that SelfArrow as well since its associated
              // circle is being deleted
              if (arrow.circle == selectedObj){
                deleteArrow(arrow,i--);
              }
            }

            // If an arrow is a regular Arrow
            if (arrow instanceof Arrow) {

              // If either the startCircle or the endCircle of
              // this Arrow is the object being currently selected,
              // then delete the Arrow, since it will no longer
              // have two safe endpoints to be connected to
              if (arrow.startCircle == selectedObj || arrow.endCircle == selectedObj) {
                deleteArrow(arrow,i--);
              }
            }
          }

        }
        // After all the arrows and circles present have been
        // checked, we can draw the canvas again
        draw();
      }

    }, { signal });


    // If the arrow is being deleted, then update the
    // circles that it is associated with
    function deleteArrow(arrow: Arrow | SelfArrow | EntryArrow, index: number){
      if(arrow instanceof Arrow){
        arrow.startCircle.outArrows.delete(arrow);
      }
      else if(arrow instanceof SelfArrow){
        arrow.circle.outArrows.delete(arrow);
        arrow.circle.loop = null;
      }
      arrows.splice(index,1);
    }

    /* Helper Functions*/

    // Align the input circle to any circle in the array if x or y absolute is less than padding
    function snapAlignCircle(circle: Circle) {
      for(let circ = 0; circ < circles.length; circ++) {
        if(circles[circ] == circle) continue;

        if(Math.abs(circle.x - circles[circ].x) < snapToPadding) {
          circle.x = circles[circ].x;
        }

        if(Math.abs(circle.y - circles[circ].y) < snapToPadding) {
          circle.y = circles[circ].y;
        }
      }
    }

    // Get the current mouse position inside the canvas
    const getMousePos = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    // Get the collided object at the point x, y.
    // Basically checks to see if the cursor is touching an object.
    // If it is, then return that specific object.
    // This function is used to set the selectedObj variable in the
    // mousedown eventListener and dblclick eventListener.
    function mouseCollision(x: number, y: number) {

      // Iterate through all circles. If a circle is selected by
      // the mouse, return that specific circle.
      for(let circ = 0; circ < circles.length; circ++) {
        if(circles[circ].containsPoint(x, y)) {
          return circles[circ];
        }
      }

      // Iterate through all Arrows and SelfArrows. If one of them is selected by
      // the mouse, return that specific Arrow or SelfArrow.
      for(let arrow = 0; arrow < arrows.length; arrow++) {
        if (arrows[arrow].containsPoint(x, y)) {
          return arrows[arrow];
        }
      }

      // Check if the startState is being selected by the mouse.
      // If it is, then return it.
      if(startState && startState.containsPoint(x,y)){
        return startState;
      }

      return null;
    }

    // Expose draw to force redraw when clicking outside of the canvas to remove highlighting and dragging
    return { draw };
  }

  // Updates the alphabet label to reflect the current alphabet
  function updateAlphabetLabel(alphabetLabel: HTMLLabelElement | null) {
    if(alphabetLabel){
      alphabetLabel.textContent = "Alphabet: {"+Array.from(config.getAlphabet()).join(",")+"}";
    }
  }

  function importHelper(
    canvas: HTMLCanvasElement | null,
    drawImportBtn: HTMLButtonElement | null,
    alphabetLabel: HTMLLabelElement | null,
    inputContainer: HTMLDivElement | null,
    textArea: HTMLTextAreaElement | null,
    drawFunc: (() => void) | null
  ) {
    if (inputContainer && drawImportBtn) {
      if (inputContainer.hidden && drawImportBtn.hidden) {
        console.log("called the helper function inside the toggle textArea")
        toggle_visiblity(inputContainer);
        toggle_visiblity(drawImportBtn);
        return;
      }
      if (textArea) {
        const data = textArea.value.trim();
        if (data) {
          if (confirm("Everything on the canvas currently will be erased! Proceed with importing?")){
            if (canvas) {
              if (clearAutomaton(canvas)){
                const importer = config.createImporter(circles, arrows, textArea.value, drawFunc!);
                const valid = importer.convert();
                if(!valid){
                  showToast(`Import failed. Please check if you are importing a ${config.automatonLabel}.`, { color: "red", duration: 6000 });
                }
              } else {
                showToast(`Failure to import ${config.automatonLabel}`, { color: "red", duration: 6000 });
              }
            }
          }
        }
      }
      updateAlphabetLabel(alphabetLabel);
      config.dispatchAlphabetUpdated();
    }
  }

  // Simplifies the finalization for the transition of an edited arrow
  function finalizeEditedArrow(nextSelected: unknown | null) {
    if (!lastEditedArrow) return;

    // If the previously edited object was an Arrow or SelfArrow, AND if the currently
    // selected object is different from the previous edited Arrow or SelfArrow,
    // then we will run the transition commit check
    if (nextSelected !== lastEditedArrow) {
      if (config.commitTransition(lastEditedArrow)) {
        // This will sort the string in ascending order and assign it to the arrow's text,
        // which makes it more visually appealing for the user
        lastEditedArrow.text = lastEditedArrow.text
          .replace(/^[,\s]+|[,\s]+$/g, "")
          .split(",")
          .sort()
          .join(",");
      } else {
        // If the commit check returns false, that means the transition is not valid
        // and its text has been reset inside the check itself
        console.log(
          "Transition determinism check failed for state",
          lastEditedArrow.startCircle.id
        );
      }
      config.getValidator().resetBuffer();
    }
  }

  /* -----------------------------------------------------------
   * Attach automatically when DOM is ready.
   * --------------------------------------------------------- */
  function attachWhenReady() {
    let setupAbortController: AbortController | null = null;

    const run = () => {
      // Tear down any listeners registered by the previous run() call.
      setupAbortController?.abort();
      setupAbortController = new AbortController();
      const signal = setupAbortController.signal;

      // Get the input tag for the input string of the automaton
      const inputString = document.getElementById("inputString") as HTMLInputElement | null;
      // Get the input tag for the alphabet input of the automaton
      const alphabetInput = document.getElementById("alphabet") as HTMLInputElement | null;
      // Get the canvas tag for the canvas of the automaton
      const canvas = document.getElementById(config.canvasId) as HTMLCanvasElement | null;
      // Get label tag for the alphabet label of the automaton
      const alphabetLabel = document.getElementById("alphabetLabel") as HTMLLabelElement | null;
      // Buttons for exporting, SVG and LaTeX
      const exportSVGBtn = document.getElementById('svgExportBtn') as HTMLButtonElement | null;
      const exportLaTeXBtn = document.getElementById('latexExportBtn') as HTMLButtonElement | null;
      // Buttons for importing, SVG and LaTeX
      const importSVGBtn = document.getElementById('svgImportBtn') as HTMLButtonElement | null;
      const importLaTeXBtn = document.getElementById('latexImportBtn') as HTMLButtonElement | null;
      const drawImportBtn = document.getElementById('confirmImport') as HTMLButtonElement | null;
      // Container surrounding the export textarea (the output container {the div})
      const outputContainer = document.getElementById('exportOutputContainer') as HTMLDivElement | null;
      // Container surround the import textarea (the input container {the div})
      const inputContainer = document.getElementById('importInputContainer') as HTMLDivElement | null;
      // Actual textarea containing the output data
      const outputTextArea = document.getElementById('output') as HTMLTextAreaElement | null;
      // Textarea containing the input data
      const inputTextArea = document.getElementById('input') as HTMLTextAreaElement | null;
      // Button that will hide the output container effectively hiding the text area
      const hideOutputBtn = document.getElementById('hideOutput') as HTMLButtonElement | null;
      // Button that will copy the output to clipboard
      const copyOutputBtn = document.getElementById('copyOutput') as HTMLButtonElement | null;
      // Button that will hide the input container effectively hiding the text area
      const hideInputBtn = document.getElementById('hideInput') as HTMLButtonElement | null;
      // Button that will clear the input textarea
      const clearInputBtn = document.getElementById('clearInput') as HTMLButtonElement | null;
      // Button that will clear the canvas
      const clearCanvasBtn = document.getElementById('clearCanvas') as HTMLButtonElement | null;
      // Run button
      const runBtn = document.getElementById(config.runBtnId) as HTMLButtonElement | null;
      // Reference to draw function
      let drawRef: (() => void) | null = null;
      if (canvas)  {
        const { draw } = setupCanvas(canvas, signal);
        drawRef = draw;
        draw(); // repaint existing state when canvas is remounted
        config.onCanvasReady?.(draw);

        // If you click outside of the canvas it will deselect the object and turn off dragging
        document.addEventListener("mousedown", (event) => {
          if (!isInsideCanvas(event, canvas)) {
            finalizeEditedArrow(null);

            selectedObj = null;
            dragging = false;
            draw();
          } else {
            // Clicking the canvas must return keyboard control to it. The canvas
            // mousedown handler calls preventDefault(), which stops the browser
            // from blurring the focused element on its own, so blur whatever is
            // focused explicitly — a hardcoded list of controls misses elements
            // like the import button and leaves keyboard input dead after an import.
            const active = document.activeElement;
            if (active instanceof HTMLElement && active !== document.body) {
              active.blur();
            }
          }
        }, { signal });
      };

      if (inputString) {
        inputString.addEventListener("keydown", (event) => {
          // If the "Enter" key is pressed on the input string
          if (event.key === "Enter") {
            event.preventDefault();

            config.runAlgo(inputString.value);

            // Reset the input tag
            inputString.value = "";
          }
        });
      }

      if (alphabetInput) {
        alphabetInput.addEventListener("keydown", (event) => {
          // If the "Enter" key is pressed on the alphabet input
          if (event.key === "Enter") {
            event.preventDefault();
            console.log("Submitting alphabet:", alphabetInput.value);

            // Obtain the input and update the alphabet variable.
            // Trimming also removes any trailing/leading commas and whitespace
            const normalized = alphabetInput.value
              .split(',')
              .map(s => s.trim())
              .filter(s => s.length > 0);

            config.setAlphabet(new Set(normalized));

            config.dispatchAlphabetUpdated();

            console.log(config.getAlphabet());

            alphabetInput.value = "";

            updateAlphabetLabel(alphabetLabel);
            // Notify the React page so it can show a toast confirming the alphabet updated
            showToast("Alphabet Updated!");
          }
        });
      }

      // Export SVG button event handler and export textarea visiblity enable
      if (exportSVGBtn) {
        exportSVGBtn.addEventListener('click', () => {
          if (canvas && outputTextArea) {
            saveAsSVG(canvas, outputTextArea, config.automatonLabel, selectedObj, config.getAlphabet(), hightlightSelected, base);
          }
          if (outputContainer) {
            if (outputContainer.hidden) {
              toggle_visiblity(outputContainer);
            }
          }
        });
      } else {
        console.log("unable to find the export svg btn");
      }

      // Export LaTeX button event handler and export textarea visiblity enable
      if (exportLaTeXBtn) {
        exportLaTeXBtn.addEventListener('click', () => {
          if (canvas && outputTextArea) {
            saveAsLaTeX(canvas, outputTextArea, config.automatonLabel, config.getAlphabet());
          }
          if (outputContainer) {
            if (outputContainer.hidden) {
              toggle_visiblity(outputContainer);
            }
          }
        });
      }

      // Import SVG button event handler and import textarea visiblity enable
      if (importSVGBtn) {
        importSVGBtn.addEventListener('click', () => {
          importHelper(canvas, drawImportBtn, alphabetLabel, inputContainer, inputTextArea, drawRef);
        });
      }

      // Import LaTeX button event handler and Import textarea visiblity enable
      if (importLaTeXBtn) {
        importLaTeXBtn.addEventListener('click', () => {
          importHelper(canvas, drawImportBtn, alphabetLabel, inputContainer, inputTextArea, drawRef);
        });
      }

      // Additional button so the user doesn't have to click the drop down to import
      if (drawImportBtn) {
        drawImportBtn.addEventListener('click', () => {
          importHelper(canvas, drawImportBtn, alphabetLabel, inputContainer, inputTextArea, drawRef);
        })
      }

      // Event handler to hide the export textarea (refered to as the output container, since hiding the div hides the textarea)
      if (hideOutputBtn) {
        hideOutputBtn.addEventListener('click', () => {
          if (outputContainer) {
            toggle_visiblity(outputContainer);
          }
        });
      }

      // Copies the output created from the export to your clipboard
      if (copyOutputBtn) {
        copyOutputBtn.addEventListener('click', async () => {
          if (outputTextArea) {
            try {
              const textToCopy = outputTextArea.value;
              await navigator.clipboard.writeText(textToCopy);
              // Notify the React page so it can show a toast confirming the copy
              showToast("Copied to clipboard!");
            } catch (err) {
              showToast(`Failed to copy: ${err}`)
              console.log("Failed to copy: ", err)
            }
          }
        });
      }

      // Event handler to hide the import textarea (refered to as the input container, since hiding the div hides the textarea)
      if (hideInputBtn) {
        hideInputBtn.addEventListener('click', () => {
          if (inputContainer && drawImportBtn) {
            toggle_visiblity(inputContainer);
            toggle_visiblity(drawImportBtn);
          }
        });
      }

      // Event handler to clear the text in the inputTextArea
      if (clearInputBtn) {
        clearInputBtn.addEventListener('click', () => {
          if (inputTextArea) {
            inputTextArea.value = '';
          }
        })
      }

      // Run button
      if (runBtn) {
        runBtn.addEventListener("click", () => {
          // Run the automaton check for the user created automaton
          if (inputString) {
            config.runAlgo(inputString.value);
            // Reset the input tag
            inputString.value = "";
          }
        });
      }

      // Clear Canvas button
      if (clearCanvasBtn) {
        clearCanvasBtn.addEventListener("click", () => {
          clearAutomaton(canvas);
          showToast('Canvas Cleared!')
        })
      }

    };

    // Next.js client-side navigation unmounts and remounts the canvas element
    // without re-executing this script.  A persistent MutationObserver watches
    // for each insertion/removal so listeners are wired up (and cleanly torn
    // down via AbortController) on every navigation — not just the first load.
    let currentCanvas: HTMLCanvasElement | null = null;

    const observer = new MutationObserver(() => {
      const el = document.getElementById(config.canvasId) as HTMLCanvasElement | null;

      if (el && el !== currentCanvas) {
        // Canvas just appeared (or was swapped out) — initialise it.
        currentCanvas = el;
        run();
      } else if (!el && currentCanvas) {
        // Canvas was removed — abort the old listeners so they don't pile up.
        setupAbortController?.abort();
        setupAbortController = null;
        currentCanvas = null;
      }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Kick off immediately in case the canvas is already in the DOM.
    const existing = document.getElementById(config.canvasId) as HTMLCanvasElement | null;
    if (existing) {
      currentCanvas = existing;
      run();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachWhenReady);
  } else {
    attachWhenReady();
  }
}
