import {ClickableButton} from './elements/button/index.js'
import {FormElement} from './elements/form/index.js'
import {Holder} from './elements/holder/index.js'
import {Indicator} from './elements/indicator/index.js'
import {MessageViewer} from './elements/message/index.js'
import {PubSub} from './pubsub/index.js'

var wsUri = `ws://${location.hostname}:${+location.port+1}`;
var websocket = new WebSocket(wsUri);
var pubsub = new PubSub();

function generateGUI() {

    let holderForm = new Holder({
        parent: document.body,
        style: {
            margin: "1em",
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
            ws_send(WS.RESET_COUNT, true);
        }
    });

    let countPreset = new ClickableButton({
        text: "Preset Count",
        color: "#0f0",
        callback: () => {
            ws_send(WS.PRESET_COUNT, formLen.get("pcount"));
        }
    });

    let formLen = new FormElement({
        parent: holderForm.element(),
        style: {
            gap: "1em",
        },
        configs: [
            {
                id: "length",
                label: "Length (mm)",
                placeholder: "000",
                type: "text",
                regParser: /^[0-9]+$/,
                sideButton: lenSubmit.element(),
                blurListener: () => {
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
                blurListener: () => {
                    feedLenSubmit.enable(formLen.parse("feedLength"));
                }
            }, {
                id: "speed",
                label: "Speed %",
                placeholder: "000",
                type: "text",
                regParser: /^[0-9]+$/,
                sideButton: speedSubmit.element(),
                blurListener: () => {
                    speedSubmit.enable(formLen.parse("speed"));
                }
            }, {
                id: "count",
                label: "Count",
                type: "text",
                regParser: /^[0-9]+$/,
                value: [0],
                sideButton: countReset.element(),
            }, {
                id: "pcount",
                label: "Preset Count",
                type: "text",
                regParser: /^[0-9]+$/,
                value: [0],
                sideButton: countPreset.element(),
            }
        ]
    });

    let holderStatus = new Holder({
        parent: document.body,
        style: {
            margin: "1em",
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
            padding: "1rem 0 0 0",
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(3rem, 1fr))",
            gap: "1em",
        }
    });

    let indicatorStyle = {
        padding: "1rem",
        fontSize: "3rem",
        color: "black",
        borderRadius: ".5rem",
        textAlign: "center",
    };

    let indicatorUncoiler = new Indicator({
        parent: holderIndicator.element(),
        text: "Uncoiler",
        style: indicatorStyle,
    });

    let indicatorLeveler = new Indicator({
        parent: holderIndicator.element(),
        text: "Leveler",
        style: indicatorStyle,
    });

    let indicatorRecoiler = new Indicator({
        parent: holderIndicator.element(),
        text: "Recoiler",
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
            margin: "1em",
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
            padding: "1em 0 0 0",
            display: "grid",
            width: "100%",
            gridTemplateColumns: "repeat(2, minmax(3rem, 1fr))",
            gap: "1em",
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
            padding: "1em 0 0 0",
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(3rem, 1fr))",
            gap: "1em",
        }
    });

    // let buttonModeSingle = new ClickableButton({
    //     // parent: holderCommand.element(),
    //     text: "Single Mode",
    //     style: buttonStyle,
    //     callback: () => {
    //         ws_send(WS.SET_MODE_SINGLE, true)
    //     }
    // });

    // let buttonModeMulti = new ClickableButton({
    //     // parent: holderCommand.element(),
    //     text: "Multi Mode",
    //     style: buttonStyle,
    //     callback: () => {
    //         ws_send(WS.SET_MODE_MULTI, true)
    //     }
    // });

    // let buttonResetDrive = new ClickableButton({
    //     parent: holderCommand.element(),
    //     text: "Reset Drive",
    //     style: buttonStyle,
    //     callback: () => {
    //         ws_send(WS.RESET_DRIVE, true)
    //     }
    // });

    let buttonTrip = new ClickableButton({
        parent: holderCommand.element(),
        text: "Trip Status",
        style: buttonStyle,
        callback: () => {}
    });

    let buttonSettings = new ClickableButton({
        parent: holderCommand.element(),
        text: "Setting",
        style: buttonStyle,
        callback: () => {
            location.href = '/setup.html'
        }
    });

    let holderModbusStatus = new Holder({
        parent: holderControl.element(),
        style: {
            padding: "1em 0 0 0",
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

    let messageHandle = new MessageViewer({ parent: document.body });


    // keyboard
    const inputList = document.querySelectorAll("input[type=text]");
    inputList.forEach(i => {
        i.classList.add("virtual-keyboard")
        i.setAttribute("data-kioskboard-type", "numpad")
    })

    KioskBoard.Init({
        keysArrayOfObjects: [
            {
              "0": "Q",
              "1": "W",
              "2": "E",
              "3": "R",
              "4": "T",
              "5": "Y",
              "6": "U",
              "7": "I",
              "8": "O",
              "9": "P"
            },
            {
              "0": "A",
              "1": "S",
              "2": "D",
              "3": "F",
              "4": "G",
              "5": "H",
              "6": "J",
              "7": "K",
              "8": "L"
            },
            {
              "0": "Z",
              "1": "X",
              "2": "C",
              "3": "V",
              "4": "B",
              "5": "N",
              "6": "M"
            }
          ],
        language: 'en',
        // The theme of keyboard => "light" || "dark" || "flat" || "material" || "oldschool"
        theme: 'dark',
        capsLockActive: true,
        allowRealKeyboard: true,
        cssAnimations: true,
        cssAnimationsDuration: 360,
        cssAnimationsStyle: 'slide',
        keysAllowSpacebar: true,
        keysSpacebarText: 'Space',
        keysFontFamily: 'sans-serif',
        keysFontSize: '22px',
        keysFontWeight: 'normal',
        keysIconSize: '25px',
        allowMobileKeyboard: true,
        autoScroll: true,
    });
    KioskBoard.Run('.virtual-keyboard');



    // pubsub
    pubsub.subscribe(PUBSUB.LENGTH, (msg) => formLen.set({length: [msg], feedLength: [msg]}));
    pubsub.subscribe(PUBSUB.SPEED, (msg) => formLen.set({speed: [msg]}));
    pubsub.subscribe(PUBSUB.COUNT, (msg) => formLen.set({count: [msg]}));

    pubsub.subscribe(PUBSUB.STATUS_UNCOILER, (msg) => indicatorUncoiler.set(msg));
    pubsub.subscribe(PUBSUB.STATUS_LEVELER, (msg) => indicatorLeveler.set(msg));
    pubsub.subscribe(PUBSUB.STATUS_RECOILER, (msg) => indicatorRecoiler.set(msg));
    pubsub.subscribe(PUBSUB.STATUS_FEEDER, (msg) => indicatorFeeder.set(msg));

    pubsub.subscribe(PUBSUB.THREAD_FWD, (msg) => buttonThreadFwd.active(msg));
    pubsub.subscribe(PUBSUB.THREAD_REV, (msg) => buttonThreadRev.active(msg));

    pubsub.subscribe(PUBSUB.MODE_MULTI, (msg) => {
        buttonModeMulti.active(true)
        buttonModeSingle.active(false)
    });
    pubsub.subscribe(PUBSUB.MODE_SINGLE, (msg) => {
        buttonModeSingle.active(true)
        buttonModeMulti.active(false)
    });
    pubsub.subscribe(WS.PRESET_COUNT, (msg) => formLen.set({pcount: [msg]}));

    pubsub.subscribe(PUBSUB.MESSAGE_SUCCESS, (msg) => messageHandle.success(msg.text, msg.duration));
    pubsub.subscribe(PUBSUB.MESSAGE_WARNING, (msg) => messageHandle.warning(msg.text, msg.duration));
    pubsub.subscribe(PUBSUB.MESSAGE_ERROR, (msg) => messageHandle.error(msg.text, msg.duration));

    pubsub.subscribe(WS.PLC_STATUS, (msg) => indicatorPLC.set(msg));
    pubsub.subscribe(WS.DRIVE_STATUS, (msg) => indicatorDrive.set(msg));
}


function getCurrentValue() {
    ws_send(WS.GET_DRIVE_DASHBOARD, true);
    setInterval(() => {
        setTimeout(() => ws_send(WS.GET_COUNT, true), 0);
        setTimeout(() => ws_send(WS.GET_PLC_DASHBOARD, true), 200);
    }, 1000);
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
    getCurrentValue();
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
        case WS.GET_UNCOILER:
            pubsub.publish(PUBSUB.STATUS_UNCOILER, parsedEvt.value);
            break;

        case WS.GET_LEVELER:
            pubsub.publish(PUBSUB.STATUS_LEVELER, parsedEvt.value);
            break;

        case WS.GET_RECOILER:
            pubsub.publish(PUBSUB.STATUS_RECOILER, parsedEvt.value);
            break;

        case WS.GET_FEEDER:
            pubsub.publish(PUBSUB.STATUS_FEEDER, parsedEvt.value);
            break;

        case WS.GET_COUNT:
            pubsub.publish(PUBSUB.COUNT, parsedEvt.value);
            break;

        case WS.GET_LENGTH:
            pubsub.publish(PUBSUB.LENGTH, parsedEvt.value);
            break;

        case WS.PRESET_COUNT:
            pubsub.publish(WS.PRESET_COUNT, parsedEvt.value);
            break;

        case WS.GET_SPEED:
            pubsub.publish(PUBSUB.SPEED, parsedEvt.value);
            break;
    
        case WS.SET_THREAD_FORWARD:
            pubsub.publish(PUBSUB.THREAD_FWD, parsedEvt.value);
            break;

        case WS.SET_THREAD_REVERSE:
            pubsub.publish(PUBSUB.THREAD_REV, parsedEvt.value);
            break;

        case WS.COMM_SUCCESS:
            pubsub.publish(PUBSUB.MESSAGE_SUCCESS, {text: "success changing data", duration: 1});
            break;

        case WS.COMM_ERROR:
            pubsub.publish(PUBSUB.MESSAGE_ERROR, {text: parsedEvt.value, duration: 2});
            break;

        case WS.SET_MODE_MULTI:
            pubsub.publish(PUBSUB.MODE_MULTI, parsedEvt.value);
            break;

        case WS.SET_MODE_SINGLE:
            pubsub.publish(PUBSUB.MODE_SINGLE, parsedEvt.value);
            break;

        case WS.PLC_STATUS:
            pubsub.publish(WS.PLC_STATUS, parsedEvt.value);
            break;
        
        case WS.DRIVE_STATUS:
            pubsub.publish(WS.DRIVE_STATUS, parsedEvt.value);
            break;
    }
}
      
function ws_onError(evt) {
    console.log(`WS: ${evt.type}`);
    console.log(evt.data);
}

document.addEventListener('DOMContentLoaded', () => {
    ws_load();
    generateGUI();
});

const PUBSUB = {
    MESSAGE_SUCCESS: "msg-success",
    MESSAGE_WARNING: "msg-warning",
    MESSAGE_ERROR: "msg-error",

    THREAD_FWD: "thread-fwd",
    THREAD_REV: "thread-rev",

    LENGTH: "gui-length",
    SPEED: "gui-speed",
    COUNT: "gui-count",

    STATUS_UNCOILER: "status-uncoiler",
    STATUS_LEVELER: "status-leveler",
    STATUS_RECOILER: "status-recoiler",
    STATUS_FEEDER: "status-feeder",

    MODE_SINGLE: "mode-single",
    MODE_MULTI: "mode-multi",
}

const WS = {
    GET_UNCOILER: 'Uncoiler',
    GET_LEVELER: 'Leveller',
    GET_RECOILER: 'Recoiler',
    GET_FEEDER: 'Feeder',
    GET_PUNCHING: 'Punching',
    GET_FEEDING: 'Feeding',

    PLC_STATUS: 'PLC_Status',
    DRIVE_STATUS: 'DRIVE_Status',

    GET_PLC_DASHBOARD: 'PLC_Dashboard',
    GET_DRIVE_DASHBOARD: 'Drive_Dashboard',
    GET_DRIVE_SETTING: 'Drive_Setting',

    SET_LENGTH: "set_length",
    SET_FEED_LENGTH: "set_feedlength",
    SET_SPEED: "set_speed",
    PRESET_COUNT: "preset_count",
    RESET_COUNT: "reset_count",
    SET_THREAD_FORWARD: "set_threadfwd",
    SET_THREAD_REVERSE: "set_threadrev",
    SET_MODE_SINGLE: "set_modesingle",
    SET_MODE_MULTI: "set_modemulti",

    GET_LENGTH: "get_length",
    GET_FEED_LENGTH: "get_feedlength",
    GET_SPEED: "get_speed",
    GET_COUNT: "get_count",
    GET_INDICATOR: "get_indicator",
    GET_THREAD_FORWARD: "get_threadfwd",
    GET_THREAD_REVERSE: "get_threadrev",
    GET_MODE: "get_mode",

    SAVE_PARAMETER: "save",
    RESET_DRIVE: "reset",

    COMM_SUCCESS: "com_success",
    COMM_ERROR: "com_error",
}