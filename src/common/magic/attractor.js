import Log from 'common/log';
import Skill from 'common/magic/skill';

let log = new Log('Attractor');

class Attractor extends Skill {
	constructor(parent, options, nested) {
		super(parent, options, nested);

		this.power = 1;

		this.initCost = 10;
	}

	init() {
		super.init();
		this.duration = this.options.duration;

		let parent = this.parent.pos();

		this._position = {
			x: this.options.startX || parent.x,
			y: this.options.startY || parent.y
		};
	}

	start() {
		this.init();

		if (this.parent.drain(this.initCost)) {
			// TODO: find how to get required skill to attract
		} else {
			log.debug('attractor no energy for start');
			// TODO: pufff!
			this.done = true;
			this.end();
		}
	}

	action() {

	}

	toString() {
		return '[object Attractor]';
	}
}

Skill.register('Attractor', Attractor);

export default Attractor;
