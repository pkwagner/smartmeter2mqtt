import { ObisOptions } from 'smartmeter-obis';
import { ObisMeasurement } from 'smartmeter-obis/lib/ObisMeasurement';
import { readFileSync } from 'fs';

export const config: Configuration = JSON.parse(readFileSync('./config.json', 'utf-8'));

export interface Configuration {
  strict?: boolean;

  mqtt: {
    topic: string;
    server: string;
    port: number;
    username?: string;
    password?: string;
  };

  obis: ObisOptions;

  mappings: {
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
  return Object.entries(config.mappings).filter((mapping) => {
    const mappingRules = mapping[1];

    return Object.entries(mappingRules).every((rule) => {
      const ruleKey = rule[0];
      const ruleValue = rule[1];

      return ruleKey in measurement && measurement[ruleKey] === ruleValue;
    });
  }).map((mapping) => mapping[0]);
}
