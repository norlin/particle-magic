import express from 'express'
import socket from 'socket.io';
import * as HTTP from 'http';
import Log from '../common/log';

const log = new Log('Server');
const port = 3000;

class Server {
	constructor() {
		const app = express();
		const http = HTTP.createServer(app);
		const io = socket(http);

		app.use(express.static('build/client'));

		http.listen(port, function () {
			log.info(`Server listening on port ${port}`);
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
	}
}

export default Server;
