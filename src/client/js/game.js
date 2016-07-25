import Log from 'common/log';
import GObject from 'common/object.js';
import Keys from './keys';
import Socket from './connection';
import GPlayer from './player';
import GElement from './element';
import Canvas from './canvas';

let log = new Log('Game');

class Game extends GObject {
	constructor(options) {
		options.screenWidth = options.screenWidth || document.body.offsetWidth;
		options.screenHeight = options.screenHeight || document.body.offsetHeight;

		super(null, options);

		this.viewpoint = {
			x: 0,
			y: 0
		};

		this.targetDirections = [];
		this.objects = {};
		this.objectsUI = {};
		this.sectors = [];
		this.initCanvas();

		this.debug = false;

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

		this.addKeyListener(Keys.TAB, () => {
			this.debug = !this.debug;
		}, true);

		this.start();
	}

	initCanvas() {
		let el = document.getElementById(this.options.canvas);

		if (!el) {
			throw 'No canvas found!';
		}

		this.canvas = new Canvas(this, {
			canvas: el,
			width: this.options.screenWidth,
			height: this.options.screenHeight,
			background: '#fff'
		});

		document.body.addEventListener('keydown', (e)=>this.onKeyDown(e), true);
		document.body.addEventListener('keyup', (e)=>this.onKeyUp(e), true);
		document.body.addEventListener('click', (e)=>this.onClick(e), true);
		document.body.addEventListener('mousemove', (e)=>this.onMove(e), true);

		window.addEventListener('resize', ()=>this.updateScreen());
		this.updateScreen();

		this.direction = 0;
	}

	updateScreen() {
		this.options.screenWidth = document.body.offsetWidth;
		this.options.screenHeight = document.body.offsetHeight;

		this.centerX = this.options.screenWidth / 2;
		this.centerY = this.options.screenHeight / 2;

		this.canvas.updateSize(this.options.screenWidth, this.options.screenHeight);
	}

	fillPlayerData(player, data) {
		let fields = [
			'fireCost',
			'firePower',
			'fireDistance',
			'maxHealth',
			'health',
			'maxEnergy',
			'energy',
			'maxPower',
			'power',
			'basicPower',
			'hits'
		];

		fields.forEach((field)=>{
			player[field] = data[field];
		});

		return player;
	}

	connect() {
		this.connection = Socket();
		this.socket = this.connection.socket;
		this.socket.on('config', (config)=>this.init(config));

		this.socket.on('createPlayer', (data)=>{
			if (this.player) {
				return;
			}

			let playerData = {
				id: data.id,
				name: 'test',
				color: data.color,
				startX: data.x,
				startY: data.y,
				radius: data.radius
			};

			playerData = this.fillPlayerData(playerData, data);

			this.addPlayer(new GPlayer(this, this.socket, playerData));
		});

		this.socket.on('died', ()=>{
			this.onDie();
		});

		this.socket.on('update', (data)=>{
			this.player.target.x = data.targetX;
			this.player.target.y = data.targetY;
			this.player._position.x = data.x;
			this.player._position.y = data.y;

			this.fillPlayerData(this.player, data);

			this.viewpoint.x = this.player._position.x;
			this.viewpoint.y = this.player._position.y;

			let visible = data.visible;

			this.iterate((object)=>{
				let id = object.id;

				if (id == this.player.id) {
					// skip player object
					return;
				}

				if (!visible[id] || !visible[id].x) {
					this.remove(id);
				}
			});

			this.targetDirections = [];

			for (let id in visible) {
				let newObject = visible[id];
				let existing = this.objects[id];

				if (newObject.direction) {
					this.targetDirections.push(newObject);
					continue;
				}

				if (existing) {
					existing._position.x = newObject.x;
					existing._position.y = newObject.y;
					existing.radius = newObject.radius;
					existing.color = newObject.color;
					existing.hits = newObject.hits;
					continue;
				}

				this.addMass({
					id: id,
					startX: newObject.x,
					startY: newObject.y,
					radius: newObject.radius,
					color: newObject.color,
					hits: newObject.hits
				});
			}

			this.sectors = data.sectors||[];
		});
	}

	iterate(method, objects) {
		objects = objects || this.objects;

		for (let id in objects) {
			method(objects[id]);
		}
	}

	iterateUI(method) {
		return this.iterate(method, this.objectsUI);
	}

	add(object, ui) {
		if (!object) {
			throw "What should I add?";
		}

		let objects = ui ? this.objectsUI : this.objects;

		if (objects[object.id]) {
			log.debug('object already in the game');
			return false;
		}

		objects[object.id] = object;

		return true;
	}

	remove(id, ui) {
		let objects = ui ? 'objectsUI' : 'objects';

		if (!this[objects][id]) {
			return;
		}

		this[objects][id] = undefined;
		delete this[objects][id];
	}

	addPlayer(player) {
		this.player = player;
		this.add(player);

		this.viewpoint.x = this.player._position.x;
		this.viewpoint.y = this.player._position.y;
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

	onKeyUp(event) {
		let code = event.which;

		this.emit(`keyup.${code}.global`);

		if (this.tickTimer) {
			this.emit(`keyup.${code}`);
		}
	}

	onMove(mouse) {
		let centerX = this.options.screenWidth / 2;
		let centerY = this.options.screenHeight / 2;

		let point = {
			x: mouse.clientX,
			y: mouse.clientY
		};

		let directionX = point.x - centerX;
		let directionY = point.y - centerY;

		this.direction = Math.atan2(directionX, directionY);
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

	addKeyUpListener(key, handler, global) {
		let isGlobal = global ? '.global' : '';
		this.on(`keyup.${key}${isGlobal}`, handler);
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

		this.tickTimer = window.setInterval(()=>this.tick(), 1000 / this.config.fps);

		if (this.player) {
			return;
		}

		this.socket.emit('start', {
			screenWidth: this.options.screenWidth,
			screenHeight: this.options.screenHeight
		});
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
		/*if (this.player) {
			this.field.draw();
		}*/

		this.drawGrid();
		this.drawBorder();

		let elements = [];
		this.iterate((object)=>this.canvas.add(object));

		if (this.player) {
			let pos = this.player.pos();
			let left = Math.floor(pos.x);
			let top = Math.floor(pos.y);

			this.canvas.drawText(10, this.options.screenHeight - 40, `Position: ${left} x ${top}`);
			this.canvas.drawText(10, 20, `Health: ${Math.ceil(this.player.health)}/${this.player.maxHealth}`);
			this.canvas.drawText(10, 40, `Energy: ${Math.floor(this.player.energy)}/${this.player.maxEnergy}`);
		} else {
			this.canvas.drawText(this.options.screenWidth / 2, this.options.screenHeight / 2, 'No player');
		}

		let x = this.centerX;
		let y = this.centerY;

		let rad45 = Math.PI/4;
		let rad90 = Math.PI/2;
		let rad135 = Math.PI - rad45;

		let targetWidth = 50;

		this.targetDirections.forEach((target)=>{
			let d = target.direction;
			let sector = d > -rad45 && d < rad45 ? 1 : (d >= rad45 && d < rad135 ? 2 : (d >= rad135 || d < -rad135 ? 3 : 4));

			let angle;
			let side;
			let targetW;
			let targetH;
			switch (sector) {
			case 1:
				angle = target.direction;
				side = this.centerY;
				targetW = targetWidth;
				targetH = 0;
				break;
			case 2:
				angle = target.direction - rad90;
				side = this.centerX;
				targetW = 0;
				targetH = targetWidth;
				break;
			case 3:
				if (target.direction > 0) {
					angle = target.direction - Math.PI;
				} else {
					angle = target.direction + Math.PI;
				}
				side = this.centerY;
				targetW = targetWidth;
				targetH = 0;
				break;
			case 4:
				angle = target.direction + rad90;
				side = this.centerX;
				targetW = 0;
				targetH = targetWidth;
				break;
			}
			let length = side / Math.cos(angle);

			let x2 = x + Math.sin(target.direction) * length;
			let y2 = y + Math.cos(target.direction) * length;

			this.canvas.drawLine({
				x: x2-targetW/2,
				y: y2-targetH/2,
				x2: x2+targetW/2,
				y2: y2+targetH/2,
				solid: true,
				color: target.color,
				width: 5
			});

			if (this.debug) {
				let x2 = x + Math.sin(target.direction) * 200;
				let y2 = y + Math.cos(target.direction) * 200;
				let deg = d * 180 / Math.PI;
				this.canvas.drawText(x2, y2, 'deg: '+deg);
				this.canvas.drawLine(x, y, target.direction, 1000, target.color);
			}
		});

		this.iterateUI((object)=>this.canvas.add(object));
	}

	drawGrid() {
		let size = this.options.gridSize || 32;
		let screenWidth = this.options.screenWidth;
		let screenHeight = this.options.screenHeight;

		let horizontalStep = size;
		let verticalStep = size;

		let playerPos = this.player ? this.player.pos() : {
			x: this.centerX,
			y: this.centerY
		};

		let init = {x: -0 -playerPos.x, y: -0 -playerPos.y};

		let ctx = this.canvas.ctx;

		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = this.config.gridColor;

		for (let x = init.x; x < screenWidth; x += horizontalStep) {
			ctx.moveTo(x, 0);
			ctx.lineTo(x, screenHeight);
		}

		for (let y = init.y; y < screenHeight; y += verticalStep) {
			ctx.moveTo(0, y);
			ctx.lineTo(screenWidth, y);
		}

		ctx.stroke();

		if (this.debug) {
			this.sectors.forEach((sector)=>{
				let pos = this.toScreenCoords(sector.x, sector.y);
				this.canvas.drawText(pos.x+50, pos.y+50, Math.floor(sector.value));
			});
		}
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
		if (player.x <= this.centerX) {
			ctx.moveTo(this.centerX - player.x, this.centerY - player.y);
			ctx.lineTo(this.centerX - player.x, config.height + this.centerY - player.y);
		}

		// Top
		if (player.y <= this.centerY) {
			ctx.moveTo(this.centerX - player.x, this.centerY - player.y);
			ctx.lineTo(config.width + this.centerX - player.x, this.centerY - player.y);
		}

		// Right
		if (config.width - player.x <= this.centerX) {
			ctx.moveTo(config.width + this.centerX - player.x, this.centerY - player.y);
			ctx.lineTo(config.width + this.centerX - player.x, config.height + this.centerY - player.y);
		}

		// Bottom
		if (config.height - player.y <= this.centerY) {
			ctx.moveTo(config.width + this.centerX - player.x, config.height + this.centerY - player.y);
			ctx.lineTo(this.centerX - player.x, config.height + this.centerY - player.y);
		}

		ctx.stroke();
	}

	toScreenCoords(x, y) {
		let view = this.viewpoint;

		return {
			x: x - view.x + this.centerX,
			y: y - view.y + this.centerY
		};
	}

	onDie() {
		this.stop();
		this.remove(this.player.id);
		this.player = undefined;
		this.tick();
	}
}

export default Game;
