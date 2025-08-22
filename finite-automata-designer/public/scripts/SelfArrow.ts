/*
 Portions of this file are adapted from:

 Copyright (c) 2010 Evan Wallace
 Finite State Machine Designer (https://madebyevan.com/fsm/)
 Licensed under the MIT License

 Modifications:
 Copyright (c) 2025 Mohammed Mowla and Parth Patel
 Licensed under the MIT Licenses
*/

import {Circle} from "./circle";
import { drawArrow, drawText, nodeRadius, hitTargetPadding } from "./draw";

export class SelfArrow {
  circle: Circle; // The state which this SelfArrow loops back to

  // These two attributes are not really necessary.
  // However, since the DFA algorithm will check the startCircle
  // and endCircle of each state, it makes it a lot simpler if the
  // SelfArrow has these attributes as well, so that we don't 
  // have to create an entirely separate case for it in the algo.
  startCircle: Circle; // The state which this SelfArrow loops back to
  endCircle: Circle; // The state which this SelfArrow loops back to

  anchorAngle: number;
  mouseOffsetAngle: number;
  text: string; // The text (transition) of the Arrow that will be displayed
  transition: Set<string>; // Set containing the transition of this arrow

  constructor(pointsToCircle: Circle, point: {x: number, y: number}) {
    this.circle = pointsToCircle;
    this.startCircle = pointsToCircle;
    this.endCircle = pointsToCircle;
    this.anchorAngle = 0;
    this.mouseOffsetAngle = 0;
    this.text = ''; 
    this.transition = new Set();
    

    if (point) {
      this.setAnchorPoint(point.x, point.y);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    var arcInfo = this.getEndPointsAndCircle();
    // draw arc
    ctx.beginPath();
    ctx.arc(arcInfo.circleX, arcInfo.circleY, arcInfo.circleRadius, arcInfo.startAngle, arcInfo.endAngle, false);
    ctx.stroke();
    // Draw the text on the loop farthest from the circle
    var textX = arcInfo.circleX + arcInfo.circleRadius * Math.cos(this.anchorAngle);
    var textY = arcInfo.circleY + arcInfo.circleRadius * Math.sin(this.anchorAngle);
    drawText(ctx, this.text, textX, textY, this.anchorAngle);
    // draw the head of the arrow
    drawArrow(ctx, arcInfo.endX, arcInfo.endY, arcInfo.endAngle + Math.PI * 0.4);
  }

  setMouseStart(x: number, y: number): void {
    this.mouseOffsetAngle = this.anchorAngle - Math.atan2(y - this.circle.y, x - this.circle.x);
  }

    setAnchorPoint(x: number, y: number) {
        this.anchorAngle = Math.atan2(y - this.circle.y, x - this.circle.x) + this.mouseOffsetAngle;
        // snap to 90 degrees
        var snap = Math.round(this.anchorAngle / (Math.PI / 2)) * (Math.PI / 2);
        if (Math.abs(this.anchorAngle - snap) < 0.1) this.anchorAngle = snap;
        // keep in the range -pi to pi so our containsPoint() function always works
        if (this.anchorAngle < -Math.PI) this.anchorAngle += 2 * Math.PI;
        if (this.anchorAngle > Math.PI) this.anchorAngle -= 2 * Math.PI;
    }
    getEndPointsAndCircle() {
        var circleX = this.circle.x + 1.5 * nodeRadius * Math.cos(this.anchorAngle);
        var circleY = this.circle.y + 1.5 * nodeRadius * Math.sin(this.anchorAngle);
        var circleRadius = 0.75 * nodeRadius;
        var startAngle = this.anchorAngle - Math.PI * 0.8;
        var endAngle = this.anchorAngle + Math.PI * 0.8;
        var startX = circleX + circleRadius * Math.cos(startAngle);
        var startY = circleY + circleRadius * Math.sin(startAngle);
        var endX = circleX + circleRadius * Math.cos(endAngle);
        var endY = circleY + circleRadius * Math.sin(endAngle);
        return {
            'hasCircle': true,
            'startX': startX,
            'startY': startY,
            'endX': endX,
            'endY': endY,
            'startAngle': startAngle,
            'endAngle': endAngle,
            'circleX': circleX,
            'circleY': circleY,
            'circleRadius': circleRadius
        };
    }
  containsPoint(x: number, y:number) {
        var stuff = this.getEndPointsAndCircle();
        var dx = x - stuff.circleX;
        var dy = y - stuff.circleY;
        var distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;
        return (Math.abs(distance) < hitTargetPadding);
    }
}