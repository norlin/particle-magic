import Log from 'common/log';
import Utils from 'common/utils';
import Entity from 'common/entity.js';
import Keys from './keys';
import Canvas from './canvas';

let log = new Log('basics');

class GameBasics extends Entity {
	constructor(options) {
		options.screenWidth = options.screenWidth || document.body.offsetWidth;
		options.screenHeight = options.screenHeight || document.body.offsetHeight;

		super(null, options);

		this.objects = {};
		this.objectsUI = {};
		this.sectors = [];

		this.debug = false;

		this.viewpoint = {
			x: 0,
			y: 0
		};

		this.initCanvas();
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
		let x = this.options.screenWidth / 2;
		let y = this.options.screenHeight / 2;

		let point = {
			x: mouse.clientX,
			y: mouse.clientY
		};

		this.direction = Utils.getDirection({x, y}, point);
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

		let pos = this.viewpoint;

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

	drawGrid() {
		let size = this.options.gridSize || 32;
		let screenWidth = this.options.screenWidth;
		let screenHeight = this.options.screenHeight;

		let horizontalStep = size;
		let verticalStep = size;

		let viewpoint = this.viewpoint;

		let init = {x: -0 -viewpoint.x, y: -0 -viewpoint.y};

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
	}

	drawBorder() {
		let options = this.options;
		let config = this.config;

		let viewpoint = this.viewpoint;

		let ctx = this.canvas.ctx;

		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = this.config.borderColor;

		// Left
		if (viewpoint.x <= this.centerX) {
			ctx.moveTo(this.centerX - viewpoint.x, this.centerY - viewpoint.y);
			ctx.lineTo(this.centerX - viewpoint.x, config.height + this.centerY - viewpoint.y);
		}

		// Top
		if (viewpoint.y <= this.centerY) {
			ctx.moveTo(this.centerX - viewpoint.x, this.centerY - viewpoint.y);
			ctx.lineTo(config.width + this.centerX - viewpoint.x, this.centerY - viewpoint.y);
		}

		// Right
		if (config.width - viewpoint.x <= this.centerX) {
			ctx.moveTo(config.width + this.centerX - viewpoint.x, this.centerY - viewpoint.y);
			ctx.lineTo(config.width + this.centerX - viewpoint.x, config.height + this.centerY - viewpoint.y);
		}

		// Bottom
		if (config.height - viewpoint.y <= this.centerY) {
			ctx.moveTo(config.width + this.centerX - viewpoint.x, config.height + this.centerY - viewpoint.y);
			ctx.lineTo(this.centerX - viewpoint.x, config.height + this.centerY - viewpoint.y);
		}

		ctx.stroke();
	}

	toScreenCoords(x, y) {
		let view = this.viewpoint;

		let corrX = view.x - this.centerX;
		if (x < corrX) {
			x += this.config.width;
		} else if (x > this.options.screenWidth + corrX) {
			x -= this.config.width;
		}

		let corrY = view.y - this.centerY;
		if (y < corrY) {
			y += this.config.height;
		} else if (y > this.options.screenHeight + corrY) {
			y -= this.config.height;
		}

		return {
			x: x - view.x + this.centerX,
			y: y - view.y + this.centerY
		};
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

	start() {
		if (this.tickTimer) {
			return;
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
		this.canvas.clear();

		this.iterate((object)=>{
			if (object.tick) {
				object.tick();
			}
		});

		this.drawGrid();
		this.drawBorder();

		this.iterate((object)=>this.canvas.add(object));

		this.iterateUI((object)=>this.canvas.add(object));
	}
}

export default GameBasics;
