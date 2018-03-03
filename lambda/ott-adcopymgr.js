'use strict';
console.log('Loading function');
const request = require('request');
const stream = require('stream');
const AWS = require('aws-sdk');
const URL = require('url');

const API_KEY = process.env.API_KEY;

const ADS = [
  { 
    adid: 1, uri: 'https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/master.m3u8',
    segments: {
      "659000":[[10.846444,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/600/600-00000.ts"],[7.2,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/600/600-00001.ts"],[7.2,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/600/600-00002.ts"],[7.2,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/600/600-00003.ts"],[10.8,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/600/600-00004.ts"],[1.84,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/600/600-00005.ts"]],
      "1091000":[[10.88,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/1000/1000-00000.ts"],[7.2,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/1000/1000-00001.ts"],[7.2,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/1000/1000-00002.ts"],[7.2,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/1000/1000-00003.ts"],[10.8,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/1000/1000-00004.ts"],[1.84,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/1000/1000-00005.ts"]],
      "2270000":[[10.88,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/2000/2000-00000.ts"],[7.2,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/2000/2000-00001.ts"],[7.2,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/2000/2000-00002.ts"],[7.2,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/2000/2000-00003.ts"],[10.8,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/2000/2000-00004.ts"],[1.84,"https://maitv-vod.lab.eyevinn.technology/Bingolotto_hornan.mov/2000/2000-00005.ts"]]
    },
  }
]

function s3upload(fname) {
  const pass = new stream.PassThrough();
  const s3 = new AWS.S3();
  s3.upload({
    Bucket: 'maitv-ad-input',
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
      if (event.path.match(/^\/ad\/.*/)) {
        const m = event.path.match(/^\/ad\/(.*)/);
        const adId = m[1];
        console.log(adId);
        const asset = ADS.find(a => a.adid == adId);
        if (!asset) {
          done(new Error(`Ad with id ${adId} not found`));
        } else {
          done(null, asset);
        }
      } else {
        done(new Error(`Unsupported path "${event.path}"`));
      }
      break;
    case 'POST':
      if (event.path === '/ad') {
        const data = JSON.parse(event.body);
        const fname = parseFilename(data.uri);
        const adid = data.adid;
        const clean = fname.clean;
        const hlsUri = `https://maitv-vod.lab.eyevinn.technology/ads/${clean}/master.m3u8`;

        if (!adid) {
          done(new Error('Missing adid in request'));
        } else {
          if (authenticate(event)) {
            request.get(data.uri)
            .on('error', err => {
              done(new Error(err));
            })
            .pipe(s3upload(clean))
            .on('end', () => {
              done(null, { adid: adid, filename: clean, uri: hlsUri })
            });
          } else {
            done(new Error('Invalid API-KEY provided. All attempts are logged'));
          }
        }
      }
      break;
    default:
      done(new Error(`Unsupported method "${event.httpMethod}"`));
  }
};
