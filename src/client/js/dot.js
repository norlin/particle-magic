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

		let x, y;
		if (sector.radius) {
			let distance = Utils.randomDouble(0, sector.radius);
			let angle = Utils.randomDouble(-Math.PI, Math.PI);

			let pos = Vector.fromAngle(angle, distance);
			x = sector.x + pos.x;
			y = sector.y + pos.y;
		} else {
			x = Utils.randomInRange(sector.x, sector.x + sector.w);
			y = Utils.randomInRange(sector.y, sector.y + sector.h);
		}

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
