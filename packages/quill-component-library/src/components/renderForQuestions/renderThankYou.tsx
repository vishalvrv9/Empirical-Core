import React from 'react'
import { Link } from 'react-router'

const ThankYou = (props: any) => (
  <section className="section">
    <div className="container">
      <div className="content">
        <h4>Thank you for playing</h4>
        <p>Thank you for alpha testing Quill Connect, an open source tool that helps students become better writers.</p>
        <p><Link to={'/play'} className="button is-primary is-outlined">Try Another Question</Link></p>
        <p><strong>Unique code:</strong> {props.sessionKey}</p>
      </div>
    </div>
  </section>
)

export { ThankYou }
