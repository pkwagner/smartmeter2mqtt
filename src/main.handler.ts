import * as logger from 'node-color-log';
import * as mqtt from 'mqtt';
import { ObisMeasurement } from 'smartmeter-obis';
import * as Obis from 'smartmeter-obis';
import Configuration from './configuration';

const MQTT_DEFAULT_CLIENT_ID = 'smartmeter2mqtt';
const MQTT_RECONNECT_PERIOD = 10;

export function composePayload(
  config: Configuration,
  measurements: ObisMeasurement[],
  warn = logger.warn,
): any {
  const mqttPayload = { time: Math.floor(Date.now() / 1000) };

  measurements.forEach((measurement) => {
    const payloadKeys = config.getMeasurementMappings(measurement);

    payloadKeys.forEach((payloadKey) => {
      if (payloadKey in mqttPayload) {
        warn(`Rule for key ${payloadKey} is arbitrary. Skipping new value...`);
        return;
      }

      // Assumption: Always at least one entry -> let it fail otherwise
      mqttPayload[payloadKey] = config.config.unpack
        ? measurement.values[0].value
        : measurement.values;
    });
  });

  if (config.config.strict && !Object.keys(config.config.rules).every(
    (mappingKey) => mappingKey in mqttPayload,
  )) {
    warn('Missing key(s) in final output while using strict mode. Dropping message...');
    return null;
  }

  return mqttPayload;
}

export default function handleMain(config: Configuration) {
  logger.info('Connecting to MQTT broker...');
  const mqttClient = mqtt.connect(config.config.mqtt.server, {
    port: config.config.mqtt.port,
    username: config.config.mqtt.username,
    password: config.config.mqtt.password,
    clientId: config.config.mqtt.clientId || MQTT_DEFAULT_CLIENT_ID,
    reconnectPeriod: MQTT_RECONNECT_PERIOD * 1000,
  });

  mqttClient.on('connect', () => {
    logger.info('Connection to MQTT broker established');
  });

  mqttClient.on('error', (error) => {
    logger.warn('Encountered MQTT connection error:');
    logger.log(error);
  });

  logger.info('Setting up OBIS...');
  Obis.init(config.config.obis, (error, measurements) => {
    if (error) {
      logger.warn('Encountered unknown error while obis data fetch:');
      logger.log(error);
      return;
    }

    const mqttPayload = composePayload(config, Object.values(measurements));
    if (!mqttPayload) return;

    if (!mqttClient.connected) {
      logger.warn('Unable to deliver MQTT message: Broker not (yet?) connected');
      return;
    }

    mqttClient.publish(config.config.mqtt.topic, JSON.stringify(mqttPayload));
  }).process();
}
