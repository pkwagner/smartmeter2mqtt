import * as assert from 'assert';
import { ObisMeasurement } from 'smartmeter-obis';
import Configuration from '../src/configuration';

const TEST_CONFIG_FILE = './config.json';
const REQUIRED_CONFIG_ATTRS = ['mqtt', 'obis', 'rules'];

describe('Configuration', () => {
  describe('#readFromFile', () => {
    const config = Configuration.readFromFile(TEST_CONFIG_FILE);

    it('should contain required attrs', () => {
      assert.ok(REQUIRED_CONFIG_ATTRS.every((attr) => attr in config.config));
    });
  });

  describe('#getMeasurementMappings', () => {
    const config = new Configuration({
      mqtt: {
        topic: 'sunny/meter',
        server: 'mqtt://example.com',
        port: 1883,
      },
      obis: {
        protocol: 'SmlProtocol',
        transport: 'SerialResponseTransport',
        transportSerialPort: '/dev/ttyUSB0',
        protocolSmlIgnoreInvalidCRC: true,
      },
      rules: {
        'always-shiny': {},
        'sunny-rule': {
          medium: 23,
          channel: 24,
        },
        'rainy-rule': {
          medium: 23,
        },
      },
    });

    it('should match 3', () => {
      const m: ObisMeasurement = {
        tariffRate: 21,
        measureType: 233,
        previousMeasurement: 424234,
        measurement: -34,
        channel: 24,
        medium: 23,
        values: [],

        idToString: null,
        valueToString: null,
      };

      assert.deepStrictEqual(config.getMeasurementMappings(m), [
        'always-shiny',
        'sunny-rule',
        'rainy-rule',
      ]);
    });

    it('should match 2', () => {
      const m: ObisMeasurement = {
        tariffRate: 21,
        measureType: 233,
        previousMeasurement: 424234,
        measurement: -34,
        channel: 25,
        medium: 23,
        values: [],

        idToString: null,
        valueToString: null,
      };

      assert.deepStrictEqual(config.getMeasurementMappings(m), ['always-shiny', 'rainy-rule']);
    });

    it('should match 1', () => {
      const m: ObisMeasurement = {
        tariffRate: 4543252,
        measureType: 233,
        previousMeasurement: 424234,
        measurement: -45423545,
        channel: 435245,
        medium: 656436,
        values: [],

        idToString: null,
        valueToString: null,
      };

      assert.deepStrictEqual(config.getMeasurementMappings(m), ['always-shiny']);
    });
  });
});
