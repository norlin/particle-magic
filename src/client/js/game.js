//import 'fabric'
import Log from './log'
import GObject from './object.js'

class Game extends GObject {
	constructor(options) {
		super(null, options)
		let log = new Log('Game');
		this.log = log.log.bind(log);

		this.objects = {};

		this.initCanvas();
	}

	initCanvas() {
		let el = document.getElementById(this.options.canvas);
		this.log('canvas:', el);

		if (!el) {
			throw "No canvas found!"
		}

		el.width = document.body.offsetWidth;
		el.height = document.body.offsetHeight;

		this.canvas = new fabric.StaticCanvas(this.options.canvas);
		this.canvas.setBackgroundColor('#fff');
	}

	add(object) {
		if (!object) {
			throw "What should I add?"
		}

		if (this.objects[object.id]) {
			this.log('object already in the game');
			return false;
		}

		this.log('adding object...', object.el);
		this.objects[object.id] = object;
		this.canvas.add(object.el);

		return true;
	}
}

export default Game;
