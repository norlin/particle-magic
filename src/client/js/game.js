import Log from 'common/log';
import Keys from './keys';
import Socket from './connection';
import GameBasics from './gameBasics';
import GPlayer from './player';
import GElement from './element';

let log = new Log('Game');

class Game extends GameBasics {
	constructor(options) {
		super(options);

		this.targetDirections = [];
		this.objects = {};
		this.objectsUI = {};
		this.sectors = [];

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

	onDie() {
		this.stop();
		this.remove(this.player.id);
		this.player = undefined;
		this.tick();
	}
}

export default Game;
