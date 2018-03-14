describe('The Home Page', function() {
  it('loads', function() {
    cy.visit('http://localhost:3000')
  })

  it('has an image in the navbar', () => {
    cy.visit('http://localhost:3000');

    cy.get('.my-selector')
      .find('.navbar-brand')
      .children('img[src^="/images/quill_header_logo.svg"]')
      .first()
  })
})