class Utils {
	valueInRange(min, max, value) {
		return Math.min(max, Math.max(min, value));
	}
}

const instance = new Utils();

export default instance
