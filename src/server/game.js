import Log from '../common/log';
import Utils from '../common/utils';
import GObject from '../common/object';
import GPlayer from './player';
import QuadTree from 'simple-quadtree';

let log = new Log('Game');

class Game extends GObject {
	constructor(options, io) {
		super(null, options);

		this.config = this.options;

		this.tree = QuadTree(0, 0, this.config.width, this.config.height);

		this.objects = {};

		this.addListeners(io);
		this.start();
	}

	add(object) {
		if (!object) {
			throw "What should I add?";
		}

		if (this.objects[object.id]) {
			return false;
		}

		this.objects[object.id] = object;

		return true;
	}

	addListeners(io) {
		io.on('connection', (socket)=>this.connection(socket));
	}

	connection(socket) {
		log.debug('A user connected!');

		socket.on('start', (data)=>this.onStart(socket, data));
		socket.on('disconnect', function(){
			log.debug('User disconnected');
			// TODO: remove user from the game
		});

		socket.emit('config', this.config);
	}

	onStart(socket, data) {
		let player = new GPlayer(this, socket, {
			screenWidth: data.screenWidth,
			screenHeight: data.screenHeight,
			startX: 100, // Utils.randomInRange(0, this.config.width),
			startY: 100, //Utils.randomInRange(0, this.config.height),
			radius: 20
		});

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

	getVisibleObjects(id, pos, screen) {
		var objects = {};

		let halfWidth = screen.width / 2;
		let halfHeight = screen.height / 2;

		let boundaries = {
			left: pos.x - halfWidth - 20,
			right: pos.x + halfWidth + 20,
			top: pos.y - halfHeight - 20,
			bottom: pos.y + halfHeight + 20
		};

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

			if (pos.x + radius > boundaries.left &&
				pos.x - radius < boundaries.right &&
				pos.y + radius > boundaries.top &&
				pos.y - radius < boundaries.bottom) {

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
