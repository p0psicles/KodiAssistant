'use strict'; // eslint-disable-line strict
// server.js
// where your node app starts

// init project
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const kodiHandler = require('./kodi-handler.js');
const LoadConfig = require('./config.js');
const config = new LoadConfig();

app.use(bodyParser.json()); // for parsing application/json
app.use(express.static('public'));

const validateRequest = function(req, res) {
    return new Promise((resolve, reject) => {
        console.log('Start validating request');
      
        let jsonString = '';
        let requestToken = '';
        let jsonBody;

        if (req === null || req.query === req) {
            console.log('403 - Unauthorized request');
            res.sendStatus(403);
            reject('403 - Unauthorized request');
            return;
        }
        
        console.log(`Req on`)
        if (req.body !== '') {
            jsonBody = req.body;
            if (jsonBody != undefined) {
                requestToken = req.headers.token;
                console.log(`Request token = ${requestToken}`);
                if (requestToken === config.globalConf.authToken) {
                    console.log('Authentication succeeded');

                    config.routeKodiInstance(req);
                    resolve('Authentication succeeded');
                    return;
                }
            }
        }
        console.log('401 - Authentication failed');
        res.sendStatus(401);
        reject('401 - Authentication failed');
    });
};

// endpoint for api.ai kodi intents
app.post('/kodi', function(request, response) {
    console.log(`headers: ${JSON.stringify(request.headers)}`);
    console.log(`body: ${JSON.stringify(request.body)}`);
    validateRequest(request, response).then(() => {
        kodiHandler.dispatch(request, response);
    });
});


/*
 * Legacy handlers used for IFTTT requests.
*/

// Pause or Resume video player
app.get('/playpause', function(request, response) {
    validateRequest(request, response).then(() => {
        kodiHandler.kodiPlayPause(request, response);
    });
});

// Stop video player
app.get('/stop', function(request, response) {
    validateRequest(request, response).then(() => {
        kodiHandler.kodiStop(request, response);
    });
});

// mute or unmute kodi
app.get('/mute', function(request, response) {
    validateRequest(request, response).then(() => {
        kodiHandler.kodiMuteToggle(request, response);
    });
});

// set kodi volume
app.get('/volume', function(request, response) {
    validateRequest(request, response).then(() => {
        kodiHandler.kodiSetVolume(request, response);
    });
});

// Turn on TV and Switch to Kodi's HDMI input
app.get('/activatetv', function(request, response) {
    validateRequest(request, response).then(() => {
        kodiHandler.kodiActivateTv(request, response);
    });
});

// Parse request to watch a movie
// Request format:     http://[THIS_SERVER_IP_ADDRESS]/playmovie?q=[MOVIE_NAME]
app.get('/playmovie', function(request, response) {
    validateRequest(request, response).then(() => {
        kodiHandler.kodiPlayMovie(request, response);
    });
});

// Parse request to open a specific tv show
// Request format:     http://[THIS_SERVER_IP_ADDRESS]/opentvshow?q=[TV_SHOW_NAME]
app.get('/opentvshow', function(request, response) {
    validateRequest(request, response).then(() => {
        kodiHandler.kodiOpenTvshow(request, response);
    });
});

// Start a new library scan
app.get('/scanlibrary', function(request, response) {
    validateRequest(request, response).then(() => {
        kodiHandler.kodiScanLibrary(request, response);
    });
});

// Parse request to watch your next unwatched episode for a given tv show
// Request format:     http://[THIS_SERVER_IP_ADDRESS]/playtvshow?q=[TV_SHOW_NAME]
app.get('/playtvshow', function(request, response) {
    validateRequest(request, response).then(() => {
        kodiHandler.kodiPlayTvshow(request, response);
    });
});

// Parse request to watch a specific episode for a given tv show
// Request format:     http://[THIS_SERVER_IP_ADDRESS]/playepisode?q=[TV_SHOW_NAME]season=[SEASON_NUMBER]episode&e=[EPISODE_NUMBER]
// For example, if IP was 1.1.1.1 a request to watch season 2 episode 3 in tv show named 'bla' looks like:
// http://1.1.1.1/playepisode?q=bla+season+2+episode&e=3
app.get('/playepisode', function(request, response) {
    validateRequest(request, response).then(() => {
        kodiHandler.kodiPlayEpisodeHandler(request, response);
    });
});

// Parse request to Shutdown the kodi system
// Request format:  http://[THIS_SERVER_IP_ADDRESS]/shutdown
app.get('/shutdown', function(request, response) {
    validateRequest(request, response).then(() => {
        request.kodi.System.Shutdown();  // eslint-disable-line new-cap
    });
    response.sendStatus(200);
});

// Parse request to watch a random episode for a given tv show
// Request format:     http://[THIS_SERVER_IP_ADDRESS]/playepisode?q[TV_SHOW_NAME]season[SEASON_NUMBER]episode&e[EPISODE_NUMBER]
// For example, if IP was 1.1.1.1 a request to watch season 2 episode 3 in tv show named 'bla' looks like:
// http://1.1.1.1/playepisode?q=bla+season+2+episode&e=3
app.get('/shuffleepisode', function(request, response) {
    validateRequest(request, response).then(() => {
        kodiHandler.kodiShuffleEpisodeHandler(request, response);
    });
});

// Parse request to watch a PVR channel by name
// Request format:     http://[THIS_SERVER_IP_ADDRESS]/playpvrchannelbyname?q=[CHANNEL_NAME]
app.get('/playpvrchannelbyname', function(request, response) {
    validateRequest(request, response).then(() => {
        kodiHandler.kodiPlayChannelByName(request, response);
    });
});


// Parse request to search for a youtube video. The video will be played using the youtube addon.
// Request format:     http://[THIS_SERVER_IP_ADDRESS]/playyoutube?q=[TV_SHOW_NAME]
// For example, if IP was 1.1.1.1 a request to watch season 2 episode 3 in tv show named 'bla' looks like:
// http://1.1.1.1/playyoutube?q=bla
app.get('/playyoutube', function(request, response) {
    validateRequest(request, response).then(() => {
        kodiHandler.kodiPlayYoutube(request, response);
    });
});

// Parse request to watch a PVR channel by number
// Request format:     http://[THIS_SERVER_IP_ADDRESS]/playpvrchannelbynumber?q=[CHANNEL_NUMBER]
app.get('/playpvrchannelbynumber', function(request, response) {
    validateRequest(request, response).then(() => {
        kodiHandler.kodiPlayChannelByNumber(request, response);
    });
});

app.get('/', (request, response) => {
    response.sendFile(`${__dirname}/views/index.html`);
});

// listen for requests :)
const listener = app.listen(config.globalConf.listenerPort, () => {
    console.log(`Your app is listening on port ${listener.address().port}`);
});
