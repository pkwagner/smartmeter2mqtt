import { ObisMeasurement, ObisOptions } from 'smartmeter-obis';
import { readFileSync } from 'fs';

interface BaseConfiguration {
  strict?: boolean;
  unpack?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';

  mqtt: {
    topic: string;
    server: string;
    port: number;
    username?: string;
    password?: string;
  };

  obis: ObisOptions;

  rules: {
    [key: string]: {
      medium?: number;
      channel?: number;
      measurement?: number;
      measureType?: number;
      tariffRate?: number;
      previousMeasurement?: number;
    }
  }
}

export default class Configuration {
  config: BaseConfiguration;

  constructor(config: BaseConfiguration) {
    this.config = config;
  }

  static readFromFile(filePath: string): Configuration {
    return new Configuration(JSON.parse(readFileSync(filePath, 'utf-8')));
  }

  getMeasurementMappings(measurement: ObisMeasurement): string[] {
    return Object.entries(this.config.rules).filter((mapping) => {
      const mappingRules = mapping[1];

      return Object.entries(mappingRules).every((rule) => {
        const ruleKey = rule[0];
        const ruleValue = rule[1];

        return ruleKey in measurement && measurement[ruleKey] === ruleValue;
      });
    }).map((mapping) => mapping[0]);
  }
}
