
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
            M  : 'M',
            S  : 'S',
            TS : 'TS',
            CS : 'CS',
            Y  : 'Y',
            D  : 'D',
            R  : 'R',
            TN : 'TN',
            CN : 'CN',
        })

        this.address =  new Object({
            M : { start: 0x0, end: 0x1FFF },
            S : { start: 0x2000, end: 0x2FFF },
            TS: { start: 0x3000, end: 0x31FF },
            CS: { start: 0x3200, end: 0x32FF },
            Y : { start: 0x3300, end: 0x33FF },
            D : { start: 0x0, end: 0x213F },
            R : { start: 0x2140, end: 0xA13F },
            TN: { start: 0xA140, end: 0xA33F },
            CN: { start: 0xA340, end: 0xA407 },
        })
    }



    read({
        type,
        address,
        length,
        priority = 2,
        callback = ()=>{}, 
    }) {
        switch(type) {
            case this.type.M:
                if( address >= 8000 && address <= 8511 ) 
                    address - (8000 - 7680);
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
                        priority,
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
                        priority,
                        callback,
                    });
                }
                break;
        }
    }



    write({
        type,
        address,
        value,
        priority = 1,
        callback = ()=>{},
    }) {
        switch(type) {
            case this.type.M:
                if( address >= 8000 && address <= 8511 ) 
                    address - (8000 - 7680);
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
                        priority,
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
                        priority,
                        callback,
                    });
                }
                break;
        }
    }



    pulse({
        type,
        address,
        priority = 1,
        duration = 0,
        callback = ()=>{}
    }) {
        switch(type) {
            case this.type.M:
            case this.type.S:
            case this.type.TS:
            case this.type.CS:
            case this.type.Y:
                this.write({
                    type, address, value: true, priority,
                    callback: (error, success) => {
                        if(success) {
                            setTimeout(() => {
                                this.write({
                                    type, address, value: false, priority,
                                    callback
                                });
                            }, duration)
                        }
                        if(error)
                            callback(error, success);
                    }
                });
        }
    }



    _readBits({
        address,
        length,
        priority = 2,
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
            priority
        })
    }



    _readBytes({
        address,
        length,
        priority = 2,
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
            priority
        })
    }



    _writeBit({
        address,
        value,
        priority = 1,
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
            priority
        })
    }



    _writeByte({
        address,
        value,
        priority = 1,
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
            priority
        })
    }

}