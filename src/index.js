// configuration import
const cfg = require('./config');

// serial communication import
const { ModbusHandler } = require('./handler-modbus');
const SerialHandler = require('./handler-serial');
const DataState = require('./data-state');

// serial slave object import
const Drive_M701 = require("./drive-ct-m701");
const PLC_FX3U = require("./plc-mitsubishi-fx3u");

// web import
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: cfg.WS_PORT });
const express = require('express');
const app = express();
app.use(express.static(`${__dirname}/GUI`))
app.listen(cfg.GUI_PORT, () => {
    console.log(`listening on port ${cfg.GUI_PORT}`);
});



// create serial handler & slave object
let modbusHandler = new ModbusHandler({
    msgSendInterval: cfg.MODBUS_SEND_INTERVAL,
    timeout: cfg.MODBUS_TIMEOUT,
    retryCount: cfg.STATUS_RETRY_COUNT,
});

let drive = new Drive_M701({
    modbusHandler: modbusHandler,
    modbusId: 1,
    modbusTimeout: cfg.MODBUS_TIMEOUT,
});

let plc = new PLC_FX3U({
    modbusHandler: modbusHandler,
    modbusId: 2,
    modbusTimeout: cfg.MODBUS_TIMEOUT,
});



// create WS command list
const WSCMD = {
    DRIVE_SET_LENGTH                    : "DRIVE_SET_LENGTH",
    DRIVE_SET_SPEED                     : "DRIVE_SET_SPEED",
    DRIVE_SET_COUNTER_PV                : "DRIVE_SET_COUNTER_PV",
    DRIVE_SET_COUNTER_CV                : "DRIVE_SET_COUNTER_CV",
    DRIVE_SET_COUNTER_RESET             : "DRIVE_SET_COUNTER_RESET",
    DRIVE_SET_THREAD_FORWARD            : "DRIVE_SET_THREAD_FORWARD",
    DRIVE_SET_THREAD_REVERSE            : "DRIVE_SET_THREAD_REVERSE",
    DRIVE_SET_DISTANCE_MOTOR_TURN       : "DRIVE_SET_DISTANCE_MOTOR_TURN",
    DRIVE_SET_DISTANCE_ENCODER_TURN     : "DRIVE_SET_DISTANCE_ENCODER_TURN",
    DRIVE_SET_ACCELERATION_POSITION     : "DRIVE_SET_ACCELERATION_POSITION",
    DRIVE_SET_DECCELERATION_POSITION    : "DRIVE_SET_DECCELERATION_POSITION",
    DRIVE_SET_JOG_ACCELERATION          : "DRIVE_SET_JOG_ACCELERATION",
    DRIVE_SET_JOG_DECCELERATION         : "DRIVE_SET_JOG_DECCELERATION",
    DRIVE_SET_JOG_SPEED                 : "DRIVE_SET_JOG_SPEED",

    DRIVE_GET_INDICATOR     : "DRIVE_GET_INDICATOR",
    DRIVE_GET_TRIP_FLAG     : "DRIVE_GET_TRIP_FLAG",
    DRIVE_GET_TRIP          : "DRIVE_GET_TRIP",
    DRIVE_GET_TRIP_DATE     : "DRIVE_GET_TRIP_DATE",
    DRIVE_GET_SUBTRIP       : "DRIVE_GET_SUBTRIP",
    DRIVE_GET_MODBUS_STATS  : "DRIVE_GET_MODBUS_STATS",

    PLC_SET_ENABLE_UNCOILER : "PLC_SET_ENABLE_UNCOILER",
    PLC_SET_ENABLE_LEVELER  : "PLC_SET_ENABLE_LEVELER",
    PLC_SET_ENABLE_RECOILER : "PLC_SET_ENABLE_RECOILER",
    PLC_SET_ENABLE_FEEDER   : "PLC_SET_ENABLE_FEEDER",

    PLC_GET_TRIP_FLAG       : "PLC_GET_TRIP_FLAG",
    PLC_GET_STATE_X         : "PLC_GET_STATE_X",
    PLC_GET_STATE_Y         : "PLC_GET_STATE_Y",
    PLC_GET_MODBUS_STATS    : "PLC_GET_MODBUS_STATS",

    MODBUS_ERROR_LIST       : "MODBUS_ERROR_LIST",
}



// create data state object
let deviceState = new DataState({
    drive_feedLength            : adapter_stateChange_ws(WSCMD.DRIVE_SET_LENGTH),
    drive_feedSpeed             : adapter_stateChange_ws(WSCMD.DRIVE_SET_SPEED),
    drive_feedAcceleration      : adapter_stateChange_ws(WSCMD.DRIVE_SET_ACCELERATION_POSITION),
    drive_feedDecceleration     : adapter_stateChange_ws(WSCMD.DRIVE_SET_DECCELERATION_POSITION),
    drive_punchCountPreset      : adapter_stateChange_ws(WSCMD.DRIVE_SET_COUNTER_PV),
    drive_punchCountDisplay     : adapter_stateChange_ws(WSCMD.DRIVE_SET_COUNTER_CV),
    drive_distanceTurnMotor     : adapter_stateChange_ws(WSCMD.DRIVE_SET_DISTANCE_MOTOR_TURN),
    drive_distanceTurnEncoder   : adapter_stateChange_ws(WSCMD.DRIVE_SET_DISTANCE_ENCODER_TURN),
    drive_jogAcceleration       : adapter_stateChange_ws(WSCMD.DRIVE_SET_JOG_ACCELERATION),
    drive_jogDecceleration      : adapter_stateChange_ws(WSCMD.DRIVE_SET_JOG_DECCELERATION),
    drive_jogSpeed              : adapter_stateChange_ws(WSCMD.DRIVE_SET_JOG_SPEED),
    drive_tripStatus            : adapter_stateChange_ws(WSCMD.DRIVE_GET_TRIP_FLAG),
    drive_tripList              : adapter_stateChange_ws(WSCMD.DRIVE_GET_TRIP),
    drive_tripSub               : adapter_stateChange_ws(WSCMD.DRIVE_GET_SUBTRIP),
    drive_tripDate              : adapter_stateChange_ws(WSCMD.DRIVE_GET_TRIP_DATE),
    drive_modbusStatus          : adapter_stateChange_ws(WSCMD.DRIVE_GET_MODBUS_STATS),

    plc_state_x                 : adapter_stateChange_ws(WSCMD.PLC_GET_STATE_X),
    plc_state_y                 : adapter_stateChange_ws(WSCMD.PLC_GET_STATE_Y),
    plc_tripStatus              : adapter_stateChange_ws(WSCMD.PLC_GET_TRIP_FLAG),
    plc_modbusStatus            : adapter_stateChange_ws(WSCMD.PLC_GET_MODBUS_STATS),

    modbus_errorList            : adapter_stateChange_ws(WSCMD.MODBUS_ERROR_LIST),
});



// create modbus address list
const ADDRESS = {
    DRIVE_SET_LENGTH                    : {menu:18, parameter:1},
    DRIVE_SET_SPEED                     : {menu:18, parameter:12},
    DRIVE_SET_COUNTER_PV                : {menu:18, parameter:13},
    DRIVE_SET_COUNTER_CV                : {menu:18, parameter:4},
    DRIVE_SET_COUNTER_RESET             : {menu:19, parameter:50},
    DRIVE_SET_THREAD_FORWARD            : {menu:18, parameter:31},
    DRIVE_SET_THREAD_REVERSE            : {menu:18, parameter:32},
    DRIVE_SET_DISTANCE_MOTOR_TURN       : {menu:18, parameter:51},
    DRIVE_SET_DISTANCE_ENCODER_TURN     : {menu:18, parameter:52},
    DRIVE_SET_ACCELERATION_POSITION     : {menu:18, parameter:53},
    DRIVE_SET_DECCELERATION_POSITION    : {menu:18, parameter:54},
    DRIVE_SET_JOG_ACCELERATION          : {menu:19, parameter:51},
    DRIVE_SET_JOG_DECCELERATION         : {menu:19, parameter:52},
    DRIVE_SET_JOG_SPEED                 : {menu:19, parameter:53},

    DRIVE_GET_INDICATOR     : {menu:18, parameter:1, length:13},
    DRIVE_GET_TRIP          : {menu:10, parameter:20, length:10},
    DRIVE_GET_TRIP_DATE     : {menu:10, parameter:41, length:20},
    DRIVE_GET_SUBTRIP       : {menu:10, parameter:70, length:10},

    PLC_SET_ENABLE_UNCOILER : {type:plc.type.M, address:16},
    PLC_SET_ENABLE_LEVELER  : {type:plc.type.M, address:17},
    PLC_SET_ENABLE_RECOILER : {type:plc.type.M, address:18},
    PLC_SET_ENABLE_FEEDER   : {type:plc.type.M, address:19},

    PLC_GET_STATE_X         : {type:plc.type.M, address:0, length:1},
    PLC_GET_STATE_Y         : {type:plc.type.M, address:20, length:2},
}



// execute this
runModbus();
runWS();
runUpdater();



async function runModbus() {
    try {
        console.log("connecting to modbus ...");
        let serialHandler = await new SerialHandler({ baudRate: cfg.MODBUS_BAUD, stopBits: cfg.MODBUS_STOPBIT}).init();
        let modbusPort = serialHandler.filterByManufacturer(cfg.MODBUS_SERIALNAME).get();
        modbusHandler.setConnection(modbusPort);
        modbusHandler.open(() => {
            if(typeof stateUpdaterInterval == 'object') {
                for (const key in stateUpdaterInterval) clearInterval(stateUpdaterInterval);
            }
            console.log("modbus port open");
        });
    } catch(e) {
        server_handleError(e);
        setTimeout(() => runModbus(), 5000); 
    }
}



async function runWS() {
    wss.on('connection', (ws) => {
        ws.on('message', (message) => {
            parsedMsg = JSON.parse(message);
            console.log(parsedMsg);
            ws_handleIncoming(ws, parsedMsg.command, parsedMsg.value);
        });
    });
}


function ws_handleIncoming(client, command, value) {
    try {
        switch(command) {
            case "GET_STATE":
                client.send(JSON.stringify({
                    command,
                    payload: {
                        state: deviceState.state,
                        drive_tripCode: drive.tripCode,
                    }
                }))
                break;

            case WSCMD.DRIVE_SET_LENGTH                 :
            case WSCMD.DRIVE_SET_SPEED                  :
            case WSCMD.DRIVE_SET_COUNTER_PV             :
            case WSCMD.DRIVE_SET_COUNTER_CV             :
            case WSCMD.DRIVE_SET_COUNTER_RESET          :
            case WSCMD.DRIVE_SET_DISTANCE_MOTOR_TURN    :
            case WSCMD.DRIVE_SET_DISTANCE_ENCODER_TURN  :
            case WSCMD.DRIVE_SET_ACCELERATION_POSITION  :
            case WSCMD.DRIVE_SET_DECCELERATION_POSITION :
            case WSCMD.DRIVE_SET_JOG_ACCELERATION       :
            case WSCMD.DRIVE_SET_JOG_DECCELERATION      :
            case WSCMD.DRIVE_SET_JOG_SPEED              :
                drive.writeParameter({
                    ...ADDRESS[command],
                    value,
                    callback: (error, success) => {
                        // handle callback
                    }
                });
                break;
            
            case WSCMD.DRIVE_SET_THREAD_FORWARD:
            case WSCMD.DRIVE_SET_THREAD_REVERSE:
                drive.toggleParameter({
                    ...ADDRESS[command],
                    toggleOn: 1,
                    toggleOff: 0,
                    callback: (error, success) => {
                        // handle callback
                    }
                });
                break;
            
            case WSCMD.PLC_SET_ENABLE_UNCOILER :
            case WSCMD.PLC_SET_ENABLE_LEVELER  :
            case WSCMD.PLC_SET_ENABLE_RECOILER :
            case WSCMD.PLC_SET_ENABLE_FEEDER   :
                plc.pulse({
                    ...ADDRESS[command],
                    callback: (error, success) => {
                        // handle callback
                    }
                });
                break;
        }
    } catch(e) {
        server_handleError(e);
    }
}


function ws_broadcast(command, payload) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({command, payload}));
        }
    });
}



function runUpdater() {
    console.log("running updater");

    // update drive main indicator
    drivestateUpdateInterval(
        ADDRESS.DRIVE_GET_INDICATOR,
        (err, success) => {
            if(success) deviceState.update({
                drive_feedLength            : success[0],
                drive_feedSpeed             : success[1],
                drive_tripStatus            : success[2],
                drive_punchCountDisplay     : success[3],
                drive_distanceTurnMotor     : success[4],
                drive_distanceTurnEncoder   : success[5],
                drive_feedAcceleration      : success[6],
                drive_feedDecceleration     : success[7],
                drive_jogAcceleration       : success[8],
                drive_jogDecceleration      : success[9],
                drive_jogSpeed              : success[10],
                drive_punchCountPreset      : success[12],
            });
        },
        cfg.STATE_UPDATE_INTERVAL_PRIMARY
    )

    // update drive trip, subtrip and trip date
    drivestateUpdateInterval(
        ADDRESS.DRIVE_GET_TRIP,
        (err, success) => {
            if(success) deviceState.update({
                drive_tripList: success,
            });
        },
        cfg.STATE_UPDATE_INTERVAL_SECONDARY
    )
    drivestateUpdateInterval(
        ADDRESS.DRIVE_GET_SUBTRIP,
        (err, success) => {
            if(success) deviceState.update({
                drive_tripSub: success,
            });
        },
        cfg.STATE_UPDATE_INTERVAL_SECONDARY
    )
    drivestateUpdateInterval(
        ADDRESS.DRIVE_GET_TRIP_DATE,
        (err, success) => {
            if(success) deviceState.update({
                drive_tripDate: success,
            });
        },
        cfg.STATE_UPDATE_INTERVAL_SECONDARY
    )

    // update plc Y state
    plcStateUpdateInterval(
        ADDRESS.PLC_GET_STATE_Y,
        (err, success) => {
            if(success) deviceState.update({
                plc_state_y : success,
                plc_tripStatus  : success[12],
            });
        },
        cfg.STATE_UPDATE_INTERVAL_PRIMARY
    )

    // update plc X state
    plcStateUpdateInterval(
        ADDRESS.PLC_GET_STATE_X,
        (err, success) => {
            if(success) deviceState.update({
                plc_state_x     : success,
            });
        },
        cfg.STATE_UPDATE_INTERVAL_SECONDARY
    )
}



// send error data to web interface 
function server_handleError(err) {
    let errorStats = {
        error: err.message,
        timestamp: Date.now(),
    };
    if(err.message == 'Port Not Open' && modbusHandler.isOpen){
        // terminate all modbus device online state.
        deviceState.update({ drive_modbusStatus: false });
        deviceState.update({ plc_modbusStatus: false });
        // close connection, then try to reconnect.
        modbusHandler.close();
        runModbus();
    }
    let modbusErrList = deviceState.state.modbus_errorList || [];
    modbusErrList.unshift(errorStats)
    deviceState.update({ 
        modbus_errorList: modbusErrList.slice(0,10)
    })
}



// state-change callback to ws broadcast adapter
function adapter_stateChange_ws(cmd) {
    return (val) => {
        console.log("STATE CHANGE: ", cmd, val)
        ws_broadcast(cmd, val)
    }
}



// state updater function
function drivestateUpdateInterval(address, handles, interval){
    setTimeout(() => {
        drive.readParameter({
            ...address,
            callback: (err, success) => {
                handles(err, success);
                if(success) deviceState.update({ drive_modbusStatus: true });
                if(err) {
                    deviceState.update({ drive_modbusStatus: false });
                    server_handleError(err);
                }
                drivestateUpdateInterval(address, handles, interval);
            }
        });
    }, interval);
}

function plcStateUpdateInterval(address, handles, interval){
    setTimeout(() => {
        plc.read({
            ...address,
            callback: (err, success) => {
                handles(err, success);
                if(success) deviceState.update({ plc_modbusStatus: true });
                if(err) {
                    deviceState.update({ plc_modbusStatus: false });
                    server_handleError(err);
                }
                plcStateUpdateInterval(address, handles, interval)
            }
        });
    }, interval);
}