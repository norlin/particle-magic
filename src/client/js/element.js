//import 'fabric'
import GObject from './object.js'

class GElement extends GObject {
	constructor(game, options) {
		super(game, options)

		this.el = this.createEl();
	}

	createEl() {
		return new fabric.Circle();
	}
}

export default GElement;
