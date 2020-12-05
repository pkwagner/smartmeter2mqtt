import * as assert from 'assert';
import { ObisMeasurement } from 'smartmeter-obis';
import Configuration from '../src/configuration';
import { composePayload } from '../src/main.handler';

describe('MainHandler', () => {
  describe('#composePayload', () => {
    let config: Configuration;
    let m: ObisMeasurement;

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

      m = {
        tariffRate: 21,
        measureType: 233,
        previousMeasurement: 424234,
        measurement: -34,
        channel: 23,
        medium: 23,
        values: [],

        idToString: null,
        valueToString: null,
      };
    });

    it('should be sent twice (arbitrary)', () => {
      const o = { ...m };
      m.medium = 2;

      let warned = false;
      assert.deepStrictEqual(Object.keys(composePayload(config, [o, m], () => {
        warned = true;
      })), [
        'always-shiny',
        'rainy-rule',
      ]);
      assert.strictEqual(warned, true);
    });

    it('should be sent twice', () => {
      let warned = false;
      assert.deepStrictEqual(Object.keys(composePayload(config, [m], () => { warned = true; })), [
        'always-shiny',
        'rainy-rule',
      ]);
      assert.strictEqual(warned, false);
    });

    it('should be sent three times', () => {
      m.channel = 24;

      let warned = false;
      assert.deepStrictEqual(Object.keys(composePayload(config, [m], () => { warned = true; })), [
        'always-shiny',
        'sunny-rule',
        'rainy-rule',
      ]);
      assert.strictEqual(warned, false);
    });

    it('should be accepted', () => {
      config.config.strict = false;

      let warned = false;
      assert.ok(composePayload(config, [m], () => { warned = true; }));
      assert.strictEqual(warned, false);
    });

    it('should be rejected because of sunny (strict)', () => {
      config.config.strict = true;

      let warned = false;
      assert.strictEqual(composePayload(config, [m], () => { warned = true; }), null);
      assert.strictEqual(warned, true);
    });
  });
});
