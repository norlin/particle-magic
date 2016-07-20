import EventEmitter from 'events';

class GObject extends EventEmitter {
	constructor(game, options) {
		super();

		this.id = options.id || 'uuid_'+Math.random();

		if (game) {
			this.game = game;
		}

		this.options = Object.assign({}, this.options, options);
	}
}

export default GObject;
