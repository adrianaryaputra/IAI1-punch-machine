const cfg = require('./config');

const SerialHandler = require('./serial-handler');
const Readl = require('@serialport/parser-readline');

const ModbusRTU = require("modbus-serial");
const Drive_CT_M701 = require("./drive-ct-m701");

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: cfg.WS_PORT });

const express = require('express');
const app = express();
app.use(express.static('src/GUI'))
app.listen(cfg.GUI_PORT, () => {
    console.log(`listening on port ${cfg.GUI_PORT}`);
});

drive = new Drive_CT_M701({
    modbusId: cfg.DRIVE_ID,
    modbusTimeout: cfg.MODBUS_TIMEOUT,
});

run();

state = {
    recoiler: 0,
    leveler: 0,
    coiler: 0,
    feeder: 0,
    count: 0,
    mode: 0,
}


async function run() {

    try {
        arduinoSerialHandler = await new SerialHandler({baudRate: cfg.ARDUINO_BAUDRATE}).init();
        arduinoPort = arduinoSerialHandler.filterByManufacturer(cfg.ARDUINO_SERIALNAME).get();
        arduinoPort.open(() => {
            console.log("arduino port OPEN");
        })
    } catch(e) { handleErrorCommand(e) }

    try {
        modbusSerialHandler = await new SerialHandler({baudRate: cfg.MODBUS_BAUD}).init();
        modbusPort = modbusSerialHandler.filterByManufacturer(cfg.MODBUS_SERIALNAME).get();
        client = new ModbusRTU(modbusPort);
        client.open();
        drive.setClient(client);
    } catch(e) { handleErrorCommand(e) }

    let arduinoStream = arduinoPort.pipe(new Readl());

    arduinoStream.on('data', (data) => {
        console.log(data);
        parsedData = JSON.parse(data);
        console.log(parsedData);
        handleArduinoMessage(parsedData);
    });

    wss.on('connection', (ws) => {
        ws.on('open', function open() {
            ws.send('connected to websocket');
        });
        ws.on('message', (message) => {
            console.log('received: %s', message);
            parsedMsg = JSON.parse(message);
            console.log('parsed', parsedMsg);
            handleWebsocketMessage(parsedMsg);
        });

        // setInterval(() => {handleModbusRead(wss)}, 1000);
    });
}


function handleSendWebsocket(payload) {
    console.log(payload);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
        }
    });
}


function handleSuccessCommand(cmd) {
    handleSendWebsocket({
        command: WS.COMM_SUCCESS,
        value: cmd,
    });
}


function handleErrorCommand(err) {
    handleSendWebsocket({
        command: WS.COMM_ERROR,
        value: err.message,
    });
    console.error(err);
}


function handleWebsocketMessage(msg) {
    try {
        switch(msg.command){
            case WS.GET_RECOILER:
                handleSendWebsocket({
                    command: WS.GET_RECOILER,
                    value: state.recoiler,
                });
                break;
            case WS.GET_LEVELER:
                handleSendWebsocket({
                    command: WS.GET_LEVELER,
                    value: state.leveler,
                });
                break;
            case WS.GET_COILER:
                handleSendWebsocket({
                    command: WS.GET_COILER,
                    value: state.coiler,
                });
                break;
            case WS.GET_FEEDER:
                handleSendWebsocket({
                    command: WS.GET_FEEDER,
                    value: state.feeder,
                });
                break;

            case WS.GET_DISTANCE_MOTOR_TURN:
                handleDefaultGetCommand(MODBUS.DISTANCE_MOTOR_TURN, WS.GET_DISTANCE_MOTOR_TURN);
                break;
            case WS.GET_DISTANCE_ENCODER_TURN:
                handleDefaultGetCommand(MODBUS.DISTANCE_ENCODER_TURN, WS.GET_DISTANCE_ENCODER_TURN);
                break;
            case WS.GET_ACCELERATION_POSITION:
                handleDefaultGetCommand(MODBUS.ACCELERATION_POSITION, WS.GET_ACCELERATION_POSITION);
                break;
            case WS.GET_DECCELERATION_POSITION:
                handleDefaultGetCommand(MODBUS.DECCELERATION_POSITION, WS.GET_DECCELERATION_POSITION);
                break;
            case WS.GET_JOG_ACCELERATION:
                handleDefaultGetCommand(MODBUS.JOG_ACCELERATION, WS.GET_JOG_ACCELERATION);
                break;
            case WS.GET_JOG_DECCELERATION:
                handleDefaultGetCommand(MODBUS.JOG_DECCELERATION, WS.GET_JOG_DECCELERATION);
                break;
            case WS.GET_JOG_SPEED:
                handleScaledGetCommand(MODBUS.JOG_SPEED, 0.5, WS.GET_JOG_SPEED);
                break;
            case WS.GET_LENGTH:
                handleDefaultGetCommand(MODBUS.LENGTH, WS.GET_LENGTH);
                break;
            case WS.GET_SPEED:
                handleScaledGetCommand(MODBUS.SPEED, 0.5, WS.GET_SPEED);
                break;
            case WS.GET_COUNT:
                handleSendWebsocket({
                    command: WS.GET_COUNT,
                    value: state.count,
                });
                break;


            case WS.SET_DISTANCE_MOTOR_TURN:
                handleDefaultSetCommand(MODBUS.DISTANCE_MOTOR_TURN, WS.SET_DISTANCE_MOTOR_TURN, msg.value);
                break;
            case WS.SET_DISTANCE_ENCODER_TURN:
                handleDefaultSetCommand(MODBUS.DISTANCE_ENCODER_TURN, WS.SET_DISTANCE_ENCODER_TURN, msg.value);
                break;
            case WS.SET_ACCELERATION_POSITION:
                handleDefaultSetCommand(MODBUS.ACCELERATION_POSITION, WS.SET_ACCELERATION_POSITION, msg.value);
                break;
            case WS.SET_DECCELERATION_POSITION:
                handleDefaultSetCommand(MODBUS.DECCELERATION_POSITION, WS.SET_DECCELERATION_POSITION, msg.value);
                break;
            case WS.SET_JOG_ACCELERATION:
                handleDefaultSetCommand(MODBUS.JOG_ACCELERATION, WS.SET_JOG_ACCELERATION, msg.value);
                break;
            case WS.SET_JOG_DECCELERATION:
                handleDefaultSetCommand(MODBUS.JOG_DECCELERATION, WS.SET_JOG_DECCELERATION, msg.value);
                break;
            case WS.SET_JOG_SPEED:
                handleScaledSetCommand(MODBUS.JOG_SPEED, 0.5, WS.SET_JOG_SPEED, msg.value);
                break;
            case WS.SET_LENGTH:
                handleDefaultSetCommand(MODBUS.LENGTH, WS.SET_LENGTH, msg.value);
                break;
            case WS.SET_SPEED:
                handleScaledSetCommand(MODBUS.SPEED, 0.5, WS.SET_SPEED, msg.value);
                break;
            case WS.SET_COUNT:
                state.count = msg.value;
                break;
            case WS.SET_THREAD_REVERSE:
                handleThreadRevCommand();
                break;
            case WS.SET_THREAD_FORWARD:
                handleThreadFwdCommand();
                break;
            case WS.SET_MODE_SINGLE:
                handleModeSingleCommand();
                break;
            case WS.SET_MODE_MULTI:
                handleModeMultiCommand();
                break;


            case WS.RESET_DRIVE:
                drive.reset()
                    .then(() => handleSuccessCommand(WS.RESET_DRIVE))
                    .catch(handleErrorCommand);
                break;
        }
    } catch(e) { handleErrorCommand(e) }
}


function handleScaledSetCommand(parameter, scale, wsCommand, value) {
    drive.writeParameter({...parameter, value: value/scale})
        .then(() => handleSuccessCommand(wsCommand))
        .catch(handleErrorCommand);
}


function handleScaledGetCommand(parameter, scale, wsCommand) {
    drive.readParameter(parameter)
        .then((v) => {
            handleSendWebsocket({
                command: wsCommand,
                value: v.data[0]*scale,
            });
        })
        .catch(handleErrorCommand);
}


function handleDefaultSetCommand(parameter, wsCommand, value) {
    drive.writeParameter({
        ...parameter, value
    })
        .then(() => handleSuccessCommand(wsCommand))
        .catch(handleErrorCommand);
}


function handleDefaultGetCommand(parameter, wsCommand) {
    drive.readParameter(parameter)
        .then((v) => {
            handleSendWebsocket({
                command: wsCommand,
                value: v.data[0],
            });
        })
        .catch(handleErrorCommand);
}


async function handleThreadFwdCommand() {
    try {

        var current = await drive.readParameter(MODBUS.THREAD_FORWARD);

        await drive.writeParameter({...MODBUS.THREAD_REVERSE, value: 0})
            .then(() => handleSendWebsocket({
                command: WS.SET_THREAD_REVERSE,
                value: 0,
            }))
            .catch(handleErrorCommand);

        setTimeout(() => {
            drive.writeParameter({...MODBUS.THREAD_FORWARD, value: (current.data[0]==1)?0:1})
                .then(() => handleSendWebsocket({
                    command: WS.SET_THREAD_FORWARD,
                    value: (current.data[0] == 1) ? 0 : 1,
                }))
                .catch(handleErrorCommand);
        }, 1000);

    } catch(e) { handleErrorCommand(e) }

}


async function handleThreadRevCommand() {
    
    try {

        var current = await drive.readParameter(MODBUS.THREAD_REVERSE);

        drive.writeParameter({...MODBUS.THREAD_FORWARD, value: 0})
            .then(() => handleSendWebsocket({
                command: WS.SET_THREAD_FORWARD,
                value: 0,
            }))
            .catch(handleErrorCommand);

        setTimeout(() => {
            drive.writeParameter({...MODBUS.THREAD_REVERSE, value: (current.data[0]==1)?0:1})
                .then(() => handleSendWebsocket({
                    command: WS.SET_THREAD_REVERSE,
                    value: (current.data[0] == 1) ? 0 : 1,
                }))
                .catch(handleErrorCommand);
        }, 1000);

    } catch(e) { handleErrorCommand(e) }

}


function handleArduinoMessage(data) {
    switch(data.command) {
        case ARDUINO.RECOILER:
            state.recoiler = data.value;
            handleSendWebsocket({
                command: ARDUINO.RECOILER,
                value: state.recoiler,
            });
            break;
        case ARDUINO.LEVELER:
            state.leveler = data.value;
            handleSendWebsocket({
                command: ARDUINO.LEVELER,
                value: state.leveler,
            });
            break;
        case ARDUINO.COILER:
            state.coiler = data.value;
            handleSendWebsocket({
                command: ARDUINO.COILER,
                value: state.coiler,
            });
            break;
        case ARDUINO.FEEDER:
            state.feeder = data.value;
            handleSendWebsocket({
                command: ARDUINO.FEEDER,
                value: state.feeder,
            });
            break;
        case ARDUINO.PUNCHING:
            state.count += 1
            handleSendWebsocket({
                command: WS.GET_COUNT,
                value: state.count,
            });
            break;
    }
}


const RUNMODE = {
    SINGLE: 0,
    MULTI: 1,
}

const ARDUINO = {
    RECOILER: 'Recoiler',
    LEVELER: 'Leveller',
    COILER: 'Coiler',
    FEEDER: 'Feeder',
    PUNCHING: 'Punching',
    FEEDING: 'Feeding',
}

const MODBUS = {
    LENGTH: { menu:18, parameter:52},
    SPEED: {menu:18, parameter:13},
    THREAD_FORWARD: {menu:18, parameter:31},
    THREAD_REVERSE: {menu:18, parameter:32},

    DISTANCE_MOTOR_TURN: {menu:19, parameter:15},
    DISTANCE_ENCODER_TURN: {menu:19, parameter:16},
    ACCELERATION_POSITION: {menu:18, parameter:11},
    DECCELERATION_POSITION: {menu:18, parameter:12},
    JOG_ACCELERATION: {menu:19, parameter:11},
    JOG_DECCELERATION: {menu:19, parameter:12},
    JOG_SPEED: {menu:19, parameter:13},
}


const WS = {
    GET_RECOILER: ARDUINO.RECOILER,
    GET_LEVELER: ARDUINO.LEVELER,
    GET_COILER: ARDUINO.COILER,
    GET_FEEDER: ARDUINO.FEEDER,
    GET_PUNCHING: ARDUINO.PUNCHING,
    GET_FEEDING: ARDUINO.FEEDING,

    SET_LENGTH: "set_length",
    SET_SPEED: "set_speed",
    SET_COUNT: "set_count",
    SET_THREAD_FORWARD: "set_threadfwd",
    SET_THREAD_REVERSE: "set_threadrev",
    SET_MODE_SINGLE: "set_modesingle",
    SET_MODE_MULTI: "set_modemulti",

    GET_LENGTH: "get_length",
    GET_SPEED: "get_speed",
    GET_COUNT: "get_count",
    GET_INDICATOR: "get_indicator",
    GET_THREAD_FORWARD: "get_threadfwd",
    GET_THREAD_REVERSE: "get_threadrev",
    GET_MODE_MULTI: "get_modemulti",

    SET_DISTANCE_MOTOR_TURN: "set_distMotorTurn",
    SET_DISTANCE_ENCODER_TURN: "set_distEncoderTurn",
    SET_ACCELERATION_POSITION: "set_accelPos",
    SET_DECCELERATION_POSITION: "set_deccelPos",
    SET_JOG_ACCELERATION: "set_jogAccel",
    SET_JOG_DECCELERATION: "set_jogDeccel",
    SET_JOG_SPEED: "set_jogSpeed",

    GET_DISTANCE_MOTOR_TURN: "get_distMotorTurn",
    GET_DISTANCE_ENCODER_TURN: "get_distEncoderTurn",
    GET_ACCELERATION_POSITION: "get_accelPos",
    GET_DECCELERATION_POSITION: "get_deccelPos",
    GET_JOG_ACCELERATION: "get_jogAccel",
    GET_JOG_DECCELERATION: "get_jogDeccel",
    GET_JOG_SPEED: "get_jogSpeed",

    SAVE_PARAMETER: "save",
    RESET_DRIVE: "reset",

    COMM_SUCCESS: "com_success",
    COMM_ERROR: "com_error",
}
