import express from 'express'
import socket from 'socket.io';
import * as HTTP from 'http';
import Log from '../common/log';

const log = new Log('Server');

class Server {
	constructor(_config) {
		let config = this.config = Object.assign({}, _config);

		const app = express();
		const http = HTTP.createServer(app);
		const io = socket(http);

		app.use(express.static('build/client'));

		http.listen({
			host: config.host,
			port: config.port
		}, function () {
			log.info(`Server listening on ${config.host}:${config.port}`);
		});

		io.on('connection', (socket)=>this.connection(socket));
	}

	connection(socket) {
		log.debug('A user connected!', socket.handshake.query.type);

		socket.on('event', function(data){
			log.debug('Event', data);
		});
		socket.on('disconnect', function(){
			log.debug('User disconnected');
		});

		socket.emit('config', this.config);
	}
}

export default Server;
