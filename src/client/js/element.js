//import 'fabric'
import GObject from './object.js'

class GElement extends GObject {
	constructor(game, options) {
		super(game, options)

		this.initParams();
		this.el = this.createEl();
	}

	createEl() {
		return new fabric.Circle({left: this._position.x, top: this._position.y});
	}

	initParams() {
		this._speed = 6.25;
		this._position = {x: 0, y: 0};
	}

	pos() {
		return this._position;
	}

	draw(x, y) {
		this.el.set('left', x);
		this.el.set('top', y);

		this.el.setCoords();
	}
}

export default GElement;
