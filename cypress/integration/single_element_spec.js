describe('Single dev tools element', () => {
  let devToolsElement;

  beforeEach(() => {
    cy.visitIndex();
  });

  context('UI', () => {
    it('should be shown with opened timeline tab', () => {
      devToolsElement = createDevToolsElement('https://www.dropbox.com/s/s1n8m8n5oddgoxx/timeline-docs.json?dl=0');
      attachDevToolsElement(devToolsElement);

      cy.get('iframe').then($frame => {
        cy.waitForTimlineElementBeLoaded().then(() => {
          const devToolsNavigation = $frame.contents().find('.insertion-point-main').first()[0].shadowRoot;
          const timelineTab = Cypress.$(devToolsNavigation).find('#tab-timeline');
          expect(timelineTab.hasClass('selected')).to.be.true;
        });
      });
    });
  });

  context('Events', () => {
    let readySpy, timelineLoadedSpy;

    beforeEach(() => {
      readySpy = cy.spy(devToolsEventHandlers, 'ready');
      timelineLoadedSpy = cy.spy(devToolsEventHandlers, 'timelineLoaded');

      devToolsElement = createDevToolsElement('https://www.dropbox.com/s/s1n8m8n5oddgoxx/timeline-docs.json?dl=0');
      devToolsElement.addEventListener('DevToolsReady', devToolsEventHandlers.ready);
      devToolsElement.addEventListener('DevToolsTimelineLoaded', devToolsEventHandlers.timelineLoaded);

      attachDevToolsElement(devToolsElement);
    });

    it('should be triggered', () => {
      cy.waitForTimlineTraceBeLoaded().then(() => {
        expect(readySpy).to.be.called;
        expect(timelineLoadedSpy).to.be.called;
      });
    });
  });

  context('Asset source', () => {
    let timelineLoadedSpy;

    beforeEach(() => {
      timelineLoadedSpy = cy.spy(devToolsEventHandlers, 'timelineLoaded');
    });

    it('Github should be used', () => {
      devToolsElement = createDevToolsElement('https://gist.github.com/paulirish/f83d30384954937dc3a1fae970a4ae52/raw/b25b27741c652d3091a316dfd8b58bf72f14aa74/twitch.json');
      devToolsElement.addEventListener('DevToolsTimelineLoaded', devToolsEventHandlers.timelineLoaded);

      attachDevToolsElement(devToolsElement);

      cy.waitForTimlineTraceBeLoaded().then(() => {
        expect(timelineLoadedSpy).to.be.called;
      });
    });

    it('Dropbox should be used', () => {
      devToolsElement = createDevToolsElement('https://www.dropbox.com/s/s1n8m8n5oddgoxx/timeline-docs.json?dl=0');
      devToolsElement.addEventListener('DevToolsTimelineLoaded', devToolsEventHandlers.timelineLoaded);

      attachDevToolsElement(devToolsElement);

      cy.waitForTimlineTraceBeLoaded().then(() => {
        expect(timelineLoadedSpy).to.be.called;
      });
    });
  });
});

const createDevToolsElement = src => {
  const devToolsElement = document.createElement('dev-tools-element');
  devToolsElement.setAttribute('src', src);
  return devToolsElement;
};

const attachDevToolsElement = devToolsElement => {
  cy.document().then(document => {
    document.body.appendChild(devToolsElement);
  });
};

const devToolsEventHandlers = {
  ready: () => {},
  timelineLoaded: () => {}
};


