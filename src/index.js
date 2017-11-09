import DevTools from './dev-tools';

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
      this._contentWindow.document.write(`
        <body>
          <script src="https://chrome-devtools-frontend.appspot.com/serve_file/@14fe0c24836876e87295c3bd65f8482cffd3de73/inspector.js" id="devtoolsscript"></script>
          <script>
              document.addEventListener('DOMContentLoaded', () => {
                window.devtools = new window.IframeDevTools({ scope: window });
                if (this.timelineURL) {
                  window.devtools.loadTimelineDataFromUrl(this.timelineURL);
                }
              });
              const DOMContentLoadedEvent = document.createEvent('Event');
              DOMContentLoadedEvent.initEvent('DOMContentLoaded', true, true);
              window.document.dispatchEvent(DOMContentLoadedEvent);
          </script>
        </body>
      `);
    };
  }

  static get observedAttributes() {
    return Object.keys(HTMLIFrameElement.prototype);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name == 'src') {
      if (this._contentWindow && this._contentWindow.devtools) {
        this._contentWindow.devtools.loadTimelineDataFromUrl(newValue);
      }
      return;
    }
    this._iframe.setAttribute(name, newValue);
  }

  connectedCallback() {
    if (!this.closest(':root')) return;
    this.append(this._iframe);
  }
});
