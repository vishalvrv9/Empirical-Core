describe('Premium Page', () => {

  const teacherActivePremiumCopy = 'You have an active subscription and cannot buy premium now. If your subscription is a school subscription, you may buy Premium when it expires. If your subscription is a teacher one, please turn on recurring payments and we will renew it automatically when your subscription ends.'
  const schoolActivePremiumCopy = 'You have an active subscription and cannot buy premium now. You may buy a new Premium subscription when your current subscription expires.'

  const itHasYouCanBookMeLink = () => {
    it('has a link to you can book me', () => {
      cy.get(':nth-child(3) > .pricing-mini > a').should('have.attr', 'href').should('match', /youcanbook/)
    })
  }
  const itLoads = () => {
    it('loads', ()=>{
      cy.get('#premium-pricing-guide')
    })
  }
  const itDoesNotHaveAFreeTrial = () => {
    it('does not have a Free Trial', () => {
      cy.get('.empty-blue').should('not.exist')
    })
  }
  const itHasAPurchaseButtonThatOpensAModalWhenClicked = () => {
    it('has a purchase button that opens a modal when clicked', () => {
      cy.get('.btn.purple')
        .click().get('.school-premium-modal').get('.pull-right').click()
    })
  }

  const activePremiumSubscriptionBehavior = () => {

    describe('it has all the active premium behavior', () => {

      itLoads();

      describe('school premium', () => {

        itHasYouCanBookMeLink()

        it('has a purchase button that triggers an alert mentioning active premium when clicked', () => {
          const stub = cy.stub()
          cy.on('window:alert', stub)
          cy.get('#purchase-btn')
            .click().then(() => {
              expect(stub.getCall(0)).to.be.calledWith(teacherActivePremiumCopy)
            })
        })

      })

      describe('teacher premium', () => {

        itDoesNotHaveAFreeTrial()

        it('has a purchase button that triggers an alert mentioning active premium when clicked', () => {
          const stub = cy.stub()
          cy.on('window:alert', stub)
          cy.get('.btn.purple')
            .click().then(() => {
              expect(stub.getCall(0)).to.be.calledWith(schoolActivePremiumCopy)
            })
        })
      })
    })
  }

  describe('subscriptions', () => {
    describe('when I am not logged in', () => {
      before(() => {
        cy.logout();
        cy.visit('/premium')
      })

      itLoads();

      itHasYouCanBookMeLink()

      describe('school premium', () => {
        it('has a purchase button that triggers an alert when clicked', () => {
          const stub = cy.stub()
          cy.on('window:alert', stub)
          cy.get('.btn.purple')
            .click().then(() => {
              expect(stub.getCall(0)).to.be.calledWith('You must be logged in to activate Premium.')
            })
        })
      })
    })

    describe('when I am logged in with no school', ()=>{

      before(() => {
        cy.app('clean')
        cy.appFactories([
          ['create', 'teacher', {
            password: 'password',
            username: 'teacher',
            stripe_customer_id: 'cus_CN6VaNY6yd8R5M'
          }]
        ])
        cy.login('teacher', 'password')
        cy.visit('/premium')

        beforeEach(() => {
          Cypress.Cookies.preserveOnce('_quill_session')
        })
      })

      describe('school premium', ()=>{
        it('will alert the user that they need to add a school', () => {
          const stub = cy.stub()
          cy.on('window:alert', stub)
          cy.get('.btn.purple')
            .click().then(() => {
              expect(stub.getCall(0)).to.be.calledWith('You must add a school before buying School Premium. You can do so by visiting Quill.org/teachers/my_account')
            })
        })
      })
    })

    describe('when I am logged in with a school', () => {

      before(() => {
        cy.app('clean')
        cy.appFactories([
          ['create', 'teacher_with_school', {
            password: 'password',
            username: 'teacher',
            stripe_customer_id: 'cus_CN6VaNY6yd8R5M'
          }]
        ])
        cy.login('teacher', 'password')
        cy.visit('/premium')

        beforeEach(() => {
          Cypress.Cookies.preserveOnce('_quill_session')
        })
      })

      describe('when I have never had one', () => {
        itLoads();

        describe('school premium', () => {
          itHasYouCanBookMeLink();
          itHasAPurchaseButtonThatOpensAModalWhenClicked()
        })

        describe('teacher premium', () => {
          it('has a Buy Now button', () => {
            cy.visit('/premium')
            cy.get('#purchase-btn').click()
            cy.get('.pull-right').click()
          })

          it('has a Free Trial button that activates a trial when clicked and redirects to the scorebook', () => {
            cy.get('.empty-blue').click({force: true})
            cy.location().should((loc) => {
              expect(loc.pathname).to.eq('/teachers/progress_reports/activities_scores_by_classroom')
            })
            cy.get('.premium-tab > a > .hide-on-mobile').contains('30 Days Left')
          })
        })

      })
    })
  })
})
