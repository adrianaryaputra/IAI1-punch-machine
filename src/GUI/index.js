import {ClickableButton} from './elements/button.js'
import {FormElement} from './elements/form.js'
import {Holder} from './elements/holder.js'
import { Indicator } from './elements/indicator.js';

var wsUri = `ws://${location.hostname}:${+location.port+1}`;
var websocket = new WebSocket(wsUri);

function generateGUI() {

    let holderForm = new Holder({
        parent: document.body,
        style: {
            padding: "1em",
        }
    });

    let lenSubmit = new ClickableButton({
        text: "Submit",
        color: "#0f0",
        isEnable: false,
        callback: () => {
            console.log(formLen.get("length"), formLen.parse("length"));
            if(formLen.parse("length")){
                ws_send(WS.SET_LENGTH, formLen.get("length"));
                lenSubmit.enable(false);
            }
        }
    });

    let feedLenSubmit = new ClickableButton({
        text: "Submit",
        color: "#0f0",
        isEnable: false,
        callback: () => {
            console.log(formLen.get("feedLength"), formLen.parse("feedLength"));
            if(formLen.parse("feedLength")){
                ws_send(WS.SET_FEED_LENGTH, [
                    formLen.get("length"),
                    formLen.get("feedLength")
                ]);
                formLen.set({length: [formLen.get("feedLength")]});
                feedLenSubmit.enable(false);
            }
        }
    });

    let speedSubmit = new ClickableButton({
        text: "Submit",
        color: "#0f0",
        isEnable: false,
        callback: () => {
            console.log(formLen.get("speed"), formLen.parse("speed"));
            if(formLen.parse("speed")){
                ws_send(WS.SET_SPEED, formLen.get("speed"));
                speedSubmit.enable(false);
            }
        }
    });

    let countReset = new ClickableButton({
        text: "Reset Count",
        color: "#f00",
        callback: () => {
            ws_send(WS.SET_COUNT, 0);
            formLen.set({count: [0]});
        }
    });

    let formLen = new FormElement({
        parent: holderForm.element(),
        configs: [
            {
                id: "length",
                label: "Length (mm)",
                placeholder: "000",
                type: "text",
                regParser: /^[0-9]+$/,
                sideButton: lenSubmit.element(),
                inputListener: () => {
                    formLen.set({feedLength: [formLen.get("length")]});
                    lenSubmit.enable(formLen.parse("length"));
                }
            }, {
                id: "feedLength",
                label: "Feed Length (mm)",
                placeholder: "000",
                type: "text",
                regParser: /^[0-9]+$/,
                sideButton: feedLenSubmit.element(),
                inputListener: () => {
                    feedLenSubmit.enable(formLen.parse("feedLength"));
                }
            }, {
                id: "speed",
                label: "Speed %",
                placeholder: "000",
                type: "text",
                regParser: /^[0-9]+$/,
                sideButton: speedSubmit.element(),
                inputListener: () => {
                    speedSubmit.enable(formLen.parse("speed"));
                }
            }, {
                id: "count",
                label: "Count",
                type: "text",
                regParser: /^[0-9]+$/,
                value: [0],
                sideButton: countReset.element(),
                blurListener: () => {
                    console.log(formLen.get("count"), formLen.parse("count"));
                    if(formLen.parse("count")){
                        ws_send(WS.SET_COUNT, formLen.get("count"));
                    }
                }
            }
        ]
    });

    let holderStatus = new Holder({
        parent: document.body,
        style: {
            padding: "1em",
        }
    });

    let textStatus = document.createElement('h3');
    textStatus.textContent = "Status";
    textStatus.style.color = "#FFF";
    textStatus.style.width = "100%";
    textStatus.style.textAlign = "center";
    holderStatus.element().appendChild(textStatus);

    let holderIndicator = new Holder({
        parent: holderStatus.element(),
        style: {
            padding: "1rem 0",
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(3rem, 1fr))",
            gap: "2rem",
        }
    });

    let indicatorStyle = {
        padding: "1rem",
        fontSize: "3rem",
        color: "black",
        borderRadius: ".5rem",
        textAlign: "center",
    };

    let indicatorRecoiler = new Indicator({
        parent: holderIndicator.element(),
        text: "Recoiler",
        style: indicatorStyle,
    });

    let indicatorLeveler = new Indicator({
        parent: holderIndicator.element(),
        text: "Leveler",
        style: indicatorStyle,
    });

    let indicatorCoiler = new Indicator({
        parent: holderIndicator.element(),
        text: "Coiler",
        style: indicatorStyle,
    });

    let indicatorFeeder = new Indicator({
        parent: holderIndicator.element(),
        text: "Feeder",
        style: indicatorStyle,
    })

    let holderControl = new Holder({
        parent: document.body,
        style: {
            padding: "1em",
        }
    });

    let textControl = document.createElement('h3');
    textControl.textContent = "Control";
    textControl.style.color = "#FFF";
    textControl.style.width = "100%";
    textControl.style.textAlign = "center";
    holderControl.element().appendChild(textControl);

    let holderThread = new Holder({
        parent: holderControl.element(),
        style: {
            padding: "1rem 0 0 0",
            display: "grid",
            width: "100%",
            gridTemplateColumns: "repeat(2, minmax(3rem, 1fr))",
            gap: "2rem",
            justifyContent: "center",
        }
    });

    let buttonStyle = {
        fontSize: "2rem",
        textAlign: "center",
        padding: "1rem",
        width: "100%",
    }

    let buttonThreadRev = new ClickableButton({
        parent: holderThread.element(),
        text: "Thread Reverse",
        style: buttonStyle,
        callback: () => {
            ws_send(WS.SET_THREAD_REVERSE, true)
        }
    });

    let buttonThreadFwd = new ClickableButton({
        parent: holderThread.element(),
        text: "Thread Forward",
        style: buttonStyle,
        callback: () => {
            ws_send(WS.SET_THREAD_FORWARD, true)
        }
    });

    let holderCommand = new Holder({
        parent: holderControl.element(),
        style: {
            padding: "2rem 0 0 0",
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(3rem, 1fr))",
            gap: "2rem",
        }
    });

    let buttonModeSingle = new ClickableButton({
        parent: holderCommand.element(),
        text: "Single Mode",
        style: buttonStyle,
        callback: () => {
            ws_send(WS.SET_MODE_SINGLE, true)
        }
    });

    let buttonModeMulti = new ClickableButton({
        parent: holderCommand.element(),
        text: "Multi Mode",
        style: buttonStyle,
        callback: () => {
            ws_send(WS.SET_MODE_MULTI, true)
        }
    });

    let buttonResetDrive = new ClickableButton({
        parent: holderCommand.element(),
        text: "Reset Drive",
        style: buttonStyle,
        callback: () => {
            ws_send(WS.RESET_DRIVE, true)
        }
    });

    let buttonSettings = new ClickableButton({
        parent: holderCommand.element(),
        text: "Setting",
        style: buttonStyle,
        callback: () => {console.log("setting")}
    });

    // let length = new TextBox({
    //     label: 'Test',
    //     type: 'datetime',
    //     inputListener: () => {
    //         console.log(length.get());
    //     }
    // });

    // length.set("2020-12-12 09:55");
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
    console.log(`WS: ${evt.type}`);
    console.log(evt.data);
}
      
function ws_onClose(evt) {
    console.log(`WS: ${evt.type}`);
    console.log(evt.data);
}
      
function ws_onMessage(evt) {
    console.log(`WS: ${evt.type}`);
    console.log(evt.data);
}
      
function ws_onError(evt) {
    console.log(`WS: ${evt.type}`);
    console.log(evt.data);
}

document.addEventListener('DOMContentLoaded', () => {
    ws_load();
    generateGUI();
});