import Log from 'common/log';
import GObject from 'common/object.js';
import Keys from './keys';
import Socket from './connection';
import GPlayer from './player';
import GElement from './element';
import Canvas from './canvas';
import Field from './field';

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

		this.field = new Field(this, {
			width: config.width,
			height: config.height
		});

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

		this.canvas = new Canvas(this, {
			canvas: el,
			width: this.options.screenWidth,
			height: this.options.screenHeight
		});
		this.canvas.setBackgroundColor('#fff');

		document.body.addEventListener('keydown', (e)=>this.onKeyDown(e), true);
		document.body.addEventListener('click', (e)=>this.onClick(e), true);

		window.addEventListener('resize', (e)=>{
			this.options.screenWidth = document.body.offsetWidth;
			this.options.screenHeight = document.body.offsetHeight;

			document.getElementById(this.options.canvas);
			el.width = this.options.screenWidth;
			el.height = this.options.screenHeight;
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
		});
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

		return true;
	}

	remove(id) {
		if (!this.objects[id] || this.player.id == id) {
			return;
		}

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
			x: pos.x + point.x + this.player.radius,
			y: pos.y + point.y + this.player.radius
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

		// separate player & viewpoint
		if (this.player) {
			this.field.draw();
		}

		//this.drawGrid();
		this.drawBorder();

		let elements = [];
		this.iterate((object)=>this.canvas.add(object));

		if (this.player) {
			let pos = this.player.pos();
			let left = Math.floor(pos.x);
			let top = Math.floor(pos.y);

			this.canvas.drawText(10, this.options.screenHeight - 20, `Position: ${left} x ${top}`);
		} else {
			this.canvas.drawText(this.options.screenWidth / 2, this.options.screenHeight / 2, 'No player');
		}
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

		let lines = [];
		let init = {x: -0 -playerPos.x, y: -0 -playerPos.y};

		let ctx = this.canvas.ctx;

		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = this.config.borderColor;

		for (let x = init.x; x < screenWidth; x += horizontalStep) {
			ctx.moveTo(x, 0);
			ctx.lineTo(x, screenHeight);
		}

		for (let y = init.y; y < screenHeight; y += verticalStep) {
			ctx.moveTo(0, y);
			ctx.lineTo(screenWidth, y);
		}

		ctx.stroke();

		this.canvas.add.apply(this.canvas, lines);
	}

	drawBorder() {
		let options = this.options;
		let config = this.config;

		let player = this.player ? this.player.pos() : {
			x: options.screenWidth,
			y: options.screenHeight
		};

		let ctx = this.canvas.ctx;

		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = this.config.borderColor;

		// Left
		if (player.x <= options.screenWidth/2) {
			ctx.moveTo(options.screenWidth/2 - player.x, options.screenHeight/2 - player.y);
			ctx.lineTo(options.screenWidth/2 - player.x, config.height + options.screenHeight/2 - player.y);
		}

		// Top
		if (player.y <= options.screenHeight/2) {
			ctx.moveTo(options.screenWidth/2 - player.x, options.screenHeight/2 - player.y);
			ctx.lineTo(config.width + options.screenWidth/2 - player.x, options.screenHeight/2 - player.y);
		}

		// Right
		if (config.width - player.x <= options.screenWidth/2) {
			ctx.moveTo(config.width + options.screenWidth/2 - player.x, options.screenHeight/2 - player.y);
			ctx.lineTo(config.width + options.screenWidth/2 - player.x, config.height + options.screenHeight/2 - player.y);
		}

		// Bottom
		if (config.height - player.y <= options.screenHeight/2) {
			ctx.moveTo(config.width + options.screenWidth/2 - player.x, config.height + options.screenHeight/2 - player.y);
			ctx.lineTo(options.screenWidth/2 - player.x, config.height + options.screenHeight/2 - player.y);
		}

		ctx.stroke();
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
