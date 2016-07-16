'use strict';

import Log from './common/log';
import Server from './server/server';

const log = new Log('index');

log.debug('Create server...');
const server = new Server();

log.info('Server created!');
