class Utils {
	valueInRange(min, max, value) {
		return Math.min(max, Math.max(min, value));
	}

	randomInRange(min, max) {
		return Math.floor(Math.random() * (max-min) + min);
	}

	getRandomColor() {
		return '#'+((1<<24)*Math.random()|0).toString(16);
	}

	hexToRgb(hex) {
		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, function(m, r, g, b) {
			return r + r + g + g + b + b;
		});

		let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	}

	hexToGL(hex) {
		let rgb = this.hexToRgb(hex);

		return rgb ? {
			r: rgb.r / 255,
			g: rgb.g / 255,
			b: rgb.b / 255
		} : null;
	}
}

const instance = new Utils();

export default instance;
