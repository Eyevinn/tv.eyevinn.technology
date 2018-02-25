const restify = require('restify');
const debug = require('debug')('assetmgr-server');

const VODs = [
  { id: 1, title: "Vinngroup Promotion", uri: "https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8" },
  { id: 2, title: "Tears of Steel", uri: "https://maitv-vod.lab.eyevinn.technology/tearsofsteel_4k.mov/master.m3u8" },
  { id: 3, title: "Att jobba på Vinnter", uri: "https://maitv-vod.lab.eyevinn.technology/Attjobbapavinnter.mp4/master.m3u8" },
  { id: 4, title: "David Springall and Andy Jones at Streaming Tech Sweden 2017", uri: "https://maitv-vod.lab.eyevinn.technology/stswe17-springalljones.mp4/master.m3u8" },
  { id: 5, title: "Jan Ozer at Streaming Tech Sweden 2017", uri: "https://maitv-vod.lab.eyevinn.technology/stswe17-ozer.mp4/master.m3u8" },
  { id: 6, title: "Come Shine recording at Atlantis Studios", uri: "https://maitv-vod.lab.eyevinn.technology/ComeShineiatlantis.mp4/master.m3u8" },
  { id: 7, title: "Reportage från Klassiker-garaget", uri: "https://maitv-vod.lab.eyevinn.technology/Klassiker_garaget.mp4/master.m3u8" },
  { id: 8, title: "Marcus Lindén at Streaming Tech Sweden 2017", uri: "https://maitv-vod.lab.eyevinn.technology/stswe17-linden.mp4/master.m3u8" },
];

const PLAYLISTs = [
  { id: "stswe17", title: "Streaming Tech Sweden 2017", assets: [4, 5, 8] },
  { id: "skaneby", title: "Skaneby productions", assets: [3, 6, 7] },
];

class AssetManager {
  constructor() {
    this.server = restify.createServer();
    this.server.use(restify.plugins.queryParser());

    this.server.get('/nextVod/:playlist', this._handleNextVod.bind(this));
  }

  listen(port) {
    this.server.listen(port, () => {
      debug('%s listening at %s', this.server.name, this.server.url);
    });
  }

  _handleNextVod(req, res, next) {
    debug(req.params);
    debug(req.query);
    if (req.params['playlist'] === 'random') {
      const rndIdx = Math.floor(Math.random() * VODs.length);
      res.send(200, VODs[rndIdx]);
    } else {
      const playlist = PLAYLISTs.find(p => p.id === req.params['playlist']);
      const position = req.query['position'] || 0;
      if (playlist) {
        let assets = [];
        let nextPos = position;
        nextPos++;
        if (nextPos > playlist.assets.length) {
          nextPos = 0;
        }
        debug(nextPos);
        playlist.assets.forEach(assetId => { assets.push(this._lookupVodById(assetId)); });
        res.send(200, assets[nextPos]);
      }
    }
    next();
  }

  _lookupVodById(id) {
    return VODs.find(v => v.id === id);
  }
}

module.exports = AssetManager;

