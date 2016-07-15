import Game from './game'
import GPlayer from './player'

class App {
	constructor() {
		let game = new Game({canvas: 'canvas'});
		let player = new GPlayer(game, {name: 'test', color: '#f00'});

		game.addPlayer(player);
		game.start();
	}
}

window.addEventListener('load', function(){
	new App();
});
