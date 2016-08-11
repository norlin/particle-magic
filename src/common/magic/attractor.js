import Utils from 'common/utils';
import Log from 'common/log';
import {Skill, SkillStates} from 'common/magic/skill';

let log = new Log('Attractor');

class Attractor extends Skill {
	constructor(parent, options, nested) {
		super(parent, options, nested);

		this.power = 1;
		this.initCost = 10;
		this.actionCost = 10;
	}

	action() {
		switch (this.state) {
		case SkillStates.START:
			this._attract();
			break;
		case SkillStates.DONE:
		case SkillStates.END:
		case SkillStates.ERR:
			this.end();
			break;
		}
	}

	_attract() {
		let target = this.parent.getObject(this.options.target);
		if (!target) {
			log.debug('cant find target skill');
			this.state = SkillStates.ERR;
			return;
		}

		if (this.caster.drain(this.actionCost)) {
			let direction = this.pos().directionTo(target.pos());
			target.setTarget(direction);
			this.state = SkillStates.DONE;
		} else {
			log.debug('no energy to push');
			this.state = SkillStates.ERR;
		}
	}

	toString() {
		return '[object Attractor]';
	}
}

Skill.register('Attractor', Attractor);

export default Attractor;
