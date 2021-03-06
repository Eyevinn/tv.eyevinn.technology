
const AWS = require('aws-sdk');
const elastictranscoder = new AWS.ElasticTranscoder();

function basename(path) {
  return path.split('/').reverse()[0].split('.')[0];
}

function createContentJob(event) {
  const key = event.Records[0].s3.object.key;
  const params = {
    Input: { 
      Key: key
    },
    PipelineId: '1509711276362-h9b4pp',
    OutputKeyPrefix: key + '/',
    Outputs: [
      {
        Key: '2000/2000-',
        PresetId: '1351620000001-200010',
        SegmentDuration: '8.0',
      },
      {
        Key: '1000/1000-',
        PresetId: '1351620000001-200030',
        SegmentDuration: '8.0',
      },
      {
        Key: '600/600-',
        PresetId: '1351620000001-200040',
        SegmentDuration: '8.0',
      },
    ],
    Playlists: [
      {
        Format: 'HLSv3',
        Name: 'master',
        OutputKeys: [
          '2000/2000-',
          '1000/1000-',
          '600/600-'
        ]
      }
    ]
  };
  return params;
}

function createAdJob(event) {
  const key = event.Records[0].s3.object.key;
  const params = {
    Input: { 
      Key: key
    },
    PipelineId: '1520068945322-v57tqk',
    OutputKeyPrefix: 'ads/' + key + '/',
    Outputs: [
      {
        Key: '2000/2000-',
        PresetId: '1351620000001-200010',
        SegmentDuration: '8.0',
      },
      {
        Key: '1000/1000-',
        PresetId: '1351620000001-200030',
        SegmentDuration: '8.0',
      },
      {
        Key: '600/600-',
        PresetId: '1351620000001-200040',
        SegmentDuration: '8.0',
      },
    ],
    Playlists: [
      {
        Format: 'HLSv3',
        Name: 'master',
        OutputKeys: [
          '2000/2000-',
          '1000/1000-',
          '600/600-'
        ]
      }
    ]
  };
  return params;
}

exports.handler = (event, context) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const bucketName = event.Records[0].s3.bucket.name;
  let params;
  if (bucketName === 'maitv-input') {
    params = createContentJob(event);
  } else if (bucketName === 'maitv-ad-input') {
    params = createAdJob(event);
  }

  elastictranscoder.createJob(params, function(err, data) {
    if (err){
      console.log(err, err.stack); // an error occurred
      context.fail();
      return;
    }
  });
};
