const crypto = require('crypto');
const request = require('request');
const debug = require('debug')('streamer-session');
const HLSVod = require('vod-to-live.js');

const SessionState = Object.freeze({
  VOD_INIT: 1,
  VOD_PLAYING: 2,
  VOD_NEXT_INIT: 3,
});

class Session {
  constructor(usageProfile, assetMgrUri, playlist) {
    this._usageProfile = usageProfile;
    this._assetMgrUri = assetMgrUri;
    this._playlist = playlist;
    this._sessionId = crypto.randomBytes(20).toString('hex');
    this._state = {
      mediaSeq: 0,
      vodMediaSeq: 0,
      state: SessionState.VOD_INIT,
    };
    this.currentVod;
  }

  get sessionId() {
    return this._sessionId;
  }

  getMediaManifest(bw) {
    return new Promise((resolve, reject) => {
      this._tick().then(() => {
        const realBw = this._getNearestBandwidth(bw);
        const m3u8 = this.currentVod.getLiveMediaSequences(this._state.mediaSeq, realBw, this._state.vodMediaSeq);
        debug(`[${this._sessionId}]: bandwidth=${realBw} vodMediaSeq=${this._state.vodMediaSeq}`);
        this._state.vodMediaSeq++;
        resolve(m3u8);
      }).catch(reject);
    });
  }

  getMasterManifest() {
    return new Promise((resolve, reject) => {
      this._tick().then(() => {
        let m3u8 = "#EXTM3U\n";
        Object.keys(this._usageProfile).forEach(bw => {
          const v = this._usageProfile[bw];
          m3u8 += '#EXT-X-STREAM-INF:BANDWIDTH=' + bw + ',RESOLUTION=' + v[0] + ',CODECS="' + v[1] + '"\n';
          m3u8 += "master" + bw + ".m3u8;session=" + this._sessionId + "\n";
        });
        resolve(m3u8);
      }).catch(reject);
    });
  }

  _tick() {
    return new Promise((resolve, reject) => {
      // State machine
      switch(this._state.state) {
        case SessionState.VOD_INIT:
          debug(`[${this._sessionId}]: state=VOD_INIT`);
          this._getNextVod().then(hlsVod => {
            this.currentVod = hlsVod;
            return this.currentVod.load();
          }).then(() => {
            this._state.state = SessionState.VOD_PLAYING;
            this._state.vodMediaSeq = this.currentVod.getLiveMediaSequencesCount() - 5;
            //this._state.vodMediaSeq = 0;
            resolve();
          }).catch(reject);
          break;
        case SessionState.VOD_PLAYING:
          debug(`[${this._sessionId}]: state=VOD_PLAYING`);
          if (this._state.vodMediaSeq === this.currentVod.getLiveMediaSequencesCount() - 1) {
            this._state.state = SessionState.VOD_NEXT_INIT;
          }
          resolve();
          break;
        case SessionState.VOD_NEXT_INIT:
          debug(`[${this._sessionId}]: state=VOD_NEXT_INIT`);
          const length = this.currentVod.getLiveMediaSequencesCount();
          let newVod;
          this._getNextVod().then(hlsVod => {
            newVod = hlsVod;
            return hlsVod.loadAfter(this.currentVod);
          }).then(() => {
            this.currentVod = newVod;
            this._state.state = SessionState.VOD_PLAYING;
            this._state.vodMediaSeq = 0;
            this._state.mediaSeq += length;
            resolve();
          }).catch(reject);
          break;
        default:
          reject("Invalid state: " + this.state.state);
      }

    });
  }

  _getNextVod() {
    return new Promise((resolve, reject) => {
      request.get(this._assetMgrUri + '/nextVod/' + this._playlist, (err, resp, body) => {
        const data = JSON.parse(body);
        debug(`[${this._sessionId}]: nextVod=${data.uri}`);
        const newVod = new HLSVod(data.uri);
        resolve(newVod);
      });
    });
  }

  _getNearestBandwidth(bandwidth) {
    const availableBandwidths = this.currentVod.getBandwidths().sort((a,b) => b - a);
    for (let i = 0; i < availableBandwidths.length; i++) {
      if (bandwidth >= availableBandwidths[i]) {
        return availableBandwidths[i];
      }
    }
    return availableBandwidths[availableBandwidths.length - 1];
  }
}

module.exports = Session;