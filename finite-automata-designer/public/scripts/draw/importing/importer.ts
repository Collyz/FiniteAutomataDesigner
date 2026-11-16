import { Circle } from "../../Shapes/Circle";
import { Arrow } from "../../Shapes/Arrow";
import { SelfArrow } from "../../Shapes/SelfArrow";
import { EntryArrow, entryArrows } from "../../Shapes/EntryArrow";

const startsWith = {
    AUTOMATON: 'Automaton:',
    CIRCLE: 'Circle:',
    STRAIGHT_ARROW: 'StraightArrow:',
    CURVED_ARROW: 'CurvedArrow:',
    SELF_ARROW: 'SelfArrow:',
    ENTRY_ARROW: 'EntryArrow:'
}

// Importer for the draw-only page. Accepts an SVG/LaTeX export from any of the
// designers (DFSM, NDFSM, or the draw-only page) and loads it as a plain
// drawing: transition labels are kept exactly as exported, no determinism or
// alphabet checks are run, and the exported alphabet is ignored.
export class Importer {
    circles: Circle[];
    arrows: (Arrow | SelfArrow) [];
    _svgData: string;
    draw: () => void;

    constructor(circArr: Circle[], arrowsArray: (Arrow | SelfArrow)[], data: string, drawFunc:() => void) {
        this.circles = circArr;
        this.arrows = arrowsArray;
        this._svgData = data;
        this.draw = drawFunc;
    }

    clear(){
        this._svgData = '';
    }

    convert(): boolean{
        const commentRegex = /<!--\s*(.*?)\s*-->/g;
        const parsedData: string[] = [];
        let match;
        while ((match = commentRegex.exec(this._svgData)) != null) {
            const raw = match[1].trim();
            if (raw.startsWith('Circle')) {
                // Only store circles if they don't exist because accept states draw two circles and have the same comment for the the outer and inner circles
                if (parsedData.indexOf(raw) == -1) {
                    parsedData.push(raw);
                }
            } else {
                parsedData.push(raw);
            }
        }

        // Check to be sure that you are importing something exported by this app
        if (!parsedData.some(raw => raw.startsWith(startsWith.AUTOMATON))) {
            return false;
        }

        // Add the circles first because all arrows depend on them
        for (const raw of parsedData) {
            if (raw.startsWith(startsWith.CIRCLE)) {
                const circleMatch = raw.match(/id=(\w+), x=([\d.]+), y=([\d.]+), accept=(\w+), text=(.*)/);
                if (!circleMatch) continue;
                const [, id, x, y, accept, text] = circleMatch;
                // Create circle instance
                const circle = new Circle(parseFloat(x), parseFloat(y));
                circle.id = id;
                circle.isAccept = accept == 'true';
                circle.text = text;
                this.circles.push(circle);
            }
        }

        // Run through the array again and add the arrows with the associated circles
        for (const raw of parsedData) {
            if (raw.startsWith(startsWith.STRAIGHT_ARROW)) {
                const arrowMatch = raw.match(/from=(\w+), to=(\w+), label=(.*)/);
                if (!arrowMatch) continue;
                const [, from, to, label] = arrowMatch;
                const startCircle = this.circles.find(c => c.id === from);
                const endCircle = this.circles.find(c => c.id === to);
                if (startCircle && endCircle) {
                    const arrow = new Arrow(startCircle, endCircle);
                    arrow.startCircle.outArrows.add(arrow); // Adds out arrow for the starting circle of the arrow
                    arrow.text = label.trim();
                    this.arrows.push(arrow);
                }
            } else if (raw.startsWith(startsWith.CURVED_ARROW)) {
                const arrowMatch = raw.match(/from=(\w+), to=(\w+), parallel=([\d.]+), perpendicular=([-]?\d+(?:\.\d+)?), label=(.*)/);
                if (!arrowMatch) continue;
                const [, from, to, parallel, perpendicular, label] = arrowMatch;
                const startCircle = this.circles.find(c => c.id === from);
                const endCircle = this.circles.find(c => c.id === to);
                if (startCircle && endCircle) {
                    const arrow = new Arrow(startCircle, endCircle);
                    arrow.startCircle.outArrows.add(arrow); // Adds out arrow for the starting circle of the arrow
                    arrow.text = label.trim();
                    arrow.parallelPart = parseFloat(parallel);
                    arrow.perpendicularPart = parseFloat(perpendicular);
                    this.arrows.push(arrow);
                }
            } else if (raw.startsWith(startsWith.SELF_ARROW)) {
                const selfArrowMatch = raw.match(/circle=(\w+), anchor=\(([\d.]+),([\d.]+)\), text=(.*)/);
                if (!selfArrowMatch) continue;
                const [, circleId, x, y, text] = selfArrowMatch;
                const circle = this.circles.find(c => c.id === circleId);
                // A state can only have one SelfArrow
                if (circle && !circle.loop) {
                    const selfArrow = new SelfArrow(circle, { x: parseFloat(x), y: parseFloat(y)});
                    circle.loop = selfArrow;
                    circle.outArrows.add(selfArrow); // Adds out arrow for the circle
                    selfArrow.text = text;
                    this.arrows.push(selfArrow);
                }
            } else if (raw.startsWith(startsWith.ENTRY_ARROW)) {
                const entryMatch = raw.match(/to=(\w+), start=\(([\d.]+),([\d.]+)\)/);
                if (!entryMatch) continue;
                const [, toId, x, y] = entryMatch;
                const circle = this.circles.find(c => c.id === toId);
                if (circle) {
                    const entryArrow = new EntryArrow(circle, { x: parseFloat(x), y: parseFloat(y) });
                    // Keep every entry arrow: the draw-only page has no limit
                    entryArrows.push(entryArrow);
                }
            }
        }

        this.draw();
        return true;
    }
}
