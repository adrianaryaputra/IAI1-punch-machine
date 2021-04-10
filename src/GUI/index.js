import {ClickableButton} from './elements/button/index.js'
import {FormElement} from './elements/form/index.js'
import {Holder} from './elements/holder/index.js'
import {Indicator} from './elements/indicator/index.js'
import {MessageViewer} from './elements/message/index.js'
import {PubSub} from './elements/pubsub/index.js'

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

    let buttonStyle = {
        fontSize: "1.7rem",
        textAlign: "center",
        padding: ".75rem",
        width: "100%",
    }

    let statsNamaSubmit = new ClickableButton({
        text: "Submit",
        color: "#0f0",
        isEnable: false,
        style: buttonStyle,
        callback: () => {
            console.log(formLen.get("statsnama"), formLen.parse("statsnama"));
            if(formLen.parse("statsnama")){
                lenSubmit.enable(false);
                ws_send("STATS_NAMA_PELANGGAN", formLen.get("statsnama"));
            }
        }
    });

    let statsTebalSubmit = new ClickableButton({
        text: "Submit",
        color: "#0f0",
        isEnable: false,
        style: buttonStyle,
        callback: () => {
            console.log(formLen.get("statstebal"), formLen.parse("statstebal"));
            if(formLen.parse("statstebal")){
                lenSubmit.enable(false);
                ws_send("STATS_TEBAL_BAHAN", formLen.get("statstebal"));
            }
        }
    });

    let statsDiameterSubmit = new ClickableButton({
        text: "Submit",
        color: "#0f0",
        isEnable: false,
        style: buttonStyle,
        callback: () => {
            console.log(formLen.get("statsdiameter"), formLen.parse("statsdiameter"));
            if(formLen.parse("statsdiameter")){
                lenSubmit.enable(false);
                ws_send("STATS_DIAMETER_PON", formLen.get("statsdiameter"));
            }
        }
    });

    let lenSubmit = new ClickableButton({
        text: "Submit",
        color: "#0f0",
        isEnable: false,
        style: buttonStyle,
        callback: () => {
            console.log(formLen.get("length"), formLen.parse("length"));
            if(formLen.parse("length")){
                lenSubmit.enable(false);
                ws_send(WS.DRIVE_SET_LENGTH, formLen.get("length"));
            }
        }
    });

    let speedSubmit = new ClickableButton({
        text: "Submit",
        color: "#0f0",
        isEnable: false,
        style: buttonStyle,
        callback: () => {
            console.log(formLen.get("speed"), formLen.parse("speed"));
            if(formLen.parse("speed")){
                speedSubmit.enable(false);
                ws_send(WS.DRIVE_SET_SPEED, formLen.get("speed"));
            }
        }
    });

    let countReset = new ClickableButton({
        text: "Reset Count",
        color: "#f00",
        style: buttonStyle,
        callback: () => {
            ws_send(WS.DRIVE_SET_COUNTER_RESET, true);
        }
    });

    let formLen = new FormElement({
        parent: holderForm.element(),
        style: {
            gap: ".75em",
        },
        configs: [
            {
                id: "statsnama",
                label: "Nama Pelanggan",
                placeholder: "Nama",
                type: "text",
                regParser: /^[\w]+$/,
                sideButton: statsNamaSubmit.element(),
                blurListener: () => {
                    statsNamaSubmit.enable(formLen.parse("statsnama"));
                }
            }, {
                id: "statstebal",
                label: "Tebal (μm)",
                placeholder: "000",
                type: "text",
                regParser: /^[\w]+$/,
                sideButton: statsTebalSubmit.element(),
                blurListener: () => {
                    statsTebalSubmit.enable(formLen.parse("statstebal"));
                }
            }, {
                id: "statsdiameter",
                label: "Diameter (mm)",
                placeholder: "000",
                type: "text",
                regParser: /^[\w]+$/,
                sideButton: statsDiameterSubmit.element(),
                blurListener: () => {
                    statsDiameterSubmit.enable(formLen.parse("statsdiameter"));
                }
            }, {
                id: "length",
                label: "Length (mm)",
                placeholder: "000",
                type: "text",
                regParser: /^[0-9]+$/,
                sideButton: lenSubmit.element(),
                blurListener: () => {
                    lenSubmit.enable(formLen.parse("length"));
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
            },
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

    let holderModbusStatus = new Holder({
        parent: holderStatus.element(),
        style: {
            padding: ".5em 0 0 0",
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(3rem, 1fr))",
            gap: "1em",
        }
    });

    let holderIndicator = new Holder({
        parent: holderStatus.element(),
        style: {
            padding: ".5rem 0 0 0",
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(3rem, 1fr))",
            gap: "1em",
        }
    });

    let indicatorStyle = {
        padding: ".75rem",
        fontSize: "2rem",
        color: "black",
        borderRadius: ".5rem",
        textAlign: "center",
    };

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

    let holderContactor = new Holder({
        parent: holderControl.element(),
        style: {
            padding: "1em 0 0 0",
            display: "grid",
            width: "100%",
            gridTemplateColumns: "repeat(4, minmax(3rem, 1fr))",
            gap: "1em",
            justifyContent: "center",
        }
    });

    let buttonUncoiler = new ClickableButton({
        parent: holderContactor.element(),
        text: "Uncoiler",
        color: "#F00",
        style: buttonStyle,
        callback: () => {
            buttonUncoiler.enable(false);
            ws_send(WS.PLC_SET_ENABLE_UNCOILER, true)
        }
    });

    let buttonLeveler = new ClickableButton({
        parent: holderContactor.element(),
        text: "Leveler",
        color: "#F00",
        style: buttonStyle,
        callback: () => {
            buttonLeveler.enable(false);
            ws_send(WS.PLC_SET_ENABLE_LEVELER, true)
        }
    });

    let buttonFeeder = new ClickableButton({
        parent: holderContactor.element(),
        text: "Feeder",
        color: "#F00",
        style: buttonStyle,
        callback: () => {
            buttonFeeder.enable(false);
            ws_send(WS.PLC_SET_ENABLE_FEEDER, true)
        }
    });

    let buttonRecoiler = new ClickableButton({
        parent: holderContactor.element(),
        text: "Recoiler",
        color: "#F00",
        style: buttonStyle,
        callback: () => {
            buttonRecoiler.enable(false);
            ws_send(WS.PLC_SET_ENABLE_RECOILER, true)
        }
    });
    
    let holderThread = new Holder({
        parent: holderControl.element(),
        style: {
            padding: "1em 0 0 0",
            display: "grid",
            width: "100%",
            gridTemplateColumns: "repeat(4, minmax(3rem, 1fr))",
            gap: "1em",
            justifyContent: "center",
        }
    });

    let buttonThreadRev = new ClickableButton({
        parent: holderThread.element(),
        text: "Thread Reverse",
        style: buttonStyle,
        callback: () => {
            ws_send(WS.DRIVE_SET_THREAD_REVERSE, true)
        }
    });

    let buttonThreadFwd = new ClickableButton({
        parent: holderThread.element(),
        text: "Thread Forward",
        style: buttonStyle,
        callback: () => {
            ws_send(WS.DRIVE_SET_THREAD_FORWARD, true)
        }
    });

    let buttonFeederPressure = new ClickableButton({
        parent: holderThread.element(),
        text: "Feed Roll Clamp",
        color: "#F00",
        style: {
            ...buttonStyle,
            // gridColumn: "2 / span 2"
        },
        callback: () => {
            buttonFeederPressure.enable(false);
            ws_send(WS.PLC_SET_ENABLE_FEEDCLAMP, true);
        }
    });

    let buttonPunch1x = new ClickableButton({
        parent: holderThread.element(),
        text: "Punch 1x",
        style: {
            ...buttonStyle,
        },
        callback: () => {
            ws_send(WS.PLC_SET_ENABLE_PUNCH1X, true);
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

    let buttonTrip = new ClickableButton({
        parent: holderCommand.element(),
        text: "Trip Status",
        style: buttonStyle,
        callback: () => {
            location.href = '/trip.html';
        }
    });

    let buttonSettings = new ClickableButton({
        parent: holderCommand.element(),
        text: "Setting",
        style: buttonStyle,
        callback: () => {
            location.href = '/setup.html';
        }
    });

    let messageHandle = new MessageViewer({ parent: document.body });


    // keyboard
    const inputList = document.querySelectorAll("input[type=text]");
    inputList.forEach(i => {
        i.classList.add("virtual-keyboard")
        i.setAttribute("data-kioskboard-type", "all")
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
        language                : 'en',
        theme                   : 'dark',
        capsLockActive          : true,
        allowRealKeyboard       : true,
        cssAnimations           : true,
        cssAnimationsDuration   : 360,
        cssAnimationsStyle      : 'slide',
        keysAllowSpacebar       : true,
        keysSpacebarText        : 'Space',
        keysFontFamily          : 'sans-serif',
        keysFontSize            : '22px',
        keysFontWeight          : 'normal',
        keysIconSize            : '25px',
        allowMobileKeyboard     : true,
        autoScroll              : true,
    });
    KioskBoard.Run('.virtual-keyboard');



    // pubsub
    pubsub.subscribe(WS.DRIVE_SET_LENGTH, (msg) => formLen.set({length: [msg]}));
    pubsub.subscribe(WS.DRIVE_SET_SPEED, (msg) => formLen.set({speed: [msg]}));
    pubsub.subscribe(WS.DRIVE_SET_COUNTER_CV, (msg) => formLen.set({count: [msg]}));
    pubsub.subscribe(WS.DRIVE_SET_COUNTER_PV, (msg) => formLen.set({pcount: [msg]}));

    pubsub.subscribe(WS.DRIVE_SET_THREAD_FORWARD, (msg) => buttonThreadFwd.active(msg));
    pubsub.subscribe(WS.DRIVE_SET_THREAD_REVERSE, (msg) => buttonThreadRev.active(msg));

    pubsub.subscribe(WS.PLC_GET_MODBUS_STATS, (msg) => indicatorPLC.set(msg));
    pubsub.subscribe(WS.DRIVE_GET_MODBUS_STATS, (msg) => indicatorDrive.set(msg));
    
    pubsub.subscribe(WS.PLC_GET_TRIP_FLAG, (msg) => buttonTrip.warn(!msg));
    pubsub.subscribe(WS.DRIVE_GET_TRIP_FLAG, (msg) => buttonTrip.warn(!msg));

    pubsub.subscribe(WS.STATS_NAMA_PELANGGAN, (msg) => formLen.set({statsnama: [msg]}));
    pubsub.subscribe(WS.STATS_DIAMETER_PON, (msg) => formLen.set({statsdiameter: [msg]}));
    pubsub.subscribe(WS.STATS_TEBAL_BAHAN, (msg) => formLen.set({statstebal: [msg]}));

    pubsub.subscribe(WS.PLC_GET_STATE_Y, (y) => {
        buttonUncoiler.enable(true);
        buttonUncoiler.active(y[0]);
        buttonLeveler.enable(true);
        buttonLeveler.active(y[1]);
        buttonRecoiler.enable(true);
        buttonRecoiler.active(y[2]);
        buttonFeeder.enable(true);
        buttonFeeder.active(y[3]);
        buttonFeederPressure.enable(true);
        buttonFeederPressure.active(y[6]);
    })
}


function ws_load() {
    websocket.onopen    = ws_onOpen;
    websocket.onclose   = ws_onClose;
    websocket.onmessage = ws_onMessage;
    websocket.onerror   = ws_onError;
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
    console.log(parsedEvt);
    switch(parsedEvt.command){
        case "GET_STATE":
            for (const key in parsedEvt.payload.state) {
                // console.log("sending to pubsub: ", MAP_STATE_WS[key], parsedEvt.payload.state[key]);
                pubsub.publish(MAP_STATE_WS[key], parsedEvt.payload.state[key]);
            }
            break;

        default:
            // console.log("sending to pubsub: ", parsedEvt.command, parsedEvt.payload);
            pubsub.publish(parsedEvt.command, parsedEvt.payload);
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
    PLC_SET_ENABLE_FEEDCLAMP            : "PLC_ENABLE_FEEDCLAMP",
    PLC_SET_ENABLE_PUNCH1X              : "PLC_ENABLE_PUNCH1X",
    PLC_GET_TRIP_FLAG                   : "PLC_TRIP_FLAG",
    PLC_GET_STATE_X                     : "PLC_STATE_X",
    PLC_GET_STATE_Y                     : "PLC_STATE_Y",
    PLC_GET_MODBUS_STATS                : "PLC_MODBUS_STATS",

    STATS_NAMA_PELANGGAN                : "STATS_NAMA_PELANGGAN",
    STATS_TEBAL_BAHAN                   : "STATS_TEBAL_BAHAN",
    STATS_DIAMETER_PON                  : "STATS_DIAMETER_PON",
    STATS_COUNTER                       : "STATS_COUNTER",
    STATS_PUNCHING                      : "STATS_PUNCHING",

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

    STATS_NAMA_PELANGGAN        : "STATS_NAMA_PELANGGAN",
    STATS_TEBAL_BAHAN           : "STATS_TEBAL_BAHAN",
    STATS_DIAMETER_PON          : "STATS_DIAMETER_PON",
    STATS_COUNTER               : "STATS_COUNTER",
    STATS_PUNCHING              : "STATS_PUNCHING",

    modbus_errorList            : WS.MODBUS_ERROR_LIST,
}