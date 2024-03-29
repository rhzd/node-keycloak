/*
 * Copyright 2016 Red Hat Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

var Keycloak = require('keycloak-connect');
var hogan = require('hogan-express');
var express = require('express');
var session = require('express-session');
var jwt_decode = require('jwt-decode');

var app = express();

var server = app.listen(4000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});

// Register '.mustache' extension with The Mustache Express
app.set('view engine', 'html');
app.set('views', require('path').join(__dirname, '/view'));
app.engine('html', hogan);

// A normal un-protected public URL.

app.get('/', function (req, res) {
  res.render('index');
});

// Create a session-store to be used by both the express-session
// middleware and the keycloak middleware.

var memoryStore = new session.MemoryStore();

app.use(session({
  secret: 'mySecret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

// Provide the session store to the Keycloak so that sessions
// can be invalidated from the Keycloak console callback.
//
// Additional configuration is read from keycloak.json file
// installed from the Keycloak web console.

var keycloak = new Keycloak({
  store: memoryStore
});

// Install the Keycloak middleware.
//
// Specifies that the user-accessible application URL to
// logout should be mounted at /logout
//
// Specifies that Keycloak console callbacks should target the
// root URL.  Various permutations, such as /k_logout will ultimately
// be appended to the admin URL.

app.use(keycloak.middleware({
  logout: '/logout',
  admin: '/'
}));

app.get('/login', keycloak.protect(), function (req, res) {
  res.render('index', {
    result: JSON.stringify(JSON.parse(req.session['keycloak-token']), null, 4),
    event: JSON.stringify(jwt_decode(req.session['keycloak-token']), null, 4)
  });

  //var decoded = jwt_decode(req.session['keycloak-token']);
  //console.log(decoded);

});

app.get('/protected_advertiser', keycloak.protect('realm:customer-advertiser'), function (req, res) {
  res.render('index', {
    result: 'advertiser and admin only',
    event: 'PASS'
  });

});

app.get('/protected_analyst', keycloak.protect('realm:customer-analyst'), function (req, res) {
  res.render('index', {
    result: 'analyst and admin only',
    event: 'PASS'
  });

});

app.get('/protected_admin', keycloak.protect('realm:admin'), function (req, res) {
  res.render('index', {
    result: 'admin only',
    event: 'PASS'
  });

});
