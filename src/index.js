const cfg = require('./config');

const SerialHandler = require('./serial-handler');
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


async function run() {
    modbusSerialHandler = await new SerialHandler({baudRate: cfg.MODBUS_BAUD}).init();
    serialPort = modbusSerialHandler.filterByManufacturer(cfg.MODBUS_SERIALNAME).get();
    const client = new ModbusRTU(serialPort);
    client.open()

    drive.setClient(client);

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

    // setTimeout(()=> {
    //     drive.saveParameter()
    //         .then(() => {
    //             drive.reset()
    //                 .then(console.log)
    //                 .catch(console.error)
    //         })
    //         .catch(console.error)
    // }, 1000)
    
    // runValue = false;
    // setInterval(() => {
    //     runValue = !runValue;
    //     drive.writeParameter({
    //         menu: 18,
    //         parameter: 31,
    //         value: runValue,
    //     })
    //         .then(console.log)
    //         .catch(console.error)
    // }, 5000);
}


// function handleModbusRead(wss){
//     // get speed
//     drive.readParameter({menu: 18, parameter: 13,})
//         .then((result) =>{
//             handleSendWebsocket(wss, JSON.stringify(result));
//         })
//         .catch(console.error)
// }


function handleSendWebsocket(wss, payload){
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}


function handleWebsocketMessage(msg) {
    switch(msg.command){
        case WS.SET_LENGTH:
            handleLengthCommand(msg.value);
            break;
        case WS.SET_SPEED:
            handleSpeedCommand(msg.value);
            break;
        case WS.SET_COUNT:
            handleCountCommand(msg.value);
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
            handleResetDriveCommand();
            break;
    }
}


async function handleResetDriveCommand() {
    await drive.writeParameter({
        menu: 10,
        parameter: 33,
        value: 1,
    })

    setTimeout(() => {
        drive.writeParameter({
            menu: 10,
            parameter: 33,
            value: 0,
        });
    }, 1000);
}


async function handleLengthCommand(val) {
    await drive.writeParameter({
        menu: 18,
        parameter: 52,
        value: Math.floor(val),
    });
}


async function handleThreadFwdCommand() {

    var current = await drive.readParameter({
        menu: 18,
        parameter: 31
    });
    await drive.writeParameter({
        menu: 18,
        parameter: 32,
        value: 0,
    });
    setTimeout(() => {
        drive.writeParameter({
            menu: 18,
            parameter: 31,
            value: (current.data[0] == 1) ? 0 : 1,
        });
    }, 1000);

}


async function handleThreadRevCommand() {
    
    var current = await drive.readParameter({
        menu: 18,
        parameter: 32
    });
    await drive.writeParameter({
        menu: 18,
        parameter: 31,
        value: 0,
    });
    setTimeout(() => {
        drive.writeParameter({
            menu: 18,
            parameter: 32,
            value: (current.data[0] == 1) ? 0 : 1,
        });
    }, 1000);

}

const WS = {
    SET_LENGTH: "set_length",
    SET_FEED_LENGTH: "set_feedlength",
    SET_SPEED: "set_speed",
    SET_COUNT: "set_count",
    GET_LENGTH: "get_length",
    GET_FEED_LENGTH: "get_feedlength",
    GET_SPEED: "get_speed",
    GET_COUNT: "get_count",
    GET_INDICATOR: "get_indicator",
    SET_THREAD_FORWARD: "set_threadfwd",
    SET_THREAD_REVERSE: "set_threadrev",
    GET_THREAD_FORWARD: "get_threadfwd",
    GET_THREAD_REVERSE: "get_threadrev",
    SET_MODE_SINGLE: "set_modesingle",
    SET_MODE_MULTI: "set_modemulti",
    GET_MODE_MULTI: "get_modemulti",
    RESET_DRIVE: "reset",
}
