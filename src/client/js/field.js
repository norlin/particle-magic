import Log from 'common/log';
import Utils from 'common/utils';
import Vector from 'common/vector';
import Entity from 'common/entity';
import Dot from './dot';

let log = new Log('Field');

class Field extends Entity {
	constructor(game, options) {
		super(game, options);

		this._client = true;

		this.visibility = 0.2;

		this.sectors = [];
		this.dots = {};
	}

	generateDots(flows) {
		flows = flows || [];
		flows.forEach((flow)=>{
			let sectorFrom = this.dots[flow.from];
			if (!sectorFrom) {
				return;
			}

			let dotsFrom = sectorFrom.dots;
			let drained = Math.ceil(flow.drained * this.visibility);
			let consumed = Math.ceil(flow.consumed * this.visibility);

			let dots = dotsFrom.splice(0, drained);
			if (consumed < drained) {
				dots.length = consumed;
			}

			let sectorTo = this.dots[flow.to] || this.game.objects[flow.to];
			if (!sectorTo) {
				return;
			}

			let dotsTo = sectorTo.dots;

			dots.forEach((dot)=>{
				if (sectorTo.radius) {
					dot.setPosition({
						x: sectorTo._position.x,
						y: sectorTo._position.y,
						radius: sectorTo.radius||1,
						radiusMin: sectorTo.radiusMin
					});
				} else {
					dot.setPosition(sectorTo.sector);
				}

				if (dotsTo) {
					dotsTo.push(dot);
				}
			});
		});

		this.sectors.forEach((sector)=>{
			let sectorData = this.dots[sector.id] = this.dots[sector.id] || {
				sector: sector,
				dots: []
			};
			let dots = sectorData.dots;
			let count = Math.floor(sector.value * this.visibility);

			let diff = count - dots.length;
			if (diff < 0) {
				dots.length = count;
			} else if (diff > 0) {
				for (let i=dots.length; i < count; i += 1) {
					dots.push(new Dot(this.game, {
						radius: 1,
						color: '#f60',
						sector: sector
					}));
				}
			}
		});
	}

	update(data) {
		this.sectors = data.sectors||[];
		this.generateDots(data.flows);
		this.activeSector = data.activeSector;
		this.nearbies = data.nearbies;
		//this.generateDots();
	}

	tick() {
		this.sectors.forEach((sector)=>{
			let dots = this.dots[sector.id].dots;
			dots.forEach((dot)=>dot.tick());
		});
	}

	draw(canvas) {
		if (0) {
			return;
		}
		//log.debug('draw');
		let count = 0;
		this.sectors.forEach((sector)=>{
			let dots = this.dots[sector.id].dots;
			dots.forEach((dot)=>canvas.add(dot));
			count += dots.length;
		});

		if (this.game.debug) {
			this.sectors.forEach((sector)=>{
				let sectorPoint = new Vector(sector.x, sector.y);
				let pos = this.game.toScreenCoords(sectorPoint);
				canvas.drawText(pos.add(50), sector.id, '#f00');
				canvas.drawText(pos.add({x: 0, y: 10}), Math.floor(sector.value));

				if (this.activeSector === sector.id) {
					canvas.drawText(pos.add({x: 0, y: 10}), 'active', '#f00');
				}

				if (this.nearbies.indexOf(sector.id) > -1) {
					canvas.drawText(pos.add({x: 0, y: 10}), 'nearby', '#00f');
				}
			});
		}

		canvas.drawText(new Vector(10, this.game.screen.y - 60), `Dots: ${count}`);
		canvas.drawText(new Vector(10, this.game.screen.y - 80), `Active: ${this.activeSector}`);
	}
}

export default Field;
