const appendDevTools = () => {
  cy.document().then(document => {
    document.body.innerHTML = '';

    const devToolsElement = document.createElement('dev-tools-element');
    devToolsElement.setAttribute('src', 'https://www.dropbox.com/s/s1n8m8n5oddgoxx/timeline-docs.json?dl=0');
    devToolsElement.setAttribute('class', 'dev-tools-test');
    document.body.appendChild(devToolsElement);
  });
};

describe('Single dev tools element', () => {
  before(() => {
    cy.visit('http://localhost:8080');
  });

  it('should be shown with opened timeline tab', () => {
    window.location.reload(true);

    appendDevTools();

    cy.get('iframe').then($frame => {
      // wait for dev tools scripts be loaded
      cy.wait(1000).then(() => {
        const devToolsNavigation = $frame.contents().find('.insertion-point-main').first()[0].shadowRoot;
        const timelineTab = Cypress.$(devToolsNavigation).find('#tab-timeline');
        expect(timelineTab.hasClass('selected')).to.be.true;
      });
    });
  });
});
