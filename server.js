const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const methodOverride = require('method-override');

const app = express();

app.use(express.static(__dirname + '/dist'));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(methodOverride());

app.get('*', function(req, res) {
    res.sendfile('./public/index.html');
});

app.listen(8080);
