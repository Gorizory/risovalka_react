import paper from 'paper';
import {
    PureComponent,
} from 'react';
import v4 from 'uuid/v4';

const Tool = paper.Tool;
const Point = paper.Point;
let view = undefined;

const geomTypes = {
    Point: 'point',
    Path: 'path',
    EndPoint: 'endPoint',
};

const eventTypes = {
    CreatePoint: 'create_point',
    CreateLine: 'create_line',
    DragPoint: 'drag_point',
    DragLine: 'drag_line',
    Horizontal: 'horizontal',
    Vertical: 'vertical',
    Parallel: 'parallel',
    Perpendicular: 'perpendicular',
    Connect: 'connect_points',
    AttachPointToLine: 'attach_point_to_line',
    AngleBetweenLines: 'angle_between_lines',
    DistanceBetweenPoints: 'dist_between_points',
};

let path;
let point1Uid;
let point2Uid;
let line1Uid;
let line2Uid;
let pointUid;
let lineUid;

class Drawer extends PureComponent {
    _lines = {};
    _points = {};
    _tools = {};

    constructor(props) {
        super(props);

        this._countAngleBetweenLines = this._countAngleBetweenLines.bind(this);
        this._changeTool = this._changeTool.bind(this);
        this._getPoint = this._getPoint.bind(this);
        this._updateState = this._updateState.bind(this);
    }

    componentDidMount() {
        const canvas = document.getElementById('myCanvas');
        paper.setup(canvas);

        view = paper.view;

        this._tools[this.props.tools.Point] = new Tool();
        this._tools[this.props.tools.Point].onMouseDown = (event) => {
            const uid = v4();
            path = new paper.Path.Ellipse({
                point: new Point(event.point.x - 2.5, event.point.y - 2.5),
                size: [5, 5],
                fillColor: 'black'
            });
            this._points[uid] = {
                point: event.point,
                circle: path,
                type: geomTypes.Point,
            };
            view.draw();

            this._onChange({
                    uid,
                    point: {
                        x: event.point.x,
                        y: event.point.y,
                    },
                },
                eventTypes.CreatePoint,
            );
        };

        this._tools[this.props.tools.Line] = new Tool();
        this._tools[this.props.tools.Line].onMouseDown = (event) => {
            path = new paper.Path({
                strokeColor: 'black',
            });
            path.moveTo(event.point);
            path.lineTo(event.point);
        };

        this._tools[this.props.tools.Line].onMouseDrag = (event) => {
            path.segments[1].point = event.point;
        };

        this._tools[this.props.tools.Line].onMouseUp = () => {
            if (path.length < 10) {
                return;
            }
            const lineUid = v4();
            const point1Uid = v4();
            const point2Uid = v4();
            path.endPoints = [
                point1Uid,
                point2Uid,
            ];
            this._lines[lineUid] = path;

            const point1 = new paper.Path.Ellipse({
                point: new Point(path._segments[0]._point._x - 2.5, path._segments[0]._point._y - 2.5),
                size: [5, 5],
                fillColor: 'black'
            });
            this._points[point1Uid] = {
                point: new Point(path._segments[0]._point._x, path._segments[0]._point._y),
                type: geomTypes.EndPoint,
                segment: 0,
                circle: point1,
                lineUid,
            };

            const point2 = new paper.Path.Ellipse({
                point: new Point(path._segments[1]._point._x - 2.5, path._segments[1]._point._y - 2.5),
                size: [5, 5],
                fillColor: 'black'
            });
            this._points[point2Uid] = {
                point: new Point(path._segments[1]._point._x, path._segments[1]._point._y),
                type: geomTypes.EndPoint,
                segment: 1,
                circle: point2,
                lineUid,
            };
            view.draw();

            this._onChange({
                    uid: lineUid,
                    point1: {
                        x: point1.position.x,
                        y: point1.position.y,
                    },
                    point2: {
                        x: point2.position.x,
                        y: point2.position.y,
                    }
                }, eventTypes.CreateLine,
            )
        };

        this._tools[this.props.tools.Drag] = new Tool();
        this._tools[this.props.tools.Drag].onMouseDown = (event) => {
            path = undefined;

            pointUid = this._getPoint(event.point);
        };

        this._tools[this.props.tools.Drag].onMouseDrag = (event) => {
            if (typeof pointUid !== 'undefined') {
                const point = this._points[pointUid];
                switch (point.type) {
                    case geomTypes.Point:
                        point.circle.position = event.point;
                        break;
                    case geomTypes.EndPoint:
                        point.circle.position = event.point;
                        this._lines[point.lineUid].segments[point.segment].point = event.point;
                        break;
                    default:
                        break;
                }
            }
        };

        this._tools[this.props.tools.Drag].onMouseUp = (event) => {
            if (pointUid) {
                const point = this._points[pointUid];
                switch (point.type) {
                    case geomTypes.Point:
                        point.point = event.point;
                        this._onChange({
                                uid: pointUid,
                                point: {
                                    x: event.point.x,
                                    y: event.point.y,
                                },
                            },
                            eventTypes.DragPoint,
                        );
                        break;
                    case geomTypes.EndPoint:
                        point.point = event.point;
                        this._onChange({
                                uid: point.lineUid,
                                point1: {
                                    x: this._lines[point.lineUid].segments[0].point.x,
                                    y: this._lines[point.lineUid].segments[0].point.y,
                                },
                                point2: {
                                    x: this._lines[point.lineUid].segments[1].point.x,
                                    y: this._lines[point.lineUid].segments[1].point.y,
                                },
                            },
                            eventTypes.DragLine,
                        );
                        break;
                    default:
                        break;
                }
            }
        };

        this._tools[this.props.tools.Vertical] = new Tool();
        this._tools[this.props.tools.Vertical].onMouseDown = (event) => {
            lineUid = this._getLine(event.point);
            if (lineUid) {
                this._onChange({
                        uid: lineUid,
                    },
                    eventTypes.Vertical,
                );
            }
        };

        this._tools[this.props.tools.Horizontal] = new Tool();
        this._tools[this.props.tools.Horizontal].onMouseDown = (event) => {
            lineUid = this._getLine(event.point);
            if (lineUid) {
                this._onChange({
                        uid: lineUid,
                    },
                    eventTypes.Horizontal,
                );
            }
        };

        this._tools[this.props.tools.Connect] = new Tool();
        this._tools[this.props.tools.Connect].onMouseDown = (event) => {
            if (point1Uid && point2Uid) {
                this._points[point1Uid].circle.fullySelected = false;
                this._points[point2Uid].circle.fullySelected = false;
                point1Uid = undefined;
                point2Uid = undefined;
            }

            if (!point1Uid) {
                point1Uid = this._getPoint(event.point, true);
                if (point1Uid) {
                    this._points[point1Uid].circle.fullySelected = true;
                }
            } else {
                point2Uid = this._getPoint(event.point);
                if (point2Uid) {
                    this._points[point1Uid].circle.fullySelected = false;
                    if (point1Uid !== point2Uid) {
                        this._onChange({
                                point1: {
                                    uid: this._points[point1Uid].lineUid,
                                    pointNum: this._points[point1Uid].segment,
                                },
                                point2: {
                                    uid: this._points[point2Uid].type === geomTypes.EndPoint
                                        ? this._points[point2Uid].lineUid
                                        : point2Uid,
                                    pointNum: this._points[point2Uid].type === geomTypes.EndPoint
                                        ? this._points[point2Uid].segment
                                        : undefined,
                                }
                            },
                            eventTypes.Connect,
                        )
                    }
                }
            }
        };

        this._tools[this.props.tools.Parallel] = new Tool();
        this._tools[this.props.tools.Parallel].onMouseDown = (event) => {
            if (line1Uid && line2Uid) {
                this._lines[line1Uid].fullySelected = false;
                this._lines[line2Uid].fullySelected = false;
                line1Uid = undefined;
                line2Uid = undefined;
            }

            if (!line1Uid) {
                line1Uid = this._getLine(event.point);
                if (line1Uid) {
                    this._lines[line1Uid].fullySelected = true;
                }
            } else {
                line2Uid = this._getLine(event.point);
                if (line2Uid) {
                    this._lines[line1Uid].fullySelected = false;
                    if (line1Uid !== line2Uid) {
                        this._onChange({
                                uid1: line1Uid,
                                uid2: line2Uid,
                            },
                            eventTypes.Perpendicular,
                        )
                    }
                }
            }
        };

        this._tools[this.props.tools.Perpendicular] = new Tool();
        this._tools[this.props.tools.Perpendicular].onMouseDown = (event) => {
            if (line1Uid && line2Uid) {
                this._lines[line1Uid].fullySelected = false;
                this._lines[line2Uid].fullySelected = false;
                line1Uid = undefined;
                line2Uid = undefined;
            }

            if (!line1Uid) {
                line1Uid = this._getLine(event.point);
                if (line1Uid) {
                    this._lines[line1Uid].fullySelected = true;
                }
            } else {
                line2Uid = this._getLine(event.point);
                if (line2Uid) {
                    this._lines[line1Uid].fullySelected = false;
                    if (line1Uid !== line2Uid) {
                        this._onChange({
                                uid1: line1Uid,
                                uid2: line2Uid,
                            },
                            eventTypes.Perpendicular,
                        )
                    }
                }
            }
        };

        this._tools[this.props.tools.AttachPointToLine] = new Tool();
        this._tools[this.props.tools.AttachPointToLine].onMouseDown = (event) => {
            if (lineUid && pointUid) {
                this._lines[lineUid].fullySelected = false;
                this._points[pointUid].circle.fullySelected = false;
                lineUid = undefined;
                pointUid = undefined;
            }

            if (!pointUid) {
                pointUid = this._getPoint(event.point);
                if (pointUid) {
                    this._points[pointUid].circle.fullySelected = true;
                }
            } else {
                lineUid = this._getLine(event.point);
                if (lineUid) {
                    this._points[pointUid].circle.fullySelected = false;
                    this._onChange({
                            uid1: pointUid,
                            uid2: lineUid,
                        },
                        eventTypes.AttachPointToLine,
                    )
                }
            }
        };

        this._tools[this.props.tools.AngleBetweenLines] = new Tool();
        this._tools[this.props.tools.AngleBetweenLines].onMouseDown = (event) => {
            if (line1Uid && line2Uid) {
                this._lines[line1Uid].fullySelected = false;
                this._lines[line2Uid].fullySelected = false;
                line1Uid = undefined;
                line2Uid = undefined;
            }

            if (!line1Uid) {
                line1Uid = this._getLine(event.point);
                if (line1Uid) {
                    this._lines[line1Uid].fullySelected = true;
                }
            } else {
                line2Uid = this._getLine(event.point);
                if (line2Uid) {
                    this._lines[line1Uid].fullySelected = false;
                    if (line1Uid !== line2Uid) {
                        this._onChange({
                                uid1: line1Uid,
                                uid2: line2Uid,
                                angle: this.props.inputValue,
                            },
                            eventTypes.AngleBetweenLines,
                        )
                    }
                }
            }
        };

        this._tools[this.props.tools.DistanceBetweenPoints] = new Tool();
        this._tools[this.props.tools.DistanceBetweenPoints].onMouseDown = (event) => {
            if (point1Uid && point2Uid) {
                this._points[point1Uid].circle.fullySelected = false;
                this._points[point2Uid].circle.fullySelected = false;
                point1Uid = undefined;
                point2Uid = undefined;
            }

            if (!point1Uid) {
                point1Uid = this._getPoint(event.point);
                if (point1Uid) {
                    this._points[point1Uid].circle.fullySelected = true;
                }
            } else {
                point2Uid = this._getPoint(event.point);
                if (point2Uid) {
                    this._points[point1Uid].circle.fullySelected = false;
                    if (point1Uid !== point2Uid) {
                        this._onChange({
                                uid1: point1Uid,
                                uid2: point2Uid,
                                dist: this.props.inputValue,
                            },
                            eventTypes.DistanceBetweenPoints,
                        )
                    }
                }
            }
        };

        this._tools[this.props.tools.GetAngleBetweenLines] = new Tool();
        this._tools[this.props.tools.GetAngleBetweenLines].onMouseDown = (event) => {
            if (line1Uid && line2Uid) {
                this._lines[line1Uid].fullySelected = false;
                this._lines[line2Uid].fullySelected = false;
                line1Uid = undefined;
                line2Uid = undefined;
            }

            if (!line1Uid) {
                line1Uid = this._getLine(event.point);
                if (line1Uid) {
                    this._lines[line1Uid].fullySelected = true;
                }
            } else {
                line2Uid = this._getLine(event.point);
                if (line2Uid) {
                    this._lines[line1Uid].fullySelected = false;
                    if (line1Uid !== line2Uid) {
                        this.props.setOutputValue(
                            this._countAngleBetweenLines(line1Uid, line2Uid),
                        );
                    }
                }
            }
        };

        this._tools[this.props.tools.GetDistanceBetweenPoints] = new Tool();
        this._tools[this.props.tools.GetDistanceBetweenPoints].onMouseDown = (event) => {
            if (point1Uid && point2Uid) {
                this._points[point1Uid].circle.fullySelected = false;
                this._points[point2Uid].circle.fullySelected = false;
                point1Uid = undefined;
                point2Uid = undefined;
            }

            if (!point1Uid) {
                point1Uid = this._getPoint(event.point);
                if (point1Uid) {
                    this._points[point1Uid].circle.fullySelected = true;
                }
            } else {
                point2Uid = this._getPoint(event.point);
                if (point2Uid) {
                    this._points[point1Uid].circle.fullySelected = false;
                    if (point1Uid !== point2Uid) {
                        this.props.setOutputValue(
                            this._points[point1Uid].point.getDistance(this._points[point2Uid].point)
                        );
                    }
                }
            }
        };

        this._changeTool(this.props.tool);
    }

    componentWillUpdate(newProps) {
        if (this.props.tool === newProps.tool) {
            return false;
        }

        this._changeTool(newProps.tool);
    }

    render() {
        return null;
    }

    _changeTool(newTool) {
        path = undefined;
        point1Uid = undefined;
        point2Uid = undefined;
        line1Uid = undefined;
        line2Uid = undefined;
        pointUid = undefined;
        lineUid = undefined;
        this._tools[newTool].activate();
    }

    _getPoint(evPoint, onlyEnds = false) {
        let currentPointUid = undefined;

        Object.keys(this._points).forEach((pointUid) => {
            const dist = this._points[pointUid].point.getDistance(evPoint);

            if (onlyEnds && this._points[pointUid].type !== geomTypes.EndPoint) {
                return;
            }

            if (dist < 5) {
                currentPointUid = pointUid;
            }
        });

        return currentPointUid;
    }

    _getLine(evPoint) {
        let currentPathUid = undefined;

        Object.keys(this._lines).forEach((lineUid) => {
            const path = this._lines[lineUid];
            const a = path.length;
            const b = path.segments[0].point.getDistance(evPoint);
            const c = path.segments[1].point.getDistance(evPoint);
            const p = (a + b + c) / 2;

            const square = Math.sqrt(p * (p - a) * (p - b) * (p - c));

            const dist = 2 * square / a;

            if (dist < 5) {
                currentPathUid = lineUid;
            }
        });

        return currentPathUid;
    }

    _countAngleBetweenLines(uid1, uid2) {
        const a = this._lines[uid1];
        const a0 = a.segments[0].point;
        const a1 = a.segments[1].point;
        const b = this._lines[uid2];
        const b0 = b.segments[0].point;
        const b1 = b.segments[1].point;

        const scalar = (a0.x - a1.x) * (b0.x - b1.x) + (a0.y - a1.y) * (b0.y - b1.y);
        const cosAlpha = scalar / (a.length * b.length);

        const alpha = Math.acos(cosAlpha) * 180 / Math.PI

        return alpha <= 90 ? alpha : 180 - alpha;
    }

    _onChange(data, operation) {
        this.props.update({data, operation}, this._updateState);
    }

    _updateState() {

    }
}

export default Drawer;