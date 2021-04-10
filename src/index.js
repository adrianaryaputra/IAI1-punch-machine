const exec = require('child_process').exec;

// configuration import
const cfg = require('./config.json');
const deviceName = require('os').hostname();

// serial communication import
const { ModbusHandler, SerialPort } = require('com-modbus');
const { ModbusDevice_Nidec_M701 }   = require('modbus-nidec-m701');
const { ModbusDevice_FX3U }         = require('modbus-mitsubishi-fx3u');

// state observer
const DataState = require('observable-state');


// web import
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: cfg.WS_PORT });
const express = require('express');
const app = express();
app.use(express.static(`${__dirname}/GUI`))
app.listen(cfg.GUI_PORT, () => {
    console.log(`listening on port ${cfg.GUI_PORT}`);
});


// mqtt import
const mqtt = require('mqtt');
const mqclient = mqtt.connect(cfg.MQTT_BROKER, {port:5001, clientId: deviceName});




// create serial handler & slave object
let modbusHandler = new ModbusHandler({
    msgSendInterval: cfg.MODBUS_SEND_INTERVAL,
    timeout: cfg.MODBUS_TIMEOUT,
    retryCount: cfg.STATUS_RETRY_COUNT,
});

let drive = new ModbusDevice_Nidec_M701({
    modbusHandler: modbusHandler,
    modbusId: 1,
    modbusTimeout: cfg.MODBUS_TIMEOUT,
});

let plc = new ModbusDevice_FX3U({
    modbusHandler: modbusHandler,
    modbusId: 2,
    modbusTimeout: cfg.MODBUS_TIMEOUT,
});




// execute this
let updaterRunning = false;
runModbus();
runWS();
runMQ();




async function runModbus() {
    try {
        modbusRunning = true;
        console.log("connecting to modbus ...");
        let serialList = (await SerialPort.list()).filter(s => s.manufacturer === cfg.MODBUS_SERIALNAME);
        if(serialList.length == 1) {
            let modbusPort = new SerialPort(serialList[0].path, {autoOpen: false, baudRate: cfg.MODBUS_BAUD, stopBits: cfg.MODBUS_STOPBIT});
            modbusHandler.setConnection(modbusPort).open(() => {
                drive_resetCount(() => {
                    if(!updaterRunning) { runUpdater(); updaterRunning = true; }
                });
                console.log("modbus port open", modbusHandler);
            });
        }
        else throw Error(`there are ${serialList.length} serial selected, it should be 1.`)
    } catch(e) {
        server_handleError(e);
        server_handleError(Error('Port Not Open'));
    }
}



function drive_resetCount(cb = ()=>{}) {
    drive.writeParameter({
        ...ADDRESS[CMD.DRIVE_COUNTER_RESET],
        value: 1,
        callback: (e,s) => {
            if(e) drive_resetCount();
            if(s) cb();
        }
    });
}



function runWS() {
    wss.on('connection', (ws) => {
        ws.on('message', (message) => {
            parsedMsg = JSON.parse(message);
            console.log(parsedMsg);
            ws_handleIncoming(ws, parsedMsg.command, parsedMsg.value);
        });
    });
}



function runMQ() {
    mqclient.on("connect", () => {
        mqclient.subscribe(`MP/${deviceName}/#`);
        mq_publish("GET_STATE", true);
    });
    mqclient.on("message", (topic, message) => {
        const t = topic.split('/');
        console.log("receive:", t, message.toString());
        switch(t[2]) {
            case "SERVER_STATE":
                if(Buffer.isBuffer(message)) message = JSON.parse(message.toString()).payload
                console.log("SERVER_STATE", message);
                for (const data in message) {
                    deviceState.state[data] = message[data];
                    ws_broadcast(data, message[data]);
                }
                break;
            case CMD.STATS_COUNTER:
                deviceState.update({[t[2]]: message});
                break;
        }
    })
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
            
            case "REBOOT":
                handleRestart();
                break;

            case CMD.DRIVE_LENGTH                 :
            case CMD.DRIVE_SPEED                  :
            case CMD.DRIVE_COUNTER_PV             :
            case CMD.DRIVE_COUNTER_CV             :
            case CMD.DRIVE_COUNTER_RESET          :
            case CMD.DRIVE_DISTANCE_MOTOR_TURN    :
            case CMD.DRIVE_DISTANCE_ENCODER_TURN  :
            case CMD.DRIVE_ACCELERATION_POSITION  :
            case CMD.DRIVE_DECCELERATION_POSITION :
            case CMD.DRIVE_JOG_ACCELERATION       :
            case CMD.DRIVE_JOG_DECCELERATION      :
            case CMD.DRIVE_JOG_SPEED              :
                drive.writeParameter({
                    ...ADDRESS[command],
                    value,
                    callback: (e,s) => deviceState.update({...MAP_WS_STATE[command](s)}),
                });
                break;
            
            case CMD.DRIVE_THREAD_FORWARD :
                drive.writeParameter({
                    ...ADDRESS.DRIVE_THREAD_REVERSE,
                    value: 0,
                    callback: (e,s) => {
                        if(s !== null) {
                            deviceState.update({
                                drive_threadReverseFlag: s
                            });
                            drive.toggleParameter({
                                ...ADDRESS[command],
                                toggleOn: 1,
                                toggleOff: 0,
                                callback: (er, sc) => {
                                    if(sc !== null) deviceState.update({
                                        drive_threadForwardFlag: sc
                                    });
                                }
                            });
                        }
                    },
                });
                break;
                
            case CMD.DRIVE_THREAD_REVERSE :
                drive.writeParameter({
                    ...ADDRESS.DRIVE_THREAD_FORWARD,
                    value: 0,
                    callback: (e,s) => {
                        if(s !== null) {
                            deviceState.update({
                                drive_threadForwardFlag: s
                            })
                            drive.toggleParameter({
                                ...ADDRESS[command],
                                toggleOn: 1,
                                toggleOff: 0,
                                callback: (er, sc) => {
                                    if(sc !== null) deviceState.update({
                                        drive_threadReverseFlag: sc
                                    })
                                }
                            });
                        }
                    },
                });
                break;
            
            case CMD.PLC_ENABLE_UNCOILER  :
            case CMD.PLC_ENABLE_LEVELER   :
            case CMD.PLC_ENABLE_RECOILER  :
            case CMD.PLC_ENABLE_FEEDER    :
            case CMD.PLC_ENABLE_FEEDCLAMP :
            case CMD.PLC_ENABLE_PUNCH1X   :
                plc.pulse({
                    ...ADDRESS[command],
                    callback: (e,s) => {
                        if(s!==null) {
                            console.log("OLD", deviceState.state.plc_state_y);
                            console.log("NEW", MAP_WS_STATE[command](deviceState.state.plc_state_y));
                            deviceState.update({
                                ...MAP_WS_STATE[command](deviceState.state.plc_state_y)
                            });
                        }
                    }
                });
                break;
            
            case CMD.STATS_NAMA_PELANGGAN :
            case CMD.STATS_TEBAL_BAHAN    :
            case CMD.STATS_DIAMETER_PON   :
                deviceState.update({
                    [command]: value
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



function mq_publish(command, payload) {
    const ps = JSON.stringify({
        success: true,
        payload: payload
    });
    const topic = ["MP", deviceName, command].join('/')
    mqclient.publish(topic, ps, {qos: 2})
}



function runUpdater() {
    console.log("running updater");

    // update drive main indicator
    drivestateUpdateInterval(
        ADDRESS.DRIVE_INDICATOR,
        (err, success) => {
            if(success) {
                // send punch diff if diff > 0
                let punchDiff = (success[3] - deviceState.state.drive_punchCountDisplay);
                punchDiff > 0 ? punchDiff : 0;
                if(punchDiff) mq_publish(CMD.STATS_PUNCHING, punchDiff);

                // update state
                deviceState.update({
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
            }
        },
        cfg.STATE_UPDATE_INTERVAL_PRIMARY
    )

    // update drive trip, subtrip and trip date
    drivestateUpdateInterval(
        ADDRESS.DRIVE_TRIP,
        (err, success) => {
            if(success) deviceState.update({
                drive_tripList: success,
            });
        },
        cfg.STATE_UPDATE_INTERVAL_SECONDARY
    )
    drivestateUpdateInterval(
        ADDRESS.DRIVE_SUBTRIP,
        (err, success) => {
            if(success) deviceState.update({
                drive_tripSub: success,
            });
        },
        cfg.STATE_UPDATE_INTERVAL_SECONDARY
    )
    drivestateUpdateInterval(
        ADDRESS.DRIVE_TRIP_DATE,
        (err, success) => {
            if(success) deviceState.update({
                drive_tripDate: success,
            });
        },
        cfg.STATE_UPDATE_INTERVAL_SECONDARY
    )

    // update plc Y state
    plcStateUpdateInterval(
        ADDRESS.PLC_STATE_Y,
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
        ADDRESS.PLC_STATE_X,
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
    if(err.message == 'Port Not Open') {
        // terminate all modbus device online state.
        deviceState.update({ drive_modbusStatus: false });
        deviceState.update({ plc_modbusStatus: false });
        // close connection and reconnect
        modbusHandler.close();
        setTimeout(() => runModbus(), 5000);
    }
    let modbusError = deviceState.state.modbus_errorList || []
    let modbusErrList = modbusError.slice(0,9);
    modbusErrList.unshift(errorStats);
    deviceState.update({ 
        modbus_errorList: modbusErrList
    });
}



function handleRestart() {
    exec("reboot");
}



// state-change callback to ws broadcast adapter
function ws_onStateChange(cmd) {
    return (cur) => {
        console.log("STATE CHANGE [WS]: ", cmd);
        ws_broadcast(cmd, cur);
    }
}

function mq_onStateChange(cmd) {
    return (cur) => {
        console.log("STATE CHANGE [MQ]: ", cmd);
        mq_publish(cmd, cur);
    }
}

function wq_onStateChange(cmd) {
    return (cur) => {
        console.log("STATE CHANGE [WQ]: ", cmd);
        ws_broadcast(cmd, cur);
        mq_publish(cmd, cur);
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





// create command list
const CMD = cfg.COMMAND;



// WS map to statelist
const MAP_WS_STATE = {
    DRIVE_LENGTH                 : (val) => ({drive_feedLength: val}),          
    DRIVE_SPEED                  : (val) => ({drive_feedSpeed: val}),           
    DRIVE_ACCELERATION_POSITION  : (val) => ({drive_feedAcceleration: val}),    
    DRIVE_DECCELERATION_POSITION : (val) => ({drive_feedDecceleration: val}),   
    DRIVE_COUNTER_PV             : (val) => ({drive_punchCountPreset: val}),    
    DRIVE_COUNTER_CV             : (val) => ({drive_punchCountDisplay: val}),   
    DRIVE_DISTANCE_MOTOR_TURN    : (val) => ({drive_distanceTurnMotor: val}),   
    DRIVE_DISTANCE_ENCODER_TURN  : (val) => ({drive_distanceTurnEncoder: val}), 
    DRIVE_JOG_ACCELERATION       : (val) => ({drive_jogAcceleration: val}),     
    DRIVE_JOG_DECCELERATION      : (val) => ({drive_jogDecceleration: val}),    
    DRIVE_JOG_SPEED              : (val) => ({drive_jogSpeed: val}),            
    DRIVE_TRIP_FLAG              : (val) => ({drive_tripStatus: val}),          
    DRIVE_TRIP                   : (val) => ({drive_tripList: val}),            
    DRIVE_SUBTRIP                : (val) => ({drive_tripSub: val}),             
    DRIVE_TRIP_DATE              : (val) => ({drive_tripDate: val}),            
    DRIVE_MODBUS_STATS           : (val) => ({drive_modbusStatus: val}),
    
    PLC_ENABLE_UNCOILER          : (y) => {y[0]=!y[0]; return({plc_state_y: y})},
    PLC_ENABLE_LEVELER           : (y) => {y[1]=!y[1]; return({plc_state_y: y})},
    PLC_ENABLE_RECOILER          : (y) => {y[2]=!y[2]; return({plc_state_y: y})},
    PLC_ENABLE_FEEDER            : (y) => {y[3]=!y[3]; return({plc_state_y: y})},
    PLC_ENABLE_FEEDCLAMP         : (y) => {y[6]=!y[6]; return({plc_state_y: y})},
    PLC_ENABLE_PUNCH1X           : (y) => {y[4]=!y[4]; return({plc_state_y: y})},

    PLC_STATE_X                  : (val) => ({plc_state_x: val}),
    PLC_STATE_Y                  : (val) => ({plc_state_y: val}),
    PLC_TRIP_FLAG                : (val) => ({plc_tripStatus: val}),
    PLC_MODBUS_STATS             : (val) => ({plc_modbusStatus: val}),

    MODBUS_ERRORS                : (val) => ({modbus_errorList: val}),
}



// create data state object
let deviceState = new DataState({
    drive_feedLength            : ws_onStateChange(CMD.DRIVE_LENGTH),
    drive_feedSpeed             : wq_onStateChange(CMD.DRIVE_SPEED),
    drive_feedAcceleration      : ws_onStateChange(CMD.DRIVE_ACCELERATION_POSITION),
    drive_feedDecceleration     : ws_onStateChange(CMD.DRIVE_DECCELERATION_POSITION),
    drive_punchCountPreset      : ws_onStateChange(CMD.DRIVE_COUNTER_PV),
    drive_punchCountDisplay     : ws_onStateChange(CMD.DRIVE_COUNTER_CV),
    drive_distanceTurnMotor     : ws_onStateChange(CMD.DRIVE_DISTANCE_MOTOR_TURN),
    drive_distanceTurnEncoder   : ws_onStateChange(CMD.DRIVE_DISTANCE_ENCODER_TURN),
    drive_threadForwardFlag     : ws_onStateChange(CMD.DRIVE_THREAD_FORWARD),
    drive_threadReverseFlag     : ws_onStateChange(CMD.DRIVE_THREAD_REVERSE),
    drive_jogAcceleration       : ws_onStateChange(CMD.DRIVE_JOG_ACCELERATION),
    drive_jogDecceleration      : ws_onStateChange(CMD.DRIVE_JOG_DECCELERATION),
    drive_jogSpeed              : ws_onStateChange(CMD.DRIVE_JOG_SPEED),
    drive_tripStatus            : ws_onStateChange(CMD.DRIVE_TRIP_FLAG),
    drive_tripList              : ws_onStateChange(CMD.DRIVE_TRIP),
    drive_tripSub               : ws_onStateChange(CMD.DRIVE_SUBTRIP),
    drive_tripDate              : ws_onStateChange(CMD.DRIVE_TRIP_DATE),
    drive_modbusStatus          : ws_onStateChange(CMD.DRIVE_MODBUS_STATS),

    plc_state_x                 : ws_onStateChange(CMD.PLC_STATE_X),
    plc_state_y                 : ws_onStateChange(CMD.PLC_STATE_Y),
    plc_tripStatus              : ws_onStateChange(CMD.PLC_TRIP_FLAG),
    plc_modbusStatus            : ws_onStateChange(CMD.PLC_MODBUS_STATS),

    modbus_errorList            : ws_onStateChange(CMD.MODBUS_ERRORS),

    [CMD.STATS_NAMA_PELANGGAN]  : wq_onStateChange(CMD.STATS_NAMA_PELANGGAN),
    [CMD.STATS_TEBAL_BAHAN]     : wq_onStateChange(CMD.STATS_TEBAL_BAHAN),
    [CMD.STATS_DIAMETER_PON]    : wq_onStateChange(CMD.STATS_DIAMETER_PON),
    [CMD.STATS_COUNTER]         : ws_onStateChange(CMD.STATS_COUNTER),
});



// create modbus address list
const ADDRESS = {
    DRIVE_LENGTH                    : {menu:18, parameter:1},
    DRIVE_SPEED                     : {menu:18, parameter:12},
    DRIVE_COUNTER_PV                : {menu:18, parameter:13},
    DRIVE_COUNTER_CV                : {menu:18, parameter:4},
    DRIVE_COUNTER_RESET             : {menu:19, parameter:50},
    DRIVE_THREAD_FORWARD            : {menu:18, parameter:31},
    DRIVE_THREAD_REVERSE            : {menu:18, parameter:32},
    DRIVE_DISTANCE_MOTOR_TURN       : {menu:18, parameter:51},
    DRIVE_DISTANCE_ENCODER_TURN     : {menu:18, parameter:52},
    DRIVE_ACCELERATION_POSITION     : {menu:18, parameter:53},
    DRIVE_DECCELERATION_POSITION    : {menu:18, parameter:54},
    DRIVE_JOG_ACCELERATION          : {menu:19, parameter:51},
    DRIVE_JOG_DECCELERATION         : {menu:19, parameter:52},
    DRIVE_JOG_SPEED                 : {menu:19, parameter:53},

    DRIVE_INDICATOR                 : {menu:18, parameter:1, length:13},
    DRIVE_TRIP                      : {menu:10, parameter:20, length:10},
    DRIVE_TRIP_DATE                 : {menu:10, parameter:41, length:20},
    DRIVE_SUBTRIP                   : {menu:10, parameter:70, length:10},

    PLC_ENABLE_UNCOILER             : {type:plc.type.M, address:16},
    PLC_ENABLE_LEVELER              : {type:plc.type.M, address:17},
    PLC_ENABLE_RECOILER             : {type:plc.type.M, address:18},
    PLC_ENABLE_FEEDER               : {type:plc.type.M, address:19},
    PLC_ENABLE_FEEDCLAMP            : {type:plc.type.M, address:33},
    PLC_ENABLE_PUNCH1X              : {type:plc.type.M, address:34},

    PLC_STATE_X                     : {type:plc.type.M, address:0, length:1},
    PLC_STATE_Y                     : {type:plc.type.M, address:20, length:2},
}
