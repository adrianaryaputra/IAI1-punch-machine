const SerialPort = require('serialport');

// USAGE EXAMPLE:
// 
// modbusSerialHandler = await new SerialHandler({baudRate: 9600, autoOpen: false}).init();
// console.log(modbusSerialHandler.filterByManufacturer('1a86').get());
// 

module.exports = class SerialHandler{

    constructor(settings = {}){
        this._SerialPort = SerialPort;
        this.settings = {
            autoOpen: false,
            ...settings,
        };
        this.serialList = new Array();
    }

    filterByManufacturer(manufacturerName) {        
        this.serialList = this.serialList.filter(serial => serial.manufacturer == manufacturerName);
        return this;
    }

    filterByPnpId(pnpId) {
        this.serialList = this.serialList.filter(serial => serial.pnpId == pnpId);
        return this;
    }

    list() {
        return this.serialList;
    }

    async init() {
        this.serialList = await this._SerialPort.list();
        return this;
    }

    get() {
        if(this.serialList.length == 1){
            let selectedPort = this.serialList[0];
            return new this._SerialPort(selectedPort.path, this.settings);
        } else {
            throw Error(`there are ${this.serialList.length} serial exist. you need exactly 1 serial. Filter by Manufacturer and PNP ID first!`);
        }
    }

}