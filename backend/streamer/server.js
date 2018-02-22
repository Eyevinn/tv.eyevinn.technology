const restify = require('restify');
const errs = require('restify-errors');
const debug = require('debug')('streamer-server');
const Session = require('./session.js');

const DEFAULT_USAGE_PROFILE = {
  "12494856": [ "960x540", "mp4a.40.2, avc1.4d001f" ],
  "5480576": [ "640x360", "mp4a.40.2, avc1.4d001e" ],
  "3885960": [ "640x360", "mp4a.40.2, avc1.4d001e" ],
  "2050328": [ "640x360", "mp4a.40.2, avc1.4d001e" ],
  "718536": [ "428x240", "mp4a.40.2, avc1.42e015" ],
  "391792": [ "428x240", "mp4a.40.2, avc1.42e015" ],
};

const sessions = {}; // Should be a persistent store...

class StreamerServer {
  constructor(assetMgrUri) {
    this.server = restify.createServer();
    this.assetMgrUri = assetMgrUri;

    this.server.get('/live/master.m3u8', this._handleMasterManifest.bind(this));
    this.server.get(/^\/live\/master(\d+).m3u8;session=(.*)$/, this._handleMediaManifest.bind(this));
  }

  listen(port) {
    this.server.listen(port, () => {
      debug('%s listening at %s', this.server.name, this.server.url);
    });
  }

  _handleMasterManifest(req, res, next) {
    debug('req.url=' + req.url);
    const playlist = 'random';
    const session = new Session(DEFAULT_USAGE_PROFILE, this.assetMgrUri, playlist);
    sessions[session.sessionId] = session;
    session.getMasterManifest().then(body => {
      debug(`[${session.sessionId}] body=`);
      debug(body);
      res.sendRaw(200, body, { 
        "Content-Type": "application/x-mpegURL",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "max-age=4",
      });
      next();
    }).catch(err => {
      next(this._errorHandler(err));
    });    
  }

  _handleMediaManifest(req, res, next) {
    debug(`req.url=${req.url}`);
    const session = sessions[req.params[1]];
    if (session) {
      session.getMediaManifest(req.params[0]).then(body => {
        debug(`[${session.sessionId}] body=`);
        debug(body);
        res.sendRaw(200, body, { 
          "Content-Type": "application/x-mpegURL",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "max-age=4",
        });
        next();
      }).catch(err => {
        next(this._errorHandler(err));
      })
    } else {
      const err = new errs.NotFoundError('Invalid session');
      next(err);
    }
  }

  _errorHandler(errMsg) {
    console.error(errMsg);
    const err = new errs.InternalServerError(errMsg);
    return err;    
  }
}

module.exports = StreamerServer;
