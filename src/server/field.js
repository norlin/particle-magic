import Log from 'common/log';
import Utils from 'common/utils';
import Vector from 'common/vector';
import Entity from 'common/entity';
import Element from 'common/element';
import QuadTree from 'simple-quadtree';

let log = new Log('Field');

class Dot extends Element {

}

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
	}

	generateField() {
		log.debug('generate field');
		let sectorSize = this.sectorSize;

		let i = 0;
		for (let x = 0; x < this.size.x; x += sectorSize) {
			for (let y = 0; y < this.size.y; y += sectorSize) {
				// TODO: unify sectors data
				// TODO: get rid of tree? (calculate by coordinates)
				this.tree.put({
					id: i,
					x: x,
					y: y,
					w: sectorSize,
					h: sectorSize
				});
				let value = this.field(new Vector(x, y));
				this.sectors.push({
					id: i,
					x: x,
					y: y,
					w: sectorSize,
					h: sectorSize,
					max: value,
					value: value
				});
				i += 1;
			}
		}

		let rowLength = Math.ceil(this.size.x / this.sectorSize);
		let colLength = Math.ceil(this.size.y / this.sectorSize);
		this.sizeInSectors = new Vector(rowLength, colLength);
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

	tick() {
		this.flows = [];

		this.sectors.forEach((sector)=>{
			let nearby = this.getMinimalSector(sector.id);
			if (nearby) {
				let currentDiff = sector.max - sector.value;
				let diff = nearby.max - nearby.value;

				if (diff <= currentDiff) {
					return;
				}

				if (currentDiff < 0) {
					diff -= currentDiff * 2;
				}

				let power = Math.sqrt(diff*2);

				let drained = this.consume(sector.id, 1, power, true, nearby.id);
				nearby.value += drained;
			}
		});
	}

	getBySectorPosition(colNum, rowNum) {
		return colNum * this.sizeInSectors.y + rowNum;
	}

	getByCoordinates(pos) {
		let colNum = Math.floor(pos.x / this.sectorSize);
		let rowNum = Math.floor(pos.y / this.sectorSize);

		return this.getBySectorPosition(colNum, rowNum);
	}

	getNearbiesTo(id, radius) {
		let result = [];
		radius = radius || 1;

		let colNum = Math.floor(id / this.sizeInSectors.y);
		let rowNum = id - colNum * this.sizeInSectors.y;

		// into both sides + current sector
		for (let x = -radius; x <= radius; x += 1) {
			let colPos = colNum + x;

			if (colPos < 0 || colPos >= this.sizeInSectors.x) {
				continue;
			}

			for (let y = -radius; y <= radius; y += 1) {
				let rowPos = rowNum + y;

				if (rowPos < 0 || rowPos >= this.sizeInSectors.y) {
					continue;
				}

				if (x === 0 && y === 0) {
					// skip current sector;
					continue;
				}
				result.push(this.getBySectorPosition(colPos, rowPos));
			}
		}

		return result;
	}

	getMinimalSector(id) {
		let uniqueNearbies = [];

		let nearbies = this.getNearbiesTo(id);
		nearbies.forEach((id)=>{
			let sector = this.sectors[id];

			if (sector.value < sector.max) {
				uniqueNearbies.push(sector);
			}
		});

		if (!uniqueNearbies.length) {
			return;
		}

		uniqueNearbies.sort((a, b)=>{
			return a.value - b.value;
		});

		return uniqueNearbies[0];
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
				id: data.id,
				value: data.value,
				x: data.x,
				y: data.y,
				w: data.w,
				h: data.h
			};
		});
	}

	consume(pos, radius, power, isFlow, to) {
		let sectors;

		if (typeof(pos) === 'number') {
			sectors = [this.sectors[pos]];
		} else {
			pos = pos.copy().sub(radius);

			let area = {
				x: pos.x,
				y: pos.y,
				w: radius * 2,
				h: radius * 2
			};

			sectors = this.tree.get(area);
		}

		let drainPower = power / sectors.length;
		let drained = 0;
		sectors.forEach((sector)=>{
			let data = this.sectors[sector.id];

			let value = data.value;
			let power = Math.min(value, drainPower);
			drained += power;
			value -= power;

			data.value = value;
			data.drained = !isFlow;

			if (!to) {
				return;
			}

			this.flows.push({
				from: data.id,
				to: to,
				drained: power
			});
		});

		return drained;
	}

	feed(pos, amount) {
		let id = this.getByCoordinates(pos);
		let sector = this.sectors[id];

		sector.value += amount;
	}
}

export default Field;

