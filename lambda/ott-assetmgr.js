'use strict';
console.log('Loading function');

const API_KEY = process.env.API_KEY;

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});
const URL = require('url');
const request = require('request');
const stream = require('stream');

const FALLBACK_ASSETS = [
  { id: 1, title: "Vinngroup Promotion", uri: "https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8" },
  { id: 2, title: "Tears of Steel", uri: "https://maitv-vod.lab.eyevinn.technology/tearsofsteel_4k.mov/master.m3u8" },
  { id: 3, title: "Att jobba på Vinnter", uri: "https://maitv-vod.lab.eyevinn.technology/Attjobbapavinnter.mp4/master.m3u8"  },
  { id: 4, title: "Jan Ozer at Streaming Tech Sweden 2017", uri: "https://maitv-vod.lab.eyevinn.technology/stswe17-ozer.mp4/master.m3u8" },
  { id: 5, title: "Come Shine recording at Atlantis Studios", uri: "https://maitv-vod.lab.eyevinn.technology/ComeShineiatlantis.mp4/master.m3u8" },
  { id: 6, title: "Reportage från Klassiker-garaget", uri: "https://maitv-vod.lab.eyevinn.technology/Klassiker_garaget.mp4/master.m3u8" },
  { id: 7, title: "Marcus Lindén at Streaming Tech Sweden 2017", uri: "https://maitv-vod.lab.eyevinn.technology/stswe17-linden.mp4/master.m3u8" },
]

const FALLBACK_PLAYLISTS = [
  { id: "stswe17", title: "Streaming Tech Sweden 2017", assets: [4, 5, 8] },
  { id: "skaneby", title: "Skaneby productions", assets: [3, 6, 7] },
];

function getRandomItem() {
  return new Promise((resolve, reject) => {
    ddb.describeTable({ TableName: 'maitv-assets' }, (err, data) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log(data);
        const itemCount = data.Table.ItemCount || 13;
        let rndItemId = Math.floor(Math.random() * (itemCount-1));
        rndItemId++;
        getItemById(rndItemId).then(resolve).catch(reject);
      }
    });
  });
}

function getItemById(id) {
  return new Promise((resolve, rejct) => {
    const params = {
      Key: {
        "id": { N: id.toString() }
      },
      TableName: 'maitv-assets'
    };
    console.log(params);
    ddb.getItem(params, (err, data) => {
      console.log(data);
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve({ id: data.Item['id'].N, uri: data.Item['uri'].S, title: data.Item['title'].S }); 
      }
    });
  });
}

function getPlaylist(playlistId) {
  return new Promise((resolve, reject) => {
    const params = {
      Key: {
        "id": { S: playlistId }
      },
      TableName: 'maitv-playlists'
    };
    console.log(params);
    ddb.getItem(params, (err, data) => {
      console.log(data);
      if (err) {
        console.log(err);
        reject(err);
      } else {
        let assets = [];
        data.Item['assets'].L.forEach(v => {
          assets.push(Number.parseInt(v.N));
        });
        resolve({ id: data.Item['id'].S, title: data.Item['title'].S, assets: assets });
      }
    });
  });
}

function authenticate(event) {
  if (API_KEY) {
    if (event.headers['X-API-KEY'] === API_KEY) {
      return true;
    } else {
      console.log('Invalid API-KEY provided!');
      return false;
    }
  } else {
    return true;
  }  
}

function parseFilename(uri) {
  const url = URL.parse(uri);
  const basename = url.pathname.split('/').reverse()[0].split('.')[0];
  const filename = url.pathname.split('/').reverse()[0];
  const clean = filename.replace(/[^0-9a-zA-Z]/g, '_');
  return {
    basename: basename,
    original: filename,
    clean: clean,
  };
}

function s3upload(fname) {
  const pass = new stream.PassThrough();
  const s3 = new AWS.S3();
  s3.upload({
    Bucket: 'maitv-input',
    Key: fname,
    Body: pass,
  }, (err, data) => {
    console.log(err, data);
    if (err) {
      pass.emit('error', err);
    }
  });
  return pass;
}

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const done = (err, res) => callback(null, {
    statusCode: err ? '400' : '200',
    body: err ? err.message : JSON.stringify(res),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  switch (event.httpMethod) {
    case 'GET':
      let nextPos;
      if (event.path === '/nextVod/random') {
        const rndIdx = Math.floor(Math.random() * FALLBACK_ASSETS.length);
        getRandomItem().then(asset => {
          console.log(asset);
          done(null, asset);
        }).catch(() => {
          console.log("Failed to access db, using fallback");
          done(null, FALLBACK_ASSETS[rndIdx]);
        });
      } else if (event.path.match(/^\/nextVod\/.*/)) {
        const m = event.path.match(/^\/nextVod\/(.*)/);
        const playlistId = m[1];
        nextPos = event.queryStringParameters ? event.queryStringParameters['position'] || 0: 0;
        nextPos++;
        console.log(playlistId);
        getPlaylist(playlistId).then(playlist => {
          console.log(playlist)
          if (nextPos > playlist.assets.length) {
            nextPos = 0;
          }
          const id = playlist.assets[nextPos];
          return getItemById(id);
        }).then(asset => {
          console.log(asset);
          let a = asset;
          a.playlistPosition = nextPos;
          done(null, a);
        }).catch(err => {
          console.log("Failed to access db, using fallback", err);
          const playlist = FALLBACK_PLAYLISTS.find(p => p.id === playlistId);
          if (!playlist) {
            done(new Error(`Playlist ${playlist} does not exist among fallback playlists`));
          } else {
            if (nextPos > playlist.assets.length) {
              nextPos = 0;
            }
            let asset = FALLBACK_ASSETS.find(v => v.id === playlist.assets[nextPos]);
            asset.playlistPosition = nextPos;
            done(null, asset);
          }
        });
      } else {
        done(new Error(`Unsupported path "${event.path}"`));
      }
      break;
    case 'POST':
      if (event.path === '/vod') {
        const data = JSON.parse(event.body);

        if (authenticate(event)) {
          const fname = parseFilename(data.uri);
          const clean = fname.clean;
          const hlsUri = `https://maitv-vod.lab.eyevinn.technology/${clean}/master.m3u8`;

          request.get(data.uri)
          .on('error', err => {
            done(new Error(err));
          })
          .pipe(s3upload(clean))
          .on('end', () => {
            done(null, { filename: clean, uri: hlsUri });
          });          
        } else {
          done(new Error('Invalid API-KEY provided. All attempts are logged'));
        }
      } else {
        done(new Error(`Unsupported path "${event.path}"`));        
      }
      break;
    default:
      done(new Error(`Unsupported method "${event.httpMethod}"`));
  }
};
