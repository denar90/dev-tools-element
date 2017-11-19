Cypress.Commands.add('visitIndex', () => {
  cy.visit('/');
});

Cypress.Commands.add('waitForTimlineElementBeLoaded', () => {
  return cy.wait(2000);
});

Cypress.Commands.add('waitForTimlineTraceBeLoaded', () => {
  return cy.wait(8000);
});
