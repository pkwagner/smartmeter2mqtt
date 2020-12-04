import * as Obis from 'smartmeter-obis';
import * as mqtt from 'mqtt';
import * as Configuration from './configuration';

if (process.argv.length >= 3 && process.argv[2] === '-T') {
  Obis.init(Configuration.config.obis, (error, measurements) => {
    if (error) throw error;

    process.exit(0);
  }).process();
}

const mqttClient = mqtt.connect(Configuration.config.mqtt.server, {
  port: Configuration.config.mqtt.port,
  username: Configuration.config.mqtt.username,
  password: Configuration.config.mqtt.password,
  reconnectPeriod: 10000,
});

mqttClient.on('error', (error) => console.warn(error));

Obis.init(Configuration.config.obis, (error, measurements) => {
  if (error) {
    console.warn('Encountered unknown error while obis data fetch.');
    console.warn(error);
    return;
  }

  const mqttPayload = {};
  Object.values(measurements).forEach((measurement) => {
    const payloadKeys = Configuration.getMeasurementMappings(measurement);

    payloadKeys.forEach((payloadKey) => {
      if (payloadKey in mqttPayload) {
        console.warn(`Rule for key ${payloadKey} is arbitrary. Skipping new value...`);
        return;
      }

      // Implication: Dropping all values but first
      [mqttPayload[payloadKey]] = measurement.values;
    });
  });

  if (Configuration.config.strict && !Object.keys(Configuration.config.mappings).every(
    (mappingKey) => mappingKey in mqttPayload,
  )) {
    console.warn('Missing key(s) in final output while using strict mode.');
    return;
  }

  if (!mqttClient.connected) {
    console.warn('Unable to deliver MQTT message: Broker not connected.');
    return;
  }

  mqttClient.publish(Configuration.config.mqtt.topic, JSON.stringify(mqttPayload));
}).process();
