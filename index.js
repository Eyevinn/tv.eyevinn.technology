const request = require('request');
const StreamerServer = require('eyevinn-channel-engine');
const AssetManager = require('./backend/assetmanager/server.js');
const AdCopyManager = require('./backend/adcopymanager/server.js');

const ROLE = process.env.ROLE || 'single-server';
const ASSETMGR_URI = process.env.ASSETMGR_URI || 'http://localhost:8001';
const ADCOPYMGR_URI = process.env.ADCOPYMGR_URI || 'http://localhost:8002';

class IFAssetManager {
  constructor(assetMgrUri) {
    this._assetMgrUri = assetMgrUri;
    this._sessions = {};
  }

  getNextVod(sessionId, category) {
    return new Promise((resolve, reject) => {
      if (!this._sessions[sessionId]) {
        this._sessions[sessionId] = {
          position: 0,
          playlist: category || 'random',
        }
      }
      this._sessions[sessionId].position++;
      const nextVodUri = this._assetMgrUri + '/nextVod/' + this._sessions[sessionId].playlist + '?position=' + this._sessions[sessionId].position;
      request.get(nextVodUri, (err, resp, body) => {
        const data = JSON.parse(body);
        if (data.playlistPosition !== undefined) {
          this._sessions[sessionId].position = data.playlistPosition;
        }
        this.currentMetadata = {
          id: data.id,
          title: data.title || '',
        };
        resolve({ id: data.id, title: data.title || '', uri: data.uri });
      }).on('error', err => {
        reject(err);
      });
    });
  }

  getNextVodById(sessionId, id) {
    return new Promise((resolve, reject) => {
      if (!this._sessions[sessionId]) {
        this._sessions[sessionId] = {
          position: 0,
          playlist: 'random',
        };
      }
      const assetUri = this._assetMgrUri + '/vod/' + id;
      request.get(assetUri, (err, resp, body) => {
        const data = JSON.parse(body);
        resolve({ id: data.id, title: data.title || '', uri: data.uri });
      }).on('error', err => {
        reject(err);
      });
    });
  }
}

const ifaceAssetMgr = new IFAssetManager(ASSETMGR_URI);

if (ROLE === 'single-server') {
  const streamer = new StreamerServer(ifaceAssetMgr);
  streamer.listen(process.env.STREAMER_PORT || 8000);

  const assetMgr = new AssetManager();
  assetMgr.listen(process.env.ASSETMGR_PORT || 8001);

  const adCopyMgr = new AdCopyManager();
  adCopyMgr.listen(process.env.ADCOPYMGR_PORT || 8002);

} else if (ROLE === 'streamer-server') {
  const streamer = new StreamerServer(ifaceAssetMgr);
  streamer.listen(process.env.PORT || 8000);
} else if (ROLE === 'assetmgr-server') {
  const assetMgr = new AssetManager();
  assetMgr.listen(process.env.PORT || 8001);
}