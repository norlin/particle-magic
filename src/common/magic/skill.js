import Log from 'common/log';
import Entity from 'common/entity';
import Element from 'common/element';

let log = new Log('Skill');

let skills = {};

class Skill extends Element {
	constructor(parent, options, nested) {
		super(parent.game, options);

		this.invisible = true;

		this.parent = parent;
		this.nested = nested;

		this.queue = this.options.queue || [];

		this.active = null;
		log.debug('skill create');
	}

	init() {
		this.done = false;
		this.active = {};
		this.current = -1;
	}

	start(inited) {
		if (!inited) {
			this.init();
		}

		if (!this.nested) {
			this.game.add(this);
		}
	}

	next() {
		this.current += 1;
		let action = this.queue[this.current];

		if (!action) {
			log.debug('skill no next action', this.toString());
			this.end();
			return;
		}

		let actionClass = skills[action.class];
		let actionInstance = new actionClass(this.parent, action.options, true);

		this.active[actionInstance.id] = actionInstance;

		// TODO: rewrite it to promises?
		actionInstance.once('next', ()=>{
			this.next();
		});

		actionInstance.once('end', ()=>{
			this.active[actionInstance.id] = undefined;
			delete this.active[actionInstance.id];
		});

		actionInstance.start();
	}

	end() {
		if (!this.done) {
			return;
		}

		if (this.active === null) {
			log.debug('end, already ended');
			return;
		}

		if (this.active && (Object.keys(this.active).length !== 0)) {
			// wait for nested skills
			log.debug('end, waiting for nested skills');
			return;
		}

		this.active = null;

		log.debug('emit end', this.toString());
		this.emit('end');

		if (!this.nested) {
			log.debug('end, remove', this.toString());
			this.game.remove(this.id);
		}
	}

	action() {
		if (this.done) {
			return;
		}

		this.next();
		this.done = true;
	}

	tick() {
		if (this.active === null) {
			return;
		}

		this.action();

		for (let name in this.active) {
			let action = this.active[name];
			action.tick();
		}

		this.end();
	}

	toString() {
		return '[object Skill]';
	}
}

Skill.register = function(name, skillClass) {
	skills[name] = skillClass;
};

export default Skill;
