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
        this.isOpen = false;
    }



    setConnection(port) {
        this.connection = new ModbusRTU(port);
    }



    open(next) {
        this.connection.open(() => {
            this.modbusSender = setInterval(() => this._modbusSend(), this.msgSendInterval);
            this.isOpen = true;
            next();
        });
        this.connection.setTimeout(this.timeout);
    }



    close(next) {
        this.connection.close(next);
        this.isOpen = false;
        clearInterval(this.modbusSender);
    }



    send({ 
        modbusId,
        modbusSendCommand, 
        modbusSendArgs,
        modbusPriority = 1,
        modbusRetryCount = this.retryCount,
        modbusCallback = ()=>{},
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
            this.messageBuffer.sort((a,b) => a.modbusPriority - b.modbusPriority);
            let msg = this.messageBuffer.shift();
            if(msg) {
                // set argument
                let args = [ 
                    msg.modbusId, 
                    ...msg.modbusSendArgs, 
                    (error, data) => this._handleChunkCallback(msg, error, data, msg._chunkCallback) 
                ]
                // send modbus command
                this._modbusSendCommand(msg.modbusSendCommand, args);
            }
        }
    }



    _modbusSendCommand(command, args) {

        switch(command) {
            case MODBUS_CMD.readCoils:
                args[2] = (args[2] > MODBUS_CHUNK_SIZE) ? MODBUS_CHUNK_SIZE : args[2];
                this.connection.writeFC1(...args)
                break;
            case MODBUS_CMD.readDiscreteInputs:
                args[2] = (args[2] > MODBUS_CHUNK_SIZE) ? MODBUS_CHUNK_SIZE : args[2];
                this.connection.writeFC2(...args)
                break;
            case MODBUS_CMD.readHoldingRegisters:
                args[2] = (args[2] > MODBUS_CHUNK_SIZE) ? MODBUS_CHUNK_SIZE : args[2];
                this.connection.writeFC3(...args)
                break;
            case MODBUS_CMD.readInputRegisters:
                args[2] = (args[2] > MODBUS_CHUNK_SIZE) ? MODBUS_CHUNK_SIZE : args[2];
                this.connection.writeFC4(...args)
                break;
            case MODBUS_CMD.writeCoil:
                this.connection.writeFC5(...args)
                break;
            case MODBUS_CMD.writeRegister:
                this.connection.writeFC6(...args)
                break;
            case MODBUS_CMD.writeCoils:
                args[2] = args[2].slice(0,4);
                this.connection.writeFC15(...args)
                break;
            case MODBUS_CMD.writeRegisters:
                args[2] = args[2].slice(0,4);
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
        _chunkBuffer,
        _chunkCallback
    }) {

        let address = modbusSendArgs[0];
        let vals = modbusSendArgs[1];

        switch(modbusSendCommand) {
            // if modbus read command
            case MODBUS_CMD.readCoils:
            case MODBUS_CMD.readDiscreteInputs:
            case MODBUS_CMD.readHoldingRegisters:
            case MODBUS_CMD.readInputRegisters:
                if(vals > MODBUS_CHUNK_SIZE) {
                    // generate chunks callback function
                    let chunkFn = (error, success) => {
                        if(success) {
                            _chunkBuffer.push(success);
                            // send next chunk
                            this.send({
                                modbusId,
                                modbusSendCommand,
                                modbusSendArgs: [address+MODBUS_CHUNK_SIZE, vals-MODBUS_CHUNK_SIZE],
                                modbusPriority: 0,
                                modbusCallback,
                                _chunkBuffer,
                                _chunkCallback
                            })
                        }
                    };
                    return new Object({
                        modbusId,
                        modbusSendCommand, 
                        modbusSendArgs: [address, vals],
                        modbusPriority,
                        modbusRetryCount,
                        modbusCallback,
                        _chunkBuffer,
                        _chunkCallback: chunkFn,
                    });
                }
                break;

            // if modbus write command
            case MODBUS_CMD.writeCoils:
            case MODBUS_CMD.writeRegisters:
                if(Array.isArray(vals)) {
                    if(vals.length > MODBUS_CHUNK_SIZE) {
                        // generate chunks callback function
                        let chunkFn = (error, success) => {
                            if(success) {
                                _chunkBuffer.push(success);
                                // send next chunk
                                this.send({
                                    modbusId,
                                    modbusSendCommand,
                                    modbusSendArgs: [address+MODBUS_CHUNK_SIZE, vals.slice(4)],
                                    modbusPriority: 0,
                                    modbusCallback,
                                    _chunkBuffer: _chunkBuffer,
                                    _chunkCallback
                                })
                            }
                        };
                        return new Object({
                            modbusId,
                            modbusSendCommand, 
                            modbusSendArgs: [address, vals],
                            modbusPriority,
                            modbusRetryCount,
                            modbusCallback,
                            _chunkBuffer,
                            _chunkCallback: chunkFn,
                        });
                    }
                }
                break;
        }

        // flatten the chunkBuffer if this is the last chunk;
        return new Object({
            modbusId,
            modbusSendCommand, 
            modbusSendArgs,
            modbusPriority,
            modbusRetryCount,
            modbusCallback,
            _chunkBuffer,
            _chunkCallback: (error, success) => {

                if(success) {
                    _chunkBuffer.push(success);
                    // flatten the chunkBuffer
                    success = _chunkBuffer.reduce((reducer, value) => { 
                        if(value.data) return reducer.concat(value.data.slice(0, 4));
                        if(value.state !== undefined) return reducer.push(value.state);
                    }, []);
                }

                if(success || (error && modbusRetryCount == 0)) modbusCallback(error, success);

            }
        });
    }



    _handleChunkCallback(msg, error, data, chunkCallback) {
        if(error) {
            msg.modbusRetryCount -= 1;
            if(msg.modbusRetryCount >= 0) this.send(msg);
        };
        chunkCallback(error, data);
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
    ModbusSlave,
}