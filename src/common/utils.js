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
}

const instance = new Utils();

export default instance;
