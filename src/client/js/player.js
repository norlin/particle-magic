import 'fabric'
import Log from './log'
import GElement from './element'
import Keys from './keys'
import Utils from './utils'

class GPlayer extends GElement {
	constructor(game, options) {
		super(game, options);

		let log = new Log('Player');
		this.log = log.log.bind(log);

		this.addListeners();
	}

	initParams() {
		super.initParams();

		this.maxSpeed = {x: 200, y: 200};
	}

	createEl() {
		return new fabric.Circle({
			radius: 20, fill: this.options.color, left: 0, top: 0
		});
	}

	addListeners() {
		console.log('listent to ', Keys.LEFT);

		this.game.addKeyListener(Keys.LEFT, (e) => {
			this.accelerate(-50, 0);
		});
		this.game.addKeyListener(Keys.UP, (e) => {
			this.accelerate(0, -50);
		});
		this.game.addKeyListener(Keys.RIGHT, (e) => {
			this.accelerate(50, 0);
		});
		this.game.addKeyListener(Keys.DOWN, (e) => {
			this.accelerate(0, 50);
		});
	}

	tick() {
		super.tick();
		let pos = this.pos();
		this.log('pos', this._position);

		let screenWidth = this.game.options.screenWidth / 2;
		let screenHeight = this.game.options.screenHeight / 2;
		let gameWidth = this.game.options.width;
		let gameHeight = this.game.options.height;

		var x = 0;
		var y = 0;

		let player = this.pos();
		let userCurrent = this.pos();
		let cellCurrent = this.pos();
		let radius = 10;
		let mass = 100;

		let points = 30 + ~~(mass/5);
		let increase = Math.PI * 2 / points;

		var start = {
			x: player.x - (screenWidth),
			y: player.y - (screenHeight)
		};

		var circle = {
			x: cellCurrent.x - start.x,
			y: cellCurrent.y - start.y
		};

		/*
		x = radius * Math.cos(-Math.PI) + circle.x;
		y = radius * Math.sin(-Math.PI) + circle.y;

		if (1) {
			x = Utils.valueInRange(-pos.x + screenWidth, gameWidth - pos.x + screenWidth, x);
			y = Utils.valueInRange(-pos.y + screenHeight, gameHeight - pos.y + screenHeight, y);
		} else {
			x = Utils.valueInRange(- pos.x + screenWidth / 2 + (radius/3),
				gameWidth + gameWidth - pos.x + screenWidth / 2 - (radius/3), x);
			y = Utils.valueInRange(- pos.y + screenHeight / 2 + (radius/3),
				gameHeight + gameHeight - pos.y + screenHeight / 2 - (radius/3) , y);
		}*/

		this.draw(circle.x, circle.y);
	}
}

export default GPlayer;
