import React from 'react'
import request from 'request'
import getAuthToken from '../modules/get_auth_token'

export default class RecoverUnitActivities extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      email: '',
    }

    this.updateEmail = this.updateEmail.bind(this)
    this.submit = this.submit.bind(this)
  }

  submit() {
    const that = this
    request.post({
      url: `${process.env.DEFAULT_URL}/teacher_fix/recover_unit_activities`,
      json: {email: that.state.email, authenticity_token: getAuthToken()}
    },
    (e, r, response) => {
      if (response.error) {
        that.setState({error: response.error})
      } else if (r.statusCode === 200){
        window.alert('Data has been restored!')
      } else {
        console.log(response)
      }
    })

  }

  updateEmail(e) {
    this.setState({email: e.target.value})
  }

  renderError() {
    if (this.state.error) {
      return <p className="error">{this.state.error}</p>
    }
  }

  render() {
    return <div>
      <h1><a href="/teacher_fix">Teacher Fixes</a></h1>
      <h2>Recover Unit Activities</h2>
      <p>This method will unarchive all of the unit activities for all of the given teacher's non-archived units.</p>
      <div>
        <div className="input-row">
          <label>Teacher Email:</label>
          <input type="text" value={this.state.email} onChange={this.updateEmail}/>
        </div>
        <button onClick={this.submit}>Recover Unit Activities</button>
        {this.renderError()}
      </div>
    </div>
  }
}
