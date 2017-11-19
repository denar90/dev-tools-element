# dev-tools-element [![Build Status](https://travis-ci.org/denar90/dev-tools-element.svg?branch=master)](https://travis-ci.org/denar90/dev-tools-element)

Inject and View DevTools Timeline trace easily.
Inspired by amazing work done by [@paulirish](https://github.com/paulirish) for [timeline-viewer](https://github.com/ChromeDevTools/timeline-viewer).

## Demo

[Check it live!](https://denar90.github.io/dev-tools-element/demo/)

![ezgif-3-abec631813](https://user-images.githubusercontent.com/6231516/32994748-5d1f57ba-cd74-11e7-964f-97ac1c7b2d40.gif)

## Install

Install the component using [npm](https://www.npmjs.com/):

```sh
$ npm install dev-tools-element --save
```

## Usage

```html
<dev-tools-element width="800" height="600" src="https://gist.github.com/paulirish/f83d30384954937dc3a1fae970a4ae52/raw/b25b27741c652d3091a316dfd8b58bf72f14aa74/twitch.json"></dev-tools-element>
```

## API

Attributes:

 - `src` - path to timeline json trace, can be from `dropbox`, `github`, `google drive`
 - `user-access-token` - user access token for loading timeline trace from google drive 
 
Events:
 
 - `DevToolsReady` - event triggered when Dev Tools loaded and ready to use. 

Arguments:
[CustomEvent.detail](https://developer.mozilla.org/ru/docs/Web/API/CustomEvent). 
Contains Timeline object.  
 
 - `DevToolsTimelineLoaded` - event triggered when timeline trace for Dev Tools custom element is loaded.

Arguments:
[CustomEvent.detail](https://developer.mozilla.org/ru/docs/Web/API/CustomEvent). 
Contains Timeline object.  

Example:
 
```js
  const devToolsElement = document.querySelector('dev-tools-element');
  devToolsElement.addEventListener('DevToolsReady', event => {
    console.log('Dev Tools custom element is ready!!!');
    console.log('DevTools Timeline - ', event.detail.Timeline);
  });

  devToolsElement.addEventListener('DevToolsTimelineLoaded', () => {
    console.log('Timeline trace for Dev Tools custom element is loaded!!!');
    console.log('DevTools Timeline - ', event.detail.Timeline);
  });
```

### Usage with Google Drive resources

1. Make your user Auth into Google account. (https://developers.google.com/identity/protocols/OAuth2 section https://developers.google.com/identity/protocols/OAuth2)
2. When user signed in pass user access token to `dev-tools-element`.
3. Set google drive resource id into `src` attribute, e.g. => `document.querySelector('dev-tools-element').setAttribute('src', 'drive://0B0c67TI7mLzEMFNhSENiVDhHWEE');`

Example:

```js
<script src="https://apis.google.com/js/client.js"></script>
<script>
  // example for Google Drive usage
  const authBtn = document.querySelector('.auth-btn');
  authBtn.addEventListener('click', () => {
    const authCallback = () => {
      // if user signed in show him the trace
      if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
        const userAccessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
        const devToolsElement = document.querySelector('.gdrive');
        // set userAccessToken token to get file from Google Drive
        devToolsElement.setAttribute('user-access-token', userAccessToken);
        // set file id
        devToolsElement.setAttribute('src', 'drive://0B0c67TI7mLzEMFNhSENiVDhHWEE');
      } else {
        console.log('User isn\'t signed in');
      }
    };
    const checkAuth = callback => {
      // use your own API key
      const apiKey = 'HNprjzdIDWo0CAohrwv48e9W';
      const scopes = [
        'https://www.googleapis.com/auth/drive'
      ];
      const oAuthOptions = {
        fetch_basic_profile: false,
        client_id: '727494663884-kkcfepd74cgg6fu2f5c5v4ruh7b86ul8.apps.googleusercontent.com',
        scope: scopes.join(' ')
      };

      gapi.load('client:auth2', () => {
        gapi.client.setApiKey(apiKey);

        // if we have authinstance yet, initialize
        if (gapi.auth2.getAuthInstance())
          return gapi.auth2.getAuthInstance().signIn(callback);

        return gapi.auth2.init(oAuthOptions).then(callback);
      });
    };
    checkAuth(authCallback);
  });
</script>

``` 
Look at [source](https://github.com/denar90/dev-tools-element/blob/master/demo/index.html#L10-L55).


