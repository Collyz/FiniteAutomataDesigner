import { ExportAsSVG } from "../exporting/ExportAsSVG";
import { ExportAsLaTeX } from "../exporting/ExportAsLaTeX";
import { Circle, circles} from "../Shapes/Circle";
import { Arrow, arrows} from "../Shapes/Arrow";
import { SelfArrow} from "../Shapes/SelfArrow";
import { EntryArrow, allEntryArrows } from "../Shapes/EntryArrow";

export function buildSVG(
  canvas: HTMLCanvasElement,
  automationSpecification: string,
  selectedObj: Circle | EntryArrow | Arrow | SelfArrow | null,
  alphabet: Set<string>,
  hightlightSelected: string,
  base: string,
  includeMetadata: boolean = true
): string {
  const exporter = new ExportAsSVG(canvas, alphabet);

  if (includeMetadata) {
    exporter.addAutomatonSpecification(automationSpecification);
    exporter.addAlphabet();
  }

  for (let circle = 0; circle < circles.length; circle++) {
    exporter.lineWidth = 1;
    exporter.fillStyle = exporter.strokeStyle = (circles[circle] == selectedObj) ? hightlightSelected : base;
    exporter.faObject = circles[circle];
    circles[circle].draw(exporter);
  }
  for (let arrow = 0; arrow < arrows.length; arrow++) {
    exporter.lineWidth = 1;
    exporter.fillStyle = exporter.strokeStyle = (arrows[arrow] == selectedObj) ? hightlightSelected : base;
    exporter.faObject = arrows[arrow];
    arrows[arrow].draw(exporter);
  }
  for (const entryArrow of allEntryArrows()) {
    exporter.faObject = entryArrow;
    entryArrow.draw(exporter);
  }

  return exporter.toSVG();
}

// Export the FSM as SVG
export function saveAsSVG(
    canvas: HTMLCanvasElement, 
    textArea: HTMLTextAreaElement, 
    automationSpecification: string, 
    selectedObj: Circle | EntryArrow | Arrow | SelfArrow | null, 
    alphabet: Set<string>,
    hightlightSelected: string, 
    base: string
) {
    if (!canvas) return;
    output(buildSVG(canvas, automationSpecification, selectedObj, alphabet, hightlightSelected, base), textArea);
}

// Export the FSM as LaTeX
export function saveAsLaTeX(
    canvas: HTMLCanvasElement, 
    textArea: HTMLTextAreaElement, 
    automationSpecification: string,
    alphabet: Set<string>
) {
  if (!canvas) return;
  
  const exporter = new ExportAsLaTeX(canvas, alphabet);
  exporter.addAutomatonSpecification(automationSpecification);
  exporter.addAlphabet();

  for(let circle = 0; circle < circles.length; circle++) {
    exporter.faObject = circles[circle];
    circles[circle].draw(exporter)
  }
  for (let arrow = 0; arrow < arrows.length; arrow++) {
    exporter.faObject = arrows[arrow];
    arrows[arrow].draw(exporter);
  }
  for (const entryArrow of allEntryArrows()) {
    exporter.faObject = entryArrow;
    entryArrow.draw(exporter);
  }

  output(exporter.toLaTeX(), textArea);
}

function output(
    text: string, 
    element: HTMLTextAreaElement | null
) {
  if (element && element instanceof HTMLTextAreaElement) {
    element.value = text;
  }
}

export function toggle_visiblity(element: HTMLElement) {
  element.hidden = !element.hidden;
}


