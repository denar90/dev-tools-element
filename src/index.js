import { DevTools } from './dev-tools';

customElements.define('dev-tools-element', class extends HTMLElement {
  constructor() {
    super();
    this._iframe = document.createElement('iframe');
    this._contentWindow = null;
    this._iframe.onload = () => {
      this._contentWindow = this._iframe.contentWindow;
      // pass global params to iframe
      this._contentWindow.IframeDevTools = class IframeDevTools extends DevTools {};
      this._contentWindow.timelineURL = this.getAttribute('src');
      this._contentWindow.userAccessToken = this.getAttribute('user-access-token');
      this._contentWindow.document.write(`
        <body>
          <script src="https://chrome-devtools-frontend.appspot.com/serve_file/@14fe0c24836876e87295c3bd65f8482cffd3de73/inspector.js" id="devtoolsscript"></script>
          <script src="https://apis.google.com/js/client.js"></script>
          <script>
              document.addEventListener('DOMContentLoaded', () => {
                window.devtools = new window.IframeDevTools({ scope: window, userAccessToken: window.userAccessToken });
                if (window.timelineURL) {
                  window.devtools.loadTimelineDataFromUrl(window.timelineURL);
                }
              });
              const DOMContentLoadedEvent = document.createEvent('Event');
              DOMContentLoadedEvent.initEvent('DOMContentLoaded', true, true);
              window.document.dispatchEvent(DOMContentLoadedEvent);
          </script>
        </body>
      `);

      this._contentWindow.document.addEventListener('DevToolsReadyInFrame', () => this.handleDevToolsReadyInFrame());
      this._contentWindow.document.addEventListener('DevToolsTimelineLoadedInFrame', () => this.handleDevToolsTimelineLoadedInFrame());
    };
  }

  static get observedAttributes() {
    const attrs = Object.keys(HTMLIFrameElement.prototype);
    attrs.push('user-access-token');
    return attrs;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this._contentWindow && this._contentWindow.devtools) {
      switch (name) {
        case 'user-access-token':
          this._contentWindow.devtools.updateConfig({ userAccessToken: newValue });
          break;
        case 'src':
          this._contentWindow.devtools.loadTimelineDataFromUrl(newValue);
          break;
      }
      return;
    }

    if (name === 'src') return;

    this._iframe.setAttribute(name, newValue);
  }

  connectedCallback() {
    if (!this.closest(':root')) return;
    this.append(this._iframe);
  }

  handleDevToolsReadyInFrame() {
    this.dispatchEvent(new CustomEvent('DevToolsReady'));
  }

  handleDevToolsTimelineLoadedInFrame() {
    this.dispatchEvent(new CustomEvent('DevToolsTimelineLoaded'));
  }
});
