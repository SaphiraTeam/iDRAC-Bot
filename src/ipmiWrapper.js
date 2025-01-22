const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const { ipmiToolPath } = require('./config');

class IPMIWrapper {
    constructor(ip, username, password) {
        this.ip = ip;
        this.username = username;
        this.password = password;
    }

    sanitizeErrorMessage(error) {
        let message = error.message;
        message = message.replace(this.password, 'Redacted');
        message = message.replace(this.username, 'Redacted');
        message = message.replace(this.ip, 'Redacted');
        return message;
    }

    async executeCommand(command) {
        const baseCmd = `"${ipmiToolPath}" -I lanplus -H ${this.ip} -U ${this.username} -P ${this.password}`;
        try {
            const { stdout } = await execAsync(`${baseCmd} ${command}`);
            return stdout.trim();
        } catch (error) {
            throw new Error(`IPMI command failed: ${this.sanitizeErrorMessage(error)}`);
        }
    }

    async getPowerStatus() {
        return this.executeCommand('power status');
    }

    async getPowerUsage() {
        return this.executeCommand('sdr type "Power Supply"');
    }

    async getFanSpeed() {
        return this.executeCommand('sdr type "Fan"');
    }

    async setFanSpeed(percentage) {
        return this.executeCommand(`raw 0x30 0x30 0x02 0xff 0x${percentage.toString(16)}`);
    }

    async getTemperatures() {
        return this.executeCommand('sdr type temperature');
    }

    async getSensors() {
        return this.executeCommand('sdr elist full');
    }

    async getPowerSupply() {
        return this.executeCommand('sdr type "Power Supply"');
    }

    async getEnergyConsumption() {
        return this.executeCommand('delloem powermonitor');
    }
}

module.exports = IPMIWrapper;
