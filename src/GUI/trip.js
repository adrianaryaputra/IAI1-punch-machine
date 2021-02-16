import {ClickableButton} from './elements/button/index.js'
import {FormElement} from './elements/form/index.js'
import {Holder} from './elements/holder/index.js'
import {MessageViewer} from './elements/message/index.js'
import {PubSub} from './pubsub/index.js'

var wsUri = `ws://${location.hostname}:${+location.port+1}`;
var websocket = new WebSocket(wsUri);
var pubsub = new PubSub();

function generateGUI() {

    let holderForm = new Holder({
        parent: document.body,
        style: {
            padding: "1em",
        }
    });

    let buttonStyle = {
        marginTop: "1em",
        fontSize: "2rem",
        textAlign: "center",
        padding: "1rem",
        width: "100%",
    }

    let btnBackMainMenu = new ClickableButton({
        parent: holderForm.element(),
        text: "Back to Main Menu",
        style: buttonStyle,
        color: "#FFF",
        callback: () => {
            location.href = location.origin;
        }
    });

}

document.addEventListener("DOMContentLoaded", () => {
    generateGUI();
    ws_load();
})


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
    setTimeout(() => {ws_send(WS.GET_DRIVE_TRIP, true)}, 0);
    setTimeout(() => {ws_send(WS.GET_DRIVE_SUBTRIP, true)}, 1000);
    setTimeout(() => {ws_send(WS.GET_DRIVE_TRIP_DATE, true)}, 2000);
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
}