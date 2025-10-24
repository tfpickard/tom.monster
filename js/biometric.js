/**
 * BIOMETRIC SENSOR
 * Web Bluetooth API integration for heart rate monitors and other biometric sensors
 */

export default class BiometricSensor {
    constructor() {
        this.connected = false;
        this.device = null;
        this.characteristic = null;
        this.listeners = {};

        // Standard Bluetooth GATT services
        this.HEART_RATE_SERVICE = 'heart_rate';
        this.HEART_RATE_CHARACTERISTIC = 'heart_rate_measurement';
    }

    async connect() {
        if (!navigator.bluetooth) {
            throw new Error('Web Bluetooth is not supported. Try Chrome/Edge on desktop or Android.');
        }

        try {
            // Request Bluetooth device with heart rate service
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [this.HEART_RATE_SERVICE] }],
                optionalServices: [this.HEART_RATE_SERVICE]
            });

            // Connect to GATT server
            const server = await this.device.gatt.connect();
            const service = await server.getPrimaryService(this.HEART_RATE_SERVICE);
            this.characteristic = await service.getCharacteristic(this.HEART_RATE_CHARACTERISTIC);

            // Listen for heart rate notifications
            await this.characteristic.startNotifications();
            this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
                this.handleHeartRateData(event.target.value);
            });

            // Listen for disconnection
            this.device.addEventListener('gattserverdisconnected', () => {
                this.handleDisconnect();
            });

            this.connected = true;
            console.log(`Connected to ${this.device.name}`);

        } catch (error) {
            console.error('Bluetooth connection error:', error);
            throw error;
        }
    }

    handleHeartRateData(value) {
        // Parse heart rate data according to Bluetooth Heart Rate Profile
        // https://www.bluetooth.com/specifications/specs/heart-rate-service-1-0/

        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x1;
        let heartRate;

        if (rate16Bits) {
            heartRate = value.getUint16(1, true); // little-endian
        } else {
            heartRate = value.getUint8(1);
        }

        this.emit('heartrate', heartRate);
    }

    handleDisconnect() {
        console.log('Sensor disconnected');
        this.connected = false;
        this.device = null;
        this.characteristic = null;
        this.emit('disconnect');
    }

    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            await this.device.gatt.disconnect();
        }
    }

    // Simple event emitter
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}
