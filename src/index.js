const cfg = require('./config');

const { ModbusHandler } = require('./handler-modbus');
const SerialHandler = require('./handler-serial');

const Drive_M701 = require("./drive-ct-m701");
const PLC_FX3U = require("./plc-mitsubishi-fx3u");


let modbusHandler = new ModbusHandler({
    msgSendInterval: cfg.MODBUS_SEND_INTERVAL,
    timeout: cfg.MODBUS_TIMEOUT,
    retryCount: cfg.STATUS_RETRY_COUNT,
});

let drive = new Drive_M701({
    modbusHandler: modbusHandler,
    modbusId: 1,
    modbusTimeout: cfg.MODBUS_TIMEOUT,
})

let plc = new PLC_FX3U({
    modbusHandler: modbusHandler,
    modbusId: 2,
    modbusTimeout: cfg.MODBUS_TIMEOUT,
})

runModbus();

async function runModbus() {
    try {
        console.log("connecting to modbus ...");

        serialHandler = await new SerialHandler({ baudRate: cfg.MODBUS_BAUD, stopBits: cfg.MODBUS_STOPBIT}).init();
        modbusPort = serialHandler.filterByManufacturer(cfg.MODBUS_SERIALNAME).get();
        // console.log("modbus port:", modbusPort);

        modbusHandler.setConnection(modbusPort);
        modbusHandler.open(() => console.log("modbus port OPEN"));

        // setInterval(() => plc.read({ ...ADDRESS.PLC_INDICATOR }), 1000);
        // setInterval(() => drive.readParameter(ADDRESS.UPDATE_DASHBOARD), 1000);
        drive.readParameter(ADDRESS.LENGTH)
        // drive.readParameter(ADDRESS.GET_TRIP_DATE)

    } catch(e) {
        console.log(e);
        setTimeout(() => runModbus(), 5000); 
    }
}

const ADDRESS = {
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
    UPDATE_DASHBOARD: {menu:18, parameter:3, length:2},
    INIT_SETTING: {menu:18, parameter:5, length:7},
    GET_TRIP: {menu:10, parameter:20, length:10},
    GET_TRIP_DATE: {menu:10, parameter:41, length:20},
    GET_SUBTRIP: {menu:10, parameter:70, length:10},

    PLC_INDICATOR: {type:plc.type.M, address:20, length:1},
}