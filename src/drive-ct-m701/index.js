// written by: github.com/adrianaryaputra
// FOR NIDEC M700 SERIES (M700, M701, M702)
// REQUIRED DEPS:
//     - serialport
//     - modbus-serial

module.exports = class Drive_CT_M70X{

    constructor({
        modbusClient,
        modbusId,
        modbusTimeout,
    }){
        this.id = modbusId;
        this.timeout = modbusTimeout;
        if(modbusClient) this.setClient(modbusClient);
    }

    setClient(client) {
        this.modbusClient = client;
    }

    configureID() {
        this.modbusClient.setID(this.id);
        this.modbusClient.setTimeout(this.timeout);
    }

    async readParameter({menu, parameter, length=1}) {
        this.configureID();
        return this.modbusClient.readHoldingRegisters(this._findAddress({menu, parameter}), length)
    }

    async writeParameter({menu, parameter, value}) {
        this.configureID();
        return this.modbusClient.writeRegister(this._findAddress({menu, parameter}), value)
    }

    async saveParameter() {
        this.configureID();
        return this.modbusClient.writeRegister(this._findAddress({menu:10, parameter:0}), 1001);
    }

    async reset() {
        this.configureID();
        await this.modbusClient.writeRegister(this._findAddress({menu:10, parameter:33}), 1);
        setTimeout(() => {
            this.modbusClient.writeRegister(this._findAddress({menu:10, parameter:33}), 0)
        }, 1000);
    }

    _findAddress({menu, parameter}) {
        return (menu * 100) + (parameter - 1)
    }
}