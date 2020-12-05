import { ObisMeasurement, ObisOptions } from 'smartmeter-obis';
import { readFileSync } from 'fs';

export const CONFIG: Configuration = JSON.parse(readFileSync(process.argv[2], 'utf-8'));

interface Configuration {
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

export function getMeasurementMappings(measurement: ObisMeasurement): string[] {
  return Object.entries(CONFIG.rules).filter((mapping) => {
    const mappingRules = mapping[1];

    return Object.entries(mappingRules).every((rule) => {
      const ruleKey = rule[0];
      const ruleValue = rule[1];

      return ruleKey in measurement && measurement[ruleKey] === ruleValue;
    });
  }).map((mapping) => mapping[0]);
}
