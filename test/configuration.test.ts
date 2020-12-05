import * as assert from 'assert';
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
    let config;

    beforeEach(() => {
      config = new Configuration({
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
        rules: {},
      });
    });

    it('should return 0', () => {
      config.config.rules = {};

      assert.strictEqual(0, Object.keys(config.config.rules).length);
    });
  });
});
