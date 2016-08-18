import Log from 'common/log';
import Utils from 'common/utils';
import Vector from 'common/vector';
import Keys from './keys';
import Socket from './connection';
import GameBasics from './gameBasics';
import ClientPlayer from './player';
import Element from './element';
import Field from './field';
import {ClientParticlesCloud} from './particle';

let log = new Log('Game');

class Game extends GameBasics {
	constructor(options) {
		super(options);

		this.targetDirections = [];

		this.field = new Field(this, {});
		this.add(this.field);

		this.connect();
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
				start: new Vector(data.x, data.y),
				radius: data.radius
			};

			playerData = this.fillPlayerData(playerData, data);

			this.addPlayer(new ClientPlayer(this, this.socket, playerData));
		});

		this.socket.on('died', ()=>{
			this.onDie();
		});

		this.socket.on('update', (data)=>{
			this.player.target = new Vector(data.targetX, data.targetY);
			this.player._position = new Vector(data.x, data.y);

			this.fillPlayerData(this.player, data);

			this.viewpoint = this.player.pos();

			let visible = data.visible;

			this.iterate((object)=>{
				if (object._client) {
					// skip client-only object
					return;
				}

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
					this.updateVisible(existing, newObject);
					continue;
				}

				this.addVisible(newObject);
			}

			this.field.update(data);
		});
	}

	addVisible(object) {
		switch (object.type) {
		case 'player':
		case 'object':
			let mass = new Element(this, {
				id: object.id,
				start: new Vector(object.x, object.y),
				radius: object.data.radius,
				color: object.data.color,
				hits: object.hits
			});

			this.add(mass);
			break;
		case 'cloud':
			let cloud = new ClientParticlesCloud({game: this}, {
				id: object.id,
				start: new Vector(object.x, object.y),
				radius: object.data.radius,
				particle: object.data.particle
			});

			this.add(cloud);
			break;
		}
	}

	updateVisible(existing, object) {
		switch (existing.type) {
		case 'player':
		case 'object':
			existing._position = new Vector(object.x, object.y);
			existing.radius = object.data.radius;
			existing.color = object.data.color;
			existing.hits = object.hits;
			break;
		case 'cloud':
			existing._position = new Vector(object.x, object.y);
			existing.radius = object.data.radius;
			existing.count = object.data.count;
			existing.target = object.data.target;
			existing.update();
			break;
		}
	}

	addPlayer(player) {
		this.player = player;
		this.add(player);

		this.viewpoint = this.player.pos();
	}

	start() {
		let config = this.config;
		if (!config) {
			throw 'No config loaded!';
		}

		if (this.tickTimer) {
			return;
		}

		super.start();

		if (this.player) {
			return;
		}

		this.socket.emit('start', {
			screenWidth: this.screen.x,
			screenHeight: this.screen.y
		});
	}

	tick() {
		super.tick();

		if (this.player) {
			let pos = this.player.pos();
			let left = Math.floor(pos.x);
			let top = Math.floor(pos.y);

			this.canvas.drawText(new Vector(10, this.screen.y - 40), `Position: ${left} x ${top}`);
			this.canvas.drawText(new Vector(10, 20), `Health: ${Math.ceil(this.player.health)}/${this.player.maxHealth}`);
			this.canvas.drawText(new Vector(10, 40), `Energy: ${Math.floor(this.player.energy)}/${this.player.maxEnergy}`);

			if (this.debug) {
				let screenPos = this.toScreenCoords(pos);
				this.canvas.drawLine({
					from: screenPos,
					angle: this.direction,
					distance: 100,
					color: this.player.color,
					solid: true
				});

				this.canvas.drawText(new Vector(10, this.screen.y - 20), `Direction: ${this.direction * 180 / Math.PI}`);
			}
		} else {
			this.canvas.drawText(this.center, 'No player');
		}

		let rad45 = Math.PI/4;
		let rad90 = Math.PI/2;
		let rad135 = Math.PI - rad45;

		let targetWidth = 50;
		let targetOffset = 5;

		this.targetDirections.forEach((target)=>{
			let d = target.direction;
			let sector = d > -rad45 && d < rad45 ? 1 : (d >= rad45 && d < rad135 ? 2 : (d >= rad135 || d < -rad135 ? 3 : 4));

			let side;
			let length;

			let targetSize;

			switch (sector) {
			case 1: // right
				side = this.center.x - targetOffset;
				length = (side / Math.cos(d));
				targetSize = new Vector(0, targetWidth);
				break;
			case 2: // bottom
				side = this.center.y - targetOffset;
				length = (side / Math.sin(d));
				targetSize = new Vector(targetWidth, 0);
				break;
			case 3: // left
				side = this.center.x - targetOffset;
				length = (-side / Math.cos(d));
				targetSize = new Vector(0, targetWidth);
				break;
			case 4: // top
				side = this.center.y - targetOffset;
				length = (-side / Math.sin(d));
				targetSize = new Vector(targetWidth, 0);
				break;
			}

			let point = this.center.copy().move(d, length);
			targetSize.divBy(2);

			this.canvas.drawLine({
				from: point.copy().sub(targetSize),
				to: point.copy().add(targetSize),
				solid: true,
				color: target.color,
				width: 5
			});
		});
	}

	drawGrid() {
		super.drawGrid();
	}

	onDie() {
		this.stop();
		this.remove(this.player.id);
		this.player = undefined;
		this.tick();
	}
}

export default Game;
