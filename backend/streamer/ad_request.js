const MOCK_VAST = `<VAST version="4.0" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns="http://www.iab.com/VAST">\
  <Ad id="20001" sequence="1" conditionalAd="false">\
    <InLine>\
      <AdSystem version="4.0">iabtechlab</AdSystem>\
      <Error>http://example.com/error</Error>\
      <Impression id="Impression-ID">http://example.com/track/impression</Impression>\
      <Pricing model="cpm" currency="USD">\
        <![CDATA[ 25.00 ]]>\
      </Pricing>\
      <AdTitle>Inline Simple Ad</AdTitle>\
      <AdVerifications></AdVerifications>\
      <Advertiser>IAB Sample Company</Advertiser>\
      <Category authority="http://www.iabtechlab.com/categoryauthority">AD CONTENT description category</Category>\
      <Creatives>\
        <Creative id="5480" sequence="1" adId="2447226">\
          <UniversalAdId idRegistry="Eyevinn-Ad-ID" idValue="1">1</UniversalAdId>\
          <Linear>\
            <TrackingEvents>\
              <Tracking event="start" offset="09:15:23">http://example.com/tracking/start</Tracking>\
              <Tracking event="firstQuartile">http://example.com/tracking/firstQuartile</Tracking>\
              <Tracking event="midpoint">http://example.com/tracking/midpoint</Tracking>\
              <Tracking event="thirdQuartile">http://example.com/tracking/thirdQuartile</Tracking>\
              <Tracking event="complete">http://example.com/tracking/complete</Tracking>\
            </TrackingEvents>\
            <Duration>00:00:45</Duration>\
            <MediaFiles/>\
            <VideoClicks>\
              <ClickThrough id="blog">\
                <![CDATA[https://iabtechlab.com]]>\
              </ClickThrough>\
            </VideoClicks>\
          </Linear>\
        </Creative>\
      </Creatives>\
    </InLine>\
  </Ad>\
</VAST>`;

const MOCK_VMAP = `<vmap:VMAP xmlns:vmap="http://www.iab.net/vmap-1.0" version="1.0"> \
  <vmap:AdBreak breakType="linear" breakId="midroll1" timeOffset="00:00:15.000"> \
    <vmap:AdSource allowMultipleAds="true" followRedirects="true" id="1"> \
      <vmap:VASTAdData> \
        <VAST version="3.0" xsi:noNamespaceSchemaLocation="vast.xsd">\
        ${MOCK_VAST}
        </VAST> \
      </vmap:VASTAdData> \
    </vmap:AdSource> \
    <vmap:TrackingEvents> \
      <vmap:Tracking event="breakStart">http://server.com/breakstart</vmap:Tracking> \
      <vmap:Tracking event="breakEnd">http://server.com/breakend</vmap:Tracking> \
    </vmap:TrackingEvents> \
  </vmap:AdBreak> \
  <vmap:AdBreak breakType="linear" breakId="midroll2" timeOffset="00:10:00.000"> \
    <vmap:AdSource allowMultipleAds="true" followRedirects="true" id="2"> \
      <vmap:VASTAdData> \
        <VAST version="3.0" xsi:noNamespaceSchemaLocation="vast.xsd">\
        ${MOCK_VAST}
        </VAST> \
      </vmap:VASTAdData> \
    </vmap:AdSource> \
    <vmap:TrackingEvents> \
      <vmap:Tracking event="breakStart">http://server.com/breakstart</vmap:Tracking> \
      <vmap:Tracking event="breakEnd">http://server.com/breakend</vmap:Tracking> \
    </vmap:TrackingEvents> \
  </vmap:AdBreak> \
</vmap:VMAP>`;

const request = require('request');

class AdRequest {
  constructor(adCopyMgrUri) {
    this._adCopyMgrUri = adCopyMgrUri;
  }

  resolve() {
    return new Promise((resolve, reject) => {
      this._requestSplices().then(splices => {
        let adPromises = [];

        for(let i = 0; i < splices.length; i++) {
          adPromises.push(this._getAdById(splices[i]));
        }
        Promise.all(adPromises).then(() => {
          resolve(splices);
        }).catch(reject);
      }).catch(reject);
    });
  }

  _requestSplices() {
    return new Promise((resolve, reject) => {
      let splices = [];
      // Here should some actual ad request take place
      splices.push({
        position: 1.0,
        adId: 1,
      });
      splices.push({
        position: 5 * 60.0,
        adId: 1,
      });
      resolve(splices);
    });
  }

  _getAdById(splice) {
    return new Promise((resolve, reject) => {
      request({ url: this._adCopyMgrUri + '/ad/' + splice.adId }, (err, resp, body) => {
        if (resp.statusCode == 200) {
          const data = JSON.parse(body);
          splice.segments = data.segments;
          resolve();
        } else { 
          reject(err);
        }
      });      
    });
  }
}

module.exports = AdRequest;