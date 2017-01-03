import Log from 'common/log';
import Entity from 'common/entity';
import Element from 'common/element';

let log = new Log('Skill');

let skills = {};

let SkillStates = {
	IDLE: 0,
	START: 1,
	WAIT: 2,
	DONE: 3,
	END: 4,
	ERR: -1
};

class Skill extends Element {
	constructor(caster, options, parent) {
		let pos = caster.pos();

		super(caster.game, Object.assign({start: pos}, options));

		this.invisible = true;

		this.caster = caster;
		this.parent = parent;
		this.state = SkillStates.IDLE;

		this.currentItem = 0;
		this.queue = this.options.queue||[];

		this.active = {};
		this.objects = {};

		this.initParams();
	}

	start() {
		this.state = SkillStates.START;

		if (this.parent) {
			this.parent.add(this);
		} else {
			this.game.add(this);
		}
	}

	next() {
		let next = this.queue[this.currentItem];
		if (!next) {
			this.state = SkillStates.END;
			return;
		}

		this.currentItem += 1;

		this.state = SkillStates.WAIT;
		let skillClass = skills[next.class];
		if (!skillClass || typeof(skillClass) != 'function') {
			this.state = SkillStates.ERR;
			return;
		}

		let skill = new skillClass(this.caster, next.options, this);
		skill.once('end', ()=>{
			this.state = SkillStates.DONE;
		});

		skill.start();
	}

	end() {
		this.emit('end');

		if (Object.keys(this.active).length) {
			return;
		}

		if (this.parent) {
			this.parent.remove(this.id);
		} else {
			this.game.remove(this.id);
		}
	}

	add(skill) {
		let id = skill.id;

		if (this.active[id]) {
			throw 'Skill already added: ' + skill + ' to ' + this;
		}

		this.active[id] = skill;
	}

	remove(id) {
		if (!this.active[id]) {
			throw 'Skill not found: ' + id + ' from ' + this;
		}

		this.active[id] = undefined;
		delete this.active[id];
	}

	addObject(id, object) {
		if (this.objects[id]) {
			throw 'Object already added: ' + id + ' to ' + this;
		}

		this.objects[id] = object;
	}

	removeObject(id) {
		if (!this.objects[id]) {
			throw 'Object not found: ' + id + ' from ' + this;
		}

		this.objects[id] = undefined;
		delete this.objects[id];
	}

	getObject(id) {
		return this.objects[id];
	}

	action() {
		switch (this.state) {
		case SkillStates.START:
			this.state = SkillStates.DONE;
			break;
		case SkillStates.DONE:
			this.next();
			break;
		case SkillStates.END:
		case SkillStates.ERR:
			this.end();
			break;
		}

		if (this.state > SkillStates.IDLE && this.state != SkillStates.ERR) {
			for (let id in this.active) {
				let skill = this.active[id];
				skill.tick();
			}
		}
	}

	tick() {
		this.action();
	}

	toString() {
		return '[object Skill]';
	}

}

Skill.register = function(name, skillClass) {
	skills[name] = skillClass;
};

export {Skill, SkillStates};
