import * as logger from 'node-color-log';
import * as Obis from 'smartmeter-obis';
import * as AsciiTable from 'ascii-table';
import Configuration from './configuration';

export default function handleExploration(config: Configuration) {
  logger.log('🤠 Howdy! Starting up in configuration mode...\n');

  Obis.init(config.config.obis, (error, measurements) => {
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
}
