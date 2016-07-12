let logs = [];

class Log {
	constructor(module) {
		this.module = module;
	}

	log(...msg) {
		let message = [`[${this.module}/DEBUG]`].concat(msg);
		logs.push(message.join(' '));

		console.log.apply(console, message);
	}
}

export default Log;
