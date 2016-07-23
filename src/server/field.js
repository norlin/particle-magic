import Log from 'common/log';
import Utils from 'common/utils';
import GObject from 'common/object';
import QuadTree from 'simple-quadtree';

let log = new Log('Field');

class Field extends GObject {
	constructor(game, options) {
		super(game, options);

		this.sectors = [];

		let width = this.options.width;
		let height = this.options.height;

		this.sectorSize = 100;

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

		this.tree = QuadTree(0, 0, width, height);

		this.generateField();
	}

	generateField() {
		let width = this.options.width;
		let height = this.options.height;

		let sectorSize = this.sectorSize;

		let i = 0;
		for (let x = 0; x < width; x += sectorSize) {
			for (let y = 0; y < height; y += sectorSize) {
				this.tree.put({
					id: i,
					x: x,
					y: y,
					w: sectorSize,
					h: sectorSize
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

	getVisibleSectors(area) {
		let sectors = this.tree.get({
			x: area.left,
			y: area.top,
			w: area.right - area.left,
			h: area.bottom - area.top
		});

		return sectors.map((sector)=>{
			return {
				value: this.sectors[sector.id].value,
				x: sector.x,
				y: sector.y
			};
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

		return drained;
	}
}

export default Field;

