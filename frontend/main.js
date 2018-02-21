var overlayTimer;
var audioOverlayTimer;
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
      hls.on(Hls.Events.ERROR, function(event, data) {
        if (data.fatal) {
          console.log("ERROR", data);
        }
      });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = hlsUri;
      videoElement.addEventListener('canplay', function() {
        resolve(videoElement);
      });
    } else {
      reject('Unsupported device');
    }
  });
}

function displayErrorDlg(errmsg) {
  var errorElement = document.getElementById('errordlg');
  errorElement.className = 'error-visible';
  errorElement.innerHTML = errmsg;
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

    videoElement.addEventListener('volumechange', function(event) {
      var audioElement = document.getElementById('audiosymbol');
      if (event.target.muted) {
        audioElement.className = 'audio-muted audio-visible';
      } else {
        audioElement.className = 'audio-unmuted audio-visible';        
      }
      clearTimeout(audioOverlayTimer);
      audioOverlayTimer = setTimeout(function() {
        var s = audioElement.className.replace('audio-visible', 'audio-hidden');
        audioElement.className = s;
      }, 5000);
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

function parseQueryParams(search) {
  var re = /[?&]([^=&]+)(=?)([^&]*)/g;
  var params = {};
  while (m = re.exec(search)) {
    params[decodeURIComponent(m[1])] = (m[2] == '=' ? decodeURIComponent(m[3]) : true);
  }
  return params;
}