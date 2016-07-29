import Log from 'common/log';
import GElement from './element';
import Keys from './keys';
import {Particle} from 'common/magic/particle';
import Aim from './aim';

let log = new Log('Player');

class GPlayer extends GElement {
	constructor(game, socket, options) {
		super(game, options);

		this.socket = socket;

		this.addListeners();
	}

	initParams() {
		super.initParams();

		this.game.fillPlayerData(this, this.options);

		this.target = {
			x: this._position.x,
			y: this._position.y
		};
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
			if (this.target.mark) {
				this.target.mark = undefined;
			}

			this.target = {
				x: point.x,
				y: point.y
			};

			let markPos = this.game.toScreenCoords(this.target.x, this.target.y);

			this.target.mark = {
				radius: 2,
				color: this.options.color,
				x: markPos.x,
				y: markPos.y
			};
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
	}

	setKeyboardTarget() {
		let x = this._position.x;
		let y = this._position.y;

		if (this._keyUP) {
			y -=  Number.MAX_VALUE;
		}
		if (this._keyDOWN) {
			y +=  Number.MAX_VALUE;
		}
		if (this._keyLEFT) {
			x -=  Number.MAX_VALUE;
		}
		if (this._keyRIGHT) {
			x +=  Number.MAX_VALUE;
		}

		this.socket.emit('setTarget', {
			x: x,
			y: y
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

	stopMovement() {
		log.info('stopMovement');

		if (this.target.mark) {
			this.target.mark = undefined;
		}
	}

	tick() {
		// moves calculated on server

		let pos = this.pos();
		if (Math.abs(pos.x - this.target.x) < 1 && Math.abs(pos.y - this.target.y) < 1) {
			this.stopMovement();
		} else {
			if (this.target.mark) {
				let markPos = this.game.toScreenCoords(this.target.x, this.target.y);

				this.target.mark.x = markPos.x;
				this.target.mark.y = markPos.y;
			}
		}

		if (this.aim) {
			this.aim.tick();
		}
	}

	draw(canvas) {
		if (this.target.mark) {
			this.game.canvas.drawCircle(this.target.mark.x, this.target.mark.y, this.target.mark.radius, this.target.mark.color);
		}

		if (this.game.debug) {
			this.game.canvas.drawLine(this.game.centerX, this.game.centerY, this.game.direction, 50, this.color);
		}

		super.draw(canvas);

		if (this.aim) {
			this.aim.draw(canvas);
		}
	}
}

export default GPlayer;
