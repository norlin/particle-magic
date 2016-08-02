import Log from 'common/log';
import UIElement from './ui';

class Panel extends UIElement {
	draw(canvas) {
		let w = this.options.width;
		let h = this.options.height;
		canvas.drawRect(this.pos.x, this.pos.y, w, h, this.options.color, 3);
	}
}

export default Panel;
