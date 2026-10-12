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
import { SelfArrow } from "./SelfArrow";
import { snapToPadding, nodeRadius, drawArrow, drawText, hitTargetPadding } from "./draw";
import { ExportAsSVG } from "../exporting/ExportAsSVG";
import { ExportAsLaTeX } from "../exporting/ExportAsLaTeX";

export const arrows: (Arrow | SelfArrow)[] = [];

export let arrowIdCounter = 0;

export function incrementArrowIdCounter() {
    arrowIdCounter++;
}

function circleFromThreePoints(
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number, 
  x3: number, 
  y3: number) {
	const a = det(x1, y1, 1, x2, y2, 1, x3, y3, 1);
	const bx = -det(x1*x1 + y1*y1, y1, 1, x2*x2 + y2*y2, y2, 1, x3*x3 + y3*y3, y3, 1);
	const by = det(x1*x1 + y1*y1, x1, 1, x2*x2 + y2*y2, x2, 1, x3*x3 + y3*y3, x3, 1);
	const c = -det(x1*x1 + y1*y1, x1, y1, x2*x2 + y2*y2, x2, y2, x3*x3 + y3*y3, x3, y3);
	return {
		'x': -bx / (2*a),
		'y': -by / (2*a),
		'radius': Math.sqrt(bx*bx + by*by - 4*a*c) / (2*Math.abs(a))
	};
}

function det(
  a: number, 
  b: number, 
  c: number, 
  d: number, 
  e: number, 
  f: number, 
  g: number, 
  h: number, 
  i: number
) {
	return a*e*i + b*f*g + c*d*h - a*f*h - b*d*i - c*e*g;
}

export class Arrow {
    id: string;
    startCircle: Circle; // The initial node of the Arrow
    endCircle: Circle; // The terminal node of the Arrow
    text: string; // The text (transition) of the Arrow that will be displayed
    lineAngleAdjust: number; // value to add to textAngle when link is straight line
    parallelPart: number;
    perpendicularPart: number;
    transition: Set<string>; // Set containing the transition of this arrow
    highlighted: boolean;


    constructor(startCircle: Circle, endCircle: Circle) {
        this.id = 'a' + arrowIdCounter;
        this.startCircle = startCircle;
        this.endCircle = endCircle;
        this.text = '';
        this.lineAngleAdjust = 0;
        // Make anchor point relative to the locations of start and end circles
        this.parallelPart = 0.5; // percent from start to end circle
        this.perpendicularPart = 0; // pixels from start to end circle
        this.transition = new Set();
        this.highlighted = false;
        arrowIdCounter++;
    }

    getAnchorPoint() {
        const dx = this.endCircle.x - this.startCircle.x;
        const dy = this.endCircle.y - this.startCircle.y;
        const scale = Math.sqrt(dx * dx + dy * dy);
        return {
            'x': this.startCircle.x + dx * this.parallelPart - dy * this.perpendicularPart / scale,
            'y': this.startCircle.y + dy * this.parallelPart + dx * this.perpendicularPart / scale
        };
    }

    setAnchorPoint(x: number, y: number) {
        const dx = this.endCircle.x - this.startCircle.x;
        const dy = this.endCircle.y - this.startCircle.y;
        const scale = Math.sqrt(dx * dx + dy * dy);
        this.parallelPart = (dx * (x - this.startCircle.x) + dy * (y - this.startCircle.y)) / (scale * scale);
        this.perpendicularPart = (dx * (y - this.startCircle.y) - dy * (x - this.startCircle.x)) / scale;
        // snap to a straight line
        if (this.parallelPart > 0 && this.parallelPart < 1 && Math.abs(this.perpendicularPart) < snapToPadding) {
            this.lineAngleAdjust = (this.perpendicularPart < 0 ? 1 : 0) * Math.PI;
            this.perpendicularPart = 0;
        }
    }

    getEndPointsAndCircle() {
        if (this.perpendicularPart == 0) {
            const midX = (this.startCircle.x + this.endCircle.x) / 2;
            const midY = (this.startCircle.y + this.endCircle.y) / 2;
            const start = this.startCircle.closestPointOnCircle(midX, midY);
            const end = this.endCircle.closestPointOnCircle(midX, midY);
            return {
                'hasCircle': false,
                'startX': start.x,
                'startY': start.y,
                'endX': end.x,
                'endY': end.y,
            };
        }

        const anchor = this.getAnchorPoint();
        const circle = circleFromThreePoints(this.startCircle.x, this.startCircle.y, this.endCircle.x, this.endCircle.y, anchor.x, anchor.y);
        const isReversed = (this.perpendicularPart > 0);
        const reverseScale = isReversed ? 1 : -1;
        const startAngle = Math.atan2(this.startCircle.y - circle.y, this.startCircle.x - circle.x) - reverseScale * nodeRadius / circle.radius;
        const endAngle = Math.atan2(this.endCircle.y - circle.y, this.endCircle.x - circle.x) + reverseScale * nodeRadius / circle.radius;
        const startX = circle.x + circle.radius * Math.cos(startAngle);
        const startY = circle.y + circle.radius * Math.sin(startAngle);
        const endX = circle.x + circle.radius * Math.cos(endAngle);
        const endY = circle.y + circle.radius * Math.sin(endAngle);
        return {
            'hasCircle': true,
            'startX': startX,
            'startY': startY,
            'endX': endX,
            'endY': endY,
            'startAngle': startAngle,
            'endAngle': endAngle,
            'circleX': circle.x,
            'circleY': circle.y,
            'circleRadius': circle.radius,
            'reverseScale': reverseScale,
            'isReversed': isReversed,
        };
    }

    draw(ctx: CanvasRenderingContext2D | ExportAsSVG | ExportAsLaTeX) {

        const pointInfo = this.getEndPointsAndCircle();
        // draw arc
        if (this.highlighted && ctx instanceof CanvasRenderingContext2D) {
            const previousStyling = ctx.fillStyle;
            ctx.lineWidth = 10;
            ctx.fillStyle = ctx.strokeStyle = 'yellow';
            // draw highligted arrow
            ctx.beginPath();
            if (pointInfo.hasCircle && pointInfo.circleX) {
                ctx.arc(pointInfo.circleX, pointInfo.circleY, pointInfo.circleRadius, pointInfo.startAngle, pointInfo.endAngle, pointInfo.isReversed);
            } else {
                ctx.moveTo(pointInfo.startX, pointInfo.startY);
                ctx.lineTo(pointInfo.endX, pointInfo.endY);
            }
            ctx.stroke();
            // reset lineWidth and styling
            ctx.lineWidth = 2;
            ctx.fillStyle = ctx.strokeStyle = previousStyling;
        }
        // draw regular arrow line
        ctx.beginPath();
        if (pointInfo.hasCircle && pointInfo.circleX) {
            ctx.arc(pointInfo.circleX, pointInfo.circleY, pointInfo.circleRadius, pointInfo.startAngle, pointInfo.endAngle, pointInfo.isReversed);
        } else {
            ctx.moveTo(pointInfo.startX, pointInfo.startY);
            ctx.lineTo(pointInfo.endX, pointInfo.endY);
        }
        ctx.stroke();
        
        // draw the head of the arrow
        if (pointInfo.hasCircle && pointInfo.endAngle) {
            drawArrow(ctx, pointInfo.endX, pointInfo.endY, pointInfo.endAngle - pointInfo.reverseScale * (Math.PI / 2));
        } else {
            drawArrow(ctx, pointInfo.endX, pointInfo.endY, Math.atan2(pointInfo.endY - pointInfo.startY, pointInfo.endX - pointInfo.startX));
        }

        if (pointInfo.hasCircle) {
            const startAngle = pointInfo.startAngle;
            let endAngle = pointInfo.endAngle;
        if (endAngle != null && startAngle != null&& endAngle < startAngle) {
            endAngle += Math.PI * 2;
        }
        if (startAngle != null && endAngle != null && pointInfo.circleRadius != null){
            const textAngle = (startAngle + endAngle) / 2 + (pointInfo.isReversed ? 1 : 0) * Math.PI;
            const textX = pointInfo.circleX + pointInfo.circleRadius * Math.cos(textAngle);
            const textY = pointInfo.circleY + pointInfo.circleRadius * Math.sin(textAngle);
            drawText(ctx, this.text, textX, textY, textAngle);
        }
        } else {
            const textX = (pointInfo.startX + pointInfo.endX) / 2;
            const textY = (pointInfo.startY + pointInfo.endY) / 2;
            const textAngle = Math.atan2(pointInfo.endX - pointInfo.startX, pointInfo.startY - pointInfo.endY);
            drawText(ctx, this.text, textX, textY, textAngle + this.lineAngleAdjust);
        }
    }

    containsPoint(x: number, y: number) {
        const stuff = this.getEndPointsAndCircle();
        if (stuff.hasCircle && stuff.circleX) {
            const dx = x - stuff.circleX;
            const dy = y - stuff.circleY;
            const distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;
            if (Math.abs(distance) < hitTargetPadding) {
                let angle = Math.atan2(dy, dx);
                let startAngle = stuff.startAngle;
                let endAngle = stuff.endAngle;
                if (stuff.isReversed) {
                    const temp = startAngle;
                    startAngle = endAngle;
                    endAngle = temp;
                }
                if (endAngle < startAngle) {
                    endAngle += Math.PI * 2;
                }
                if (angle < startAngle) {
                    angle += Math.PI * 2;
                } else if (angle > endAngle) {
                    angle -= Math.PI * 2;
                }
                return (angle > startAngle && angle < endAngle);
            }
        } else {
            const dx = stuff.endX - stuff.startX;
            const dy = stuff.endY - stuff.startY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const percent = (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
            const distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
            return (percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding);
        }
        return false;
    }
  }