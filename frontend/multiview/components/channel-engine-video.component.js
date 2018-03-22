'use strict';

angular.module('channelEngineMultiview')
	.component('channelEngineVideo', {
		templateUrl: 'components/channel-engine-video.template.html',
    bindings: {
      videoindex: '@',
      muted: '<',
      mute:'&',
      unmute:'&',
    },
		controller: ['$scope', '$element', '$location', function ChannelEngineVideoController($scope, $element, $location) {
			var self = this;
			self.highlighted = false;
			self.sessionId = null;
			self.hls = new Hls();
			self.videoElement = $element.find('video')[0];
			self.$postLink = function() {
				self.playStream();
			};
      self.$onChanges = function(changesObj) {
        self._muteOrUnmuteAudio(changesObj);
      };

			self.playStream = function() {
				var hlsStreamUri;
				var eventStreamUri;
        if (self._isInDevMode()) {
					hlsStreamUri = 'http://localhost:8000/live/master.m3u8';
					eventStreamUri = 'http://localhost:8000/eventstream';
				} else {
					hlsStreamUri = 'https://ott-channel-engine.herokuapp.com/live/master.m3u8';
					eventStreamUri = 'https://ott-channel-engine.herokuapp.com/eventstream';
				}
				self._initiatePlayer(hlsStreamUri)
				.then(function(videoElement) {
					self.videoElement.muted = true;
					self.videoElement.play();
				})
        .catch(function(err) {
					console.log(err);
					displayErrorDlg(err);
				});
			};

      self._initiatePlayer = function(hlsUri) {
        return new Promise(function(resolve, reject) {
          if (self.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            self.videoElement.src = hlsUri;
            self.videoElement.addEventListener('canplay', function() {
            });
            resolve(self.videoElement);
          } else if (self._canUseHls()) {
            var hls = self.hls;
            hls.attachMedia(self.videoElement);
            hls.on(Hls.Events.MEDIA_ATTACHED, function () {
              hls.loadSource(hlsUri);
            });
            hls.on(Hls.Events.MANIFEST_LOADED, function(event, data) {
              var sessionId = data.networkDetails.getResponseHeader('X-Session-Id');
              self.sessionId = sessionId;
            });
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
              resolve(self.videoElement);
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
                  console.log("Fatal error playing back stream");
                  break;
                }
              }
            });
          } else {
            reject('Unsupported device');
          }
        });
      };

      self._canUseHls = function() {
        return Hls.isSupported() && !self._isMobileDevice();
      };

      self._isMobileDevice = function() {
        var userAgent = window.navigator.userAgent;
        return /iphone|ipod|ipad|android|blackberry|windows phone|iemobile|wpdesktop/
          .test(userAgent.toLowerCase()) && !(/crkey/).test(userAgent.toLowerCase());
      };

      self._isInDevMode = function() {
        return $location.search().dev;
      };

      self._muteOrUnmuteAudio = function(changes) {
        if (changes.muted) {
          self.videoElement.muted = changes.muted.currentValue;
        }
      };

		}],

	});