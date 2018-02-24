'use strict';
console.log('Loading function');

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});

const FALLBACK_ASSETS = [
  { id: 1, uri: "https://maitv-vod.lab.eyevinn.technology/streaming+tech+2017+HLS/Arash/Arash.m3u8" },
  { id: 2, uri: "https://maitv-vod.lab.eyevinn.technology/streaming+tech+2017+HLS/Ozer/Ozer.m3u8" },
  { id: 3, uri: "https://maitv-vod.lab.eyevinn.technology/streaming+tech+2017+HLS/Springhall_Jones/Springhall.m3u8" },
  { id: 4, uri: "https://maitv-vod.lab.eyevinn.technology/streaming+tech+2017+HLS/Lindqvist_Skaneby/Lindqvist.m3u8" },
  { id: 5, uri: "https://maitv-vod.lab.eyevinn.technology/streaming+tech+2017+HLS/Widlund/Widlund.m3u8" },
  { id: 6, uri: "https://maitv-vod.lab.eyevinn.technology/stswe1/master.m3u8" },
  { id: 7, uri: "https://maitv-vod.lab.eyevinn.technology/VINN.mp4/master.m3u8" },
]
    
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
              const params = {
                  Key: {
                      "id": {
                        N: rndItemId.toString() 
                      }
                  },
                  TableName: 'maitv-assets'
              };
              console.log(params);
              ddb.getItem(params, (err2, data2) => {
                console.log(data2);
                if (err2) {
                    console.log(err2);
                    reject(err2);
                } else {
                    resolve({ id: rndItemId, uri: data2.Item['uri'].S }); 
                }
              });
          }
       });
    });
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
            if (event.path === '/nextVod/random') {
                const rndIdx = Math.floor(Math.random() * FALLBACK_ASSETS.length);
                getRandomItem().then(asset => {
                    console.log(asset);
                    done(null, asset);
                }).catch(() => {
                    done(null, FALLBACK_ASSETS[rndIdx]);
                });
            }
            break;
        default:
            done(new Error(`Unsupported method "${event.httpMethod}"`));
    }
};
