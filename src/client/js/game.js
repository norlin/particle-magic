import Log from 'common/log';
import GObject from 'common/object.js';
import Keys from './keys';
import Socket from './connection';
import GPlayer from './player';
import GElement from './element';

let log = new Log('Game');

class Game extends GObject {
	constructor(options) {
		options.screenWidth = options.screenWidth || document.body.offsetWidth;
		options.screenHeight = options.screenHeight || document.body.offsetHeight;

		super(null, options);

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

		window.addEventListener('resize', (e)=>{
			this.options.screenWidth = document.body.offsetWidth;
			this.options.screenHeight = document.body.offsetHeight;

			document.getElementById(this.options.canvas);
			el.width = this.options.screenWidth;
			el.height = this.options.screenHeight;

			this.canvas.setWidth(this.options.screenWidth);
			this.canvas.setHeight(this.options.screenHeight);
			this.canvas.calcOffset();
		});
	}

	connect() {
		this.connection = Socket();
		this.socket = this.connection.socket;
		this.socket.on('config', (config)=>this.init(config));

		this.socket.on('createPlayer', (data)=>{
			if (this.player) {
				return;
			}

			this.addPlayer(new GPlayer(this, {
				id: data.id,
				name: 'test',
				color: data.color,
				startX: data.startX,
				startY: data.startY,
				radius: data.radius
			}));
		});

		this.socket.on('updatePosition', (data)=>{
			this.player.target.x = data.targetX;
			this.player.target.y = data.targetY;
			this.player._position.x = data.x;
			this.player._position.y = data.y;

			let visible = data.visible;
			//log.debug('visible', visible);

			this.iterate((object)=>{
				let id = object.id;

				if (id == this.player.id) {
					// skip player object
					return;
				}

				if (!visible[id]) {
					this.remove(id);
				}
			});

			for (let id in visible) {
				let newObject = visible[id];
				let existing = this.objects[id];

				if (existing) {
					log.debug('update', newObject.x, newObject.y);
					existing._position.x = newObject.x;
					existing._position.y = newObject.y;
					existing.radius = newObject.radius;
					existing.color = newObject.color;
					continue;
				}

				this.addMass({
					id: id,
					startX: newObject.x,
					startY: newObject.y,
					radius: newObject.radius,
					color: newObject.color
				});
			}
		});

		this.on('gameClick', (point)=>{
			this.socket.emit('setTarget', point);
		})
	}

	iterate(method) {
		for (let id in this.objects) {
			method(this.objects[id]);
		}
	}

	add(object) {
		if (!object) {
			throw "What should I add?";
		}

		if (this.objects[object.id]) {
			log.debug('object already in the game');
			return false;
		}

		log.debug('adding object...', object.id);
		this.objects[object.id] = object;
		this.canvas.add(object.el);

		return true;
	}

	remove(id) {
		if (!this.objects[id] || this.player.id == id) {
			return;
		}

		this.objects[id].el.remove();
		this.objects[id].el = undefined;
		this.objects[id] = undefined;
		delete this.objects[id];
	}

	addPlayer(player) {
		this.player = player;
		this.add(player);
	}

	addMass(options) {
		let mass = new GElement(this, options);

		this.add(mass);
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
		let config = this.config;
		if (!config) {
			throw 'No config loaded!';
		}

		if (this.tickTimer) {
			return;
		}

		this.socket.emit('start', {
			screenWidth: this.options.screenWidth,
			screenHeight: this.options.screenHeight
		});

		this.tickTimer = window.setInterval(()=>this.tick(), 1000 / this.config.fps);
	}

	stop() {
		if (this.tickTimer) {
			window.clearInterval(this.tickTimer);
			this.tickTimer = undefined;
		}
	}

	tick() {
		this.canvas.clear();

		this.iterate((object)=>{
			if (object.tick) {
				object.tick();
			}
		});

		this.drawGrid();
		this.drawBorder();

		let elements = [];
		this.iterate((object)=>{
			if (!object.el) {
				return;
			}

			elements.push(object.el);
		});

		if (this.player.target && this.player.target.mark) {
			elements.push(this.player.target.mark);
		}

		if (this.player) {
			let pos = this.player.pos();
			let left = Math.floor(pos.x);
			let top = Math.floor(pos.y);

			elements.push(new fabric.Text(`Position: ${left} x ${top}`, {
				fontSize: 12,
				left: 10,
				top: this.options.screenHeight - 20
			}));
		} else {
			elements.push(new fabric.Text('No player', {
				left: this.options.screenWidth / 2,
				top: this.options.screenHeight / 2
			}));
		}

		this.canvas.add.apply(this.canvas, elements);
		this.canvas.renderAll();
	}

	drawGrid() {
		let size = this.options.gridSize || 50;
		let screenWidth = this.options.screenWidth;
		let screenHeight = this.options.screenHeight;

		let horizontalStep = size;
		let verticalStep = size;

		let playerPos = this.player ? this.player.pos() : {
			x: screenWidth / 2,
			y: screenHeight / 2
		};

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
		let options = this.options;
		let config = this.config;

		let player = this.player ? this.player.pos() : {
			x: options.screenWidth,
			y: options.screenHeight
		};

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
			], lineOptions));
		}

		// Top
		if (player.y <= options.screenHeight/2) {
			borders.push(new fabric.Line([
				options.screenWidth/2 - player.x,
				options.screenHeight/2 - player.y,
				config.width + options.screenWidth/2 - player.x,
				options.screenHeight/2 - player.y
			], lineOptions));
		}

		// Right
		if (config.width - player.x <= options.screenWidth/2) {
			borders.push(new fabric.Line([
				config.width + options.screenWidth/2 - player.x,
				options.screenHeight/2 - player.y,
				config.width + options.screenWidth/2 - player.x,
				config.height + options.screenHeight/2 - player.y
			], lineOptions));
		}

		// Bottom
		if (config.height - player.y <= options.screenHeight/2) {
			borders.push(new fabric.Line([
				config.width + options.screenWidth/2 - player.x,
				config.height + options.screenHeight/2 - player.y,
				options.screenWidth/2 - player.x,
				config.height + options.screenHeight/2 - player.y
			], lineOptions));
		}

		this.canvas.add.apply(this.canvas, borders);
	}

	toScreenCoords(x, y) {
		let halfWidth = this.options.screenWidth / 2;
		let halfHeight = this.options.screenHeight / 2;

		let playerPos = this.player.pos();

		return {
			x: x - playerPos.x + halfWidth,
			y: y - playerPos.y + halfHeight
		};
	}
}

export default Game;
