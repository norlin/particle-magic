import Log from 'common/log';
import GObject from 'common/object';

class Notify extends GObject {
	constructor(game, options) {
		super(game, options);

		this.pos = {
			x: this.options.x || this.game.centerX,
			y: this.options.y || this.game.centerY
		};

		this.game.add(this, 'ui');

		let timeout = this.options.timeout || 5000;

		if (timeout) {
			this.timer = window.setTimeout(()=>this.hide(), timeout);
		}
	}

	draw(canvas) {
		canvas.drawText(this.pos.x, this.pos.y, this.options.text);
	}

	hide() {
		if (this.timer) {
			window.clearTimeout(this.timer);
			this.timer = undefined;
		}

		this.game.remove(this.id, 'ui');
	}
}

export default Notify;
