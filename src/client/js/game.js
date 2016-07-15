//import 'fabric'
import Log from './log'
import GObject from './object.js'
import Keys from './keys'

class Game extends GObject {
	constructor(options) {
		options.screenWidth = options.screenWidth || document.body.offsetWidth;
		options.screenHeight = options.screenHeight || document.body.offsetHeight;

		super(null, options)
		let log = new Log('Game');
		this.log = log.log.bind(log);

		this.objects = {};

		this.initCanvas();

		this.addKeyListener(Keys.ENTER, () => {
			if (this.tickTimer) {
				this.stop();
			} else {
				this.start();
			}
		}, true);
	}

	initCanvas() {
		let el = document.getElementById(this.options.canvas);

		if (!el) {
			throw "No canvas found!"
		}

		el.width = this.options.screenWidth;
		el.height = this.options.screenHeight;

		this.canvas = new fabric.StaticCanvas(this.options.canvas);
		this.canvas.setBackgroundColor('#fff');

		document.body.addEventListener('keydown', this.onKeyDown.bind(this), true);
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

	addPlayer(player) {
		this.player = player;
		this.add(player);
	}

	onKeyDown(event) {
		let code = event.which;

		this.emit(`keydown.${code}.global`);

		if (this.tickTimer) {
			this.emit(`keydown.${code}`);
		}
	}

	addKeyListener(key, handler, global) {
		let isGlobal = global ? '.global' : '';
		this.on(`keydown.${key}${isGlobal}`, handler);
	}

	start() {
		if (this.tickTimer) {
			return;
		}

		if (!this.player) {
			throw "No player found!"
		}

		this.tickTimer = window.setInterval(this.tick.bind(this), 1000 / this.options.fps);
	}

	stop() {
		if (this.tickTimer) {
			window.clearInterval(this.tickTimer);
			this.tickTimer = undefined;
		}
	}

	tick() {
		if (!this.player) {
			this.stop();
			throw "No player found on tick!"
		}

		this.canvas.clear();

		for (let id in this.objects) {
			let object = this.objects[id];

			object.tick();
		}

		this.drawGrid();
		this.drawBorder();
		this.drawObject(this.player);


		this.canvas.renderAll();
	}

	drawObject(object) {
		this.canvas.add(object.el);
	}

	drawGrid() {
		let size = this.options.gridSize || 25;
		let screenWidth = this.options.screenWidth;
		let screenHeight = this.options.screenHeight;

		let horizontalStep = screenWidth / size;
		let verticalStep = screenHeight / size;

		let playerPos = this.player.pos();

		let lineOptions = {
			stroke: this.options.borderColor,
			selectable: false
		};

		let lines = [];
		let init = {x: -0 -playerPos.x, y: -0 -playerPos.y};
		//console.log(init);

		for (let x = init.x; x < screenWidth; x += horizontalStep) {
			lines.push(new fabric.Line([x, 0, x, screenHeight], lineOptions));
		}

		for (let y = init.y; y < screenHeight; y += verticalStep) {
			lines.push(new fabric.Line([0, y, screenWidth, y], lineOptions));
		}

		this.canvas.add.apply(this.canvas, lines);
	}

	drawBorder() {
		let player = this.player.pos();
		let options = this.options;

		let lineOptions = {
			stroke: '#000',
			selectable: false
		};

		let lines = [];

		// Left-vertical.
		if (player.x <= options.screenWidth/2) {
			console.log('left-vertical');
			lines.push(new fabric.Line([
				options.screenWidth/2 - player.x,
				options.screenHeight/2 - player.y,
				options.screenWidth/2 - player.x,
				options.height + options.screenHeight/2 - player.y
			], lineOptions))
		}

		// Top-horizontal.
		if (player.y <= options.screenHeight/2) {
			console.log('top-horizontal');
			lines.push(new fabric.Line([
				options.screenWidth/2 - player.x,
				options.screenHeight/2 - player.y,
				options.width + options.screenWidth/2 - player.x,
				options.screenHeight/2 - player.y
			], lineOptions))
		}

		// Right-vertical.
		if (options.width - player.x <= options.screenWidth/2) {
			console.log('Right-vertical');
			lines.push(new fabric.Line([
				options.width + options.screenWidth/2 - player.x,
				options.screenHeight/2 - player.y,
				options.width + options.screenWidth/2 - player.x,
				options.height + options.screenHeight/2 - player.y
			], lineOptions))
		}

		// Bottom-horizontal.
		if (options.height - player.y <= options.screenHeight/2) {
			console.log('Bottom-horizontal');
			lines.push(new fabric.Line([
				options.width + options.screenWidth/2 - player.x,
				options.height + options.screenHeight/2 - player.y,
				options.screenWidth/2 - player.x,
				options.height + options.screenHeight/2 - player.y
			], lineOptions))
		}

		this.canvas.add.apply(this.canvas, lines);
	}
}

Game.prototype.options = {
	fps: 60,
	width: 5000,
	height: 5000,
	borderColor: '#ccc'
};

export default Game;
