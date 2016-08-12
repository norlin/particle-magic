import Log from 'common/log';
import Utils from 'common/utils';
import Vector from 'common/vector';
import Entity from 'common/entity';
import QuadTree from 'simple-quadtree';

let log = new Log('Field');

class Field extends Entity {
	constructor(game, options) {
		super(game, options);

		this.sectors = [];

		this.size = new Vector(this.options.width, this.options.height);

		this.sectorSize = 100;

		this.dips = [{
			pos: new Vector(501, 501),
			fade: this.size.x / 2,
			power: 500
		},{
			pos: new Vector(3001, 3001),
			fade: this.size.x,
			power: 1000
		}];

		this.tree = QuadTree(0, 0, this.size.x, this.size.y);

		this.generateField();
		this.generateHeatMap();
	}

	generateField() {
		log.debug('generate field');
		let sectorSize = this.sectorSize;

		let i = 0;
		for (let x = 0; x < this.size.x; x += sectorSize) {
			for (let y = 0; y < this.size.y; y += sectorSize) {
				this.tree.put({
					id: i,
					x: x,
					y: y,
					w: sectorSize,
					h: sectorSize
				});
				let value = this.field(new Vector(x, y));
				this.sectors.push({
					max: value,
					value: value
				});
				i += 1;
			}
		}
	}

	field(coords) {
		var basic = 0;

		// https://en.wikipedia.org/wiki/Gaussian_function

		function getDip(dip) {
			let c = 2 * Math.pow(dip.fade, 2);
			let direction = dip.fade < 0 ? -1 : 1;
			let point = coords.copy().sub(dip.pos);

			return direction * dip.power * Math.exp(-(point.x*point.x + point.y*point.y)/c);
		}

		this.dips.forEach((dip)=>{
			let dipValue = getDip(dip);
			basic += dipValue;
		});

		return basic;
	}

	generateHeatMap() {
		log.debug('generate sources heatmap');

		let start = [];
		this.dips.forEach((dip)=>{
			start = start.concat(this.tree.get({
				x: dip.pos.x,
				y: dip.pos.y,
				w: 0,
				h: 0
			}));
		});

		let field = this;
		let heat = 0;
		function updateSectors(sectors) {
			let nearby = new Set();
			let append = nearby.add.bind(nearby);

			sectors.forEach((sector)=>{
				let data = field.sectors[sector.id];
				data.heat = heat;

				field.getNearSectors(sector).forEach(append);
			});

			if (nearby.size) {
				heat += 1;
				updateSectors(nearby);
			}
		}

		updateSectors(start);
	}

	getNearSectors(sector) {
		return this.tree.get({
			x: sector.x-1,
			y: sector.y-1,
			w: sector.w+1,
			h: sector.h+1
		}).filter((nearby)=>{
			return this.sectors[nearby.id].heat===undefined;
		});
	}

	tick() {
		let basicRecovery = 1;
		this.tree.get({
			x: 0,
			y: 0,
			w: this.size.x,
			h: this.size.y
		}).forEach((sector)=>{
			let data = this.sectors[sector.id];
			if (0 && data.drained) {
				data.drained = false;
				return;
			}

			let diff = data.max - data.value;
			if (diff === 0) {
				return;
			}

			let nearby = this.getNearbyMinimum(sector);
			if (nearby) {
				let recovery = Math.round(Math.sqrt(diff));
				let point = new Vector(nearby.x+10, nearby.y+10);
				let power = this.consume(point, 1, recovery, true);

				data.value += Math.min(power, diff);
			}
		});
	}

	getNearbyMinimum(sector) {
		let nearby = this.tree.get({
			x: sector.x-1,
			y: sector.y-1,
			w: sector.w+1,
			h: sector.h+1
		}).filter((sector)=>{
			let data = this.sectors[sector.id];
			return !!data.value;
		});

		if (!nearby.length) {
			return;
		}

		nearby.sort((a, b)=>{
			let dataA = this.sectors[a.id];
			let dataB = this.sectors[b.id];

			if (dataA.heat === dataB.heat) {
				let valueA = dataA.value;
				let valueB = dataB.value;
				return valueA<valueB;
			}

			return dataA.heat>dataB.heat;
		});

		let minData = this.sectors[nearby[0].id];

		let minHeat = minData.heat;
		let maxValue = minData.value;

		nearby = nearby.filter((sector)=>{
			let data = this.sectors[sector.id];
			return data.heat == minHeat && data.value == maxValue;
		});

		if (!nearby.length) {
			return;
		}

		if (nearby.length == 1) {
			return nearby[0];
		}

		let random = Utils.randomInRange(0, nearby.length);
		return nearby[random];
	}

	getVisibleSectors(area) {
		let sectors = this.tree.get({
			x: area.left,
			y: area.top,
			w: area.right - area.left,
			h: area.bottom - area.top
		});

		return sectors.map((sector)=>{
			let data = this.sectors[sector.id];
			return {
				value: data.value,
				x: sector.x,
				y: sector.y,
				heat: data.heat
			};
		});
	}

	consume(pos, radius, power, isFlow) {
		pos = pos.copy().sub(radius);

		let area = {
			x: pos.x,
			y: pos.y,
			w: radius * 2,
			h: radius * 2
		};

		let points = this.tree.get(area);

		let drainPower = power / points.length;
		let drained = 0;
		points.forEach((point)=>{
			let sector = this.sectors[point.id];

			let value = sector.value;
			let power = Math.min(value, drainPower);
			drained += power;
			value -= power;

			sector.value = value;
			sector.drained = !isFlow;
		});

		return drained;
	}
}

export default Field;

