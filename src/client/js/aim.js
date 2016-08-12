import Log from 'common/log';
import ClientElement from './element';

class Aim extends ClientElement {
	constructor(player, options) {
		super(player.game, options);

		this.color = this.options.color;
		this.player = player;
		this.maxRadius = 50;
		this.radius = 50;
		this.direction = -1;
	}

	tick() {
		/*this.radius += this.direction * 1;

		if (this.radius >= this.maxRadius) {
			this.radius = this.maxRadius;
			this.direction = -1;
		} else if (this.radius <= 1) {
			this.radius = 1;
			this.direction = 1;
		}*/
	}

	draw(canvas) {
		let pos = this.player.pos();
		let direction = this.game.direction;
		//let distance = this.player.radius + 50;

		//let x = pos.x + Math.cos(direction) * distance;
		//let y = pos.y + Math.sin(direction) * distance;

		//let screenPos = this.game.toScreenCoords(x, y);
		//this.game.canvas.strokeCircle(screenPos.x, screenPos.y, this.radius, this.color, 1);

		let screenPos = this.game.toScreenCoords(pos);
		this.game.canvas.drawLine({
			from: screenPos,
			angle: direction,
			distance: this.radius,
			color: this.color,
			solid: true
		});
	}
}

export default Aim;
