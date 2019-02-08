import React from 'react';
import request from 'request';
import AdminsTeachers from '../components/admins_teachers.tsx';
import PremiumFeatures from '../components/premium_features.tsx';
import CreateNewAccounts from '../components/create_new_accounts.tsx';
import LoadingSpinner from '../../Teacher/components/shared/loading_indicator';
import QuestionsAndAnswers from '../../Teacher/containers/QuestionsAndAnswers';
import Pusher from 'pusher-js';

import getAuthToken from '../../Teacher/components/modules/get_auth_token';

export default React.createClass({
  propTypes: {
    route: React.PropTypes.shape({
      adminId: React.PropTypes.number.isRequired,
    }),
  },

  getInitialState() {
    return {
      loading: true,
      model: {
        teachers: [],
      },
      newTeacher: {
        first_name: null,
        last_name: null,
        email: null,
      },
    };
  },

  componentDidMount() {
    this.getData();
  },

  getData() {
    $.ajax({
      url: `/admins/${this.props.route.adminId}`,
      success: this.receiveData,
    });
  },

  receiveData(data) {
    if (Object.keys(data).length > 1) {
      this.setState({ model: data, loading: false, });
    } else {
      this.setState({ model: data}, this.initializePusher)
    }
  },

  initializePusher() {
    if (process.env.RAILS_ENV === 'development') {
      Pusher.logToConsole = true;
    }
    const adminId = String(this.state.model.id)
    const pusher = new Pusher(process.env.PUSHER_KEY, { encrypted: true, });
    const channel = pusher.subscribe(adminId);
    const that = this;
    channel.bind('admin-users-found', () => {
      that.getData()
    });
  },

  addTeacherAccount(data) {
    const that = this;
    that.setState({ message: '', error: '', });
    data.authenticity_token = getAuthToken();
    request.post(`${process.env.DEFAULT_URL}/admins/${that.props.id}/teachers`, {
      json: data,
    },
    (e, r, response) => {
      if (response.error) {
        that.setState({ error: response.error, });
      } else if (r.statusCode === 200) {
        that.setState({ message: response.message, }, () => that.getData());
      } else {
        console.log(response);
      }
    });
  },

  render() {
    if (!this.state.loading) {
      return (
        <div >
          <div className="sub-container">
            <PremiumFeatures />
            <AdminsTeachers
              isValid={!!this.state.model.valid_subscription}
              data={this.state.model.teachers}
            />
            <CreateNewAccounts
              schools={this.state.model.schools}
              addTeacherAccount={this.addTeacherAccount}
              error={this.state.error}
              message={this.state.message}
            />
            <QuestionsAndAnswers
              questionsAndAnswersFile="admin"
              supportLink="https://support.quill.org/quill-premium"
            />
          </div>
        </div>
      );
    }
    return <LoadingSpinner />;
  },
});
