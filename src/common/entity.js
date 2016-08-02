import EventEmitter from 'events';
import Utils from './utils';

class Entity extends EventEmitter {
	constructor(game, options) {
		super();

		this.id = options.id || Utils.uuid();

		if (game) {
			this.game = game;
		}

		this.options = Object.assign({}, this.options, options);
	}
}

export default Entity;
