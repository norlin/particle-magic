import Utils from 'common/utils';
import Vector from 'common/vector';
import Element from 'common/element';

class Dot extends Element {
	constructor(game, options) {
		super(game, options);

		this.invisible = true;

		this.sector = options.sector;
		this.setPosition();
	}

	initParams() {
		this._speed = 10;
		this.radius = 1;
		this.color = this.options.color || Utils.getRandomColor();
	}

	setPosition(sector) {
		let move = sector !== undefined;
		sector = move ? sector : this.sector;

		let x = Utils.randomInRange(sector.x, sector.x + sector.w);
		let y = Utils.randomInRange(sector.y, sector.y + sector.h);

		let newPosition = new Vector(x, y);

		if (move) {
			this.target = newPosition;
			this.sector = sector;
		} else {
			this._position = newPosition;
		}
	}

	tick() {
		if (!this.target) {
			return;
		}

		this.move();

		let compare = this.pos().sub(this.target);
		if (Math.abs(compare.x) < 1 && Math.abs(compare.y) < 1) {
			this.stopMovement();
			this.target = undefined;
		}
	}

	draw(canvas) {
		let screenPos = this.game.toScreenCoords(this.pos());

		canvas.drawRect(screenPos, {x: 1, y: 1}, this.color);
	}
}

export default Dot;
