
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

module.exports = class PLC_FX3U{

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

    async read_M(number, length=1) {
        this.configureID();
        if(number>=0 && number<=7679)
            return this.modbusClient.readCoils(number, length);
        if(number>=8000 && number<=8511)
            return this.modbusClient.readCoils(number-320, length);
        return
    }

    async write_M(number, bool) {
        this.configureID();
        if(number>=0 && number<=7679)
            return this.modbusClient.writeCoil(number, bool);
        if(number>=8000 && number<=8511)
            return this.modbusClient.writeCoil(number-320, bool);
        return
    }

    async read_S(number, length=1) {
        this.configureID();
        if(number>=0 && number<=4095)
            return this.modbusClient.readCoils(number+0x2000, length);
        return
    }

    async write_S(number, bool) {
        this.configureID();
        if(number>=0 && number<=4095)
            return this.modbusClient.writeCoil(number+0x2000, bool);
        return
    }

    async read_TS(number, length=1) {
        this.configureID();
        if(number>=0 && number<=511)
            return this.modbusClient.readCoils(number+0x3000, length);
        return
    }

    async write_TS(number, bool) {
        this.configureID();
        if(number>=0 && number<=511)
            return this.modbusClient.writeCoil(number+0x3000, bool);
        return
    }

    async read_CS(number, length=1) {
        this.configureID();
        if(number>=0 && number<=255)
            return this.modbusClient.readCoils(number+0x3200, length);
        return
    }

    async write_CS(number, bool) {
        this.configureID();
        if(number>=0 && number<=255)
            return this.modbusClient.writeCoil(number+0x3200, bool);
        return
    }

    async read_Y(number, length=1) {
        this.configureID();
        if(number>=0 && number<=377)
            return this.modbusClient.readCoils(number+0x3300, length);
        return
    }

    async write_Y(number, bool) {
        this.configureID();
        if(number>=0 && number<=377)
            return this.modbusClient.writeCoil(number+0x3300, bool);
        return
    }

    async read_D(number, length=1) {
        this.configureID();
        if(number>=0 && number<=8511)
            return this.modbusClient.readHoldingRegisters(number, length);
        return
    }

    async write_D(number, array) {
        this.configureID();
        if(number>=0 && number<=8511)
            return this.modbusClient.writeRegisters(number, array);
        return
    }

    async read_R(number, length=1) {
        this.configureID();
        if(number>=0 && number<=32767)
            return this.modbusClient.readHoldingRegisters(number+0x2140, length);
        return
    }

    async write_R(number, array) {
        this.configureID();
        if(number>=0 && number<=32767)
            return this.modbusClient.writeRegisters(number+0x2140, array);
        return
    }

    async read_TN(number, length=1) {
        this.configureID();
        if(number>=0 && number<=511)
            return this.modbusClient.readHoldingRegisters(number+0xA140, length);
        return
    }

    async write_TN(number, array) {
        this.configureID();
        if(number>=0 && number<=511)
            return this.modbusClient.writeRegisters(number+0xA140, array);
        return
    }

    async read_CN(number, length=1) {
        this.configureID();
        if(number>=0 && number<=255)
            return this.modbusClient.readHoldingRegisters(number+0xA340, length);
        return
    }

    async write_CN(number, array) {
        this.configureID();
        if(number>=0 && number<=255)
            return this.modbusClient.writeRegisters(number+0xA340, array);
        return
    }

}