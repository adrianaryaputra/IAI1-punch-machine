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



    let tripTitle = document.createElement('h3');
    tripTitle.textContent = "Trip Status";
    tripTitle.style.textAlign = 'center';
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


    let buttonStyle = {
        marginTop: "1em",
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

    fetch("./etc/CT-M701-trip-code.json")
        .then(response => {
            return response.json();
        })
        .then(data => driveTripDescription = data);

    pubsub.subscribe(WS.GET_DRIVE_TRIP, (d) => { 
        driveTripData.trip = d;
        driveTripTable.update(driveTripData2table());
    });

    pubsub.subscribe(WS.GET_DRIVE_SUBTRIP, (d) => { 
        driveTripData.sub = d;
        driveTripTable.update(driveTripData2table());
    });

    pubsub.subscribe(WS.GET_DRIVE_TRIP_DATE, (d) => { 
        driveTripData.datetime = d;
        driveTripTable.update(driveTripData2table());
    });

    pubsub.subscribe(WS.PLC_STATUS, (msg) => indicatorPLC.set(msg));
    pubsub.subscribe(WS.DRIVE_STATUS, (msg) => indicatorDrive.set(msg));
    pubsub.subscribe(WS.DRIVE_TRIP, (msg) => okDrive.set(!msg, "Drive: OK"));
    pubsub.subscribe(WS.PLC_RUN, (msg) => okPLC.set(msg.data[0], "PLC: OK"));
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

function get_trip() {
    setTimeout(() => {ws_send(WS.GET_DRIVE_TRIP, true)}, 400);
    setTimeout(() => {ws_send(WS.GET_DRIVE_SUBTRIP, true)}, 1400);
    // setTimeout(() => {ws_send(WS.GET_DRIVE_TRIP_DATE, true)}, 2400);
}
      
function ws_onOpen(evt) {

    get_trip();
    setInterval(() => get_trip(), 10000);

    setInterval(() => {
        setTimeout(() => ws_send(WS.GET_DRIVE_DASHBOARD_UPDATE, true), 0);
        setTimeout(() => ws_send(WS.PLC_RUN, true), 200);
    }, 1000);
}
      
function ws_onClose(evt) {
    console.log(`WS: ${evt.type}`);
    console.log(evt.data);
}
      
function ws_onMessage(evt) {
    console.log(`WS: ${evt.type}`);
    let parsedEvt = JSON.parse(evt.data);
    console.log(parsedEvt);
    switch(parsedEvt.command){
        default:
            pubsub.publish(parsedEvt.command, parsedEvt.value);
            break;
    }
}
      
function ws_onError(evt) {
    console.log(`WS: ${evt.type}`);
    console.log(evt.data);
}

const WS = {
    GET_DRIVE_TRIP: 'Get_Drive_Trip',
    GET_DRIVE_SUBTRIP: 'Get_Drive_Subtrip',
    GET_DRIVE_TRIP_DATE: 'Get_Drive_Trip_Date',

    PLC_STATUS: 'PLC_Status',
    PLC_RUN: 'PLC_Run',
    DRIVE_STATUS: 'DRIVE_Status',
    DRIVE_TRIP: 'DRIVE_Trip',

    GET_DRIVE_DASHBOARD_UPDATE: 'Drive_Dashboard_Update',
    GET_PLC_DASHBOARD: 'PLC_Dashboard',
}