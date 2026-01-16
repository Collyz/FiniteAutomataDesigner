(function () {
    'use strict';

    /**
     * Utility functions for exporting finite automata diagrams to different formats.
     *
     * Provides helpers to:
     * - Format numbers (`fixed`)
     * - Escape text for XML (`textToXML`)
     * - Insert descriptive comments into serialized outputs (`addCircleComment`, `addCurvedArrowComment`,
     *   `addStraightArrowComment`, `addEntryArrowComment`, `addSelfArrowComment`)
     *
     * Supports both SVG (`<!-- ... -->`) and LaTeX (`%<!-- ... -->`) callers through the `CALLERS` enum.
     */
    const typeSVG = "svg";
    const typeLaTeX = "latex";
    /**
     * Exists so that there aren't separate methods for both SVG and LaTeX
     */
    const CALLERS = {
        SVG: 'svg',
        LATEX: 'latex'
    };
    /**
     * Formats a number to a fixed number of decimal places,
     * trimming unnecessary trailing zeros and decimal points
     *
     * @param number
     * @param digits
     * @returns
     */
    function fixed(number, digits) {
        return number.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
    }
    /**
     * Escapes special characters in a string for safe inclusion in XML.
     * Converts `&`, `<`, and `>` into their XML entities, and encodes
     * non-printable or non-ASCII characters as numeric character references.
     *
     * @param text - The input string to escape
     * @returns A safe XML-encoded string
     */
    function textToXML(text) {
        text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        let result = '';
        for (let i = 0; i < text.length; i++) {
            let c = text.charCodeAt(i);
            if (c >= 0x20 && c <= 0x7E) {
                result += text[i];
            }
            else {
                result += '&#' + c + ';';
            }
        }
        return result;
    }
    function addCircleComment(caller, _data, id, x, y, accept, text) {
        if (caller == CALLERS.SVG) {
            _data += `\t<!-- Circle: id=${id}, x=${fixed(x, 3)}, y=${fixed(y, 3)}, accept=${accept}, text=${text} -->\n`;
        }
        else if (caller == CALLERS.LATEX) {
            _data += `\t%<!-- Circle: id=${id}, x=${fixed(x, 3)}, y=${fixed(y, 3)}, accept=${accept}, text=${text} -->\n`;
        }
        return _data;
    }
    function addCurvedArrowComment(caller, _data, fromId, toId, parallel, perpendicular, label) {
        if (caller == CALLERS.SVG) {
            _data += `\t<!-- CurvedArrow: from=${fromId}, to=${toId}, parallel=${parallel}, perpendicular=${perpendicular}, label=${label} -->\n`;
        }
        else if (caller == CALLERS.LATEX) {
            _data += `\t%<!-- CurvedArrow: from=${fromId}, to=${toId}, parallel=${parallel}, perpendicular=${perpendicular}, label=${label} -->\n`;
        }
        return _data;
    }
    function addStraightArrowComment(caller, _data, fromId, toId, label) {
        if (caller == CALLERS.SVG) {
            _data += `\t<!-- StraightArrow: from=${fromId}, to=${toId}, label=${label} -->\n`;
        }
        else if (caller == CALLERS.LATEX) {
            _data += `\t%<!-- StraightArrow: from=${fromId}, to=${toId}, label=${label} -->\n`;
        }
        return _data;
    }
    function addEntryArrowComment(caller, _data, toId, startX, startY) {
        if (caller == CALLERS.SVG) {
            _data += `\t<!-- EntryArrow: to=${toId}, start=(${fixed(startX, 3)},${fixed(startY, 3)}) -->\n`;
        }
        else if (caller == CALLERS.LATEX) {
            _data += `\t%<!-- EntryArrow: to=${toId}, start=(${fixed(startX, 3)},${fixed(startY, 3)}) -->\n`;
        }
        return _data;
    }
    function addSelfArrowComment(caller, _data, circleId, anchorX, anchorY, text) {
        if (caller == CALLERS.SVG) {
            _data += `\t<!-- SelfArrow: circle=${circleId}, anchor=(${fixed(anchorX, 3)},${fixed(anchorY, 3)}), text=${text} -->\n`;
        }
        else if (caller == CALLERS.LATEX) {
            _data += `\t%<!-- SelfArrow: circle=${circleId}, anchor=(${fixed(anchorX, 3)},${fixed(anchorY, 3)}), text=${text} -->\n`;
        }
        return _data;
    }
    function addAlphabetComment(caller, _data, alphabet) {
        const stringifiedAlphabet = Array.from(alphabet).join(',');
        console.log(stringifiedAlphabet);
        if (caller == CALLERS.SVG) {
            _data += `\t<!-- Alphabet: ${stringifiedAlphabet} -->\n`;
        }
        else if (caller == CALLERS.LATEX) {
            _data += `\t%<!-- Alphabet ${stringifiedAlphabet} -->\n`;
        }
        return _data;
    }

    /*
     Portions of this file are adapted from:

     Copyright (c) 2010 Evan Wallace
     Finite State Machine Designer (https://madebyevan.com/fsm/)
     Licensed under the MIT License

     Modifications:
     Copyright (c) 2025 Mohammed Mowla and Parth Patel
     Licensed under the MIT Licenses
    */
    const greekLetterNames = [
        'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon',
        'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda',
        'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho', 'Sigma',
        'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'
    ];
    let nodeRadius = 30;
    let snapToPadding = 10; // pixels
    let hitTargetPadding = 6; // pixels
    // Takes LaTeX-like plain text and converts to Unicode symbols
    // Handles Greek letters and subscripts
    // --- Note --- greek letters cannot be subscripted current 'limitation'
    function convertText(text) {
        let result = text;
        // Greek letter conversion
        for (let i = 0; i < greekLetterNames.length; i++) {
            let name = greekLetterNames[i];
            // Regex: '\\\\' matches a literal backslash "\" in text.
            // 'g' flag -> replace all not just first instance
            result = result.replace(new RegExp('\\\\' + name, 'g'), String.fromCharCode(913 + i + (i > 16 ? 1 : 0))); // uppercase
            result = result.replace(new RegExp('\\\\' + name.toLowerCase(), 'g'), String.fromCharCode(945 + i + (i > 16 ? 1 : 0))); // lowercase
        }
        // Subscript conversion
        for (let i = 0; i < 10; i++) {
            result = result.replace(new RegExp('_' + i, 'g'), String.fromCharCode(8320 + i));
        }
        return result;
    }
    function drawText(ctx, originalText, x, y, angeOrNull) {
        ctx.font = '20px Times New Roman';
        let text = convertText(originalText); // Convert all of the text in one go both subscript and greek
        let width = ctx.measureText(text).width;
        x -= width / 2;
        if (angeOrNull != null) {
            let cos = Math.cos(angeOrNull);
            let sin = Math.sin(angeOrNull);
            let cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
            let cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
            let slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
            x += cornerPointX - sin * slide;
            y += cornerPointY + cos * slide;
        }
        x = Math.round(x);
        y = Math.round(y);
        if (ctx instanceof CanvasRenderingContext2D || ctx.type == typeSVG) {
            ctx.fillText(text, x, y + 6);
        }
        else if (ctx.type == typeLaTeX) {
            ctx.fillText(text, originalText, x + 6, y + 3, angeOrNull);
        }
    }
    function drawArrow(ctx, x, y, angle) {
        let dx = Math.cos(angle);
        let dy = Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 10 * dx + 5 * dy, y - 8 * dy - 5 * dx);
        ctx.lineTo(x - 10 * dx - 5 * dy, y - 8 * dy + 5 * dx);
        ctx.fill();
    }

    /*
     Portions of this file are adapted from:

     Copyright (c) 2010 Evan Wallace
     Finite State Machine Designer (https://madebyevan.com/fsm/)
     Licensed under the MIT License

     Modifications:
     Copyright (c) 2025 Mohammed Mowla and Parth Patel
     Licensed under the MIT Licenses
    */
    let circles = [];
    let circleIdCounter = 0;
    class Circle {
        constructor(x, y) {
            this.id = 'c' + circleIdCounter;
            this.x = x,
                this.y = y;
            this.mouseOffsetX = 0;
            this.mouseOffsetY = 0;
            this.isAccept = false;
            this.text = '';
            this.outArrows = new Set();
            this.loop = null;
            // Increment ID
            circleIdCounter++;
        }
        setMouseStart(x, y) {
            this.mouseOffsetX = this.x - x;
            this.mouseOffsetY = this.y - y;
        }
        setAnchorPoint(x, y) {
            this.x = x + this.mouseOffsetX;
            this.y = y + this.mouseOffsetY;
        }
        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, nodeRadius, 0, 2 * Math.PI, false);
            ctx.stroke();
            drawText(ctx, this.text, this.x, this.y, null);
            if (this.isAccept) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, nodeRadius - 5, 0, 2 * Math.PI, false);
                ctx.stroke();
            }
        }
        closestPointOnCircle(x, y) {
            var dx = x - this.x;
            var dy = y - this.y;
            var scale = Math.sqrt(dx * dx + dy * dy);
            return {
                'x': this.x + dx * nodeRadius / scale,
                'y': this.y + dy * nodeRadius / scale
            };
        }
        containsPoint(x, y) {
            return (x - this.x) * (x - this.x) + (y - this.y) * (y - this.y) < nodeRadius * nodeRadius;
        }
    }

    /*
     Portions of this file are adapted from:

     Copyright (c) 2010 Evan Wallace
     Finite State Machine Designer (https://madebyevan.com/fsm/)
     Licensed under the MIT License

     Modifications:
     Copyright (c) 2025 Mohammed Mowla and Parth Patel
     Licensed under the MIT Licenses
    */
    var arrows = [];
    function circleFromThreePoints(x1, y1, x2, y2, x3, y3) {
        var a = det(x1, y1, 1, x2, y2, 1, x3, y3, 1);
        var bx = -det(x1 * x1 + y1 * y1, y1, 1, x2 * x2 + y2 * y2, y2, 1, x3 * x3 + y3 * y3, y3, 1);
        var by = det(x1 * x1 + y1 * y1, x1, 1, x2 * x2 + y2 * y2, x2, 1, x3 * x3 + y3 * y3, x3, 1);
        var c = -det(x1 * x1 + y1 * y1, x1, y1, x2 * x2 + y2 * y2, x2, y2, x3 * x3 + y3 * y3, x3, y3);
        return {
            'x': -bx / (2 * a),
            'y': -by / (2 * a),
            'radius': Math.sqrt(bx * bx + by * by - 4 * a * c) / (2 * Math.abs(a))
        };
    }
    function det(a, b, c, d, e, f, g, h, i) {
        return a * e * i + b * f * g + c * d * h - a * f * h - b * d * i - c * e * g;
    }
    class Arrow {
        constructor(startCircle, endCircle) {
            this.startCircle = startCircle;
            this.endCircle = endCircle;
            this.text = '';
            this.lineAngleAdjust = 0;
            // Make anchor point relative to the locations of start and end circles
            this.parallelPart = 0.5; // percent from start to end circle
            this.perpendicularPart = 0; // pixels from start to end circle
            this.transition = new Set();
        }
        getAnchorPoint() {
            var dx = this.endCircle.x - this.startCircle.x;
            var dy = this.endCircle.y - this.startCircle.y;
            var scale = Math.sqrt(dx * dx + dy * dy);
            return {
                'x': this.startCircle.x + dx * this.parallelPart - dy * this.perpendicularPart / scale,
                'y': this.startCircle.y + dy * this.parallelPart + dx * this.perpendicularPart / scale
            };
        }
        setAnchorPoint(x, y) {
            var dx = this.endCircle.x - this.startCircle.x;
            var dy = this.endCircle.y - this.startCircle.y;
            var scale = Math.sqrt(dx * dx + dy * dy);
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
                var midX = (this.startCircle.x + this.endCircle.x) / 2;
                var midY = (this.startCircle.y + this.endCircle.y) / 2;
                var start = this.startCircle.closestPointOnCircle(midX, midY);
                var end = this.endCircle.closestPointOnCircle(midX, midY);
                return {
                    'hasCircle': false,
                    'startX': start.x,
                    'startY': start.y,
                    'endX': end.x,
                    'endY': end.y,
                };
            }
            var anchor = this.getAnchorPoint();
            var circle = circleFromThreePoints(this.startCircle.x, this.startCircle.y, this.endCircle.x, this.endCircle.y, anchor.x, anchor.y);
            var isReversed = (this.perpendicularPart > 0);
            var reverseScale = isReversed ? 1 : -1;
            var startAngle = Math.atan2(this.startCircle.y - circle.y, this.startCircle.x - circle.x) - reverseScale * nodeRadius / circle.radius;
            var endAngle = Math.atan2(this.endCircle.y - circle.y, this.endCircle.x - circle.x) + reverseScale * nodeRadius / circle.radius;
            var startX = circle.x + circle.radius * Math.cos(startAngle);
            var startY = circle.y + circle.radius * Math.sin(startAngle);
            var endX = circle.x + circle.radius * Math.cos(endAngle);
            var endY = circle.y + circle.radius * Math.sin(endAngle);
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
        draw(ctx) {
            var pointInfo = this.getEndPointsAndCircle();
            // draw arc
            ctx.beginPath();
            if (pointInfo.hasCircle && pointInfo.circleX) {
                ctx.arc(pointInfo.circleX, pointInfo.circleY, pointInfo.circleRadius, pointInfo.startAngle, pointInfo.endAngle, pointInfo.isReversed);
            }
            else {
                ctx.moveTo(pointInfo.startX, pointInfo.startY);
                ctx.lineTo(pointInfo.endX, pointInfo.endY);
            }
            ctx.stroke();
            // draw the head of the arrow
            if (pointInfo.hasCircle && pointInfo.endAngle) {
                drawArrow(ctx, pointInfo.endX, pointInfo.endY, pointInfo.endAngle - pointInfo.reverseScale * (Math.PI / 2));
            }
            else {
                drawArrow(ctx, pointInfo.endX, pointInfo.endY, Math.atan2(pointInfo.endY - pointInfo.startY, pointInfo.endX - pointInfo.startX));
            }
            if (pointInfo.hasCircle) {
                var startAngle = pointInfo.startAngle;
                var endAngle = pointInfo.endAngle;
                if (endAngle != null && startAngle != null && endAngle < startAngle) {
                    endAngle += Math.PI * 2;
                }
                if (startAngle != null && endAngle != null && pointInfo.circleRadius != null) {
                    var textAngle = (startAngle + endAngle) / 2 + (pointInfo.isReversed ? 1 : 0) * Math.PI;
                    var textX = pointInfo.circleX + pointInfo.circleRadius * Math.cos(textAngle);
                    var textY = pointInfo.circleY + pointInfo.circleRadius * Math.sin(textAngle);
                    drawText(ctx, this.text, textX, textY, textAngle);
                }
            }
            else {
                var textX = (pointInfo.startX + pointInfo.endX) / 2;
                var textY = (pointInfo.startY + pointInfo.endY) / 2;
                var textAngle = Math.atan2(pointInfo.endX - pointInfo.startX, pointInfo.startY - pointInfo.endY);
                drawText(ctx, this.text, textX, textY, textAngle + this.lineAngleAdjust);
            }
        }
        containsPoint(x, y) {
            var stuff = this.getEndPointsAndCircle();
            if (stuff.hasCircle && stuff.circleX) {
                var dx = x - stuff.circleX;
                var dy = y - stuff.circleY;
                var distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;
                if (Math.abs(distance) < hitTargetPadding) {
                    var angle = Math.atan2(dy, dx);
                    var startAngle = stuff.startAngle;
                    var endAngle = stuff.endAngle;
                    if (stuff.isReversed) {
                        var temp = startAngle;
                        startAngle = endAngle;
                        endAngle = temp;
                    }
                    if (endAngle < startAngle) {
                        endAngle += Math.PI * 2;
                    }
                    if (angle < startAngle) {
                        angle += Math.PI * 2;
                    }
                    else if (angle > endAngle) {
                        angle -= Math.PI * 2;
                    }
                    return (angle > startAngle && angle < endAngle);
                }
            }
            else {
                var dx = stuff.endX - stuff.startX;
                var dy = stuff.endY - stuff.startY;
                var length = Math.sqrt(dx * dx + dy * dy);
                var percent = (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
                var distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
                return (percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding);
            }
            return false;
        }
    }

    /*
     Portions of this file are adapted from:

     Copyright (c) 2010 Evan Wallace
     Finite State Machine Designer (https://madebyevan.com/fsm/)
     Licensed under the MIT License

     Modifications:
     Copyright (c) 2025 Mohammed Mowla and Parth Patel
     Licensed under the MIT Licenses
    */
    class SelfArrow {
        constructor(pointsToCircle, point) {
            this.circle = pointsToCircle;
            this.startCircle = pointsToCircle;
            this.endCircle = pointsToCircle;
            this.anchorAngle = 0;
            this.mouseOffsetAngle = 0;
            this.text = '';
            this.transition = new Set();
            this.point = point;
            if (point) {
                this.setAnchorPoint(point.x, point.y);
            }
        }
        draw(ctx) {
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
        setMouseStart(x, y) {
            this.mouseOffsetAngle = this.anchorAngle - Math.atan2(y - this.circle.y, x - this.circle.x);
        }
        setAnchorPoint(x, y) {
            this.anchorAngle = Math.atan2(y - this.circle.y, x - this.circle.x) + this.mouseOffsetAngle;
            // snap to 90 degrees
            var snap = Math.round(this.anchorAngle / (Math.PI / 2)) * (Math.PI / 2);
            if (Math.abs(this.anchorAngle - snap) < 0.1)
                this.anchorAngle = snap;
            // keep in the range -pi to pi so our containsPoint() function always works
            if (this.anchorAngle < -Math.PI)
                this.anchorAngle += 2 * Math.PI;
            if (this.anchorAngle > Math.PI)
                this.anchorAngle -= 2 * Math.PI;
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
        containsPoint(x, y) {
            var stuff = this.getEndPointsAndCircle();
            var dx = x - stuff.circleX;
            var dy = y - stuff.circleY;
            var distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;
            return (Math.abs(distance) < hitTargetPadding);
        }
    }

    /*
     Portions of this file are adapted from:

     Copyright (c) 2010 Evan Wallace
     Finite State Machine Designer (https://madebyevan.com/fsm/)
     Licensed under the MIT License

     Modifications:
     Copyright (c) 2025 Mohammed Mowla and Parth Patel
     Licensed under the MIT Licenses
    */
    // The startState will be an EntryArrow. If you wish to
    // access the start state node itself, you can use the
    // pointsToCircle attribute of the EntryArrow to do so.
    // Since we are not storing the EntryArrow itself as an
    // attribute for Circles, it was best that the startState
    // was set to the EntryArrow instead of its Circle
    var startState = null;
    // Since the startState will be imported, it cannot be reassigned
    // as usual, so this setter method will enable you to do so
    function setStartState(newEntryArrow) {
        startState = newEntryArrow;
    }
    class EntryArrow {
        constructor(pointsToCircle, startPoint) {
            this.pointsToCircle = pointsToCircle;
            this.deltaX = 0;
            this.deltaY = 0;
            this.startPoint = startPoint;
            // this.text = ''
            if (startPoint) {
                this.setAnchorPoint(startPoint.x, startPoint.y);
            }
        }
        draw(ctx) {
            var points = this.getEndPoints();
            ctx.beginPath();
            ctx.moveTo(points.startX, points.startY);
            ctx.lineTo(points.endX, points.endY);
            ctx.stroke();
            // Draw the text at the end without the fillrow
            var textAngle = Math.atan2(points.startY - points.endY, points.startX - points.endX);
            drawText(ctx, "", points.startX, points.startY, textAngle);
            // Draw the head of the arrow
            drawArrow(ctx, points.endX, points.endY, Math.atan2(-this.deltaY, -this.deltaX));
        }
        setAnchorPoint(x, y) {
            this.deltaX = x - this.pointsToCircle.x;
            this.deltaY = y - this.pointsToCircle.y;
            if (Math.abs(this.deltaX) < snapToPadding)
                this.deltaX = 0;
            if (Math.abs(this.deltaY) < snapToPadding)
                this.deltaY = 0;
        }
        getEndPoints() {
            var startX = this.pointsToCircle.x + this.deltaX;
            var startY = this.pointsToCircle.y + this.deltaY;
            var end = this.pointsToCircle.closestPointOnCircle(startX, startY);
            return {
                'startX': startX,
                'startY': startY,
                'endX': end.x,
                'endY': end.y,
            };
        }
        containsPoint(x, y) {
            var lineInfo = this.getEndPoints();
            var dx = lineInfo.endX - lineInfo.startX;
            var dy = lineInfo.endY - lineInfo.startY;
            var length = Math.sqrt(dx * dx + dy * dy);
            var percent = (dx * (x - lineInfo.startX) + dy * (y - lineInfo.startY)) / (length * length);
            var distance = (dx * (y - lineInfo.startY) - dy * (x - lineInfo.startX)) / length;
            return (percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding);
        }
    }

    /*
     Portions of this file are adapted from:

     Copyright (c) 2010 Evan Wallace
     Finite State Machine Designer (https://madebyevan.com/fsm/)
     Licensed under the MIT License

     Modifications:
     Copyright (c) 2025 Mohammed Mowla and Parth Patel
     Licensed under the MIT Licenses
    */
    class TemporaryArrow {
        constructor(startPoint, endPoint) {
            this.startPoint = startPoint;
            this.endPoint = endPoint;
        }
        draw(ctx) {
            ctx.beginPath();
            ctx.moveTo(this.endPoint.x, this.endPoint.y);
            ctx.lineTo(this.startPoint.x, this.startPoint.y);
            ctx.stroke();
            drawArrow(ctx, this.endPoint.x, this.endPoint.y, Math.atan2(this.endPoint.y - this.startPoint.y, this.endPoint.x - this.startPoint.x));
        }
    }

    class TrieNode {
        constructor() {
            this.children = new Map;
            this.isTerminal = false;
        }
    }
    class Trie {
        constructor() {
            this.root = new TrieNode();
        }
        insert(word) {
            let node = this.root;
            for (const char of word) {
                if (!node.children.has(char)) {
                    node.children.set(char, new TrieNode());
                }
                node = node.children.get(char);
            }
            node.isTerminal = true;
        }
        isPrefix(prefix) {
            let node = this.root;
            for (const char of prefix) {
                const next = node.children.get(char);
                if (!next) {
                    return false;
                }
                node = next;
            }
            return true;
        }
        contains(word) {
            let node = this.root;
            for (const char of word) {
                const next = node.children.get(char);
                if (!next) {
                    return false;
                }
                node = next;
            }
            return node.isTerminal;
        }
    }

    /**
     * TransitionLabelInputValidator
     *
     * This component performs incremental, prefix-based validation of transition
     * labels as the user types. It intentionally does NOT tokenize input or emit
     * symbols. Instead, it enforces that every keystroke keeps the current input
     * as a valid prefix of some symbol in the user-defined alphabet.
     *
     * Design rationale:
     * - Input is committed by UI interaction (arrow deselection), not by syntax.
     * - Invalid symbols are prevented at the point of entry, eliminating the need
     *   for post-hoc validation or token streams.
     * - Multi-character symbols, overlapping prefixes, and escape sequences are
     *   naturally supported via a Trie.
     *
     * This design mirrors editor-style validation rather than compiler-style
     * lexing, which better fits an interactive automata editor.
     *
     * Responsibilities:
     * - Maintain a buffer for the *current symbol* being typed
     * - Validate keystrokes using a Trie (prefix-based)
     * - Allow commas as separators
     * - Support backspace
     *
     * Non-responsibilities:
     * - Token emission
     * - Commit logic
     * - Escape replacement (handled elsewhere)
     */
    class TransitionLabelInputValidator {
        constructor(alphabet) {
            this.buffer = "";
            this.trie = new Trie();
            for (const symbol of alphabet) {
                this.trie.insert(symbol);
            }
        }
        /**
         * Returns true if the character is allowed to be typed.
         * If allowed, internal state is updated.
         */
        handleChar(char) {
            console.log("Handling char:", char);
            // Always allow commas — they separate symbols
            if (char === ",") {
                this.reset();
                console.log("Comma typed, buffer reset");
                return true;
            }
            const nextBuffer = this.buffer + char;
            console.log("New buffer to check:", nextBuffer);
            // Check prefix validity
            if (this.trie.isPrefix(nextBuffer)) {
                this.buffer = nextBuffer;
                console.log("Valid prefix, buffer updated:", this.buffer);
                return true;
            }
            // Invalid prefix → reject keystroke
            console.log("Invalid prefix, keystroke rejected");
            return false;
        }
        /**
         * Handles backspace.
         * Returns true if backspace should be allowed.
         */
        handleBackspace(currentText) {
            if (currentText.length === 0) {
                this.reset();
                return true;
            }
            const lastChar = currentText[currentText.length - 1];
            // If we backspaced over a comma, rebuild buffer
            if (lastChar === ",") {
                this.rebuildBufferFromText(currentText.slice(0, -1));
                return true;
            }
            // Normal character backspace
            this.buffer = this.buffer.slice(0, -1);
            return true;
        }
        /**
         * Clears the internal buffer.
         * Call this when:
         * - Arrow is deselected
         * - Arrow selection changes
         */
        reset() {
            this.buffer = "";
        }
        getBuffer() {
            return this.buffer;
        }
        setBuffer(newBuffer) {
            this.rebuildBufferFromText(newBuffer);
        }
        /**
         * Rebuilds buffer based on the text after backspacing a comma.
         * We only care about the *current symbol* (after last comma).
         */
        rebuildBufferFromText(text) {
            const parts = text.split(",");
            this.buffer = parts.length > 0
                ? parts[parts.length - 1]
                : "";
        }
    }

    // The alphabet defines every character that can be used in the DFA.
    // For easier usage, it has been defined as a Set.
    var alphabet = new Set(["0", "1"]);
    var transitionLabelInputValidator = new TransitionLabelInputValidator(alphabet); // Input validator for transition labels
    // Since the alphabet is being imported, it cannot be reassigned
    // directly. So, this is a setter method for it.
    function setAlphabet(newAlphabet) {
        transitionLabelInputValidator = new TransitionLabelInputValidator(newAlphabet); // Input validator for transition labels
        alphabet = newAlphabet;
    }

    // Main function that converts a row input string into
    // tokens according to the alphabet and delimiter rules.
    function parseInputString(input, alphabet) {
        // Remove leading and trailing whitespace from the input
        const trimmed = input.trim();
        if (trimmed.length === 0) {
            return { success: true, tokens: [] };
        }
        // Check for presence of commas
        const hasComma = trimmed.includes(",");
        // Check if the input contains ANY whitespace characters.
        // \s matches spaces, tabs, and newlines.
        const hasWhitespace = /\s/.test(trimmed);
        // If both commas and spaces are used, reject the input
        // to avoid ambiguous tokenization.
        if (hasComma && hasWhitespace) {
            return {
                success: false,
                error: "Input string contains both commas and whitespace as separators. Please use only one type of separator.",
            };
        }
        // This array will store the final list of tokens
        let tokens = [];
        // Case 1: Comma-separated input
        if (hasComma) {
            // Split the string at commas
            tokens = trimmed
                .split(",")
                // Remove
                .map((s) => s.trim())
                // Remove empty tokens (e.g., consecutive commas like ",,")
                .filter(Boolean);
        }
        // Case 2: Whitespace-separated input
        else if (hasWhitespace) {
            // Split the string at any whitespace character(s)
            tokens = trimmed
                .split(/\s+/)
                // Remove empty tokens (in case of multiple spaces)
                .filter(Boolean);
        }
        // Case 3: No separators, treat each character as a token
        else {
            // Check if all alphabet symbols are single characters
            const allSingleChar = [...alphabet].every((sym) => sym.length === 1);
            // If multiple-character symbols exist in the alphabet,
            // check to see if the input can form valid symbols.
            // This handles the edge case where the input only
            // contains one element, which also happens to be
            // a multi-character symbol.
            if (!allSingleChar) {
                transitionLabelInputValidator.reset();
                // Validate the entire input as a single token
                for (const char of trimmed) {
                    if (!transitionLabelInputValidator.handleChar(char)) {
                        return {
                            success: false,
                            error: `The element '${trimmed}' is not in the alphabet. This input is invalid. Please check if you need to use spaces or commas between symbols in your input.`,
                        };
                    }
                }
                tokens.push(trimmed);
                transitionLabelInputValidator.reset();
            }
            else {
                // Split the input into individual characters
                tokens = trimmed.split("");
            }
        }
        let notDefined = [];
        // Validate that each token is in the alphabet
        for (const token of tokens) {
            // If a token is not in the alphabet, return an error
            if (!alphabet.has(token)) {
                notDefined.push(token);
            }
        }
        if (notDefined.length == 1) {
            return {
                success: false,
                error: `Symbol '${notDefined[0]}' is not in the alphabet. This input is invalid.`,
            };
        }
        else if (notDefined.length > 1) {
            return {
                success: false,
                error: `Symbols '${notDefined.toString()}' are not in the alphabet. This input is invalid.`,
            };
        }
        else {
            // If everything is valid, return the list of tokens
            return { success: true, tokens };
        }
    }

    // I haven't figured out how to stop compiling the imports into JS, so here's a command
    // to get rid of them once you cd into their directory lol:
    // rm alphabet.js && rm arrow.js && rm circle.js && rm draw.js && rm EntryArrow.js && rm SelfArrow.js
    // This is a "correctness" check: does the new transition coincide
    // with other transitions going out from that state? If it does,
    // then it fails determinism.
    function transitionDeterminismCheck(lastEditedArrow) {
        if (lastEditedArrow === null) {
            return false;
        }
        if (lastEditedArrow.text === "") {
            lastEditedArrow.transition = new Set();
            console.log("Empty transition, accepted");
            return true;
        }
        // Leaving this here commented-out, for debugging purposes if the
        // need for it arises.
        // printTransitions();
        // Note: the code below will cover both the Arrow and the SelfArrow.
        // We won't need to split them into two separate cases.
        // This is because Arrow and SelfArrow both contain the startCircle
        // and endCircle attributes.
        // You don't want to check the transition for this current arrow
        // when iterating through all the arrows, so just empty it here.
        // If the transition is incorrect, then it'll remain empty.
        // If the transition is correct, then we'll reassign it to a new
        // value after all the checks.
        lastEditedArrow.transition = new Set();
        // The regex will remove any trailing/leading commas and whitespace
        const newTransitions = lastEditedArrow.text.replace(/^[,\s]+|[,\s]+$/g, "").split(",");
        // When you're typing the transition, the keydown listener checks if the
        // key pressed is in the alphabet. However, this is not enough.
        // This for-loop here will check if the entire transition itself is defined
        // in the alphabet.
        // For example, if the alphabet is {0,1}, but the transition is {00,01}, then
        // it should not work, since "00" and "01" are not in the alphabet.
        for (const newTransition of newTransitions) {
            if (!alphabet.has(newTransition)) {
                lastEditedArrow.text = "";
                alert("\'" + newTransition + "\' has not been defined in the alphabet!");
                return false;
            }
        }
        // Check the outArrows of the initial node
        const startCircOutArrows = lastEditedArrow.startCircle.outArrows;
        // Keep track of all invalid transitions to be printed to the user later
        const existingTransitions = [];
        // You iterate through every arrow that goes outwards from this current node
        for (const arrow of startCircOutArrows) {
            const oldTransitions = arrow.transition;
            // Then, you iterate through each of the old transitions for each arrow
            for (const oldTransition of oldTransitions) {
                // Next, you iterate through each transition in the new
                // transition, and compare it against each transition
                // in the original transition for that arrow
                for (const newTransition of newTransitions) {
                    // If a transition already exists, then it fails determinism
                    if (newTransition === oldTransition) {
                        lastEditedArrow.text = "";
                        existingTransitions.push(newTransition);
                    }
                }
            }
        }
        if (existingTransitions.length == 1) {
            alert("This translation violates determinism since \'" + existingTransitions[0] + "\' is already present for an outgoing arrow of this node");
            return false;
        }
        else if (existingTransitions.length > 1) {
            alert("This translation violates determinism since \'" + existingTransitions.toString() + "\' are already present for an outgoing arrows of this node");
            return false;
        }
        else {
            // Update the transition with the new one
            lastEditedArrow.transition = new Set(newTransitions);
            lastEditedArrow.text = lastEditedArrow.transition.values().toArray().join(",");
            return true;
        }
    }
    // function printTransitions(){
    //   console.log("Printing transitions");
    //   for(let circle of circles){
    //     console.log("Num of trans for circle " + circle.text + " is: " + circle.outArrows.size);
    //     console.log("Trans for circle: " + circle.text + "{ ");
    //     const outArrows = circle.outArrows;
    //     for(let arrow of outArrows){
    //       console.log(arrow.transition);
    //     }
    //     console.log("}");
    //   }
    // }
    // This is a "completeness" check: were all characters of the
    // alphabet used when building the DFA? This is processed
    // every time we input a string.
    function inputDeterminismCheck() {
        // We iterate over every single state
        for (const node of circles) {
            // We retrieve the outgoing arrows from the current state
            const outArrows = node.outArrows;
            for (const char of alphabet) {
                // The "exists" variable will be used to track if
                // this specific character in the alphabet has been
                // used as a transition or not for this specific state
                let exists = false;
                // We iterate over all the outgoing arrows from the
                // current state
                for (const arrow of outArrows) {
                    // Then, for each arrow, we iterate over every
                    // transition for it.
                    for (const transition of arrow.transition) {
                        // If the current character in the alphabet
                        // does exist as a transition for this current
                        // state, then exists = true and we break out
                        // of this loop.
                        if (char === transition) {
                            exists = true;
                            break;
                        }
                        // If the transition does not exist in the alphabet,
                        // then immediately return false, since it violates
                        // determinism.
                        if (!alphabet.has(transition)) {
                            alert("Transition " + transition + " for state " + node.text + " has not been defined in the alphabet");
                            return false;
                        }
                    }
                }
                // If we iterated over all the transitions for all the outgoing
                // arrows of this state, and the current character in the alphabet
                // was not found to be a transition at all, then it fails determinism
                if (!exists) {
                    alert(char + " has not been implemented for this state: " + node.text + "; not all characters from alphabet were used");
                    return false;
                }
            }
        }
        return true;
    }
    function dfaAlgo(input) {
        let acceptStateExists = false;
        for (const circle of circles) {
            if (circle.isAccept) {
                acceptStateExists = true;
                break;
            }
        }
        if (startState === null && !acceptStateExists) {
            alert("Start state and accept states are both undefined!");
            return false;
        }
        else if (startState === null) {
            alert("Start state undefined!");
            return false;
        }
        else if (!acceptStateExists) {
            alert("Accept state undefined!");
            return false;
        }
        // First, we make sure the input string is legal. If it contains
        // characters not defined in the alphabet, then we return false immediately.
        // for(const char of input){
        //   if(!alphabet.has(char)){
        //     alert("Input contains \'" + char + "\', which is not in the alphabet");
        //     return false;
        //   }
        // }
        const parseResult = parseInputString(input, alphabet);
        if (!parseResult.success) {
            alert(parseResult.error);
            return false;
        }
        const tokens = parseResult.tokens;
        // This "curr" variable will be used to traverse over the whole DFA
        let curr = startState.pointsToCircle;
        // We check if the DFA has been defined correctly. If not, then return false.
        if (!inputDeterminismCheck()) {
            return false;
        }
        // We begin traversing the input string.
        for (const char of tokens) {
            // We go through every outgoing arrow for the 
            // current state.
            const currOutArrows = curr.outArrows;
            //console.log("Char: " + char);
            for (const arrow of currOutArrows) {
                //console.log("At: " + curr.text);
                //console.log("Checking transition: " + arrow.transition);
                // If the current character from the input string
                // is found in one of the transitions, then we 
                // use that transition to move to the next state.
                if (arrow.transition.has(char)) {
                    //console.log("Taking transition: " + arrow.transition + " to node " + arrow.endCircle.text);
                    curr = arrow.endCircle;
                    break;
                }
            }
        }
        //console.log("Finally at: " + curr.text);
        // If the final state that we arrived at is the end state,
        // that means the string was accepted.
        if (curr.isAccept) {
            alert("The string, \"" + tokens.toString() + "\", was accepted!");
            //console.log("Accepted!");
            return true;
        }
        // Else, the final state we arrived at is not the end state,
        // which means the string was rejected.
        else {
            alert("The string, \"" + tokens.toString() + "\", was rejected!");
            //console.log("Rejected!");
            return false;
        }
    }

    /*
     Portions of this file are adapted from:

     Copyright (c) 2010 Evan Wallace
     Finite State Machine Designer (https://madebyevan.com/fsm/)
     Licensed under the MIT License

     Modifications:
     Copyright (c) 2025 Mohammed Mowla and Parth Patel
     Licensed under the MIT Licenses
    */
    class ExportAsSVG {
        constructor(canvas, alphabet) {
            this.type = "svg";
            if (!canvas) {
                throw new Error('A valid HTMLCanvasElement is required');
            }
            this.canvas = canvas;
            this.alphabet = alphabet;
            this.fillStyle = 'black';
            this.strokeStyle = 'black';
            this.lineWidth = 1;
            this.font = '12px Arial, sans-serif';
            this._points = [];
            this._svgData = '';
            this._transX = 0;
            this._transY = 0;
            this.faObject = null;
        }
        toSVG() {
            return '<?xml version="1.0" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "https://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n\n<svg width="800" height="600" version="1.1" xmlns="http://www.w3.org/2000/svg">\n' + this._svgData + '</svg>\n';
        }
        // Reset 
        beginPath() {
            this._points = [];
        }
        arc(x, y, radius, startAngle, endAngle, isReversed) {
            x += this._transX;
            y += this._transY;
            let style = 'stroke="' + this.strokeStyle + '" stroke-width="' + this.lineWidth + '" fill="none"';
            if (endAngle - startAngle == Math.PI * 2) {
                // Comment  for a circle for easy importing
                if (this.faObject instanceof Circle) {
                    this._svgData = addCircleComment(CALLERS.SVG, this._svgData, this.faObject.id, x, y, this.faObject.isAccept, this.faObject.text);
                }
                this._svgData += '\t<ellipse ' + style + ' cx="' + fixed(x, 3) + '" cy="' + fixed(y, 3) + '" rx="' + fixed(radius, 3) + '" ry="' + fixed(radius, 3) + '"/>\n';
            }
            else {
                if (this.faObject instanceof Arrow) {
                    this._svgData = addCurvedArrowComment(CALLERS.SVG, this._svgData, this.faObject.startCircle.id, this.faObject.endCircle.id, this.faObject.parallelPart, this.faObject.perpendicularPart, this.faObject.text);
                }
                else if (this.faObject instanceof SelfArrow) {
                    const centerPoint = this.faObject.getEndPointsAndCircle();
                    this._svgData = addSelfArrowComment(CALLERS.SVG, this._svgData, this.faObject.circle.id, centerPoint.circleX, centerPoint.circleY, this.faObject.text);
                }
                if (isReversed) {
                    let temp = startAngle;
                    startAngle = endAngle;
                    endAngle = temp;
                }
                if (endAngle < startAngle) {
                    endAngle += Math.PI * 2;
                }
                let startX = x + radius * Math.cos(startAngle);
                let startY = y + radius * Math.sin(startAngle);
                let endX = x + radius * Math.cos(endAngle);
                let endY = y + radius * Math.sin(endAngle);
                let useGreaterThan180 = (Math.abs(endAngle - startAngle) > Math.PI);
                this._svgData += '\t<path ' + style + ' d="';
                this._svgData += 'M ' + fixed(startX, 3) + ',' + fixed(startY, 3) + ' '; // startPoint(startX, startY)
                this._svgData += 'A ' + fixed(radius, 3) + ',' + fixed(radius, 3) + ' '; // radii(radius, radius)
                this._svgData += '0 '; // value of 0 means perfect circle, others mean ellipse
                this._svgData += +useGreaterThan180 + ' ';
                this._svgData += 1 + ' ';
                this._svgData += fixed(endX, 3) + ',' + fixed(endY, 3); // endPoint(endX, endY)
                this._svgData += '"/>\n';
            }
        }
        ;
        moveTo(x, y) {
            x += this._transX;
            y += this._transY;
            this._points.push({ x, y });
        }
        lineTo(x, y) {
            x += this._transX;
            y += this._transY;
            this._points.push({ x, y });
        }
        stroke() {
            if (this._points.length == 0)
                return;
            if (this.faObject instanceof Arrow) {
                this._svgData = addStraightArrowComment(CALLERS.SVG, this._svgData, this.faObject.startCircle.id, this.faObject.endCircle.id, this.faObject.text);
            }
            else if (this.faObject instanceof EntryArrow) {
                const points = this.faObject.getEndPoints();
                this._svgData = addEntryArrowComment(CALLERS.SVG, this._svgData, this.faObject.pointsToCircle.id, points.startX, points.startY);
            }
            this._svgData += '\t<polygon stroke="' + this.strokeStyle + '" stroke-width="' + this.lineWidth + '" points="';
            for (let i = 0; i < this._points.length; i++) {
                this._svgData += (i > 0 ? ' ' : '') + fixed(this._points[i].x, 3) + ',' + fixed(this._points[i].y, 3);
            }
            this._svgData += '"/>\n';
        }
        fill() {
            if (this._points.length == 0)
                return;
            this._svgData += '\t<polygon fill="' + this.fillStyle + '" stroke-width="' + this.lineWidth + '" points="';
            for (let i = 0; i < this._points.length; i++) {
                this._svgData += (i > 0 ? ' ' : '') + fixed(this._points[i].x, 3) + ',' + fixed(this._points[i].y, 3);
            }
            this._svgData += '"/>\n';
        }
        measureText(text) {
            const c = this.canvas.getContext('2d');
            if (c) {
                c.font = '20px "Times New Roman", serif';
                return c.measureText(text);
            }
            return { width: 0 };
        }
        fillText(text, x, y) {
            x += this._transX;
            y += this._transY;
            if (text.replace(' ', '').length > 0) {
                this._svgData += '\t<text x="' + fixed(x, 3) + '" y="' + fixed(y, 3) + '" font-family="Times New Roman" font-size="20">' + textToXML(text) + '</text>\n';
            }
        }
        translate(x, y) {
            this._transX = x;
            this._transY = y;
        }
        ;
        addAlphabet() {
            this._svgData = addAlphabetComment(CALLERS.SVG, this._svgData, this.alphabet);
        }
        save() {
            // No-op for SVG export
        }
        restore() {
            // No-op for SVG export
        }
        clearRect() {
            // No-op for SVG export
        }
    }

    /*
     Portions of this file are adapted from:

     Copyright (c) 2010 Evan Wallace
     Finite State Machine Designer (https://madebyevan.com/fsm/)
     Licensed under the MIT License

     Modifications:
     Copyright (c) 2025 Mohammed Mowla and Parth Patel
     Licensed under the MIT Licenses
    */
    class ExportAsLaTeX {
        constructor(canvas, alphabet) {
            this.type = "latex";
            if (!canvas) {
                throw new Error('A valid HTMLCanvasElement is required');
            }
            this.canvas = canvas;
            this.alphabet = alphabet;
            this.strokeStyle = 'black';
            this.font = '20px "Times New Romain", serif';
            this._points = [];
            this._texData = '';
            this._scale = 0.1;
            this.faObject = null;
        }
        toLaTeX() {
            return '\\documentclass[12pt]{article}\n' +
                '\\usepackage{tikz}\n' +
                '\n' +
                '\\begin{document}\n' +
                '\n' +
                '\\begin{center}\n' +
                '\\begin{tikzpicture}[scale=0.2]\n' +
                '\\tikzstyle{every node}+=[inner sep=0pt]\n' +
                this._texData +
                '\\end{tikzpicture}\n' +
                '\\end{center}\n' +
                '\n' +
                '\\end{document}\n';
        }
        // Reset 
        beginPath() {
            this._points = [];
        }
        arc(x, y, radius, startAngle, endAngle, isReversed) {
            let trueX = x;
            let trueY = y;
            x *= this._scale;
            y *= this._scale;
            radius *= this._scale;
            if (endAngle - startAngle == Math.PI * 2) {
                if (this.faObject instanceof Circle) {
                    this._texData = addCircleComment(CALLERS.LATEX, this._texData, this.faObject.id, trueX, trueY, this.faObject.isAccept, this.faObject.text);
                }
                this._texData += '\\draw [' + this.strokeStyle + '] (' + fixed(x, 3) + ',' + fixed(-y, 3) + ') circle (' + fixed(radius, 3) + ');\n';
            }
            else {
                if (this.faObject instanceof Arrow) {
                    this._texData = addCurvedArrowComment(CALLERS.LATEX, this._texData, this.faObject.startCircle.id, this.faObject.endCircle.id, this.faObject.parallelPart, this.faObject.perpendicularPart, this.faObject.text);
                }
                else if (this.faObject instanceof SelfArrow) {
                    const centerPoint = this.faObject.getEndPointsAndCircle();
                    this._texData = addSelfArrowComment(CALLERS.LATEX, this._texData, this.faObject.circle.id, centerPoint.circleX, centerPoint.circleY, this.faObject.text);
                }
                if (isReversed) {
                    var temp = startAngle;
                    startAngle = endAngle;
                    endAngle = temp;
                }
                if (endAngle < startAngle) {
                    endAngle += Math.PI * 2;
                }
                // TikZ needs the angles to be in between -2pi and 2pi or it breaks
                if (Math.min(startAngle, endAngle) < -2 * Math.PI) {
                    startAngle += 2 * Math.PI;
                    endAngle += 2 * Math.PI;
                }
                else if (Math.max(startAngle, endAngle) > 2 * Math.PI) {
                    startAngle -= 2 * Math.PI;
                    endAngle -= 2 * Math.PI;
                }
                startAngle = -startAngle;
                endAngle = -endAngle;
                this._texData += '\\draw [' + this.strokeStyle + '] (' + fixed(x + radius * Math.cos(startAngle), 3) + ',' + fixed(-y + radius * Math.sin(startAngle), 3) + ') arc (' + fixed(startAngle * 180 / Math.PI, 5) + ':' + fixed(endAngle * 180 / Math.PI, 5) + ':' + fixed(radius, 3) + ');\n';
            }
        }
        ;
        moveTo(x, y) {
            x *= this._scale;
            y *= this._scale;
            this._points.push({ x, y });
        }
        lineTo(x, y) {
            x *= this._scale;
            y *= this._scale;
            this._points.push({ x, y });
        }
        stroke() {
            if (this._points.length == 0)
                return;
            if (this.faObject instanceof Arrow) {
                this._texData = addStraightArrowComment(CALLERS.LATEX, this._texData, this.faObject.startCircle.id, this.faObject.endCircle.id, this.faObject.text);
            }
            else if (this.faObject instanceof EntryArrow) {
                const points = this.faObject.getEndPoints();
                this._texData = addEntryArrowComment(CALLERS.LATEX, this._texData, this.faObject.pointsToCircle.id, points.startX, points.startY);
            }
            this._texData += '\\draw [' + this.strokeStyle + ']';
            for (var i = 0; i < this._points.length; i++) {
                var p = this._points[i];
                this._texData += (i > 0 ? ' --' : '') + ' (' + fixed(p.x, 2) + ',' + fixed(-p.y, 2) + ')';
            }
            this._texData += ';\n';
        }
        fill() {
            if (this._points.length == 0)
                return;
            this._texData += '\\fill [' + this.strokeStyle + ']';
            for (var i = 0; i < this._points.length; i++) {
                var p = this._points[i];
                this._texData += (i > 0 ? ' --' : '') + ' (' + fixed(p.x, 2) + ',' + fixed(-p.y, 2) + ')';
            }
            this._texData += ';\n';
        }
        measureText(text) {
            const c = this.canvas.getContext('2d');
            if (c) {
                c.font = '20px "Times New Romain", serif';
                return c.measureText(text);
            }
            return { width: 0 };
        }
        fillText(text, originalText, x, y, angleOrNull) {
            if (text.replace(' ', '').length > 0) {
                var nodeParams = '';
                // x and y start off as the center of the text, but will be moved to one side of the box when angleOrNull != null
                if (angleOrNull != null) {
                    var width = this.measureText(text).width;
                    var dx = Math.cos(angleOrNull);
                    var dy = Math.sin(angleOrNull);
                    if (Math.abs(dx) > Math.abs(dy)) {
                        if (dx > 0)
                            nodeParams = '[right] ', x -= width / 2;
                        else
                            nodeParams = '[left] ', x += width / 2;
                    }
                    else {
                        if (dy > 0)
                            nodeParams = '[below] ', y -= 10;
                        else
                            nodeParams = '[above] ', y += 10;
                    }
                }
                x *= this._scale;
                y *= this._scale;
                this._texData += '\\draw (' + fixed(x, 2) + ',' + fixed(-y, 2) + ') node ' + nodeParams + '{$' + originalText.replace(/ /g, '\\mbox{ }') + '$};\n';
            }
        }
        addAlphabet() {
            this._texData = addAlphabetComment(CALLERS.LATEX, this._texData, this.alphabet);
        }
        translate() {
            // No-op for LaTeX export
        }
        save() {
            // No-op for LaTeX export
        }
        restore() {
            // No-op for LaTeX export
        }
        clearRect() {
            // No-op for LaTeX export
        }
    }

    const startsWith = {
        ALPHABET: 'Alphabet:',
        CIRCLE: 'Circle:',
        STRAIGHT_ARROW: 'StraightArrow:',
        CURVED_ARROW: 'CurvedArrow:',
        SELF_ARROW: 'SelfArrow:',
        ENTRY_ARROW: 'EntryArrow:'
    };
    class Importer {
        constructor(circArr, arrowsArray, data, drawFunc) {
            this.circles = circArr;
            this.arrows = arrowsArray;
            this._svgData = data;
            this.draw = drawFunc;
        }
        clear() {
            this._svgData = '';
        }
        convert() {
            const commentRegex = /<!--\s*(.*?)\s*-->/g;
            let parsedData = [];
            let match;
            while ((match = commentRegex.exec(this._svgData)) != null) {
                const raw = match[1].trim();
                if (raw.startsWith('Circle')) {
                    // Only store circles if they don't exist because accept states draw two circles and have the same comment for the the outer and inner circles
                    if (parsedData.indexOf(raw) == -1) {
                        parsedData.push(raw);
                    }
                }
                else {
                    parsedData.push(raw);
                }
            }
            // Add the circles first because all arrows depend on them 
            for (let rawData = 0; rawData < parsedData.length; rawData++) {
                const raw = parsedData[rawData];
                if (raw.startsWith(startsWith.CIRCLE)) {
                    const [, id, x, y, accept, text] = raw.match(/id=(\w+), x=([\d.]+), y=([\d.]+), accept=(\w+), text=(.*)/);
                    // Create circle instance
                    const circle = new Circle(parseFloat(x), parseFloat(y));
                    circle.id = id;
                    circle.isAccept = accept == 'true';
                    circle.text = text;
                    this.circles.push(circle);
                }
            }
            // Run through the array again and add the arrows with the associated circles
            for (let rawData = 0; rawData < parsedData.length; rawData++) {
                const raw = parsedData[rawData];
                if (raw.startsWith(startsWith.STRAIGHT_ARROW)) {
                    const [, from, to, label] = raw.match(/from=(\w+), to=(\w+), label=(.*)/);
                    const startCircle = this.circles.find(c => c.id === from);
                    const endCircle = this.circles.find(c => c.id === to);
                    if (startCircle && endCircle) {
                        const arrow = new Arrow(startCircle, endCircle);
                        arrow.startCircle.outArrows.add(arrow); // Adds out arrow for the starting circle of the arrow
                        arrow.text = label.trim();
                        if (transitionDeterminismCheck(arrow)) {
                            this.arrows.push(arrow);
                        }
                    }
                }
                else if (raw.startsWith(startsWith.CURVED_ARROW)) {
                    const [, from, to, parallel, perpendicular, label] = raw.match(/from=(\w+), to=(\w+), parallel=([\d.]+), perpendicular=([-]?\d+(?:\.\d+)?), label=(.*)/);
                    const startCircle = this.circles.find(c => c.id === from);
                    const endCircle = this.circles.find(c => c.id === to);
                    if (startCircle && endCircle) {
                        const arrow = new Arrow(startCircle, endCircle);
                        arrow.startCircle.outArrows.add(arrow); // Adds out arrow for the starting circle of the arrow
                        arrow.text = label.trim();
                        arrow.parallelPart = parseFloat(parallel);
                        arrow.perpendicularPart = parseFloat(perpendicular);
                        if (transitionDeterminismCheck(arrow)) {
                            this.arrows.push(arrow);
                        }
                    }
                }
                else if (raw.startsWith(startsWith.SELF_ARROW)) {
                    const [, circleId, x, y, text] = raw.match(/circle=(\w+), anchor=\(([\d.]+),([\d.]+)\), text=(.*)/);
                    const circle = this.circles.find(c => c.id === circleId);
                    if (circle) {
                        const selfArrow = new SelfArrow(circle, { x: parseFloat(x), y: parseFloat(y) });
                        // Add the 
                        circle.loop = selfArrow;
                        circle.outArrows.add(selfArrow); // Adds out arrow for the circle
                        selfArrow.text = text;
                        if (transitionDeterminismCheck(selfArrow)) {
                            this.arrows.push(selfArrow);
                        }
                    }
                }
                else if (raw.startsWith(startsWith.ENTRY_ARROW)) {
                    const [, toId, x, y] = raw.match(/to=(\w+), start=\(([\d.]+),([\d.]+)\)/);
                    const circle = this.circles.find(c => c.id === toId);
                    if (circle) {
                        const entryArrow = new EntryArrow(circle, { x: parseFloat(x), y: parseFloat(y) });
                        setStartState(entryArrow);
                        this.arrows.push(entryArrow);
                    }
                }
                else if (raw.startsWith(startsWith.ALPHABET)) {
                    const [, values] = raw.match(/Alphabet:\s*(.*)/);
                    const newAlphabet = new Set(values.split(",").map(s => s.trim()));
                    setAlphabet(newAlphabet);
                }
            }
            this.draw();
        }
        normalizeText(text) {
            return text.replace(/^\s+|\s+$/g, "").replace(/\s+/g, " ");
        }
    }

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
    // The previously edited object, which is determined by the object that was last
    // under typing mode.
    // This variable is crucial to determine when the transition determinism check
    // needs to be ran, since exiting typing mode on an Arrow or SelfArrow will
    // indicate that the user has submitted their transition.
    let lastEditedArrow = null;
    // This will store the previous text of an object before it is modified by the
    // keydown listener.
    // This variable is crucial for determining when to run the transitionDeterminismCheck,
    // because if the text changes on an arrow, the transitionDeterminismCheck must run.
    // If the text never changed, then no need to run the check.
    // let oldText: string = "";
    let selectedObj = null; // Currently selected object
    let hightlightSelected = 'blue'; // Blue highlight for objects for regular selection
    let base = 'black'; // Black highlight for objects to indicate that they are not being selected
    let dragging = false; // True dragging objects is enabled, false otherwise
    let shiftPressed = false; // True if shift is pressed, false otherwise
    let startClick = null;
    let tempArrow = null; // A new arrow being created
    // Returns true if no input or focusable element is active meaning the document body has focus.
    function canvasHasFocus() {
        return (document.activeElement || document.body) == document.body;
    }
    // Check if the mouse click is inside the canvas
    const isInsideCanvas = (event, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX;
        const y = event.clientY;
        return (x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom);
    };
    function setupDfaCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return { draw: () => { } };
        function draw() {
            if (!ctx)
                return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            // ctx?.translate(0.5, 0.5);
            // Iterate through ALL circles and draw each one
            for (let circle = 0; circle < circles.length; circle++) {
                ctx.lineWidth = 1;
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
            if (startState) {
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
        canvas.addEventListener('mousedown', (event) => {
            event.preventDefault();
            let mouse = getMousePos(event);
            // Check if the mouse has clicked on an object.
            // If true, then selectedObj will be updated.
            selectedObj = mouseCollision(mouse.x, mouse.y);
            dragging = false;
            startClick = mouse;
            console.log("Last edited arrow:", lastEditedArrow?.startCircle.text, " to ", lastEditedArrow?.endCircle.text);
            // console.log("Old text:", oldText);
            console.log("Last edited arrow text:", lastEditedArrow?.text);
            console.log("Selected object: ", selectedObj instanceof Arrow || selectedObj instanceof SelfArrow ? "Arrow or SelfArrow" : "Not an Arrow or SelfArrow");
            // If the previously edited object was an Arrow or SelfArrow, AND if its text has been modified,
            // AND if the currently selected object is different from the previous edited Arrow or SelfArrow,
            // then we will run the transitionDeterminismCheck
            if (lastEditedArrow && selectedObj !== lastEditedArrow) {
                // If the transitionDeterminismCheck returns true, that means the transition is valid.
                // So, we set oldText equal to the new text of the arrow. Thus, this if-statement won't
                // activate more than once, since the 2nd condition won't be fulfilled, because oldText and
                // the text of the lastEditedArrow will be equal
                if (transitionDeterminismCheck(lastEditedArrow)) {
                    // This will sort the string in ascending order and assign it to the arrow's text,
                    // which makes it more visually appealing for the user
                    console.log("Transition determinism check passed for state ", lastEditedArrow.startCircle.id);
                    lastEditedArrow.text = lastEditedArrow.text.replace(/^[,\s]+|[,\s]+$/g, "").split(",").sort().join(",");
                    // oldText = lastEditedArrow.text;
                }
                // If the transitionDeterminismCheck returns false, that means the transition is not valid.
                // So, we set oldText equal to the empty string, since the arrow's text will also have been
                // set to the empty string inside the transitionDeterminismCheck. Thus, this if-statement won't
                // activate more than once, since the 2nd condition won't be fulfilled, because oldText and
                // the text of the lastEditedArrow will be equal
                else {
                    console.log("Transition determinism check failed for state ", lastEditedArrow.startCircle.id);
                    // oldText = "";
                }
            }
            // Update the previously edited object here
            if (selectedObj instanceof Arrow ||
                selectedObj instanceof SelfArrow) {
                lastEditedArrow = selectedObj;
                transitionLabelInputValidator.setBuffer(selectedObj.text);
            }
            if (selectedObj != null) {
                if (shiftPressed && selectedObj instanceof Circle) {
                    // Draw a SelfArrow to the selected circle
                    tempArrow = new SelfArrow(selectedObj, mouse);
                }
                else {
                    dragging = true;
                    if (selectedObj instanceof Circle || selectedObj instanceof SelfArrow) {
                        selectedObj.setMouseStart(mouse.x, mouse.y);
                    }
                }
            }
            else if (shiftPressed) {
                // Cosmetic arrow logic for interactive response
                tempArrow = new TemporaryArrow(mouse, mouse);
            }
            draw();
        });
        // If mouse is double-clicked
        canvas.addEventListener('dblclick', (event) => {
            let mouse = getMousePos(event);
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
            let mouse = getMousePos(event);
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
                    }
                    else {
                        tempArrow = new TemporaryArrow(startClick, mouse);
                    }
                }
                else {
                    if (targetCircle == selectedObj && targetCircle instanceof Circle) {
                        tempArrow = new SelfArrow(targetCircle, mouse);
                    }
                    else if (targetCircle != null && selectedObj instanceof Circle && targetCircle instanceof Circle) {
                        tempArrow = new Arrow(selectedObj, targetCircle);
                    }
                    else if (selectedObj instanceof Circle) {
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
        canvas.addEventListener('mouseup', (event) => {
            dragging = false;
            if (tempArrow != null) {
                if (!(tempArrow instanceof TemporaryArrow)) {
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
            // If the "Shift" key is pressed, set
            // shiftPressed = true, since it'll be used for
            // other functions on the canvas.
            if (event.key === 'Shift') {
                shiftPressed = true;
            }
            // If we are currently selecting an object AND
            // if the currently selected object has a "text"
            // attribute, we will enter this if-statement
            if (selectedObj != null) {
                if ('text' in selectedObj) {
                    // This is for backspacing one letter at a time
                    if (event.key === 'Backspace') {
                        // If the currently selected object is an Arrow or SelfArrow,
                        // then save the old text of the object so you can determine later
                        // if a determinism check needs to be ran
                        if (selectedObj instanceof Arrow || selectedObj instanceof SelfArrow) {
                            if (transitionLabelInputValidator.handleBackspace(selectedObj.text)) {
                                selectedObj.text = selectedObj.text.slice(0, -1);
                            }
                        }
                        else {
                            selectedObj.text = selectedObj.text.slice(0, -1);
                        }
                        draw();
                    }
                    // We will only allow characters of length 1 to be typed on the arrows
                    else if (event.key.length === 1) {
                        if ((selectedObj instanceof Arrow || selectedObj instanceof SelfArrow)) {
                            // If the current object that is being typed on is an Arrow or SelfArrow,
                            // then we will check if the character being typed is defined in the alphabet.
                            // If not, we will alert the user.
                            // if(alphabet.has(event.key) || event.key === ','){
                            // Store the text of the object before it changes, since
                            // the 'text' attribute of the object will be directly modified
                            // by this keydown listener
                            // oldText = selectedObj.text;
                            // selectedObj.text += event.key;
                            // }
                            // else{
                            //   alert("\'" + event.key + "\' is not defined in the alphabet!");
                            // }
                            if (transitionLabelInputValidator.handleChar(event.key)) {
                                selectedObj.text += event.key;
                            }
                            else {
                                alert(`'${transitionLabelInputValidator.getBuffer() + event.key}' is not defined in the alphabet!`);
                            }
                        }
                        // Else, the selectedObj must be Circle, which we can type anything for
                        // as long as the key we're pressing is of length 1 (so we can't press
                        // enter or anything like that)
                        else {
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
                    if (startState == selectedObj || startState?.pointsToCircle == selectedObj) {
                        setStartState(null);
                    }
                    // Iterate through all arrows that are present
                    for (let i = 0; i < arrows.length; i++) {
                        const arrow = arrows[i];
                        // If an arrow is selected when "Delete" is pressed,
                        // then delete that specific arrow
                        if (arrow == selectedObj) {
                            deleteArrow(arrow, i--);
                        }
                        // If an arrow is a SelfArrow (looped arrow)
                        if (arrow instanceof SelfArrow) {
                            // If the circle that the SelfArrow is looped
                            // on is the object being currently selected, then
                            // delete that SelfArrow as well since its associated
                            // circle is being deleted
                            if (arrow.circle == selectedObj) {
                                deleteArrow(arrow, i--);
                            }
                        }
                        // If an arrow is a regular Arrow
                        if (arrow instanceof Arrow) {
                            // If either the startCircle or the endCircle of
                            // this Arrow is the object being currently selected,
                            // then delete the Arrow, since it will no longer
                            // have two safe endpoints to be connected to
                            if (arrow.startCircle == selectedObj || arrow.endCircle == selectedObj) {
                                deleteArrow(arrow, i--);
                            }
                        }
                    }
                }
                // After all the arrows and circles present have been
                // checked, we can draw the canvas again
                draw();
            }
        });
        // If the arrow is being deleted, then update the
        // circles that it is associated with
        function deleteArrow(arrow, index) {
            if (arrow instanceof Arrow) {
                arrow.startCircle.outArrows.delete(arrow);
            }
            else if (arrow instanceof SelfArrow) {
                arrow.circle.outArrows.delete(arrow);
                arrow.circle.loop = null;
            }
            arrows.splice(index, 1);
        }
        document.addEventListener('keyup', (event) => {
            if (event.key === 'Shift') {
                shiftPressed = false;
            }
        });
        /* Helper Functions*/
        // Align the input circle to any circle in the array if x or y absolute is less than padding
        function snapAlignCircle(circle) {
            for (let circ = 0; circ < circles.length; circ++) {
                if (circles[circ] == circle)
                    continue;
                if (Math.abs(circle.x - circles[circ].x) < snapToPadding) {
                    circle.x = circles[circ].x;
                }
                if (Math.abs(circle.y - circles[circ].y) < snapToPadding) {
                    circle.y = circles[circ].y;
                }
            }
        }
        // Get the current mouse position inside the canvas
        const getMousePos = (event) => {
            const rect = canvas.getBoundingClientRect();
            return { x: event.clientX - rect.left, y: event.clientY - rect.top };
        };
        // Get the collided object at the point x, y.
        // Basically checks to see if the cursor is touching an object.
        // If it is, then return that specific object.
        // This function is used to set the selectedObj variable in the
        // mousedown eventListener and dblclick eventListener.
        function mouseCollision(x, y) {
            // Iterate through all circles. If a circle is selected by
            // the mouse, return that specific circle.
            for (let circ = 0; circ < circles.length; circ++) {
                if (circles[circ].containsPoint(x, y)) {
                    return circles[circ];
                }
            }
            // Iterate through all Arrows and SelfArrows. If one of them is selected by
            // the mouse, return that specific Arrow or SelfArrow.
            for (let arrow = 0; arrow < arrows.length; arrow++) {
                if (arrows[arrow].containsPoint(x, y)) {
                    return arrows[arrow];
                }
            }
            // Check if the startState is being selected by the mouse.
            // If it is, then return it.
            if (startState && startState.containsPoint(x, y)) {
                return startState;
            }
            return null;
        }
        // Expose draw to force redraw when clicking outside of the canvas to remove highlighting and dragging
        return { draw };
    }
    /* -----------------------------------------------------------
     * Attach automatically when DOM is ready.
     * --------------------------------------------------------- */
    function attachWhenReady() {
        const run = () => {
            // Get the input tag for the input string of the DFA
            const inputString = document.getElementById("inputString");
            // Get the input tag for the alphabet input of the DFA
            const alphabetInput = document.getElementById("alphabet");
            // Get the canvas tag for the canvas of the DFA
            const canvas = document.getElementById('DFACanvas');
            // Get label tag for alphabet label of DFA
            const alphabetLabel = document.getElementById("alphabetLabel");
            // Export menu button and div
            const exportMenuBtn = document.getElementById("exportMenuBtn");
            const exportMenu = document.getElementById("exportMenu");
            // Import menu button and div
            const importMenuBtn = document.getElementById('importMenuBtn');
            const importMenu = document.getElementById('importMenu');
            // Buttons for exporting, SVG and LaTeX
            const exportSVGBtn = document.getElementById('svgExportBtn');
            const exportLaTeXBtn = document.getElementById('latexExportBtn');
            // Buttons for importing, SVG and LaTeX
            const importSVGBtn = document.getElementById('svgImportBtn');
            const importLaTeXBtn = document.getElementById('latexImportBtn');
            const drawImportBtn = document.getElementById('confirmImport');
            // Container surrounding the export textarea (the output container {the div})
            const outputContainer = document.getElementById('exportOutputContainer');
            // Container surround the import textarea (the input container {the div})
            const inputContainer = document.getElementById('importInputContainer');
            // Actual textarea containing the output data
            const outputTextArea = document.getElementById('output');
            // Textarea containing the input data 
            const inputTextArea = document.getElementById('input');
            // Button that will hide the output container effectively hiding the text area
            const hideOutputBtn = document.getElementById('hideOutput');
            // Button that will copy the output to clipboard
            const copyOutputBtn = document.getElementById('copyOutput');
            // Button that will hide the input container effectively hiding the text area
            const hideInputBtn = document.getElementById('hideInput');
            // Button that will clear the input textarea
            const clearInputBtn = document.getElementById('clearInput');
            // Reference to draw fucntion;
            let drawRef;
            if (canvas) {
                const { draw } = setupDfaCanvas(canvas);
                drawRef = draw;
                // If you click outside of the canvas it will deselect the object and turn off dragging
                document.addEventListener("mousedown", (event) => {
                    if (!isInsideCanvas(event, canvas)) {
                        selectedObj = null;
                        dragging = false;
                        draw();
                    }
                    else {
                        // Prevent focusing other elements so accidently taps on tab can be resolved with one click back on the canvas
                        inputString?.blur();
                        alphabetInput?.blur();
                        // Buttons
                        exportSVGBtn?.blur();
                        exportLaTeXBtn?.blur();
                        importSVGBtn?.blur();
                        importLaTeXBtn?.blur();
                        hideOutputBtn?.blur();
                        copyOutputBtn?.blur();
                    }
                });
            }
            if (inputString) {
                inputString.addEventListener("keydown", (event) => {
                    // If the "Enter" key is pressed on the input string
                    if (event.key === "Enter") {
                        event.preventDefault();
                        // Obtain the value entered
                        // let newInput = inputString.value.trim();
                        // Check to see if it contains anything not defined in the alphabet.
                        // If it contains undefined characters, alert the user
                        // let notDefined: Array<string> = [];
                        // for(let char of newInput){
                        //   if(!alphabet.has(char)){
                        //     // Note to self: maybe make it so it goes through the entire string
                        //     // first and collects every character that is wrong? Then give an alert
                        //     // afterwards with every character that was wrong
                        //     notDefined.push(char);
                        //   }
                        // }
                        // if(notDefined.length == 1){
                        //   alert("\'" + notDefined[0] + "\' is not in the alphabet, this input is invalid!");
                        // }
                        // else if(notDefined.length > 1){
                        //   alert("\'" + notDefined.toString() + "\' is not in the alphabet, this input is invalid!");
                        // }
                        // else{
                        //   // Run the DFA algorithm
                        //   dfaAlgo(newInput);
                        // }
                        dfaAlgo(inputString.value);
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
                        const normalized = alphabetInput.value
                            .split(',')
                            .map(s => s.trim())
                            .filter(s => s.length > 0);
                        // Obtain the input and update the alphabet variable.
                        // The regex also removes any trailing/leading commas and whitespace
                        const newAlphabet = new Set(normalized);
                        setAlphabet(newAlphabet);
                        window.dispatchEvent(new CustomEvent("dfaAlphabetUpdated", {
                            detail: {
                                alphabet: Array.from(newAlphabet)
                            }
                        }));
                        console.log(alphabet);
                        alphabetInput.value = "";
                        if (alphabetLabel) {
                            alphabetLabel.textContent = "Alphabet: {" + Array.from(alphabet).join(",") + "}";
                        }
                    }
                });
            }
            // Export SVG button event handler and export textarea visiblity enable
            if (exportSVGBtn) {
                exportSVGBtn.addEventListener('click', () => {
                    if (canvas && outputTextArea) {
                        saveAsSVG(canvas, outputTextArea);
                    }
                    if (outputContainer) {
                        if (outputContainer.hidden) {
                            _toggle_visiblity(outputContainer);
                        }
                    }
                });
            }
            else {
                console.log("unable to find the export svg btn");
            }
            // Export LaTeX button event handler and export textarea visiblity enable
            if (exportLaTeXBtn) {
                exportLaTeXBtn.addEventListener('click', () => {
                    if (canvas && outputTextArea) {
                        saveAsLaTeX(canvas, outputTextArea);
                    }
                    if (outputContainer) {
                        if (outputContainer.hidden) {
                            _toggle_visiblity(outputContainer);
                        }
                    }
                });
            }
            // Import SVG button event handler and import textarea visiblity enable
            if (importSVGBtn) {
                importSVGBtn.addEventListener('click', () => {
                    importHelper(canvas, drawImportBtn, alphabetLabel, inputContainer, inputTextArea, circles, arrows, drawRef);
                });
            }
            // Import LaTeX button event handler and Import textarea visiblity enable
            if (importLaTeXBtn) {
                importLaTeXBtn.addEventListener('click', () => {
                    importHelper(canvas, drawImportBtn, alphabetLabel, inputContainer, inputTextArea, circles, arrows, drawRef);
                });
            }
            // Additional button so the user doesn't have to click the drop down to import
            if (drawImportBtn) {
                drawImportBtn.addEventListener('click', () => {
                    importHelper(canvas, drawImportBtn, alphabetLabel, inputContainer, inputTextArea, circles, arrows, drawRef);
                });
            }
            // Event handler to hide the export textarea (refered to as the output container, since hiding the div hides the textarea)
            if (hideOutputBtn) {
                hideOutputBtn.addEventListener('click', () => {
                    if (outputContainer) {
                        _toggle_visiblity(outputContainer);
                    }
                });
            }
            // Copies the output created from the export to your clipboard NOTE FOR FUTURE: Some indicator that it has been copied to your clipboard 
            if (copyOutputBtn) {
                copyOutputBtn.addEventListener('click', async () => {
                    if (outputTextArea) {
                        try {
                            let textToCopy = outputTextArea.value;
                            await navigator.clipboard.writeText(textToCopy);
                        }
                        catch (err) {
                            console.log("Failed to copy: ", err);
                        }
                    }
                });
            }
            // Event handler to hide the import textarea (refered to as the input container, since hiding the div hides the textarea)
            if (hideInputBtn) {
                hideInputBtn.addEventListener('click', () => {
                    if (inputContainer && drawImportBtn) {
                        _toggle_visiblity(inputContainer);
                        _toggle_visiblity(drawImportBtn);
                    }
                });
            }
            // Event handler to clear the text in the inputTextArea
            if (clearInputBtn) {
                clearInputBtn.addEventListener('click', () => {
                    if (inputTextArea) {
                        inputTextArea.value = '';
                    }
                });
            }
            // Toggle dropdown visibility
            exportMenuBtn.addEventListener("click", () => {
                exportMenu.classList.toggle("hidden");
            });
            // Hide when clicking outside
            document.addEventListener("click", (event) => {
                if (!exportMenu.contains(event.target) && event.target !== exportMenuBtn) {
                    exportMenu.classList.add("hidden");
                }
            });
            // Toggle dropdown visibility
            importMenuBtn.addEventListener("click", () => {
                importMenu.classList.toggle("hidden");
            });
            // Hide when clicking outside
            document.addEventListener("click", (event) => {
                if (!importMenu.contains(event.target) && event.target !== importMenuBtn) {
                    importMenu.classList.add("hidden");
                }
            });
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run);
        }
        else {
            run(); // DOM is already ready
        }
    }
    attachWhenReady();
    // saveAsSVG function to export the FSM as SVG
    function saveAsSVG(canvas, textArea) {
        if (!canvas)
            return;
        const exporter = new ExportAsSVG(canvas, alphabet);
        exporter.addAlphabet();
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
        if (startState) {
            exporter.faObject = startState;
            startState.draw(exporter);
        }
        output(exporter.toSVG(), textArea);
    }
    function saveAsLaTeX(canvas, textArea) {
        if (!canvas)
            return;
        const exporter = new ExportAsLaTeX(canvas, alphabet);
        exporter.addAlphabet();
        for (let circle = 0; circle < circles.length; circle++) {
            exporter.faObject = circles[circle];
            circles[circle].draw(exporter);
        }
        for (let arrow = 0; arrow < arrows.length; arrow++) {
            exporter.faObject = arrows[arrow];
            arrows[arrow].draw(exporter);
        }
        if (startState) {
            exporter.faObject = startState;
            startState.draw(exporter);
        }
        output(exporter.toLaTeX(), textArea);
    }
    function importHelper(canvas, drawImportBtn, alphabetLabel, inputContainer, textArea, circles, arrows, drawFunc) {
        if (inputContainer && drawImportBtn) {
            if (inputContainer.hidden && drawImportBtn.hidden) {
                console.log("called the helper function inside the toggle textArea");
                _toggle_visiblity(inputContainer);
                _toggle_visiblity(drawImportBtn);
                return;
            }
            if (circles && arrows && textArea) {
                let data = textArea.value;
                data = data.trim();
                if (data) {
                    if (confirm("Everything on the canvas currently will be erased! Proceed with importing?")) {
                        if (canvas) {
                            if (emptyDFA(canvas, arrows, circles)) {
                                let importer = new Importer(circles, arrows, textArea.value, drawFunc);
                                importer.convert();
                            }
                            else {
                                alert("Failure to import DFA");
                            }
                        }
                    }
                }
            }
            if (alphabetLabel) {
                alphabetLabel.textContent = "Alphabet: {" + Array.from(alphabet).join(",") + "}";
                // This event notifies the DFA page that the alphabet has been updated.
                // This lets the DFA page know if it needs to check for multi-character
                // elements in the alphabet, in which case it will show a disclaimer to
                // the user on how to submit input strings properly.
                window.dispatchEvent(new CustomEvent("dfaAlphabetUpdated", {
                    detail: {
                        alphabet: Array.from(alphabet)
                    }
                }));
            }
        }
    }
    function emptyDFA(canvas, arrows, circles) {
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                arrows.length = 0;
                circles.length = 0;
                setStartState(null);
                setStartState(null);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return true;
            }
        }
        return false;
    }
    function output(text, element) {
        if (element && element instanceof HTMLTextAreaElement) {
            element.value = text;
        }
    }
    function _toggle_visiblity(element) {
        element.hidden = !element.hidden;
    }
    // console.log(_arrow_string_formating('    ,          ,       1,,,,,0,  00  ,111  ,,, 0000,,111, 1010101,,, 1110010,,10010 1200023, '));

})();
