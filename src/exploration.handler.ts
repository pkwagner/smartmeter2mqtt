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
      'description',
    );

    Object.values(measurements).forEach((measurement) => {
      const names = Obis.ObisNames.resolveObisName(measurement, config.config.obis.obisNameLanguage || 'en');

      table.addRow(
        `[${measurement.medium}] ${names.mediumName}`,
        `[${measurement.channel}] ${names.channelName}`,
        `[${measurement.measurement}] ${names.measurementName}`,
        `[${measurement.measureType}] ${names.measurementTypeName}`,
        `[${measurement.tariffRate}] ${names.tariffRateName}`,
        `[${measurement.previousMeasurement}] ${names.previousMeasurementName}`,
        measurement.values[0].value,
        measurement.values[0].unit,
        names.customName,
      );
    });

    logger.log(table.toString());
    logger.log('\nPrinted single OBIS measurement set. Have a good day, Sir!');

    process.exit(0);
  }).process();
}
