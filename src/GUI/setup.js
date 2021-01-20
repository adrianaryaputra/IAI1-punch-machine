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


    let btnDistPerMotorTurnSubmit = new ClickableButton({
        text: "Submit",
        color: "#0f0",
        isEnable: false,
        callback: () => {
            console.log(formLen.get("distPerMotorTurn"), formLen.parse("distPerMotorTurn"));
            if(formLen.parse("distPerMotorTurn")){
                ws_send(WS.SET_DISTANCE_MOTOR_TURN, formLen.get("distPerMotorTurn"));
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
                ws_send(WS.SET_DISTANCE_ENCODER_TURN, formLen.get("distPerEncoderTurn"));
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
                ws_send(WS.SET_ACCELERATION_POSITION, formLen.get("accelPosition"));
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
                ws_send(WS.SET_ACCELERATION_POSITION, formLen.get("deccelPosition"));
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
                ws_send(WS.SET_ACCELERATION_POSITION, formLen.get("jogAccel"));
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
                ws_send(WS.SET_ACCELERATION_POSITION, formLen.get("jogDeccel"));
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
                ws_send(WS.SET_ACCELERATION_POSITION, formLen.get("jogSpeed"));
                btnJogSpeed.enable(false);
            }
        }
    });
    

    let formLen = new FormElement({
        parent: holderForm.element(),
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
        marginTop: "1rem",
        fontSize: "2rem",
        textAlign: "center",
        padding: "1rem",
        width: "100%",
    }

    let btnSaveParameter = new ClickableButton({
        parent: holderForm.element(),
        text: "Save Parameter",
        style: buttonStyle,
        color: "#FFF",
        callback: () => {
            // console.log(formLen.get("length"), formLen.parse("length"));
            // if(formLen.parse("length")){
            //     ws_send(WS.SET_LENGTH, formLen.get("length"));
            //     lenSubmit.enable(false);
            // }
        }
    });

    let btnResetDrive = new ClickableButton({
        parent: holderForm.element(),
        text: "Reset Drive",
        style: buttonStyle,
        color: "#FFF",
        callback: () => {
            // console.log(formLen.get("length"), formLen.parse("length"));
            // if(formLen.parse("length")){
            //     ws_send(WS.SET_LENGTH, formLen.get("length"));
            //     lenSubmit.enable(false);
            // }
        }
    });

    let btnBackMainMenu = new ClickableButton({
        parent: holderForm.element(),
        text: "Back to Main Menu",
        style: buttonStyle,
        color: "#FFF",
        callback: () => {
            location.href = location.origin;
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

    // pubsub
    pubsub.subscribe(PUBSUB.MESSAGE_SUCCESS, (msg) => messageHandle.success(msg.text, msg.duration));
    pubsub.subscribe(PUBSUB.MESSAGE_WARNING, (msg) => messageHandle.warning(msg.text, msg.duration));
    pubsub.subscribe(PUBSUB.MESSAGE_ERROR, (msg) => messageHandle.error(msg.text, msg.duration));
    
    pubsub.subscribe(PUBSUB.DISTANCE_MOTOR_TURN, (msg) => formLen.set({distPerMotorTurn: [msg]}));
    pubsub.subscribe(PUBSUB.DISTANCE_ENCODER_TURN, (msg) => formLen.set({distPerEncoderTurn: [msg]}));
    pubsub.subscribe(PUBSUB.ACCELERATION_POSITION, (msg) => formLen.set({accelPosition: [msg]}));
    pubsub.subscribe(PUBSUB.DECCELERATION_POSITION, (msg) => formLen.set({deccelPosition: [msg]}));
    pubsub.subscribe(PUBSUB.JOG_ACCELERATION, (msg) => formLen.set({jogAccel: [msg]}));
    pubsub.subscribe(PUBSUB.JOG_DECCELERATION, (msg) => formLen.set({jogDeccel: [msg]}));
    pubsub.subscribe(PUBSUB.JOG_SPEED, (msg) => formLen.set({jogSpeed: [msg]}));

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
        case WS.GET_DISTANCE_MOTOR_TURN:
            pubsub.publish(PUBSUB.DISTANCE_MOTOR_TURN, parsedEvt.value);
            break;
        case WS.GET_DISTANCE_ENCODER_TURN:
            pubsub.publish(PUBSUB.DISTANCE_ENCODER_TURN, parsedEvt.value);
            break;
        case WS.GET_ACCELERATION_POSITION:
            pubsub.publish(PUBSUB.ACCELERATION_POSITION, parsedEvt.value);
            break;
        case WS.GET_DECCELERATION_POSITION:
            pubsub.publish(PUBSUB.DECCELERATION_POSITION, parsedEvt.value);
            break;
        case WS.GET_JOG_ACCELERATION:
            pubsub.publish(PUBSUB.JOG_ACCELERATION, parsedEvt.value);
            break;
        case WS.GET_JOG_DECCELERATION:
            pubsub.publish(PUBSUB.JOG_DECCELERATION, parsedEvt.value);
            break;
        case WS.GET_JOG_SPEED:
            pubsub.publish(PUBSUB.JOG_SPEED, parsedEvt.value);
            break;

        case WS.COMM_SUCCESS:
            pubsub.publish(PUBSUB.MESSAGE_SUCCESS, {text: "success changing data", duration: 1});
            break;
        case WS.COMM_ERROR:
            pubsub.publish(PUBSUB.MESSAGE_ERROR, {text: parsedEvt.value, duration: 5});
            break;
    }
}
      
function ws_onError(evt) {
    console.log(`WS: ${evt.type}`);
    console.log(evt.data);
}


function getCurrentValue() {
    console.log("get current value");
    setTimeout(() => ws_send(WS.GET_DISTANCE_MOTOR_TURN, true), 0);
    setTimeout(() => ws_send(WS.GET_DISTANCE_ENCODER_TURN, true), 100);
    setTimeout(() => ws_send(WS.GET_ACCELERATION_POSITION, true), 200);
    setTimeout(() => ws_send(WS.GET_DECCELERATION_POSITION, true), 300);
    setTimeout(() => ws_send(WS.GET_JOG_ACCELERATION, true), 400);
    setTimeout(() => ws_send(WS.GET_JOG_DECCELERATION, true), 500);
    setTimeout(() => ws_send(WS.GET_JOG_SPEED, true), 600);
}


document.addEventListener("DOMContentLoaded", () => {
    ws_load();
    generateGUI();
})

const PUBSUB = {
    DISTANCE_MOTOR_TURN: "distMotorTurn",
    DISTANCE_ENCODER_TURN: "distEncoderTurn",
    ACCELERATION_POSITION: "accelPos",
    DECCELERATION_POSITION: "deccelPos",
    JOG_ACCELERATION: "jogAccel",
    JOG_DECCELERATION: "jogDeccel",
    JOG_SPEED: "jogSpeed",

    MESSAGE_SUCCESS: "msg-success",
    MESSAGE_WARNING: "msg-warning",
    MESSAGE_ERROR: "msg-error",

    MODE_SINGLE: "mode-single",
    MODE_MULTI: "mode-multi",
}

const WS = {

    SET_DISTANCE_MOTOR_TURN: "set_distMotorTurn",
    SET_DISTANCE_ENCODER_TURN: "set_distEncoderTurn",
    SET_ACCELERATION_POSITION: "set_accelPos",
    SET_DECCELERATION_POSITION: "set_deccelPos",
    SET_JOG_ACCELERATION: "set_jogAccel",
    SET_JOG_DECCELERATION: "set_jogDeccel",
    SET_JOG_SPEED: "set_jogSpeed",

    GET_DISTANCE_MOTOR_TURN: "get_distMotorTurn",
    GET_DISTANCE_ENCODER_TURN: "get_distEncoderTurn",
    GET_ACCELERATION_POSITION: "get_accelPos",
    GET_DECCELERATION_POSITION: "get_deccelPos",
    GET_JOG_ACCELERATION: "get_jogAccel",
    GET_JOG_DECCELERATION: "get_jogDeccel",
    GET_JOG_SPEED: "get_jogSpeed",

    SAVE_PARAMETER: "save",
    RESET_DRIVE: "reset",

    COMM_SUCCESS: "com_success",
    COMM_ERROR: "com_error",
}