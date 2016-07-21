import Log from 'common/log';
import GObject from 'common/object';
import QuadTree from 'simple-quadtree';

let log = new Log('Field');

const FWHM = 2*(Math.sqrt(2*Math.log(2)));
const FWTM = 2*(Math.sqrt(2*Math.log(10)));

class Field extends GObject {
	constructor(game, options) {
		super(game, options);

		this.basic = 1;
		let width = this.options.width;
		let height = this.options.height;
		this.tree = QuadTree(0, 0, width, height);

		let step = this.step = 10;
		let fadeStep = Math.pow(step, 2);

		this.dips = [{
			x: 500,
			y: 500,
			fade: fadeStep
		},{
			x: 3000,
			y: 3000,
			fade: fadeStep/2
		}];
	}

	field(x, y) {
		var basic = this.basic;

		// https://en.wikipedia.org/wiki/Gaussian_function

		function getDip(dip) {
			let c = 2 * Math.pow(dip.fade, 2);
			return basic * Math.exp(-( (Math.pow(x-dip.x, 2)/c) + (Math.pow(y-dip.y, 2)/c)));
		}

		this.dips.forEach((dip)=>{
			let dipValue = getDip(dip);
			basic -= dipValue;
		});

		let player = this.game.player;
		let pos = player.pos();
		let playerDip = {
			x: pos.x,
			y: pos.y,
			fade: player.power
		};

		return basic - getDip(playerDip);
	}

	getColor(x, y) {
		var value = this.field(x, y);

		let bg = Math.floor((1-value) * 170);
		let color = Math.floor((value/2) * 255);

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

		let x2 = area.x + area.w;
		let y2 = area.y + area.h;

		//let points = this.tree.get(area);
		let points = [];
		let step = this.step;
		for (let x = area.x; x < x2; x += step) {
			for (let y = area.y; y < y2; y += step) {
				points.push({x: x, y: y, w: step, h: step, text: this.getColor(x, y)});
			}
		}

		points.forEach((point)=>{
			let screenPos = this.game.toScreenCoords(point.x, point.y);

			canvas.drawRect(screenPos.x, screenPos.y, point.w, point.h, point.text);
		});

		this.dips.forEach((dip)=>{
			let radius = dip.fade * FWHM;

			log.debug(radius);

			let screenPos = this.game.toScreenCoords(dip.x, dip.y);

			canvas.strokeCircle(screenPos.x, screenPos.y, radius, '#fff');
		});
	}
}

export default Field;
