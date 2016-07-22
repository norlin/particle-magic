import Log from 'common/log';
import Utils from 'common/utils';
import GObject from 'common/object';
import QuadTree from 'simple-quadtree';

let log = new Log('Field');

const FWHM = 2*(Math.sqrt(2*Math.log(2)));
const FWTM = 2*(Math.sqrt(2*Math.log(10)));

class Field extends GObject {
	constructor(game, options) {
		super(game, options);

		this.sectors = [];

		let width = this.options.width;
		let height = this.options.height;
		this.tree = QuadTree(0, 0, width, height);

		let step = this.step = 100;
		let fadeStep = 100;

		this.dips = [{
			x: 500,
			y: 500,
			fade: width / 2,
			power: 500
		},{
			x: 3000,
			y: 3000,
			fade: width,
			power: 1000
		}];

		let i = 0;
		for (let x = 0; x < width; x += step) {
			for (let y = 0; y < height; y += step) {
				this.tree.put({
					id: i,
					x: x,
					y: y,
					w: step,
					h: step
				});
				let value = this.getValue(x, y);
				this.sectors.push({max: value, value: value});
				i += 1;
			}
		}
	}

	field(x, y) {
		var basic = 0;

		// https://en.wikipedia.org/wiki/Gaussian_function

		function getDip(dip) {
			let c = 2 * Math.pow(dip.fade, 2);
			let direction = dip.fade < 0 ? -1 : 1;
			return direction * dip.power * Math.exp(-(Math.pow(x-dip.x, 2) + Math.pow(y-dip.y, 2))/c);
		}

		this.dips.forEach((dip)=>{
			let dipValue = getDip(dip);
			basic += dipValue;
		});

		return basic;
	}

	getValue(x, y) {
		let value = this.field(x, y);

		return value;
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

	getColorValue(value) {
		let s = 1000/255;

		let r = 0;
		let g = 0;
		let b = 0;

		let parts = Math.ceil(value / 1000);
		if (parts==1) {
			r = Math.round(value / s);
			g = b = r;
		} else if (parts == 2) {
			r = 255;
			g = Math.round((value-1000) / s);
		} else if (parts >= 3) {
			r = 255;
			g = 255;
			b = Math.min(255, Math.round((value-2000) / s));
		}

		return Utils.rgbToHex(r, g, b);
	}

	tick() {
		let basicRecovery = 1;
		this.sectors.forEach((sector)=>{
			if (sector.drained) {
				sector.drained = false;
				return;
			}

			let diff = sector.max - sector.value;
			if (diff === 0) {
				return;
			}

			let recovery = Math.min(basicRecovery, Math.pow(diff, 2));
			sector.value += Math.min(recovery, diff);
		});
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

			let cenX = screenPos.x + point.w / 2;
			let cenY = screenPos.y + point.h / 2;

			let sector = this.sectors[point.id];
			canvas.drawRect(screenPos.x, screenPos.y, point.w, point.h, this.getColorValue(sector.value));
			canvas.drawText(cenX, cenY, sector.value.toFixed(3));
		});
	}

	consume(x, y, radius, power) {
		let area = {
			x: x - radius,
			y: y - radius,
			w: radius * 2,
			h: radius * 2
		};

		let tree = this.tree;
		let points = tree.get(area);

		let drainPower = power / points.length;
		let drained = 0;
		points.forEach((point)=>{
			let sector = this.sectors[point.id];

			let value = sector.value;
			let power = Math.min(value, drainPower);
			drained += power;
			value -= power;

			sector.value = value;
			sector.drained = true;
		});

		log.debug('drained', drained);
		return drained;
	}
}

export default Field;
