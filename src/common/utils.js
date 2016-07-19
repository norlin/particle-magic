class Utils {
	valueInRange(min, max, value) {
		return Math.min(max, Math.max(min, value));
	}

	randomInRange(min, max) {
		return Math.floor(Math.random() * (max-min) + min);
	}
}

const instance = new Utils();

export default instance;
