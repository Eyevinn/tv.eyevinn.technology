var overlayTimer;
var mainPlayer = {
  uri: '',
  tech: null,
  videoElement: null
};

function initiatePlayer(hlsUri, videoElementId) {
  return new Promise(function(resolve, reject) {
    var videoElement = document.getElementById(videoElementId);
    videoElement.addEventListener('playing', function(event) {
      var container = document.getElementById('videocontainer');
      container.className = 'video-playing';
    });

    if (Hls.isSupported()) {
      var hls = new Hls();
      if (videoElementId === 'mainview') {
        mainPlayer.tech = hls;
        mainPlayer.uri = hlsUri;
        mainPlayer.videoElement = videoElement;
      }
      hls.attachMedia(videoElement);
      hls.on(Hls.Events.MEDIA_ATTACHED, function () {
        hls.loadSource(hlsUri);
      });
      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        resolve(videoElement);
      });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUri;
      videoElement.addEventListener('canplay', function() {
        resolve(videoElement);
      });
    }
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

function initiateClock() {
  return new Promise(function(resolve, reject) {
    var clockElement = document.getElementById('clock');

    function formatTime(s) { 
      var m = s.match(/^([0-9][0-9]:)([0-9][0-9]):*/);
      return m[1] + m[2];
    }

    if (clockElement) {
      var d = new Date();
      clockElement.innerHTML = formatTime(d.toTimeString());
      setInterval(function() {
        clockElement.innerHTML = formatTime(new Date().toTimeString());
      }, 500);
    }

  });
}