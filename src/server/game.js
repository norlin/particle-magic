import Log from 'common/log';
import Utils from 'common/utils';
import GObject from 'common/object';
import GPlayer from './player';
import Field from './field';
import QuadTree from 'simple-quadtree';

let log = new Log('Game');

class Game extends GObject {
	constructor(options, io) {
		super(null, options);

		this.config = this.options;
		this.sockets = {};
		this.players = {};

		this.objects = {};

		this.field = new Field(this, {
			width: this.config.width,
			height: this.config.height
		});

		this.add(this.field);

		this.addListeners(io);
		this.start();
	}

	add(object) {
		if (!object) {
			log.error('What I should add?');
			return false;
		}

		if (this.objects[object.id]) {
			return false;
		}

		this.objects[object.id] = object;

		return true;
	}

	remove(id) {
		if (!id) {
			log.error('What I should remove?');
			return false;
		}

		if (!this.objects[id]) {
			return false;
		}

		if (this.players[id]) {
			return this.removePlayer(id);
		}

		this.objects[id] = undefined;
		delete this.objects[id];

		return true;
	}

	removePlayer(id) {
		let socket = this.sockets[id];
		if (socket) {
			socket.emit('died');
			this.sockets[id] = undefined;
			delete this.sockets[id];
		}

		let player = this.objects[id];

		if (!player) {
			log.error('No player found with id', id);
			return false;
		}

		this.players[id] = undefined;
		delete this.players[id];

		if (!this.objects[id]) {
			return false;
		}
		this.objects[id] = undefined;
		delete this.objects[id];
	}

	addListeners(io) {
		io.on('connection', (socket)=>this.connection(socket));
	}

	connection(socket) {
		log.debug('A user connected!', socket.id);

		this.sockets[socket.id] = socket;

		socket.on('start', (data)=>this.onStart(socket, data));
		socket.on('disconnect', ()=>{
			log.debug('User disconnected', socket.id);

			this.removePlayer(socket.id);
		});

		socket.emit('config', this.config);
	}

	onStart(socket, data) {
		let basicPower = 0.1;

		let player = new GPlayer(this, socket, {
			id: socket.id,
			screenWidth: data.screenWidth,
			screenHeight: data.screenHeight,
			startX: 100, // Utils.randomInRange(0, this.config.width),
			startY: 100, //Utils.randomInRange(0, this.config.height),
			radius: 20,

			fireCost: 100,
			firePower: 100,
			fireDistance: 500,
			maxHealth: 100,
			health: 100,
			maxEnergy: 500,
			energy: 0,
			basicPower: basicPower,
			maxPower: basicPower * 100,
			power: basicPower
		});

		this.players[player.id] = player;

		this.add(player);
	}

	start() {
		if (this.tickTimer) {
			return;
		}

		this.tickTimer = setInterval(()=>this.tick(), 1000 / this.config.fps);
	}

	stop() {
		if (this.tickTimer) {
			clearInterval(this.tickTimer);
			this.tickTimer = undefined;
		}
	}

	getVisibleObjects(id, area) {
		var objects = {};

		this.iterate((object)=>{
			if (object.id == id) {
				// skip current player
				return;
			}

			let pos = object.pos && object.pos();

			if (!pos) {
				return;
			}

			let radius = object.radius || 0;

			if (pos.x + radius > area.left &&
				pos.x - radius < area.right &&
				pos.y + radius > area.top &&
				pos.y - radius < area.bottom) {

				objects[object.id] = {
					id: object.id,
					x: pos.x,
					y: pos.y,
					radius: radius,
					color: object.color
				};
			}
		});

		return objects;
	}

	iterate(method) {
		for (let id in this.objects) {
			method(this.objects[id]);
		}
	}

	tick() {
		this.iterate((object)=>{
			if (object.tick) {
				object.tick();
			}
		});

		this.iterate((object)=>{
			if (object.updateClient) {
				object.updateClient();
			}
		});
	}
}

export default Game;
