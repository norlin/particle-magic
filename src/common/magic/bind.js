import Utils from 'common/utils';
import Log from 'common/log';
import {Skill, SkillStates} from 'common/magic/skill';

let log = new Log('Bind');

class Bind extends Skill {
	constructor(parent, options, nested) {
		super(parent, options, nested);

		this.actionCost = 10;
		this.tickCost = 1;
	}

	action() {
		switch (this.state) {
		case SkillStates.START:
			if (this.caster.drain(this.actionCost)) {
				this._bind();
				if (this.state == SkillStates.START) {
					this.emit('end');
					this.state = SkillStates.DONE;
				}
			} else {
				this.state = SkillStates.ERR;
			}
			break;
		case SkillStates.DONE:
			this._bind();
			break;
		case SkillStates.ERR:
			this.end();
			break;
		}
	}

	_bind() {
		let target;
		if (this.options.target === 'caster') {
			target = this.caster;
		} else {
			target = this.parent.getObject(this.options.target);
		}

		let object = this.parent.getObject(this.options.object);

		if (!target || !object) {
			this.state = SkillStates.ERR;
			return;
		}

		if (this.caster.drain(this.tickCost)) {
			let pos = target.pos();
			object._position = pos;
		} else {
			this.state = SkillStates.ERR;
			return;
		}
	}

	toString() {
		return '[object Bind]';
	}
}

Skill.register('Bind', Bind);

export default Bind;
