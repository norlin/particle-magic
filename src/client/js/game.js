import Log from 'common/log';
import Vector from 'common/vector';
import Keys from './keys';
import Socket from './connection';
import GameBasics from './gameBasics';
import ClientPlayer from './player';
import Element from './element';

let log = new Log('Game');

class Game extends GameBasics {
	constructor(options) {
		super(options);

		this.targetDirections = [];

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
				startX: data.x,
				startY: data.y,
				radius: data.radius
			};

			playerData = this.fillPlayerData(playerData, data);

			this.addPlayer(new ClientPlayer(this, this.socket, playerData));
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

			this.viewpoint = this.player.pos();

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

	addPlayer(player) {
		this.player = player;
		this.add(player);

		this.viewpoint = this.player.pos();
	}

	addMass(options) {
		let mass = new Element(this, options);

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

			this.canvas.drawText(10, this.screen.y - 40, `Position: ${left} x ${top}`);
			this.canvas.drawText(10, 20, `Health: ${Math.ceil(this.player.health)}/${this.player.maxHealth}`);
			this.canvas.drawText(10, 40, `Energy: ${Math.floor(this.player.energy)}/${this.player.maxEnergy}`);

			if (this.debug) {
				let screenPos = this.toScreenCoords(pos);
				this.canvas.drawLine({
					from: screenPos,
					angle: this.direction,
					distance: 100,
					color: this.player.color,
					solid: true
				});

				this.canvas.drawText(10, this.screen.y - 20, `Direction: ${this.direction * 180 / Math.PI}`);
			}
		} else {
			this.canvas.drawText(this.center.x, this.center.y, 'No player');
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

		this.iterateUI((object)=>this.canvas.add(object));
	}

	drawGrid() {
		super.drawGrid();

		if (this.debug) {
			this.sectors.forEach((sector)=>{
				let sectorPoint = new Vector(sector.x, sector.y);
				let pos = this.toScreenCoords(sectorPoint);
				this.canvas.drawText(pos.x+50, pos.y+50, Math.floor(sector.value));
			});
		}
	}

	onDie() {
		this.stop();
		this.remove(this.player.id);
		this.player = undefined;
		this.tick();
	}
}

export default Game;
