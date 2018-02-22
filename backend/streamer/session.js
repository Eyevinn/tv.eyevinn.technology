const crypto = require('crypto');
const request = require('request');
const debug = require('debug')('streamer-session');
const HLSVod = require('vod-to-live.js');

const SessionState = Object.freeze({
  VOD_INIT: 1,
  VOD_PLAYING: 2,
  VOD_NEXT_INIT: 3,
  VOD_NEXT_INITIATING: 4,
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
      lastM3u8: null,
    };
    this.currentVod;
  }

  get sessionId() {
    return this._sessionId;
  }

  getMediaManifest(bw) {
    return new Promise((resolve, reject) => {
      this._tick().then(() => {
        if (this._state.state === SessionState.VOD_NEXT_INITIATING) {
          // Serve from cache
          this._state.state = SessionState.VOD_PLAYING;
          debug(`[${this._sessionId}]: serving m3u8 from cache`);
          resolve(this._state.lastM3u8);
        } else {
          const realBw = this._getNearestBandwidth(bw);
          const m3u8 = this.currentVod.getLiveMediaSequences(this._state.mediaSeq, realBw, this._state.vodMediaSeq);
          debug(`[${this._sessionId}]: bandwidth=${realBw} vodMediaSeq=${this._state.vodMediaSeq}`);
          this._state.lastM3u8 = m3u8;
          this._state.vodMediaSeq++;
          resolve(m3u8);
        }
      }).catch(reject);
    });
  }

  getMasterManifest() {
    return new Promise((resolve, reject) => {
      this._tick().then(() => {
        let m3u8 = "#EXTM3U\n";
        this.currentVod.getUsageProfiles().forEach(profile => {
          m3u8 += '#EXT-X-STREAM-INF:BANDWIDTH=' + profile.bw + ',RESOLUTION=' + profile.resolution + ',CODECS="' + profile.codecs + '"\n';
          m3u8 += "master" + profile.bw + ".m3u8;session=" + this._sessionId + "\n";
        });
        resolve(m3u8);
      }).catch(reject);
    });
  }

  _tick() {
    return new Promise((resolve, reject) => {
      // State machine
      let newVod;

      switch(this._state.state) {
        case SessionState.VOD_INIT:
          debug(`[${this._sessionId}]: state=VOD_INIT`);
          this._getNextVod().then(uri => {
            debug(`[${this._sessionId}]: got first VOD uri=${uri}`);
            newVod = new HLSVod(uri);
            this.currentVod = newVod;
            return this.currentVod.load();
          }).then(() => {
            debug(`[${this._sessionId}]: first VOD loaded`);
            debug(newVod);
            this._state.state = SessionState.VOD_PLAYING;
            this._state.vodMediaSeq = this.currentVod.getLiveMediaSequencesCount() - 5;
            if (this._state.vodMediaSeq < 0) {
              this._state.vodMediaSeq = 0;
            }
            //this._state.vodMediaSeq = 0;
            resolve();
          }).catch(reject);
          break;
        case SessionState.VOD_PLAYING:
          debug(`[${this._sessionId}]: state=VOD_PLAYING (${this._state.vodMediaSeq}, ${this.currentVod.getLiveMediaSequencesCount()})`);
          if (this._state.vodMediaSeq === this.currentVod.getLiveMediaSequencesCount() - 1) {
            this._state.state = SessionState.VOD_NEXT_INIT;
          }
          resolve();
          break;
        case SessionState.VOD_NEXT_INITIATING:
          debug(`[${this._sessionId}]: state=VOD_NEXT_INITIATING`);
          resolve();
          break;
        case SessionState.VOD_NEXT_INIT:
          debug(`[${this._sessionId}]: state=VOD_NEXT_INIT`);
          const length = this.currentVod.getLiveMediaSequencesCount();
          this._state.state = SessionState.VOD_NEXT_INITIATING;
          this._getNextVod().then(uri => {
            debug(`[${this._sessionId}]: got next VOD uri=${uri}`);
            newVod = new HLSVod(uri);
            return newVod.loadAfter(this.currentVod);
          }).then(() => {
            debug(`[${this._sessionId}]: next VOD loaded`);
            debug(newVod);
            this.currentVod = newVod;
            debug(`[${this._sessionId}]: msequences=${this.currentVod.getLiveMediaSequencesCount()}`);
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
        debug(data);
        resolve(data.uri);
      }).on('error', err => {
        reject(err);
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
