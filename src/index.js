const Drive_CT_M701 = require('./drive-ct-m701');


drive = new Drive_CT_M701({
    serialManufacturer: '1a86',
    serialConfig: {
        autoOpen: false,
        baudRate: 19200,
    },
    modbusId: 1,
});

drive.connect()
    .then(() => {
        drive.readParameter()
            .then(console.log)
            .catch(console.error)
    })
    .catch(console.error)



// ============

// const SerialHandler = require('../serial-handler');
// const ModbusRTU = require("modbus-serial");
// const client = new ModbusRTU();
// client.connect()
// client.connectRTUBuffered("/dev/ttyUSB0", { baudRate: 19200 });

// setInterval(() => {
//     read();
// }, 1000)
 
// function read() {
//     client.setID(1);
//     client.readHoldingRegisters(120, 1).then(console.log);
// }

// function write() {
//     client.setID(1);
//     client.writeRegister(120, 16000).then(read);
// }

