const ModbusRTU = require("modbus-serial");

const MODBUS_CHUNK_SIZE = 4;

class ModbusHandler {

    constructor({
        msgSendInterval = 200, 
        timeout = 500,
        retryCount = 3,
    }) {
        this.timeout = timeout;
        this.retryCount = retryCount-1;
        this.msgSendInterval = msgSendInterval;
        
        this.messageBuffer = new Array();
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
        modbusPriority = 1,
        modbusRetryCount = this.retryCount,
        modbusCallback = ()=>{},
        _chunkID = this._modbusChunkIdGenerator(),
        _chunkBuffer = new Array(),
        _chunkCallback = ()=>{},
    }) {

        // chunking
        let chunks = this._modbusChunking({
            modbusId,
            modbusSendCommand, 
            modbusSendArgs,
            modbusPriority,
            modbusRetryCount,
            modbusCallback,
            _chunkID,
            _chunkBuffer,
            _chunkCallback
        })

        // find similar modbus send command in buffer
        let similar = this.messageBuffer.filter((obj) => (
            obj.modbusId == modbusId &&
            obj.modbusSendCommand == modbusSendCommand &&
            obj.modbusSendArgs.join('-') == modbusSendArgs.join('-')
        ))

        // do not add to buffer if object already exist in buffer
        if(similar.length == 0) {
            this.messageBuffer.push(chunks);
        }
    }

    _modbusSend() {
        if(this.messageBuffer) {

            // console.log(this.messageBuffer.length);
            this.messageBuffer.sort((a,b) => a.modbusPriority - b.modbusPriority);
            let msg = this.messageBuffer.shift();

            if(msg) {

                // set argument
                let args = [ 
                    msg.modbusId, 
                    ...msg.modbusSendArgs, 
                    (error, data) => this._modbusHandleCallback(msg, error, data, msg._chunkCallback) 
                ]

                // send modbus command
                this._modbusSendCommand(msg.modbusSendCommand, args);
                
            }
        }
    }

    _modbusSendCommand(command, args) {

        // maximum data transfer is MODBUS_CHUNK_SIZE byte
        args[2] = (args[2] > MODBUS_CHUNK_SIZE) ? MODBUS_CHUNK_SIZE : args[2];

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

    _modbusChunking({ 
        modbusId,
        modbusSendCommand, 
        modbusSendArgs,
        modbusPriority,
        modbusRetryCount,
        modbusCallback,
        _chunkID,
        _chunkBuffer,
        _chunkCallback
    }) {

        let address = modbusSendArgs[0];
        let length = modbusSendArgs[1];

        if(length > MODBUS_CHUNK_SIZE) {

            // console.log(`chunking: ${modbusId} - ${modbusSendCommand} @ ${modbusSendArgs.join(" ")}`);
            
            // generate chunks callback function
            let chunkFn = (error, success) => {
                // if success
                if(success) {
                    // add success value to chunkBuffer
                    _chunkBuffer.push(success);
                    // send next chunk
                    this.send({
                        modbusId,
                        modbusSendCommand,
                        modbusSendArgs: [address+MODBUS_CHUNK_SIZE, length-MODBUS_CHUNK_SIZE],
                        modbusPriority: 0,
                        modbusCallback,
                        _chunkID: _chunkID,
                        _chunkBuffer: _chunkBuffer,
                        _chunkCallback
                    })
                }
            }

            return new Object({
                modbusId,
                modbusSendCommand, 
                modbusSendArgs: [address, length],
                modbusPriority,
                modbusRetryCount,
                modbusCallback,
                _chunkID,
                _chunkBuffer,
                _chunkCallback: chunkFn,
            })
        }

        // flatten the chunkBuffer if this is the last chunk;
        return new Object({
            modbusId,
            modbusSendCommand, 
            modbusSendArgs,
            modbusPriority,
            modbusRetryCount,
            modbusCallback,
            _chunkID,
            _chunkBuffer,
            _chunkCallback: (error, success) => {

                if(success) {
                    // add success value to chunkBuffer
                    _chunkBuffer.push(success);

                    // flatten the chunkBuffer
                    console.log("chunkBuffer: ", _chunkBuffer);
                    success = _chunkBuffer.reduce((reducer, value) => reducer.concat(value.data.slice(0, 4)), []);
                    console.log("chunkBuffer_reduce: ", success, success.length);
                }

                if(success || (error && modbusRetryCount == 0)) modbusCallback(error, success);

            }
        });
    }

    _modbusChunkIdGenerator() {
        var S4 = () => (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    }

    _modbusHandleCallback(msg, error, data, optionalCallback) {
        if(error) {
            // console.error(`${msg.modbusId} - ${msg.modbusSendCommand} - ${msg.modbusSendArgs.join(' ')} : ERROR`);
            // console.log(msg);
            msg.modbusRetryCount -= 1;
            if(msg.modbusRetryCount >= 0) this.send(msg);
        };

        // if(data) console.log(`${msg.modbusId} - ${msg.modbusSendCommand} - ${msg.modbusSendArgs.join(' ')} : ${data.data}`);
        
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