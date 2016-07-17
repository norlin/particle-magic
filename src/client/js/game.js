//import 'fabric'
import Log from 'common/log'
import GObject from './object.js'
import Keys from './keys'
import Socket from './connection'
import GPlayer from './player'

let log = new Log('Game');

class Game extends GObject {
	constructor(options) {
		options.screenWidth = options.screenWidth || document.body.offsetWidth;
		options.screenHeight = options.screenHeight || document.body.offsetHeight;

		super(null, options)

		this.objects = {};
		this.initCanvas();

		this.connect();
	}

	init(config) {
		this.config = config;

		log.debug(config);

		this.addKeyListener(Keys.ENTER, () => {
			if (this.tickTimer) {
				this.stop();
			} else {
				this.start();
			}
		}, true);

		this.start();
	}

	initCanvas() {
		let el = document.getElementById(this.options.canvas);

		if (!el) {
			throw 'No canvas found!';
		}


		el.width = this.options.screenWidth;
		el.height = this.options.screenHeight;

		this.canvas = new fabric.StaticCanvas(this.options.canvas);
		this.canvas.setBackgroundColor('#fff');

		document.body.addEventListener('keydown', (e)=>this.onKeyDown(e), true);
		document.body.addEventListener('click', (e)=>this.onClick(e), true);
	}

	connect() {
		this.connection = Socket();
		this.socket = this.connection.socket;
		this.socket.on('config', (config)=>this.init(config));
	}

	add(object) {
		if (!object) {
			throw "What should I add?"
		}

		if (this.objects[object.id]) {
			log.debug('object already in the game');
			return false;
		}

		log.debug('adding object...', object.el);
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

	onClick(mouse) {
		let point = {
			x: mouse.clientX - this.options.screenWidth / 2,
			y: mouse.clientY - this.options.screenHeight / 2
		};

		this.emit(`click.global`, point);

		if (this.tickTimer) {
			this.emit(`click`, point);
		}

		let pos = this.player && this.player.pos();

		if (!pos || !this.tickTimer) {
			return;
		}

		let gamePoint = {
			x: pos.x + point.x,
			y: pos.y + point.y
		};

		this.emit(`gameClick`, gamePoint);
	}

	addKeyListener(key, handler, global) {
		let isGlobal = global ? '.global' : '';
		this.on(`keydown.${key}${isGlobal}`, handler);
	}

	addClickListener(handler, inGame, global) {
		let event = inGame ? 'gameClick' : 'click';
		let isGlobal = global ? '.global' : '';

		this.on(`${event}${isGlobal}`, handler);
	}

	start() {
		let config = this.config
		if (!config) {
			throw 'No config loaded!';
		}

		if (this.tickTimer) {
			return;
		}

		if (!this.player) {
			this.addPlayer(new GPlayer(this, {name: 'test', color: '#f00'}));
		}

		this.tickTimer = window.setInterval(()=>this.tick(), 1000 / this.config.fps);
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

			if (object.tick) {
				object.tick();
			}
		}

		this.drawGrid();
		this.drawBorder();
		this.drawObject(this.player.el);
		if (this.player.target && this.player.target.mark) {
			this.drawObject(this.player.target.mark);
		}

		this.canvas.renderAll();
	}

	drawObject(el) {
		this.canvas.add(el);
	}

	drawGrid() {
		let size = this.options.gridSize || 100;
		let screenWidth = this.options.screenWidth;
		let screenHeight = this.options.screenHeight;

		let horizontalStep = size;
		let verticalStep = size;

		let playerPos = this.player.pos();

		let lineOptions = {
			stroke: this.config.borderColor,
			selectable: false
		};

		let lines = [];
		let init = {x: -0 -playerPos.x, y: -0 -playerPos.y};

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
		let config = this.config;

		let lineOptions = {
			stroke: '#000',
			selectable: false
		};

		let borders = [];

		// Left
		if (player.x <= options.screenWidth/2) {
			borders.push(new fabric.Line([
				options.screenWidth/2 - player.x,
				options.screenHeight/2 - player.y,
				options.screenWidth/2 - player.x,
				config.height + options.screenHeight/2 - player.y
			], lineOptions))
		}

		// Top
		if (player.y <= options.screenHeight/2) {
			borders.push(new fabric.Line([
				options.screenWidth/2 - player.x,
				options.screenHeight/2 - player.y,
				config.width + options.screenWidth/2 - player.x,
				options.screenHeight/2 - player.y
			], lineOptions))
		}

		// Right
		if (options.width - player.x <= options.screenWidth/2) {
			borders.push(new fabric.Line([
				config.width + options.screenWidth/2 - player.x,
				options.screenHeight/2 - player.y,
				config.width + options.screenWidth/2 - player.x,
				config.height + options.screenHeight/2 - player.y
			], lineOptions))
		}

		// Bottom
		if (options.height - player.y <= options.screenHeight/2) {
			borders.push(new fabric.Line([
				config.width + options.screenWidth/2 - player.x,
				config.height + options.screenHeight/2 - player.y,
				options.screenWidth/2 - player.x,
				config.height + options.screenHeight/2 - player.y
			], lineOptions))
		}

		this.canvas.add.apply(this.canvas, borders);
	}
}

export default Game;
