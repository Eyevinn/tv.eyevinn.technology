const StreamerServer = require('eyevinn-channel-engine');
const AssetManager = require('./backend/assetmanager/server.js');
const AdCopyManager = require('./backend/adcopymanager/server.js');

const ROLE = process.env.ROLE || 'single-server';
const ASSETMGR_URI = process.env.ASSETMGR_URI || 'http://localhost:8001';
const ADCOPYMGR_URI = process.env.ADCOPYMGR_URI || 'http://localhost:8002';

if (ROLE === 'single-server') {
  const streamer = new StreamerServer(ASSETMGR_URI, ADCOPYMGR_URI);
  streamer.listen(process.env.STREAMER_PORT || 8000);

  const assetMgr = new AssetManager();
  assetMgr.listen(process.env.ASSETMGR_PORT || 8001);

  const adCopyMgr = new AdCopyManager();
  adCopyMgr.listen(process.env.ADCOPYMGR_PORT || 8002);

} else if (ROLE === 'streamer-server') {
  const streamer = new StreamerServer(ASSETMGR_URI, ADCOPYMGR_URI);
  streamer.listen(process.env.PORT || 8000);
} else if (ROLE === 'assetmgr-server') {
  const assetMgr = new AssetManager();
  assetMgr.listen(process.env.PORT || 8001);
}