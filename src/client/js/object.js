class GObject {
	constructor(game, options) {
		this.id = 'uuid_'+Math.random();

		this.game = game;

		this.options = Object.assign({}, this.defaults, options);
	}
}

export default GObject;
