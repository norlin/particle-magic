const map = {
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	ENTER: 13,
	SPACE: 32,
	TAB: 9
};

class Keys {
	constructor() {
		for (let name in map) {
			let value = map[name];
			this[name] = value;
			this[value] = name;
		}
	}
}

const instance = new Keys();

export default instance;
