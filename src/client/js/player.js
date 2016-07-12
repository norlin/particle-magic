import 'fabric'
import GElement from './element.js'

class GPlayer extends GElement {
	constructor(game, options) {
		super(game, options);
	}

	createEl() {
		return new fabric.Circle({
			radius: 20, fill: this.options.color, left: 0, top: 0
		});
	}
}

export default GPlayer;
