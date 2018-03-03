# Eyevinn Technology TV

Server-less OTT-Only TV Channel Playout

![system design](https://github.com/Eyevinn/tv.eyevinn.technology/blob/master/docs/system_design.png)


## Development

Install necessary packages:

```
$ npm install
```

When developing and running local server providing the lambda API endpoints are available. To run
in development mode (i.e. server is restarting on file change):

```
$ npm run dev-server
```

And for testing and debugging

```
$ npm run debug-server
```

If you want to use another endpoint for the assetmanager API for example you set the environment
variable `ASSETMGR_URI`.

```
$ ASSETMGR_URI=<URI to API> npm run debug-server
```

And to configure endpoint for adcopymanager API the environment variable `ADCOPYMGR_URI` is defined

```
$ ADCOPYMGR_URI=<URI to API> npm run debug-server
```

Default port for the Channel Engine is 8000 so to test the stream point your browser or HLS video player to: http://localhost:8000/live/master.m3u8

To run the frontend locally start a simple HTTP server (requires python installed) with this command:

```
$ npm run frontend
```

and then point your browser to http://localhost:3000/?dev

The query parameter `dev` instructs the frontend to use the Channel Engine running on localhost.

## Lambda APIs

Upload Ad Creative and transcode ad to HLS

```
$ curl -H "X-API-KEY: <KEY>" -X POST -d '{ "adid": 2, "uri": "https://example.com/ad.mp4" }' -H "Content-Type: application/json"  https://adcopymgr.api.eyevinn.technology/ad
```

Get HLS and segments for ad with adId 1

```
$ curl  https://adcopymgr.api.eyevinn.technology/ad/1
```
