var overlayTimer;

function initiatePlayer(hlsUri, videoElementId) {
  return new Promise(function(resolve, reject) {
    var videoElement = document.getElementById(videoElementId);
    var hls = new Hls();
    hls.attachMedia(videoElement);
    hls.on(Hls.Events.MEDIA_ATTACHED, function () {
      hls.loadSource(hlsUri);
    });
    hls.on(Hls.Events.MANIFEST_PARSED, function() {
      resolve(videoElement);
    });
    videoElement.addEventListener('playing', function(event) {
      var container = document.getElementById('videocontainer');
      container.className = 'video-playing';
    });
  });
}

function initiateControllers(videoElement) {
  return new Promise(function(resolve, reject) {
    document.addEventListener('mousemove', function(event) {
      clearTimeout(overlayTimer);
      var overlayElement = document.getElementById('overlay');
      overlayElement.className = 'overlay overlay-visible';

      overlayTimer = setTimeout(function() {
        var overlayElement = document.getElementById('overlay');
        overlayElement.className = 'overlay overlay-hidden';        
      }, 5000);
    });

    videoElement.addEventListener('click', function(event) {
      event.target.muted = event.target.muted ? false : true;
    });
    resolve();
  });
}