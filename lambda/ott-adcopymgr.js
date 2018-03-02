'use strict';
console.log('Loading function');

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
        done(null, asset);
      } else {
        done(new Error(`Unsupported path "${event.path}"`));
      }
      break;
    default:
      done(new Error(`Unsupported method "${event.httpMethod}"`));
  }
};
