'use strict';

angular.module('channelEngineMultiview')
	.component('mainController', {
		templateUrl: 'components/main-controller.template.html',
		controller: function() {
			self = this;
			self.indexOfVideoWithAudio = null;
			self.muted = true;
			self.mute = function() {
				self.indexOfVideoWithAudio = null;
			};
			self.unmute = function(index) {
				self.indexOfVideoWithAudio = index;
			};
		},
	});