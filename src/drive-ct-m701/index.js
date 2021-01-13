const SerialHandler = require('../serial-handler');
const ModbusRTU = require("modbus-serial");
const util = require('util');

module.exports = class {

    constructor({
        serialManufacturer,
        serialPnpId,
        serialPort,
        serialConfig = {},
        modbusId = 1,
        modbusTimeout = 500,
    }){
        this.serialManufacturer = serialManufacturer;
        this.serialPnpId = serialPnpId;
        this.serialPort = serialPort;
        this.serialHandler = new SerialHandler(serialConfig);
        this.id = modbusId;
        this.timeout = modbusTimeout;
    }

    async connect(callback) {
        if(this.serialPort === undefined){
            await this.serialHandler.init();
            if(this.serialManufacturer) this.serialHandler.filterByManufacturer(this.serialManufacturer);
            if(this.serialPnpId) this.serialHandler.filterByPnpId(this.serialPnpId);
            this.serialPort = this.serialHandler.get();
        }
        console.log(this.serialPort);
        this.modbusClient = new ModbusRTU(this.serialPort);
        this.modbusClient.open(callback)
        this.modbusClient.setID(this.id);
        this.modbusClient.setTimeout(this.timeout);
    }

    isconnected() {
        return this.modbusClient.isOpen();
    }

    async readParameter({menu, parameter, length=1}) {
        return this.modbusClient.readHoldingRegisters(this._findAddress({menu, parameter}), length)
    }

    async writeParameter({menu, parameter, value}) {
        await this.modbusClient.writeRegister(this._findAddress({menu, parameter, length:1}), value)
        return this.readParameter(menu, parameter)
    }

    _findAddress({menu, parameter}) {
        return (menu * 100) + (parameter - 1)
    }

}