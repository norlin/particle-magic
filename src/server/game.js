import Log from 'common/log';
import Utils from 'common/utils';
import Entity from 'common/entity';
import Player from './player';
import Field from './field';
import QuadTree from 'simple-quadtree';
import Collisions from 'common/collisions';

let log = new Log('Game');

class Game extends Entity {
	constructor(options, io) {
		super(null, options);

		this.config = this.options;
		this.sockets = {};
		this.players = {};

		this.objects = {};

		let width = this.config.width;
		let height = this.config.height;

		this.tree = QuadTree(0, 0, width, height);

		this.field = new Field(this, {
			width: width,
			height: height
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
			log.error('Already added!');
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
			this.players[id].die();
			this.players[id] = undefined;
			delete this.players[id];
		}

		this.objects[id] = undefined;
		delete this.objects[id];

		return true;
	}

	disconnectPlayer(id) {
		let socket = this.sockets[id];
		if (socket) {
			// TODO: unify with player.die()
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

			this.disconnectPlayer(socket.id);
		});

		socket.emit('config', this.config);
	}

	onStart(socket, data) {
		if (this.players[socket.id]) {
			return;
		}

		let basicPower = 0.1;

		let player = new Player(this, socket, {
			id: socket.id,
			screenWidth: data.screenWidth,
			screenHeight: data.screenHeight,
			startX: Utils.randomInRange(0, this.config.width),
			startY: Utils.randomInRange(0, this.config.height),
			radius: 20,

			fireCost: 50,
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

		let player = this.players[id];
		let currentPos;
		if (player) {
			currentPos = player.pos();
		}

		if (area.left < 0) {
			area.left = this.config.width + area.left;
		}

		if (area.top < 0) {
			area.top = this.config.height + area.top;
		}

		if (area.right > this.config.width) {
			area.right = area.right - this.config.width;
		}

		if (area.bottom > this.config.height) {
			area.bottom = area.bottom - this.config.height;
		}

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

			let inArea = {
				x: false,
				y: false
			};

			let left = pos.x + radius;
			let right = pos.x - radius;
			let top = pos.y + radius;
			let bottom = pos.y - radius;

			if (area.left > area.right) {
				inArea.x = ((left > area.left) && (right < this.config.width)) || ((left > 0) && (right < area.right));
			} else {
				inArea.x = (left > area.left) && (right < area.right);
			}
			if (area.top > area.bottom) {
				inArea.y = ((top > area.top) && (bottom < this.config.height)) || ((top > 0) && (bottom < area.bottom));
			} else {
				inArea.y = (top > area.top) && (bottom < area.bottom);
			}

			if (inArea.x && inArea.y) {
				objects[object.id] = {
					id: object.id,
					x: pos.x,
					y: pos.y,
					radius: radius,
					color: object.color
				};

				if (object.hits) {
					objects[object.id].hits = object.hits;
				}
			} else if (object.type == 'player' && currentPos) {
				let directionX = pos.x - currentPos.x;
				let directionY = pos.y - currentPos.y;

				let direction = Math.atan2(directionX, directionY);

				objects[object.id] = {
					id: object.id,
					direction: direction,
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

	tickCollision(target, collisions) {
		if (target.collision) {
			collisions.forEach((id)=>{
				target.collision(this.objects[id]);
			});
		}
	}

	tick() {
		this.tree.clear();

		// move objects
		this.iterate((object)=>{
			if (object._needRemove) {
				this.remove(object.id);
				return;
			}

			if (object.tick) {
				object.tick();
			}

			if (object._position) {
				this.tree.put(object.area());
			}
		});

		// check collisions
		this.iterate((object)=>{
			if (!object._position) {
				return;
			}

			let otherObjects = this.tree.get(object.area());

			if (otherObjects.length > 1) {
				let collisions = Collisions.findCollisions(object, otherObjects);

				if (collisions && collisions.length) {
					this.tickCollision(object, collisions);
				}
			}
		});

		// update clients
		this.iterate((object)=>{
			if (object.updateClient) {
				object.updateClient();
			}
		});
	}
}

export default Game;
