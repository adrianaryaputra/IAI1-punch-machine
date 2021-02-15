const cfg = require('./config');

const SerialHandler = require('./serial-handler');

const ModbusRTU = require("modbus-serial");
const Drive_CT_M701 = require("./drive-ct-m701");
const PLC_FX3U = require("./plc-mitsubishi-fx3u");

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: cfg.WS_PORT });

const express = require('express');
const app = express();
app.use(express.static(`${__dirname}/GUI`))
app.listen(cfg.GUI_PORT, () => {
    console.log(`listening on port ${cfg.GUI_PORT}`);
});

var drive = new Drive_CT_M701({
    modbusId: cfg.DRIVE_ID,
    modbusTimeout: cfg.MODBUS_TIMEOUT,
});

var plc = new PLC_FX3U({
    modbusId: cfg.PLC_ID,
    modbusTimeout: cfg.MODBUS_TIMEOUT
});

runModbus();
runWS();


async function runModbus() {
    try {

        modbusSerialHandler = await new SerialHandler({ baudRate: cfg.MODBUS_BAUD, stopBits: cfg.MODBUS_STOPBIT}).init();
        modbusPort = modbusSerialHandler.filterByManufacturer(cfg.MODBUS_SERIALNAME).get();
        console.log(modbusPort);
        const client = new ModbusRTU(modbusPort);
        client.open(() => console.log("modbus port OPEN"));
        drive.setClient(client);
        plc.setClient(client);
    } catch(e) { 
        handleErrorCommand(e);
        setTimeout(() => runModbus(), 5000); 
    }
}


async function runWS() {
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
            case WS.SET_DISTANCE_MOTOR_TURN:
                handleDefaultSetCommand(DRIVE.DISTANCE_MOTOR_TURN, WS.SET_DISTANCE_MOTOR_TURN, msg.value);
                break;
            case WS.SET_DISTANCE_ENCODER_TURN:
                handleDefaultSetCommand(DRIVE.DISTANCE_ENCODER_TURN, WS.SET_DISTANCE_ENCODER_TURN, msg.value);
                break;
            case WS.SET_ACCELERATION_POSITION:
                handleDefaultSetCommand(DRIVE.ACCELERATION_POSITION, WS.SET_ACCELERATION_POSITION, msg.value);
                break;
            case WS.SET_DECCELERATION_POSITION:
                handleDefaultSetCommand(DRIVE.DECCELERATION_POSITION, WS.SET_DECCELERATION_POSITION, msg.value);
                break;
            case WS.SET_JOG_ACCELERATION:
                handleDefaultSetCommand(DRIVE.JOG_ACCELERATION, WS.SET_JOG_ACCELERATION, msg.value);
                break;
            case WS.SET_JOG_DECCELERATION:
                handleDefaultSetCommand(DRIVE.JOG_DECCELERATION, WS.SET_JOG_DECCELERATION, msg.value);
                break;
            case WS.SET_JOG_SPEED:
                handleDefaultSetCommand(DRIVE.JOG_SPEED, WS.SET_JOG_SPEED, msg.value);
                break;
            case WS.SET_LENGTH:
                handleDefaultSetCommand(DRIVE.LENGTH, WS.SET_LENGTH, msg.value);
                break;
            case WS.SET_SPEED:
                handleDefaultSetCommand(DRIVE.SPEED, WS.SET_SPEED, msg.value);
                break;
            case WS.RESET_COUNT:
                handleDefaultSetCommand(DRIVE.COUNTER_RESET, WS.RESET_COUNT, msg.value);
                setTimeout(() => {handleDefaultGetCommand(DRIVE.COUNTER_PV, WS.PRESET_COUNT)}, 200);
                break;
            case WS.PRESET_COUNT:
                handleDefaultSetCommand(DRIVE.COUNTER_PV, WS.PRESET_COUNT, msg.value);
                break;
            case WS.SET_THREAD_REVERSE:
                handleThreadRevCommand();
                break;
            case WS.SET_THREAD_FORWARD:
                handleThreadFwdCommand();
                break;
            case WS.GET_DRIVE_DASHBOARD:
                handleDriveDashboard();
                break;
            case WS.GET_DRIVE_SETTING:
                handleDriveSetting();
                break;
            case WS.GET_COUNT:
                handleIntervalGetCommand(DRIVE.COUNTER_CV, WS.GET_COUNT);
                break;
            case WS.RESET_DRIVE:
                console.log('reset called', msg);
                drive.reset()
                    .then(() => handleSuccessCommand(WS.RESET_DRIVE))
                    .catch(handleErrorCommand);
                break;

            case WS.GET_PLC_STATUS:
                handlePlcGetIndicator();
                break;
        }
    } catch(e) { handleErrorCommand(e) }
}


function handlePlcGetIndicator() {
    plc.read_M(20,1)
        .then(v => {
            handleSendWebsocket({
                command: WS.GET_UNCOILER,
                value: v.data[0],
            });
            handleSendWebsocket({
                command: WS.GET_LEVELER,
                value: v.data[1],
            });
            handleSendWebsocket({
                command: WS.GET_RECOILER,
                value: v.data[2],
            });
            handleSendWebsocket({
                command: WS.GET_FEEDER,
                value: v.data[3],
            });
        })
        .catch(() => {});
}


function handleDriveDashboard() {
    drive.readParameter(DRIVE.INIT_DASHBOARD)
        .then(v => {
            handleSendWebsocket({
                command: WS.GET_LENGTH,
                value: v.data[0],
            });
            handleSendWebsocket({
                command: WS.GET_SPEED,
                value: v.data[1],
            });
            handleSendWebsocket({
                command: WS.PRESET_COUNT,
                value: v.data[3],
            });
            handleSendWebsocket({
                command: WS.GET_COUNT,
                value: v.data[3],
            });
        })
        .catch((e) => {
            handleErrorCommand(e);
            setTimeout(() => {handleDriveDashboard()}, cfg.RETRY_TIMEOUT);
        });
}


function handleDriveSetting() {
    drive.readParameter(DRIVE.INIT_SETTING)
        .then(v => {
            handleSendWebsocket({
                command: WS.GET_DISTANCE_MOTOR_TURN,
                value: v.data[0],
            });
            handleSendWebsocket({
                command: WS.GET_DISTANCE_ENCODER_TURN,
                value: v.data[1],
            });
            handleSendWebsocket({
                command: WS.GET_ACCELERATION_POSITION,
                value: v.data[2],
            });
            handleSendWebsocket({
                command: WS.GET_DECCELERATION_POSITION,
                value: v.data[3],
            });
            handleSendWebsocket({
                command: WS.GET_JOG_ACCELERATION,
                value: v.data[4],
            });
            handleSendWebsocket({
                command: WS.GET_JOG_DECCELERATION,
                value: v.data[5],
            });
            handleSendWebsocket({
                command: WS.GET_JOG_SPEED,
                value: v.data[6],
            });
        })
        .catch((e) => {
            handleErrorCommand(e);
            setTimeout(() => {handleDriveSetting()}, cfg.RETRY_TIMEOUT);
        });
}


function handleDefaultSetCommand(parameter, wsCommand, value) {
    drive.writeParameter({
        ...parameter, value
    })
        .then(() => handleSuccessCommand(wsCommand))
        .catch(e => {
            setTimeout(() => {handleDefaultSetCommand(parameter, wsCommand, value)}, cfg.RETRY_TIMEOUT);
            handleErrorCommand(e);
        });
}


function handleDefaultGetCommand(parameter, wsCommand) {
    drive.readParameter(parameter)
        .then((v) => {
            handleSendWebsocket({
                command: wsCommand,
                value: v.data[0],
            });
        })
        .catch(e => {
            setTimeout(() => {handleDefaultGetCommand(parameter, wsCommand)}, cfg.RETRY_TIMEOUT);
            handleErrorCommand(e);
        });
}


function handleIntervalGetCommand(parameter, wsCommand) {
    drive.readParameter(parameter)
        .then((v) => {
            handleSendWebsocket({
                command: wsCommand,
                value: v.data[0],
            });
        })
        .catch(e => {});
}


async function handleThreadFwdCommand() {
    try {

        var current = await drive.readParameter(DRIVE.THREAD_FORWARD);

        await drive.writeParameter({...DRIVE.THREAD_REVERSE, value: 0})
            .then(() => handleSendWebsocket({
                command: WS.SET_THREAD_REVERSE,
                value: 0,
            }))
            .catch(handleErrorCommand);

        setTimeout(() => {
            drive.writeParameter({...DRIVE.THREAD_FORWARD, value: (current.data[0]==1)?0:1})
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

        var current = await drive.readParameter(DRIVE.THREAD_REVERSE);

        drive.writeParameter({...DRIVE.THREAD_FORWARD, value: 0})
            .then(() => handleSendWebsocket({
                command: WS.SET_THREAD_FORWARD,
                value: 0,
            }))
            .catch(handleErrorCommand);

        setTimeout(() => {
            drive.writeParameter({...DRIVE.THREAD_REVERSE, value: (current.data[0]==1)?0:1})
                .then(() => handleSendWebsocket({
                    command: WS.SET_THREAD_REVERSE,
                    value: (current.data[0] == 1) ? 0 : 1,
                }))
                .catch(handleErrorCommand);
        }, 1000);

    } catch(e) { handleErrorCommand(e) }

}

const DRIVE = {
    LENGTH: {menu:18, parameter:1},
    SPEED: {menu:18, parameter:12},

    COUNTER_PV: {menu:18, parameter:13},
    COUNTER_CV: {menu:18, parameter:4},
    COUNTER_RESET: {menu:19, parameter:50},

    THREAD_FORWARD: {menu:18, parameter:31},
    THREAD_REVERSE: {menu:18, parameter:32},

    DISTANCE_MOTOR_TURN: {menu:18, parameter:51},
    DISTANCE_ENCODER_TURN: {menu:18, parameter:52},
    ACCELERATION_POSITION: {menu:18, parameter:53},
    DECCELERATION_POSITION: {menu:18, parameter:54},
    JOG_ACCELERATION: {menu:19, parameter:51},
    JOG_DECCELERATION: {menu:19, parameter:52},
    JOG_SPEED: {menu:19, parameter:53},

    INIT_DASHBOARD: {menu:18, parameter:1, length:4},
    INIT_SETTING: {menu:18, parameter:5, length:7},
}


const WS = {

    GET_PLC_STATUS: 'PLC_Status',
    GET_DRIVE_DASHBOARD: 'Drive_Dashboard',
    GET_DRIVE_SETTING: 'Drive_Setting',

    SET_LENGTH: "set_length",
    SET_SPEED: "set_speed",
    PRESET_COUNT: "preset_count",
    RESET_COUNT: "reset_count",
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
    GET_MODE: "get_mode",

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

    GET_UNCOILER: 'Uncoiler',
    GET_LEVELER: 'Leveller',
    GET_RECOILER: 'Recoiler',
    GET_FEEDER: 'Feeder',

    COMM_SUCCESS: "com_success",
    COMM_ERROR: "com_error",
}
