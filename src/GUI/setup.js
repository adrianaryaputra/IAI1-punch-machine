import {ClickableButton} from './elements/button/index.js'
import {FormElement} from './elements/form/index.js'
import {Holder} from './elements/holder/index.js'
import {MessageViewer} from './elements/message/index.js'
import {PubSub} from './elements/pubsub/index.js'

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


    let btnDistPerMotorTurnSubmit = new ClickableButton({
        text: "Submit",
        color: "#0f0",
        isEnable: false,
        callback: () => {
            console.log(formLen.get("distPerMotorTurn"), formLen.parse("distPerMotorTurn"));
            if(formLen.parse("distPerMotorTurn")){
                ws_send(WS.DRIVE_SET_DISTANCE_MOTOR_TURN, formLen.get("distPerMotorTurn"));
                btnDistPerMotorTurnSubmit.enable(false);
            }
        }
    });


    let btnDistPerEncoderTurnSubmit = new ClickableButton({
        text: "Submit",
        color: "#0f0",
        isEnable: false,
        callback: () => {
            console.log(formLen.get("distPerEncoderTurn"), formLen.parse("distPerEncoderTurn"));
            if(formLen.parse("distPerEncoderTurn")){
                ws_send(WS.DRIVE_SET_DISTANCE_ENCODER_TURN, formLen.get("distPerEncoderTurn"));
                btnDistPerEncoderTurnSubmit.enable(false);
            }
        }
    });


    let btnAccelPos = new ClickableButton({
        text: "Submit",
        color: "#0f0",
        isEnable: false,
        callback: () => {
            console.log(formLen.get("accelPosition"), formLen.parse("accelPosition"));
            if(formLen.parse("accelPosition")){
                ws_send(WS.DRIVE_SET_ACCELERATION_POSITION, formLen.get("accelPosition"));
                btnAccelPos.enable(false);
            }
        }
    });


    let btnDeccelPos = new ClickableButton({
        text: "Submit",
        color: "#0f0",
        isEnable: false,
        callback: () => {
            console.log(formLen.get("deccelPosition"), formLen.parse("deccelPosition"));
            if(formLen.parse("deccelPosition")){
                ws_send(WS.DRIVE_SET_DECCELERATION_POSITION, formLen.get("deccelPosition"));
                btnAccelPos.enable(false);
            }
        }
    });


    let btnJogAccel = new ClickableButton({
        text: "Submit",
        color: "#0f0",
        isEnable: false,
        callback: () => {
            console.log(formLen.get("jogAccel"), formLen.parse("jogAccel"));
            if(formLen.parse("jogAccel")){
                ws_send(WS.DRIVE_SET_JOG_ACCELERATION, formLen.get("jogAccel"));
                btnJogAccel.enable(false);
            }
        }
    });


    let btnJogDeccel = new ClickableButton({
        text: "Submit",
        color: "#0f0",
        isEnable: false,
        callback: () => {
            console.log(formLen.get("jogDeccel"), formLen.parse("jogDeccel"));
            if(formLen.parse("jogDeccel")){
                ws_send(WS.DRIVE_SET_JOG_DECCELERATION, formLen.get("jogDeccel"));
                btnJogDeccel.enable(false);
            }
        }
    });


    let btnJogSpeed = new ClickableButton({
        text: "Submit",
        color: "#0f0",
        isEnable: false,
        callback: () => {
            console.log(formLen.get("jogSpeed"), formLen.parse("jogSpeed"));
            if(formLen.parse("jogSpeed")){
                ws_send(WS.DRIVE_SET_JOG_SPEED, formLen.get("jogSpeed"));
                btnJogSpeed.enable(false);
            }
        }
    });
    

    let formLen = new FormElement({
        parent: holderForm.element(),
        style: {
            gap: "1em",
        },
        configs: [
            {
                id: "distPerMotorTurn",
                label: "Distance per Motor Turn",
                placeholder: "000",
                type: "text",
                regParser: /^[0-9]+$/,
                sideButton: btnDistPerMotorTurnSubmit.element(),
                blurListener: () => {
                    btnDistPerMotorTurnSubmit.enable(formLen.parse("distPerMotorTurn"));
                }
            }, {
                id: "distPerEncoderTurn",
                label: "Distance per Encoder Turn",
                placeholder: "000",
                type: "text",
                regParser: /^[0-9]+$/,
                sideButton: btnDistPerEncoderTurnSubmit.element(),
                blurListener: () => {
                    btnDistPerEncoderTurnSubmit.enable(formLen.parse("distPerEncoderTurn"));
                }
            }, {
                id: "accelPosition",
                label: "Acceleration Position",
                placeholder: "000",
                type: "text",
                regParser: /^[0-9]+$/,
                sideButton: btnAccelPos.element(),
                blurListener: () => {
                    btnAccelPos.enable(formLen.parse("accelPosition"));
                }
            }, {
                id: "deccelPosition",
                label: "Decceleration Position",
                placeholder: "000",
                type: "text",
                regParser: /^[0-9]+$/,
                sideButton: btnDeccelPos.element(),
                blurListener: () => {
                    btnDeccelPos.enable(formLen.parse("deccelPosition"));
                }
            }, {
                id: "jogAccel",
                label: "Jog-Thread Acceleration",
                placeholder: "000",
                type: "text",
                regParser: /^[0-9]+$/,
                sideButton: btnJogAccel.element(),
                blurListener: () => {
                    btnJogAccel.enable(formLen.parse("jogAccel"));
                }
            }, {
                id: "jogDeccel",
                label: "Jog-Thread Decceleration",
                placeholder: "000",
                type: "text",
                regParser: /^[0-9]+$/,
                sideButton: btnJogDeccel.element(),
                blurListener: () => {
                    btnJogDeccel.enable(formLen.parse("jogDeccel"));
                }
            }, {
                id: "jogSpeed",
                label: "Jog-Thread Speed %",
                placeholder: "000",
                type: "text",
                regParser: /^[0-9]+$/,
                sideButton: btnJogSpeed.element(),
                blurListener: () => {
                    btnJogSpeed.enable(formLen.parse("jogSpeed"));
                }
            }, 
        ]
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

    let btnReboot = new ClickableButton({
        parent: holderForm.element(),
        text: "RESTART HMI",
        style: buttonStyle,
        color: "#F00",
        callback: () => {
            ws_send("REBOOT", true);
        }
    });

    // keyboard
    document.body.style.marginBottom = "5em";
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

    // message handle
    let messageHandle = new MessageViewer({ parent: document.body });

    pubsub.subscribe(WS.DRIVE_SET_DISTANCE_MOTOR_TURN, (msg) => formLen.set({distPerMotorTurn: [msg]}));
    pubsub.subscribe(WS.DRIVE_SET_DISTANCE_ENCODER_TURN, (msg) => formLen.set({distPerEncoderTurn: [msg]}));
    pubsub.subscribe(WS.DRIVE_SET_ACCELERATION_POSITION, (msg) => formLen.set({accelPosition: [msg]}));
    pubsub.subscribe(WS.DRIVE_SET_DECCELERATION_POSITION, (msg) => formLen.set({deccelPosition: [msg]}));
    pubsub.subscribe(WS.DRIVE_SET_JOG_ACCELERATION, (msg) => formLen.set({jogAccel: [msg]}));
    pubsub.subscribe(WS.DRIVE_SET_JOG_DECCELERATION, (msg) => formLen.set({jogDeccel: [msg]}));
    pubsub.subscribe(WS.DRIVE_SET_JOG_SPEED, (msg) => formLen.set({jogSpeed: [msg]}));

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
            for (const key in parsedEvt.payload.state) {
                // console.log("sending to pubsub: ", MAP_STATE_WS[key], parsedEvt.payload.state[key]);
                pubsub.publish(MAP_STATE_WS[key], parsedEvt.payload.state[key]);
            }
            break;
        default:
            // console.log(parsedEvt);
            pubsub.publish(parsedEvt.command, parsedEvt.payload);
    }
}
      
function ws_onError(evt) {
    console.log(`WS: ${evt.type}`);
    console.log(evt.data);
}


document.addEventListener("DOMContentLoaded", () => {
    ws_load();
    generateGUI();
});



const WS = {
    DRIVE_SET_LENGTH                    : "DRIVE_LENGTH",
    DRIVE_SET_SPEED                     : "DRIVE_SPEED",
    DRIVE_SET_COUNTER_PV                : "DRIVE_COUNTER_PV",
    DRIVE_SET_COUNTER_CV                : "DRIVE_COUNTER_CV",
    DRIVE_SET_COUNTER_RESET             : "DRIVE_COUNTER_RESET",
    DRIVE_SET_THREAD_FORWARD            : "DRIVE_THREAD_FORWARD",
    DRIVE_SET_THREAD_REVERSE            : "DRIVE_THREAD_REVERSE",
    DRIVE_SET_DISTANCE_MOTOR_TURN       : "DRIVE_DISTANCE_MOTOR_TURN",
    DRIVE_SET_DISTANCE_ENCODER_TURN     : "DRIVE_DISTANCE_ENCODER_TURN",
    DRIVE_SET_ACCELERATION_POSITION     : "DRIVE_ACCELERATION_POSITION",
    DRIVE_SET_DECCELERATION_POSITION    : "DRIVE_DECCELERATION_POSITION",
    DRIVE_SET_JOG_ACCELERATION          : "DRIVE_JOG_ACCELERATION",
    DRIVE_SET_JOG_DECCELERATION         : "DRIVE_JOG_DECCELERATION",
    DRIVE_SET_JOG_SPEED                 : "DRIVE_JOG_SPEED",
    DRIVE_GET_INDICATOR                 : "DRIVE_INDICATOR",
    DRIVE_GET_TRIP_FLAG                 : "DRIVE_TRIP_FLAG",
    DRIVE_GET_TRIP                      : "DRIVE_TRIP",
    DRIVE_GET_TRIP_DATE                 : "DRIVE_TRIP_DATE",
    DRIVE_GET_SUBTRIP                   : "DRIVE_SUBTRIP",
    DRIVE_GET_MODBUS_STATS              : "DRIVE_MODBUS_STATS",

    PLC_SET_ENABLE_UNCOILER             : "PLC_ENABLE_UNCOILER",
    PLC_SET_ENABLE_LEVELER              : "PLC_ENABLE_LEVELER",
    PLC_SET_ENABLE_RECOILER             : "PLC_ENABLE_RECOILER",
    PLC_SET_ENABLE_FEEDER               : "PLC_ENABLE_FEEDER",
    PLC_GET_TRIP_FLAG                   : "PLC_TRIP_FLAG",
    PLC_GET_STATE_X                     : "PLC_STATE_X",
    PLC_GET_STATE_Y                     : "PLC_STATE_Y",
    PLC_GET_MODBUS_STATS                : "PLC_MODBUS_STATS",

    MODBUS_ERROR_LIST                   : "MODBUS_ERRORS",
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