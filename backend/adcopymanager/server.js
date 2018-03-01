const restify = require('restify');
const debug = require('debug')('adcopymgr-server');
const HlsAd = require('./ad.js');

const ADS = [
  { adid: 1, uri: 'https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/master.m3u8' },
];

const AD_CACHE = {};

class AdCopyManager {
  constructor() {
    this.server = restify.createServer();
    this.server.use(restify.plugins.queryParser());

    this.server.get('/ad/:adId', this._handleGetAdById.bind(this));
  }

  listen(port) {
    this.server.listen(port, () => {
      debug('%s listening at %s', this.server.name, this.server.url);
    });
  }

  _getAd(ad) {
    return new Promise((resolve, reject) => {
      if (AD_CACHE[ad.adid]) {
        resolve(AD_CACHE[ad.adid]);
      } else {
        const hlsAd = new HlsAd(ad.uri);
        hlsAd.load().then(() => {
          AD_CACHE[ad.adid] = hlsAd;
          resolve(hlsAd);
        }).catch(reject);
      }
    });
  }

  _handleGetAdById(req, res, next) {
    debug(req.params);
    const adId = req.params.adId;
    const ad = ADS.find(ad => ad.adid == adId);
    this._getAd(ad).then(hlsAd => {
      res.send(200, hlsAd.segments);
    }).catch(err => {
      next(err);
    });
  }
}

module.exports = AdCopyManager;
