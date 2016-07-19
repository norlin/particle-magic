import Log from '../common/log';
import Utils from '../common/utils';
import GObject from '../common/object';
import GPlayer from './player';

let log = new Log('Game');

class Game extends GObject {
	constructor(options, io) {
		super(null, options);

		this.config = this.options;

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
		log.debug('A user connected!', socket);

		socket.on('start', (data)=>this.onStart(socket, data));
		socket.on('disconnect', function(){
			log.debug('User disconnected');
		});

		socket.emit('config', this.config);
	}

	onStart(socket, data) {
		let player = new GPlayer(this, {
			screenWidth: data.screenWidth,
			screenHeight: data.screenHeight,
			startX: Utils.randomInRange(0, this.config.width),
			startY: Utils.randomInRange(0, this.config.height)
		});

		this.add(player);

		socket.emit('createPlayer', {
			color: '#0f0',
			startX: player._position.x,
			startY: player._position.y
		});
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

	tick() {
		for (let id in this.objects) {
			let object = this.objects[id];

			if (object.tick) {
				object.tick();
			}
		}
	}
}

export default Game;
