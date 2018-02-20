const StreamerServer = require('./backend/streamer/server.js');
const AssetManager = require('./backend/assetmanager/server.js');

const ROLE = process.env.ROLE || 'single-server';
const ASSETMGR_URI = process.env.ASSETMGR_URI || 'http://localhost:8001';

if (ROLE === 'single-server') {
  const streamer = new StreamerServer(ASSETMGR_URI);
  streamer.listen(process.env.STREAMER_PORT || 8000);

  const assetMgr = new AssetManager();
  assetMgr.listen(process.env.ASSETMGR_PORT || 8001);  
} else if (ROLE === 'streamer-server') {
  const streamer = new StreamerServer(ASSETMGR_URI);
  streamer.listen(process.env.PORT || 8000);
} else if (ROLE === 'assetmgr-server') {
  const assetMgr = new AssetManager();
  assetMgr.listen(process.env.PORT || 8001);
}