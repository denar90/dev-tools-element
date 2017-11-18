describe('Single dev tools element', () => {
  let devToolsElement;

  beforeEach(() => {
    cy.visit('http://localhost:8080');
    devToolsElement = createDevToolsElement();
  });

  it('should be shown with opened timeline tab', () => {
    attachDevToolsElement(devToolsElement);

    cy.get('iframe').then($frame => {
      // wait for dev tools scripts be loaded
      cy.wait(1000).then(() => {
        const devToolsNavigation = $frame.contents().find('.insertion-point-main').first()[0].shadowRoot;
        const timelineTab = Cypress.$(devToolsNavigation).find('#tab-timeline');
        expect(timelineTab.hasClass('selected')).to.be.true;
      });
    });
  });

  context('Events', () => {
    let readySpy, timelineLoadedSpy;

    beforeEach(() => {
      const eventHandlers = {
        ready: () => {},
        timelineLoaded: () => {}
      };

      readySpy = cy.spy(eventHandlers, 'ready');
      timelineLoadedSpy = cy.spy(eventHandlers, 'timelineLoaded');

      devToolsElement.addEventListener('DevToolsReady', eventHandlers.ready);
      devToolsElement.addEventListener('DevToolsTimelineLoaded', eventHandlers.timelineLoaded);

      attachDevToolsElement(devToolsElement);
    });

    it('should be triggered', () => {
      cy.wait(4000).then(() => {
        expect(readySpy).to.be.called;
        expect(timelineLoadedSpy).to.be.called;
      });
    });
  });
});

const createDevToolsElement = () => {
  const devToolsElement = document.createElement('dev-tools-element');
  devToolsElement.setAttribute('src', 'https://www.dropbox.com/s/s1n8m8n5oddgoxx/timeline-docs.json?dl=0');
  return devToolsElement;
};

const attachDevToolsElement = devToolsElement => {
  cy.document().then(document => {
    document.body.appendChild(devToolsElement);
  });
};
