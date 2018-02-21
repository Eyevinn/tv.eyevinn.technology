const restify = require('restify');
const debug = require('debug')('assetmgr-server');

const VODs = [
  { id: 1, uri: "https://maitv-vod.lab.eyevinn.technology/streaming+tech+2017+HLS/Arash/Arash.m3u8" },
  { id: 2, uri: "https://maitv-vod.lab.eyevinn.technology/streaming+tech+2017+HLS/Ozer/Ozer.m3u8" },
  { id: 3, uri: "https://maitv-vod.lab.eyevinn.technology/streaming+tech+2017+HLS/Springhall_Jones/Springhall.m3u8" },
  { id: 4, uri: "https://maitv-vod.lab.eyevinn.technology/streaming+tech+2017+HLS/Lindqvist_Skaneby/Lindqvist.m3u8" },
  { id: 5, uri: "https://maitv-vod.lab.eyevinn.technology/streaming+tech+2017+HLS/Widlund/Widlund.m3u8" },
  { id: 6, uri: "https://maitv-vod.lab.eyevinn.technology/stswe1/master.m3u8" },
  { id: 7, uri: "https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8" }
];

class AssetManager {
  constructor() {
    this.server = restify.createServer();

    this.server.get('/nextVod/random', this._handleNextVodByRandom.bind(this));
  }

  listen(port) {
    this.server.listen(port, () => {
      debug('%s listening at %s', this.server.name, this.server.url);
    });
  }

  _handleNextVodByRandom(req, res, next) {
    const rndIdx = Math.floor(Math.random() * VODs.length);
    res.send(200, VODs[rndIdx]);
    next();
  }
}

module.exports = AssetManager;