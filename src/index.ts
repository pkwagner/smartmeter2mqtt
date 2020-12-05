import * as Obis from 'smartmeter-obis';
import * as mqtt from 'mqtt';
import * as AsciiTable from 'ascii-table';
import * as logger from 'node-color-log';
import * as Configuration from './configuration';

logger.setLevel(Configuration.CONFIG.logLevel || 'info');

const MQTT_RECONNECT_PERIOD = 10;

// Argument order: <RESERVED> <RESERVED> <CONFIG_PATH> [-T]
if (process.argv.length >= 4 && process.argv[3] === '-T') {
  logger.log('🤠 Howdy! Starting up in configuration mode...\n');

  Obis.init(Configuration.CONFIG.obis, (error, measurements) => {
    if (error) throw error;

    const table = new AsciiTable();
    table.setHeading(
      'medium',
      'channel',
      'measurement',
      'measureType',
      'tariffRate',
      'previousMeasurement',
      'value (first)',
      'unit (first)',
    );

    Object.values(measurements).forEach((measurement) => {
      table.addRow(
        measurement.medium,
        measurement.channel,
        measurement.measurement,
        measurement.measureType,
        measurement.tariffRate,
        measurement.previousMeasurement,
        measurement.values[0].value,
        measurement.values[0].unit,
      );
    });

    logger.log(table.toString());
    logger.log('\nPrinted single OBIS measurement set. Have a good day, Sir!');

    process.exit(0);
  }).process();
} else {
  logger.info('Connecting to MQTT broker...');
  const mqttClient = mqtt.connect(Configuration.CONFIG.mqtt.server, {
    port: Configuration.CONFIG.mqtt.port,
    username: Configuration.CONFIG.mqtt.username,
    password: Configuration.CONFIG.mqtt.password,
    reconnectPeriod: MQTT_RECONNECT_PERIOD * 1000,
  });

  mqttClient.on('connect', () => {
    logger.info('Connection to MQTT broker established');
  });

  mqttClient.on('error', (error) => {
    logger.warn('Encountered MQTT connection error');
    logger.log(error);
  });

  logger.info('Setting up OBIS...');
  Obis.init(Configuration.CONFIG.obis, (error, measurements) => {
    if (error) {
      logger.warn('Encountered unknown error while obis data fetch');
      logger.log(error);
      return;
    }

    const mqttPayload = {};
    Object.values(measurements).forEach((measurement) => {
      const payloadKeys = Configuration.getMeasurementMappings(measurement);

      payloadKeys.forEach((payloadKey) => {
        if (payloadKey in mqttPayload) {
          logger.warn(`Rule for key ${payloadKey} is arbitrary. Skipping new value...`);
          return;
        }

        mqttPayload[payloadKey] = Configuration.CONFIG.unpack
          ? measurement.values[0].value
          : measurement.values;
      });
    });

    if (Configuration.CONFIG.strict && !Object.keys(Configuration.CONFIG.rules).every(
      (mappingKey) => mappingKey in mqttPayload,
    )) {
      logger.warn('Missing key(s) in final output while using strict mode. Dropping message...');
      return;
    }

    if (!mqttClient.connected) {
      logger.warn('Unable to deliver MQTT message: Broker not (yet?) connected');
      return;
    }

    mqttClient.publish(Configuration.CONFIG.mqtt.topic, JSON.stringify(mqttPayload));
  }).process();
}
