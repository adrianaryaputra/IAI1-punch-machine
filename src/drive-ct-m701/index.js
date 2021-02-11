
// USAGE EXAMPLE:

// drive = new Drive_CT_M701({
//     modbusClient: client,
//     modbusId: 1,
//     modbusTimeout: 500,
// });

// drive.writeParameter({
//     menu: 18,
//     parameter:31,
//     value: runValue,
// })
//     .then(console.log)
//     .catch(console.error)

module.exports = class Drive_CT_M701{

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
        return this.modbusClient.readHoldingRegisters(this.findAddress({menu, parameter}), length)
    }

    async writeParameter({menu, parameter, value}) {
        this.configureID();
        return this.modbusClient.writeRegister(this.findAddress({menu, parameter}), value)
    }

    async saveParameter() {
        this.configureID();
        return this.modbusClient.writeRegister(this.findAddress({menu:10, parameter:0}), 1001);
    }

    async reset() {
        this.configureID();
        await this.modbusClient.writeRegister(this.findAddress({menu:10, parameter:33}), 1);
        setTimeout(() => {
            this.modbusClient.writeRegister(this.findAddress({menu:10, parameter:33}), 0)
        }, 1000);
    }

    findAddress({menu, parameter}) {
        return (menu * 100) + (parameter - 1)
    }

}