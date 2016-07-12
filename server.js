const express = require('express');
const app = express();

app.use(express.static('build/client'));
//app.use('/', express.static('build/client/index.html'));
//app.use('/css', express.static('build/client/css'));
//app.use('/js', express.static('build/client/js'));

app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});
