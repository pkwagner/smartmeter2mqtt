import * as logger from 'node-color-log';
import Configuration from './configuration';
import handleMain from './main.handler';
import handleExploration from './exploration.handler';

const config = Configuration.readFromFile(process.argv[2]);

logger.setLevel(config.config.logLevel || 'info');

if (process.argv.length >= 4 && process.argv[3] === '-T') {
  handleExploration(config);
} else {
  handleMain(config);
}
