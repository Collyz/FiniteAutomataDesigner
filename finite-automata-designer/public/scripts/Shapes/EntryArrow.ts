/*
 Portions of this file are adapted from:

 Copyright (c) 2010 Evan Wallace
 Finite State Machine Designer (https://madebyevan.com/fsm/)
 Licensed under the MIT License

 Modifications:
 Copyright (c) 2025 Mohammed Mowla and Parth Patel
 Licensed under the MIT Licenses
*/

import {Circle} from "./Circle";
import { drawArrow, drawText, snapToPadding, hitTargetPadding } from "./draw";
import { ExportAsLaTeX } from "../exporting/ExportAsLaTeX";
import { ExportAsSVG } from "../exporting/ExportAsSVG";

// The startState will be an EntryArrow. If you wish to
// access the start state node itself, you can use the
// pointsToCircle attribute of the EntryArrow to do so.
// Since we are not storing the EntryArrow itself as an
// attribute for Circles, it was best that the startState
// was set to the EntryArrow instead of its Circle
export let startState: EntryArrow|null = null;

// Since the startState will be imported, it cannot be reassigned
// as usual, so this setter method will enable you to do so
export function setStartState(newEntryArrow: EntryArrow | null){
  startState = newEntryArrow;
}

export class EntryArrow {
  pointsToCircle: Circle; // The startState of the DFSM which this arrow points to
  deltaX: number;
  deltaY: number;
  // text: string;
  startPoint: {x: number, y: number};
  highlighted: boolean;

  constructor(pointsToCircle: Circle, startPoint: {x: number, y: number}) {
    this.pointsToCircle = pointsToCircle;
    this.deltaX = 0;
    this.deltaY = 0;
    this.startPoint = startPoint;
    // this.text = ''
    if (startPoint) {
      this.setAnchorPoint(startPoint.x, startPoint.y);
    }
    this.highlighted = false;
  }

  draw(ctx: CanvasRenderingContext2D | ExportAsSVG | ExportAsLaTeX) {
    const points = this.getEndPoints();
    if (this.highlighted && ctx instanceof CanvasRenderingContext2D) {
      const previousStyling = ctx.fillStyle;
      ctx.lineWidth = 10;
      ctx.fillStyle = ctx.strokeStyle = 'yellow';
      // draw highlighted arrow
      ctx.beginPath();
      ctx.moveTo(points.startX, points.startY);
      ctx.lineTo(points.endX, points.endY);
      ctx.stroke();
      // reset lineWidth and styling
      ctx.lineWidth = 3;
      ctx.fillStyle = ctx.strokeStyle = previousStyling;
    }

    ctx.beginPath();
    ctx.moveTo(points.startX, points.startY);
    ctx.lineTo(points.endX, points.endY);
    ctx.stroke();
    
    // Draw the text at the end without the fillrow
    const textAngle = Math.atan2(points.startY - points.endY, points.startX - points.endX);
    drawText(ctx, "", points.startX, points.startY, textAngle);

    // Draw the head of the arrow
    drawArrow(ctx, points.endX, points.endY, Math.atan2(-this.deltaY, -this.deltaX));
  }

  setAnchorPoint(x: number, y: number) {
    this.deltaX = x - this.pointsToCircle.x;
    this.deltaY = y - this.pointsToCircle.y;

    if (Math.abs(this.deltaX) < snapToPadding) this.deltaX = 0;
    if (Math.abs(this.deltaY) < snapToPadding) this.deltaY = 0;
  }

  getEndPoints() {
    const startX = this.pointsToCircle.x + this.deltaX;
    const startY = this.pointsToCircle.y + this.deltaY;
    const end = this.pointsToCircle.closestPointOnCircle(startX, startY);
    return {
            'startX': startX,
            'startY': startY,
            'endX': end.x,
            'endY': end.y,
          };
  }

  containsPoint(x: number, y: number) {
    const lineInfo = this.getEndPoints();
    const dx = lineInfo.endX - lineInfo.startX;
    const dy = lineInfo.endY - lineInfo.startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const percent = (dx * (x - lineInfo.startX) + dy * (y - lineInfo.startY)) / (length * length);
    const distance = (dx * (y - lineInfo.startY) - dy * (x - lineInfo.startX)) / length;
    return (percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding); 
  }

}