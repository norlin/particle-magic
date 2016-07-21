import Log from 'common/log';
import GObject from 'common/object';
import QuadTree from 'simple-quadtree';

let log = new Log('Field');

class Field extends GObject {
	constructor(game, options) {
		super(game, options);

		this.basic = 1;
		let width = this.options.width;
		let height = this.options.height;
		this.tree = QuadTree(0, 0, width, height);

		let step = 50;
		let fadeStep = step * 1000;

		this.dips = [{
			x: 500,
			y: 500,
			fade: fadeStep
		},{
			x: 3000,
			y: 3000,
			fade: fadeStep/2
		}];

		for (let x = 0; x < width; x += step) {
			for (let y = 0; y < height; y += step) {
				this.tree.put({x: x, y: y, w: step, h: step, text: this.getColor(x, y)});
			}
		}
	}

	field(x, y) {
		var basic = this.basic;

		this.dips.forEach((dip)=>{
			let dipValue = basic * Math.exp(-( (Math.pow(x-dip.x, 2)/dip.fade) + (Math.pow(y-dip.y, 2)/dip.fade)));
			basic -= dipValue;
		});

		return basic;
	}

	getColor(x, y) {
		let value = this.field(x, y);

		let bgValue = value < 1 ? 1-value : value;
		let value = value < 1 ? value : (1-value);
		let bg = Math.floor(bgValue * 255);
		let color = Math.floor(value * 255);

		var hex = color.toString(16);
		if (hex.length < 2) {
			hex = '0'+hex;
		}

		let bgHex = bg.toString(16);
		if (bgHex.length < 2) {
			bgHex = '0'+bgHex;
		}

		return `#${hex}${bgHex}${bgHex}`;
	}

	draw() {
		let canvas = this.game.canvas;
		let halfWidth = this.game.options.screenWidth / 2;
		let halfHeight = this.game.options.screenHeight / 2;

		let pos = this.game.player.pos();
		let area = {
			x: pos.x - halfWidth,
			y: pos.y - halfHeight,
			w: halfWidth * 2,
			h: halfHeight * 2
		};

		let points = this.tree.get(area);

		points.forEach((point)=>{
			let screenPos = this.game.toScreenCoords(point.x, point.y);

			canvas.drawRect(screenPos.x, screenPos.y, point.w, point.h, point.text);
		});
	}
}

export default Field;
