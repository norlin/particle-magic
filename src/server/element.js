import GObject from '../common/object.js';

class GElement extends GObject {
	constructor(game, options) {
		super(game, options);

		this.initParams();
	}

	initParams() {
		this._speed = 6.25;
		this._position = {x: 0, y: 0};
	}

	pos() {
		return this._position;
	}
}

export default GElement;
