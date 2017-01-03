import Log from './log';
import Utils from './utils';
import * as SAT from 'sat';

let log = new Log('Collisions');

class Collisions {
	findCollisions(target, objects) {
		let targetCircle = new SAT.Circle(new SAT.Vector(target._position.x, target._position.y), target.radius);
		let targetMinCircle;
		if (target.radiusMin) {
			targetMinCircle = new SAT.Circle(new SAT.Vector(target._position.x, target._position.y), target.radiusMin);
		}

		return objects.reduce((collisions, object)=>{
			if (object.id === target.id) {
				return collisions;
			}

			let objectCircle = new SAT.Circle(new SAT.Vector(object.centerX, object.centerY), object.radius);
			let response = new SAT.Response();
			let collided = SAT.testCircleCircle(targetCircle, objectCircle, response);

			let objectMinCircle;
			if (object.radiusMin) {
				objectMinCircle = new SAT.Circle(new SAT.Vector(object.centerX, object.centerY), object.radiusMin);
			}

			let collidedMin;
			let responseMin;
			if (objectMinCircle) {
				responseMin = new SAT.Response();
				collidedMin = SAT.testCircleCircle(targetCircle, objectMinCircle, responseMin);
			} else if (targetMinCircle) {
				responseMin = new SAT.Response();
				collidedMin = SAT.testCircleCircle(objectCircle, targetMinCircle, responseMin);
			}

			if (responseMin && responseMin.aInB) {
				collided = false;
			}

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
