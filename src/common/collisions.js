import Log from './log';
import Utils from './utils';
import * as SAT from 'sat';

let log = new Log('Collisions');

class Collisions {
	findCollisions(target, objects) {
		let targetCircle = new SAT.Circle(new SAT.Vector(target._position.x, target._position.y), target.radius);

		return objects.reduce((collisions, object)=>{
			if (object.id === target.id) {
				return collisions;
			}

			let objectCircle = new SAT.Circle(new SAT.Vector(object.centerX, object.centerY), object.radius);
			let response = new SAT.Response();
			let collided = SAT.testCircleCircle(targetCircle, objectCircle, response);

			if (!collided) {
				return collisions;
			}

			collisions.push(object.id);

			return collisions;
		}, []);
	}
}

let instance = new Collisions();

export default instance;
