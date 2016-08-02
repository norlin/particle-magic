import Log from 'common/log';
import Entity from 'common/entity';

class UIElement extends Entity {
	constructor(game, options) {
		super(game, options);

		this.pos = {
			x: typeof(this.options.x) == 'number' ? this.options.x : this.game.centerX,
			y: typeof(this.options.y) == 'number' ? this.options.y : this.game.centerY
		};

		this.game.add(this, 'ui');
	}

	draw(canvas) {}

	hide() {
		this.game.remove(this.id, 'ui');
	}
}

export default UIElement;
