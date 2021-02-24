import {ClickableButton} from './elements/button/index.js'
import {Table} from './elements/table/index.js'
import {Holder} from './elements/holder/index.js'
import {PubSub} from './elements/pubsub/index.js'
import {Indicator} from './elements/indicator/index.js'

var wsUri = `ws://${location.hostname}:${+location.port+1}`;
var websocket = new WebSocket(wsUri);
var pubsub = new PubSub();

let driveTripData = new Object();
let driveTripDescription = new Object();

function generateGUI() {

    let holderTrip = new Holder({
        parent: document.body,
        style: {
            margin: "1em",
        }
    });



    let buttonStyle = {
        marginBottom: "1em",
        fontSize: "2rem",
        textAlign: "center",
        padding: "1rem",
        width: "100%",
    }

    let btnBackMainMenu = new ClickableButton({
        parent: holderTrip.element(),
        text: "Back to Main Menu",
        style: buttonStyle,
        color: "#FFF",
        callback: () => {
            location.href = location.origin;
        }
    });



    let tripTitle = document.createElement('h3');
    tripTitle.textContent = "Trip Status";
    tripTitle.style.textAlign = 'center';
    tripTitle.style.marginTop = '1em';
    holderTrip.element().appendChild(tripTitle);

    let holderTripIndicator = new Holder({
        parent: holderTrip.element(),
        style: {
            margin: "1em",
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(3rem, 1fr))",
            gap: "1em",
        }
    });

    let indicatorStyle = {
        padding: "1rem",
        fontSize: "2rem",
        color: "black",
        borderRadius: ".5rem",
        textAlign: "center",
    };

    let okDrive = new Indicator({
        parent: holderTripIndicator.element(),
        text: "Drive: Trip",
        style: indicatorStyle,
    });

    let okPLC = new Indicator({
        parent: holderTripIndicator.element(),
        text: "PLC: Stop",
        style: indicatorStyle,
    });



    let holderModbusStatus = new Holder({
        parent: holderTrip.element(),
        style: {
            margin: "1em",
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(3rem, 1fr))",
            gap: "1em",
        }
    });
    
    let indicatorDrive = new Indicator({
        parent: holderModbusStatus.element(),
        text: "Drive-HMI Connection",
        style: indicatorStyle,
    });

    let indicatorPLC = new Indicator({
        parent: holderModbusStatus.element(),
        text: "PLC-HMI Connection",
        style: indicatorStyle,
    });

    

    let driveTripTitle = document.createElement('h3');
    driveTripTitle.textContent = "Drive Trip List";
    driveTripTitle.style.textAlign = 'center';
    driveTripTitle.style.marginTop = '2em';
    holderTrip.element().appendChild(driveTripTitle);

    let driveTripTable = new Table({
        parent: holderTrip.element(),
        header: [
            "Trip",
            "Sub",
            "Description",
            // "Time"
        ],
        contentSize: 10,
        autonum: true,
    });



    let modbusErrorTitle = document.createElement('h3');
    modbusErrorTitle.textContent = "Modbus Error List";
    modbusErrorTitle.style.textAlign = 'center';
    modbusErrorTitle.style.marginTop = '2em';
    holderTrip.element().appendChild(modbusErrorTitle);

    let modbusErrorTable = new Table({
        parent: holderTrip.element(),
        header: [
            "Error Message",
            "Time",
        ],
        contentSize: 10,
        autonum: true,
    });



    pubsub.subscribe(WS.DRIVE_GET_TRIP, (d) => { 
        driveTripData.trip = d;
        driveTripTable.update(driveTripData2table());
    });

    pubsub.subscribe(WS.DRIVE_GET_SUBTRIP, (d) => { 
        driveTripData.sub = d;
        driveTripTable.update(driveTripData2table());
    });

    pubsub.subscribe(WS.DRIVE_GET_TRIP_DATE, (d) => { 
        driveTripData.datetime = d;
        driveTripTable.update(driveTripData2table());
    });

    pubsub.subscribe(WS.MODBUS_ERROR_LIST, (e) => {
        modbusErrorTable.update(
            objArray2Table(e.map(d => ({
                ...d, 
                timestamp: new Date(d.timestamp).toLocaleString("id-ID")
            })))
        );
    })

    pubsub.subscribe(WS.PLC_GET_MODBUS_STATS, (msg) => indicatorPLC.set(msg));
    pubsub.subscribe(WS.DRIVE_GET_MODBUS_STATS, (msg) => indicatorDrive.set(msg));
    pubsub.subscribe(WS.DRIVE_GET_TRIP_FLAG, (msg) => okDrive.set(msg, "Drive: OK"));
    pubsub.subscribe(WS.PLC_GET_TRIP_FLAG, (msg) => okPLC.set(msg, "PLC: OK"));
}

document.addEventListener("DOMContentLoaded", () => {
    generateGUI();
    ws_load();
})


function driveTripData2table(size=10) {
    // check if driveTrip is filled
    if(driveTripData.trip === undefined) driveTripData.trip = Array(size).fill(0)
    if(driveTripData.sub === undefined) driveTripData.sub = Array(size).fill('')
    if(driveTripData.datetime === undefined) driveTripData.datetime = Array(size*2).fill(0)

    driveTripData.description = Array(size).fill('');
    driveTripData.date = []
    driveTripData.time = []
    driveTripData.datetime.forEach((val, idx) => {
        if(idx%2==0){
            let tmpval = val.toString().padStart(6,'0').match(/.{2}/g);
            if(tmpval[1].length == 2) tmpval[1] = ['??', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'][parseInt(tmpval[1])]
            if(tmpval[2].length == 2) tmpval[2] = `20${tmpval[2]}`;
            driveTripData.date.push(tmpval.join('-'));
        }
        else driveTripData.time.push(val.toString().padStart(6,'0').match(/.{2}/g).join(':'))
    })

    let rowArray = Array.from(Array(size).keys());
    let content = rowArray.map((val,idx) => {
        return [
            driveTripData.trip[idx],
            driveTripData.sub[idx],
            driveTripDescription[driveTripData.trip[idx]] ? driveTripDescription[driveTripData.trip[idx]].name : 'undefined',
            // `${driveTripData.date[idx]} at ${driveTripData.time[idx]}`
        ]
    });

    return {
        rowArray: rowArray,
        contentArray: content,
    }
}


function objArray2Table(data=[{}]) {
    let rowArray = Array.from(Array(data.length).keys());
    let content = data.map((obj) => {
        return [ ...Object.values(obj) ]
    });
    return {
        rowArray: rowArray,
        contentArray: content,
    }
}


function ws_load() {
    websocket.onopen = function(evt) { ws_onOpen(evt) };
    websocket.onclose = function(evt) { ws_onClose(evt) };
    websocket.onmessage = function(evt) { ws_onMessage(evt) };
    websocket.onerror = function(evt) { ws_onError(evt) };
}

function ws_send(command, value) {
    websocket.send(JSON.stringify({
        command,
        value
    }))
}
      
function ws_onOpen(evt) {
    ws_send("GET_STATE", true);
}
      
function ws_onClose(evt) {
    console.log(`WS: ${evt.type}`);
    console.log(evt.data);
    location.reload();
}
      
function ws_onMessage(evt) {
    // console.log(`WS: ${evt.type}`);
    let parsedEvt = JSON.parse(evt.data);
    // console.log(parsedEvt);
    switch(parsedEvt.command){
        case "GET_STATE":
            driveTripDescription = parsedEvt.payload.drive_tripCode;
            for (const key in parsedEvt.payload.state) {
                // console.log("sending to pubsub: ", MAP_STATE_WS[key], parsedEvt.payload.state[key]);
                pubsub.publish(MAP_STATE_WS[key], parsedEvt.payload.state[key]);
            }
            break;
        default:
            pubsub.publish(parsedEvt.command, parsedEvt.payload);
            break;
    }
}
      
function ws_onError(evt) {
    console.log(`WS: ${evt.type}`);
    console.log(evt.data);
}

const WS = {
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

const MAP_STATE_WS = {
    drive_feedLength            : WS.DRIVE_SET_LENGTH,
    drive_feedSpeed             : WS.DRIVE_SET_SPEED,
    drive_feedAcceleration      : WS.DRIVE_SET_ACCELERATION_POSITION,
    drive_feedDecceleration     : WS.DRIVE_SET_DECCELERATION_POSITION,
    drive_punchCountPreset      : WS.DRIVE_SET_COUNTER_PV,
    drive_punchCountDisplay     : WS.DRIVE_SET_COUNTER_CV,
    drive_distanceTurnMotor     : WS.DRIVE_SET_DISTANCE_MOTOR_TURN,
    drive_distanceTurnEncoder   : WS.DRIVE_SET_DISTANCE_ENCODER_TURN,
    drive_jogAcceleration       : WS.DRIVE_SET_JOG_ACCELERATION,
    drive_jogDecceleration      : WS.DRIVE_SET_JOG_DECCELERATION,
    drive_jogSpeed              : WS.DRIVE_SET_JOG_SPEED,
    drive_tripStatus            : WS.DRIVE_GET_TRIP_FLAG,
    drive_tripList              : WS.DRIVE_GET_TRIP,
    drive_tripSub               : WS.DRIVE_GET_SUBTRIP,
    drive_tripDate              : WS.DRIVE_GET_TRIP_DATE,
    drive_modbusStatus          : WS.DRIVE_GET_MODBUS_STATS,

    plc_state_x                 : WS.PLC_GET_STATE_X,
    plc_state_y                 : WS.PLC_GET_STATE_Y,
    plc_tripStatus              : WS.PLC_GET_TRIP_FLAG,
    plc_modbusStatus            : WS.PLC_GET_MODBUS_STATS,

    modbus_errorList            : WS.MODBUS_ERROR_LIST,
}