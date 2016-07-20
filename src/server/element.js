import GObject from '../common/object.js';
import Utils from '../common/utils';

class GElement extends GObject {
	constructor(game, options) {
		super(game, options);

		this.initParams();
	}

	initParams() {
		this.color = this.options.color || Utils.getRandomColor();

		this.radius = this.options.radius;

		this._speed = 6.25;

		this._position = {
			x: this.options.startX || 0,
			y: this.options.startY || 0
		};
	}

	pos() {
		return {
			x: this._position.x,
			y: this._position.y
		};
	}
}

export default GElement;
