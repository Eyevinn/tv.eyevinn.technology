var overlayTimer;
var audioOverlayTimer;
var tickerOverlayTimer;
var mainPlayer = {
  uri: '',
  tech: null,
  videoElement: null
};

function initiatePlayer(hlsUri, videoElementId, playlist, noresume) {
  return new Promise(function(resolve, reject) {
    var videoElement = document.getElementById(videoElementId);
    videoElement.addEventListener('playing', function(event) {
      var container = document.getElementById('videocontainer');
      container.className = 'video-playing';
      var playButton = document.getElementById('playbutton');
      playButton.className = 'playbtn playbtn-hidden';
    });

    var sessionId = getSessionIdFromCookie();
    var queryParams = {};
    if (sessionId && !noresume) {
      queryParams['session'] = sessionId;
    }
    if (playlist) {
      queryParams['playlist'] = playlist;
    }

    if (Object.keys(queryParams).length > 0) {
      hlsUri += '?' + Object.keys(queryParams).map(function(key) {
        return [key, queryParams[key]].map(encodeURIComponent).join("=");
      }).join("&");
    }

    if (Hls.isSupported() && !isMobileDevice()) {
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
      hls.on(Hls.Events.MANIFEST_LOADED, function(event, data) {
        var sessionId = data.networkDetails.getResponseHeader('X-Session-Id');
        document.cookie = 'event_stream_session_id=' + sessionId;
      });
      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        resolve(videoElement);
      });
      hls.on(Hls.Events.ERROR, function(event, data) {
        if (data.fatal) {
          console.log("ERROR", data);
          switch (data.type) {
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("fatal media error encountered, try to recover");
              hls.recoverMediaError();
              break;
            default:
              console.log("cannot recover");
              hls.destroy();
              displayErrorDlg("Fatal error playing back stream");
              break;
          }
        }
      });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      videoElement.src = hlsUri;
      videoElement.addEventListener('canplay', function() {
      });
      resolve(videoElement);
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

function initiateControllers(videoElement, canAutoPlay) {
  return new Promise(function(resolve, reject) {
    if (!canAutoPlay) {
      var playButton = document.getElementById('playbutton');
      playButton.className = 'playbtn playbtn-visible';
      playButton.addEventListener('click', function(event) {
        videoElement.play();
      });
    }
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
    resolve();
  });
}

function initiateEventStreamPoller(streamUri) {
  return new Promise(function(resolve, reject) {
    setInterval(function() {
      var sessionId = getSessionIdFromCookie();
      if (sessionId) {
        getEvent(streamUri, sessionId).then(function(event) {
          eventHandler(event);
        });
      }
    }, 10000);
    resolve();
  });
}

function eventHandler(event) {
  switch(event.type) {
    case 'NEXT_VOD_SELECTED':
      updateMetadata('Coming up next', event.data);
      break;
    case 'NOW_PLAYING':
      updateMetadata('Now playing', event.data);
      break;
  }
}

function updateMetadata(title, metadata) {
  var metadataElement = document.getElementById('metadata');
  metadataElement.innerHTML = "<p>" + title + "</p>";
  metadataElement.innerHTML += "<h2>" + metadata.title + "</h2>";
}

function initiateTicker() {
  return new Promise(function(resolve, reject) {
    var tickerElement = document.getElementById('ticker');
    tickerElement.className = 'ticker-wrap ticker-visible';
    tickerOverlayTimer = setTimeout(function() {
      var s = tickerElement.className.replace('ticker-visible', 'ticker-hidden');
      tickerElement.className = s;
    }, 80000);
    resolve();
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

function isMobileDevice() {
  var userAgent = window.navigator.userAgent;
  return /iphone|ipod|ipad|android|blackberry|windows phone|iemobile|wpdesktop/
      .test(userAgent.toLowerCase()) &&
      !(/crkey/).test(userAgent.toLowerCase());
}

function getEvent(endpoint, sessionId) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.onloadend = function(event) {
      resolve(JSON.parse(event.target.response));
    }
    xhr.open('GET', endpoint + '/' + sessionId);
    xhr.send();
  });
}

function getSessionIdFromCookie() {
  var cookies = document.cookie.split(';');
  var sessionCookie = cookies.find(function(s) { return s.match(/event_stream_session_id/); });
  if (sessionCookie) {
    var sessionId = sessionCookie.split('=')[1];
    return sessionId;
  }
  return null;
}