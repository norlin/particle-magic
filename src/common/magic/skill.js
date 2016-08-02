import Entity from 'common/object';
import Action from './action';

// TODO: allow to include skill into queue
class Skill extends Entity {
	constructor(game, options) {
		super(game, options);

		this.queue = [];
		this.active = null;
	}

	start() {
		this.active = {};
		this.current = 0;

		this.next();
	}

	next() {
		let action = this.queue[this.current];

		if (!action) {
			this.end();
			return;
		}

		let actionInstance = new action.class(this.game, action.options);

		this.active[actionInstance.id] = actionInstance;

		// TODO: rewrite it to promises?
		// TODO: make possible to launch multiple actions at once?
		actionInstance.on('next', ()=>{
			actionInstance.off('next');
			this.current += 1;
			this.next();
		});

		actionInstance.on('end', ()=>{
			actionInstance.off('end');
			this.active[actionInstance.id] = undefined;
			delete this.active[actionInstance.id];
		});
	}

	end() {
		// TODO: check if all actions executed
		this.active = null;
	}

	tick() {
		if (this.active === null) {
			return;
		}

		for (let name in this.active) {
			let action = this.active[name];
			action.tick();
		}
	}
}

export default Skill;
