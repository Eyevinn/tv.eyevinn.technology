const m3u8 = require('m3u8');
const request = require('request');
const url = require('url');
const debug = require('debug')('adcopymgr-hlsad');

class HlsAd {
  constructor(hlsUri) {
    this._hlsUri = hlsUri;
    this._usageProfile = [];
    this._segments = {};
  }

  load() {
    return new Promise((resolve, reject) => {
      const parser = m3u8.createStream();

      parser.on('m3u', m3u => {
        let mediaManifestPromises = [];
        let baseUrl;
        const m = this._hlsUri.match('^(.*)/.*?$');
        if (m) {
          baseUrl = m[1] + '/';
        }
        for (let i = 0; i < m3u.items.StreamItem.length; i++) {
          const streamItem = m3u.items.StreamItem[i];
          let mediaManifestUrl = url.resolve(baseUrl, streamItem.properties.uri);
          if (streamItem.attributes.attributes['resolution']) {
            this._usageProfile.push({
              bw: streamItem.attributes.attributes['bandwidth'],
              codecs: streamItem.attributes.attributes['codecs'],
              resolution: streamItem.attributes.attributes['resolution'][0] + 'x' + streamItem.attributes.attributes['resolution'][1]
            });
            mediaManifestPromises.push(this._loadMediaManifest(mediaManifestUrl, streamItem.attributes.attributes['bandwidth']));
          }
        }
        Promise.all(mediaManifestPromises)
        .then(resolve)
        .catch(reject);

      });

      parser.on('error', err => {
        reject(err);
      });

      request.get(this._hlsUri)
      .on('error', err => {
        reject(err);
      })
      .pipe(parser);
    });
  }

  get segments() {
    return this._segments;
  }

  _loadMediaManifest(mediaManifestUri, bandwidth) {
    return new Promise((resolve, reject) => {
      const parser = m3u8.createStream();
      let bw = bandwidth;
      debug(`Loading media manifest for bandwidth=${bw}`);

      if (!this._segments[bw]) {
        this._segments[bw] = [];
      }

      parser.on('m3u', m3u => {
        for (let i = 0; i < m3u.items.PlaylistItem.length; i++) {
          const playlistItem = m3u.items.PlaylistItem[i];
          let segmentUri;
          let baseUrl;

          const m = mediaManifestUri.match('^(.*)/.*?$');
          if (m) {
            baseUrl = m[1] + '/';
          }

          if (playlistItem.properties.uri.match('^http')) {
            segmentUri = playlistItem.properties.uri;
          } else {
            segmentUri = url.resolve(baseUrl, playlistItem.properties.uri);
          }
          this._segments[bw].push([
            playlistItem.properties.duration,
            segmentUri,
          ]);
        }
        resolve();
      });

      parser.on('error', err => {
        reject(err);
      });

      request.get(mediaManifestUri)
      .on('error', err => {
        reject(err);
      })
      .pipe(parser);      
    });
  }
}

module.exports = HlsAd;