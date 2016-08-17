import Log from 'common/log';
import Vector from 'common/vector';
import Element from './element';
import Keys from './keys';
import {Particle} from 'common/magic/particle';
import Aim from './aim';
import Target from './target';

let log = new Log('Player');

class ClientPlayer extends Element {
	constructor(game, socket, options) {
		super(game, options);

		this.socket = socket;

		this.addListeners();
	}

	initParams() {
		super.initParams();

		this.game.fillPlayerData(this, this.options);

		this.target = this.pos();
	}

	addListeners() {
		this.socket.on('noEnergy', ()=>{
			log.info('No energy!');
		});

		this.socket.on('fire', (data)=>{
			log.info('fire!', data.damage);
			this.energy = data.energy;
		});

		this.game.addClickListener((point)=>{
			this.socket.emit('setTarget', point);
		}, true);

		this.game.addClickListener((point) => {
			this.target = new Vector(point.x, point.y);
		}, true);

		// UP
		this.game.addKeyListener(Keys.UP, ()=>{
			this._keyUP = true;
			this.setKeyboardTarget();
		}, true);

		this.game.addKeyUpListener(Keys.UP, ()=>{
			this._keyUP = false;
			this.setKeyboardTarget();
		}, true);

		// DOWN
		this.game.addKeyListener(Keys.DOWN, ()=>{
			this._keyDOWN = true;
			this.setKeyboardTarget();
		}, true);

		this.game.addKeyUpListener(Keys.DOWN, ()=>{
			this._keyDOWN = false;
			this.setKeyboardTarget();
		}, true);

		// LEFT
		this.game.addKeyListener(Keys.LEFT, ()=>{
			this._keyLEFT = true;
			this.setKeyboardTarget();
		}, true);

		this.game.addKeyUpListener(Keys.LEFT, ()=>{
			this._keyLEFT = false;
			this.setKeyboardTarget();
		}, true);

		// RIGHT
		this.game.addKeyListener(Keys.RIGHT, ()=>{
			this._keyRIGHT = true;
			this.setKeyboardTarget();
		}, true);

		this.game.addKeyUpListener(Keys.RIGHT, ()=>{
			this._keyRIGHT = false;
			this.setKeyboardTarget();
		}, true);

		// FIRE
		this.game.addKeyListener(Keys.SPACE, (event)=>{
			if (!this.aim) {
				this.launchFire();
			}
		});

		this.game.addKeyUpListener(Keys.SPACE, (event)=>{
			if (this.aim) {
				this.launchFire();
			}
		});

		this.game.addKeyUpListener(Keys.P, (event)=>{
			this.purgeEnergy();
		});
	}

	setKeyboardTarget() {
		let pos = this.pos();

		if (this._keyUP) {
			pos.y -=  Number.MAX_VALUE;
		}
		if (this._keyDOWN) {
			pos.y +=  Number.MAX_VALUE;
		}
		if (this._keyLEFT) {
			pos.x -=  Number.MAX_VALUE;
		}
		if (this._keyRIGHT) {
			pos.x +=  Number.MAX_VALUE;
		}

		this.socket.emit('setTarget', {
			x: pos.x,
			y: pos.y
		});
	}

	launchFire() {
		if (this.aim) {
			// fire!
			this.socket.emit('launchFire', {
				direction: this.game.direction,
				radius: this.aim.radius
			});

			this.aim = undefined;

			return;
		}

		this.socket.emit('aimStart');

		let particle = new Particle({type: 'fire'});

		this.aim = new Aim(this, {color: particle.color});
	}

	purgeEnergy() {
		this.socket.emit('purgeEnergy');
	}

	updateTarget() {
		if (this.mark) {
			this.mark.reset();
			this.mark._position = this.target.copy();
		} else {
			this.mark = new Target(this, {
				start: this.target.copy(),
				color: this.color
			});
		}
	}

	stopMovement() {
		if (this.mark) {
			log.info('stopMovement');
			this.mark = undefined;
		}
	}

	tick() {
		// moves calculated on server

		let radius = this.radius;
		let pos = this.pos();
		pos.sub(this.target);

		if (Math.abs(pos.x) < radius && Math.abs(pos.y) < radius) {
			this.stopMovement();
		} else {
			if (this.mark) {
				this.mark._position = this.target.copy();

				this.mark.tick();
			} else {
				this.updateTarget();
			}
		}

		if (this.aim) {
			this.aim.tick();
		}
	}

	draw(canvas) {
		super.draw(canvas);

		if (this.aim) {
			this.aim.draw(canvas);
		}

		if (this.mark) {
			this.mark.draw(canvas);
		}
	}
}

export default ClientPlayer;
