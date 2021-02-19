const ModbusRTU = require("modbus-serial");

class ModbusHandler {

    constructor({
        msgSendInterval = 200, 
        timeout = 500,
        retryCount = -1,
    }) {
        this.timeout = timeout;
        this.retryCount = retryCount;
        this.msgSendInterval = msgSendInterval;

        this.slave = new Object();
        this.messageBuffer = new Array();

        // send message every interval
    }

    setConnection(port) {
        this.connection = new ModbusRTU(port);
    }

    open(next) {
        this.connection.open(() => {
            this.modbusSender = setInterval(() => this._modbusSend(), this.msgSendInterval);
            next();
        });
        this.connection.setTimeout(this.timeout);
    }

    close(next) {
        this.connection.close(next);
        clearInterval(this.modbusSender);
    }

    send({ 
        modbusId,
        modbusSendCommand, 
        modbusSendArgs,
        modbusCallback = ()=>{},
        priority = 1,
    }) {

        // find similar modbus send command in buffer
        let similar = this.messageBuffer.filter((obj) => (
            obj.modbusId == modbusId &&
            obj.modbusSendCommand == modbusSendCommand &&
            obj.modbusSendArgs.join('-') == modbusSendArgs.join('-')
        ))

        // do not add to buffer if object already exist in buffer
        if(similar.length == 0) {
            this.messageBuffer.push({
                modbusSendCommand,
                modbusSendArgs,
                modbusCallback,
                modbusId,
                priority
            });
        }
    }

    _modbusSend() {
        if(this.messageBuffer) {

            console.log(this.messageBuffer.length);
            this.messageBuffer.sort((a,b) => a.priority - b.priority);
            let msg = this.messageBuffer.shift();

            if(msg) {

                // set argument
                let args = [ 
                    msg.modbusId, 
                    ...msg.modbusSendArgs, 
                    (error, data) => this._modbusHandleCallback(msg, error, data, msg.modbusCallback) 
                ]

                // send modbus command
                this._modbusSendCommand(msg.modbusSendCommand, args);
                
            }
        }
    }

    _modbusSendCommand(command, args) {
        switch(command) {
            case MODBUS_CMD.readCoils:
                this.connection.writeFC1(...args)
                break;
            case MODBUS_CMD.readDiscreteInputs:
                this.connection.writeFC2(...args)
                break;
            case MODBUS_CMD.readHoldingRegisters:
                this.connection.writeFC3(...args)
                break;
            case MODBUS_CMD.readInputRegisters:
                this.connection.writeFC4(...args)
                break;
            case MODBUS_CMD.writeCoil:
                this.connection.writeFC5(...args)
                break;
            case MODBUS_CMD.writeRegister:
                this.connection.writeFC6(...args)
                break;
            case MODBUS_CMD.writeCoils:
                this.connection.writeFC15(...args)
                break;
            case MODBUS_CMD.writeRegisters:
                this.connection.writeFC16(...args)
                break;
        }
    }

    _modbusHandleCallback(msg, error, data, optionalCallback) {
        if(error) {
            // console.error(error);
            this.send(msg);
        };
        if(data) console.log(data);
        optionalCallback(error, data);
    }

}


class ModbusSlave {

    constructor({
        modbusHandler,
        modbusId,
        modbusTimeout,
    }){
        this.id = modbusId;
        this.timeout = modbusTimeout;
        this.handler = modbusHandler;
        this.command = MODBUS_CMD;
    }

}


let MODBUS_CMD = new Object({
    readCoils: 'FC1',
    readDiscreteInputs: 'FC2',
    readHoldingRegisters: 'FC3',
    readInputRegisters: 'FC4',
    writeCoil: 'FC5',
    writeRegister: 'FC6',
    writeCoils: 'FC15',
    writeRegisters: 'FC16',
})


module.exports = {
    ModbusHandler,
    ModbusSlave
}