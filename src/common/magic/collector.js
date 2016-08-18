import Log from 'common/log';
import {Skill, SkillStates} from 'common/magic/skill';
import {ParticlesCloud} from 'common/magic/particle';

let log = new Log('Collector');

class Collector extends Skill {
	constructor(caster, options, parent) {
		super(caster, options, parent);

		this.radius = 50;
		this.power = 100;

		this.initCost = 10;
		this.tickCost = 1;

		this.duration = this.options.duration;

		if (typeof(this.duration) != 'number') {
			throw 'Collector duration must be a number';
		}
	}

	action() {
		switch (this.state) {
		case SkillStates.START:
			if (!this.cloud) {
				this._createCloud();
				break;
			}

			this._collect();
			break;
		case SkillStates.DONE:
		case SkillStates.END:
		case SkillStates.ERR:
			this.end();
			break;
		}
	}

	_createCloud() {
		if (this.caster.drain(this.initCost)) {
			this.cloud = new ParticlesCloud(this, {
				particle: 'fire',
				count: 0,
				radius: 10,
				start: this.pos()
			});

			let objectId = this.options.identifier||this.id;

			this.cloud.once('blast', ()=>{
				this.cloud = undefined;
				this.object = undefined;
				this.parent.removeObject(objectId);
				if (this.state != SkillStates.START) {
					return;
				}
				this.state = SkillStates.ERR;
			});

			// handler for other skills
			this.parent.addObject(objectId, this.cloud);
			this.game.add(this.cloud);
		} else {
			// TODO: pufff!
			this.state = SkillStates.ERR;
		}
	}

	_collect() {
		if (!this.caster.drain(this.tickCost)) {
			// TODO: self-blast!
			this.cloud.blast();
			this.state = SkillStates.ERR;
			return;
		}

		let drained = this.game.field.consume(this.pos(), this.radius, this.power, false, this.cloud.id);
		this.cloud.feed(drained);

		if (this.duration > 0) {
			this.duration -= 1;
		} else {
			this.state = SkillStates.DONE;
		}
	}

	toString() {
		return '[object Collector]';
	}
}

Skill.register('Collector', Collector);

export default Collector;
