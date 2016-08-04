import Log from 'common/log';
import Skill from 'common/magic/skill';
import {ParticlesCloud} from 'common/magic/particle';

let log = new Log('Collector');

class Collector extends Skill {
	constructor(parent, options, nested) {
		super(parent, options, nested);

		this.power = 1;
		this.radius = 50;

		this.initCost = 10;
		this.tickCost = 1;
		log.debug('collector create', options);
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
			this.cloud = new ParticlesCloud(this, {
				particle: 'fire',
				count: 0,
				radius: 1,
				startX: this._position.x,
				startY: this._position.y
			});

			this.cloud.once('blast', ()=>{
				console.log('blast!');
				this.end();
				this.cloud = undefined;
				this.object = undefined;
			});

			// handler for other skills
			this.object = this.cloud;

			//this.cloud.setTarget(data.direction);
			this.game.add(this.cloud);

			log.debug('collector start');
			super.start(true);
		} else {
			log.debug('collector no energy for start');
			// TODO: pufff!
			this.done = true;
			this.end();
		}
	}

	end() {
		if (!this.done) {
			return;
		}
		super.end();
	}

	action() {
		if (this.done) {
			return;
		}
		if (!this.parent.drain(this.tickCost)) {
			log.debug('collector blast');
			// TODO: self-blast!
			this.cloud.blast();
			this.done = true;
			this.end();
			return;
		}

		let pos = this.pos();
		let drained = this.game.field.consume(pos.x, pos.y, this.radius, this.power);
		this.cloud.feed(drained);

		if (typeof(this.duration) != 'number') {
			//this.end();
			log.debug('no duration?');
			return;
		}

		if (this.duration > 0) {
			this.duration -= 1;
		} else {
			this.duration = null;
			this.done = true;
			log.debug('collector next');
			this.next();
		}
	}

	toString() {
		return '[object Collector]';
	}
}

Skill.register('Collector', Collector);

export default Collector;
