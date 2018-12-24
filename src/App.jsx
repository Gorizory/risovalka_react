import React, {
    PureComponent,
} from 'react';
import './App.css';
import Drawer from './Drawer';
import Spinner from './Spinner/Spinner';

const SERVER_LOCATION = 'localhost';
const SERVER_PORT = 65432;

export const Tools = {
    Drag: 'drag',
    Line: 'line',
    Point: 'point',
    Vertical: 'vertical',
    Horizontal: 'horizontal',
    Connect: 'connect',
    Parallel: 'parallel',
    Perpendicular: 'perpendicular',
    AttachPointToLine: 'attach_point_to_line',
    AngleBetweenLines: 'angle_between_lines',
    DistanceBetweenPoints: 'dist_between_points',
    GetAngleBetweenLines: 'get_angle_between_lines',
    GetDistanceBetweenPoints: 'get_dist_between_points',
};

class App extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            inputValue: undefined,
            outputValue: undefined,
            tool: Tools.Point,
            isConnected: false,
        };

        this._connect = this._connect.bind(this);
        this._setInputValue = this._setInputValue.bind(this);
        this._setOutputValue = this._setOutputValue.bind(this);
        this._update = this._update.bind(this);
        this._setTool = this._setTool.bind(this);
    }

    async componentDidMount() {
        this._connect(`ws:${SERVER_LOCATION}:${SERVER_PORT}`)
    }

    render() {
        const {
            inputValue,
            outputValue,
            tool,
            isConnected,
        } = this.state;

        const drawerProps = {
            inputValue,
            tool,
            tools: Tools,
            onInit: updateState => this._updateState = updateState,
            setOutputValue: this._setOutputValue,
            update: this._update,
        };

        const buttonClassName = (buttonTool) => buttonTool === tool ? 'button-active' : 'button';
        const inputDisabled = () =>
            tool === Tools.DistanceBetweenPoints || tool === Tools.AngleBetweenLines;

        return (
            <div className={'app'}>
                {!isConnected && <Spinner/>}
                {isConnected && (
                    <div className={'wrapper'}>
                        <canvas className={'my-canvas'} id={'myCanvas'}/>
                        < Drawer {...drawerProps}/>
                        <div className={'buttons'}>
                            <button onClick={() => this._setTool(Tools.Point)} className={buttonClassName(Tools.Point)}>
                                Point
                            </button>
                            <button onClick={() => this._setTool(Tools.Line)} className={buttonClassName(Tools.Line)}>
                                Line
                            </button>
                            <button onClick={() => this._setTool(Tools.Drag)} className={buttonClassName(Tools.Drag)}>
                                Drag
                            </button>
                            <button onClick={() => this._setTool(Tools.Connect)}
                                    className={buttonClassName(Tools.Connect)}>
                                Connect
                            </button>
                            <button onClick={() => this._setTool(Tools.Vertical)}
                                    className={buttonClassName(Tools.Vertical)}>
                                Vertical
                            </button>
                            <button onClick={() => this._setTool(Tools.Horizontal)}
                                    className={buttonClassName(Tools.Horizontal)}>
                                Horizontal
                            </button>
                            <button onClick={() => this._setTool(Tools.Parallel)}
                                    className={buttonClassName(Tools.Parallel)}>
                                Parallel
                            </button>
                            <button onClick={() => this._setTool(Tools.Perpendicular)}
                                    className={buttonClassName(Tools.Perpendicular)}>
                                Perpendicular
                            </button>
                            <button onClick={() => this._setTool(Tools.AttachPointToLine)}
                                    className={buttonClassName(Tools.AttachPointToLine)}>
                                Attach point to line
                            </button>
                            <button onClick={() => this._setTool(Tools.AngleBetweenLines)}
                                    className={buttonClassName(Tools.AngleBetweenLines)}>
                                Set angle between lines
                            </button>
                            <button onClick={() => this._setTool(Tools.DistanceBetweenPoints)}
                                    className={buttonClassName(Tools.DistanceBetweenPoints)}>
                                Set distance between points
                            </button>
                            <input
                                id={'input'}
                                type={'number'}
                                min={0}
                                max={90}
                                onInput={() => this._setInputValue()}
                                disabled={!inputDisabled()}
                                className={'input'}
                            />
                        </div>
                        <div className={'buttons'}>
                            <button onClick={() => this._setTool(Tools.GetAngleBetweenLines)}
                                    className={buttonClassName(Tools.GetAngleBetweenLines)}>
                                Get angle between lines
                            </button>
                            <button onClick={() => this._setTool(Tools.GetDistanceBetweenPoints)}
                                    className={buttonClassName(Tools.GetDistanceBetweenPoints)}>
                                Get distance between points
                            </button>
                            <div className={'output'}>
                                Output: {outputValue}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    _setTool(tool) {
        this.setState({
            tool,
        })
    }

    _update(data) {
        this.setState({
            inputValue: undefined,
        });
        const input = document.getElementById('input');
        if (input) {
            input.value = '';
        }

        console.log(data);
        this._socket.send(JSON.stringify(data));
    }

    _setInputValue() {
        const {value} = document.getElementById('input');
        this.setState({
            inputValue: value,
        });
    }

    _setOutputValue(value) {
        this.setState({
            outputValue: value.toFixed(3),
        });
    }

    _connect(websocketServerLocation) {
        try{
            this._socket = new WebSocket(websocketServerLocation);
        } catch (err) {}
        this._socket.onopen = () => {
            console.log('Connection established');
            this.setState({
                isConnected: true,
            });
        };
        this._socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this._updateState(data);
        };
        this._socket.onclose = async (event) => {
            if (this.state.isConnected) {
                if (event.wasClean) {
                    console.log('Connection finished')
                } else {
                    console.log('Connection lost')
                }
            }
            this.setState({
                isConnected: false,
            });
            console.log('Retry connection in 5 seconds');
            setTimeout(() => this._connect(websocketServerLocation), 1000);
        };
    }
}

export default App;
