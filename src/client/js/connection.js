import Log from 'common/log'
import GObject from './object.js'
import { connect as io } from 'socket.io-client'

let log = new Log('Socket');

log.debug('socket', io);

class Client extends GObject {
	constructor(game, options) {
		super(game, options);

		this.socket = io({query:'type=player'});
	}
}

let instance;

function create(game, options) {
	if (!instance) {
		instance = new Client(game, options);
	}

	return instance
}

export default create;
