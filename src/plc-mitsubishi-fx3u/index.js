
// USAGE EXAMPLE:

// plc = new PLC_FX3U({
//     modbusClient: client,
//     modbusId: 1,
//     modbusTimeout: 500,
// });

// plc.write({
//     device: plc.device.M,
//     number: 1,
//     value: 1,
// })
//     .then(console.log)
//     .catch(console.error)

const { ModbusSlave } = require("../handler-modbus");

module.exports = class PLC_FX3U extends ModbusSlave{

    constructor({
        modbusHandler,
        modbusId,
        modbusTimeout,
    }) { 
        super({
            modbusHandler,
            modbusId,
            modbusTimeout,
        });

        this.type = new Object({
            M : 'M',
            S : 'S',
            TS: 'TS',
            CS: 'CS',
            Y : 'Y',
            D : 'D',
            R : 'R',
            TN: 'TN',
            CN: 'CN',
        })

        this.address =  new Object({
            M : { start: 0x0, end: 0x1FFF },
            S : { start: 0x2000, end: 0x2FFF },
            TS: { start: 0x3000, end: 0x31FF },
            CS: { start: 0x3200, end: 0x32FF },
            Y : { start: 0x3300, end: 0xFFFF },
            D : { start: 0x0, end: 0x213F },
            R : { start: 0x2140, end: 0xA13F },
            TN: { start: 0xA140, end: 0xA33F },
            CN: { start: 0xA340, end: 0xFFFF },
        })
    }

    read({
        type,
        address,
        length,
        callback = ()=>{}, 
    }) {
        switch(type) {
            case this.type.M:
            case this.type.S:
            case this.type.TS:
            case this.type.CS:
            case this.type.Y:
                if( 
                    address >= 0x0 && 
                    address <= (this.address[type].end - this.address[type].start)
                ) {
                    this._readBits({
                        address,
                        length,
                        callback,
                    });
                }
                break;
            case this.type.D:
            case this.type.R:
            case this.type.TN:
            case this.type.CN:
                if( 
                    address >= 0x0 && 
                    address <= (this.address[type].end - this.address[type].start)
                ) {
                    this._readBytes({
                        address,
                        length,
                        callbackSuccess,
                        callbackFail,
                    });
                }
                break;
        }
    }

    _readBits({
        address,
        length,
        callback = ()=>{},
    }) {
        this.handler.send({
            modbusSendCommand: this.command.readCoils,
            modbusSendArgs: [
                address, 
                length*8 // length in byte
            ],
            modbusCallback: callback,
            modbusId: this.id,
            priority: 2
        })
    }

    _readBytes({
        address,
        length,
        callback = ()=>{}, 
    }) {
        this.handler.send({
            modbusSendCommand: this.command.readHoldingRegisters,
            modbusSendArgs: [
                address, 
                length
            ],
            modbusCallback: callback,
            modbusId: this.id,
            priority: 2
        })
    }


    write({
        type,
        address,
        value,
        callback = ()=>{},
    }) {
        switch(type) {
            case this.type.M:
            case this.type.S:
            case this.type.TS:
            case this.type.CS:
            case this.type.Y:
                if( 
                    address >= 0x0 && 
                    address <= (this.address[type].end - this.address[type].start)
                ) {
                    this._writeBit({
                        address,
                        value,
                        callback,
                    });
                }
                break;
            case this.type.D:
            case this.type.R:
            case this.type.TN:
            case this.type.CN:
                if( 
                    address >= 0x0 && 
                    address <= (this.address[type].end - this.address[type].start)
                ) {
                    this._writeByte({
                        address,
                        value,
                        callback,
                    });
                }
                break;
        }
    }

    _writeBit({
        address,
        value,
        callback = ()=>{},
    }) {
        this.handler.send({
            modbusSendCommand: this.command.writeCoil,
            modbusSendArgs: [
                address, 
                value
            ],
            modbusCallback: callback,
            modbusId: this.id,
            priority: 1
        })
    }

    _writeByte({
        address,
        value,
        callback = ()=>{},
    }) {
        this.handler.send({
            modbusSendCommand: this.command.writeRegister,
            modbusSendArgs: [
                address, 
                value
            ],
            modbusCallback: callback,
            modbusId: this.id,
            priority: 1
        })
    }

}