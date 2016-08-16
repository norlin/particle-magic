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
			let dots = dotsFrom.splice(0, flow.drained);
			if (flow.consumed < flow.drained) {
				dots.length = flow.consumed;
			}

			let sectorTo = this.dots[flow.to];
			if (!sectorTo) {
				return;
			}

			let dotsTo = sectorTo && sectorTo.dots;

			dots.forEach((dot)=>{
				dot.setPosition(sectorTo.sector);
				dotsTo.push(dot);
			});
		});

		this.sectors.forEach((sector)=>{
			let sectorData = this.dots[sector.id] = this.dots[sector.id] || {
				sector: sector,
				dots: []
			};
			let dots = sectorData.dots;
			let count = Math.floor(sector.value / 10);

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
		//this.generateDots();
	}

	tick() {
		this.sectors.forEach((sector)=>{
			let dots = this.dots[sector.id].dots;
			dots.forEach((dot)=>dot.tick());
		});
	}

	draw(canvas) {
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
				canvas.drawText(pos.add(50), Math.floor(sector.value));
				canvas.drawText(pos.add(10), sector.heat, '#f00');
			});
		}

		canvas.drawText(new Vector(10, this.game.screen.y - 60), `Dots: ${count}`);
	}
}

export default Field;
