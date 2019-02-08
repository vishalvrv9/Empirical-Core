import request from 'request';
import Pusher from 'pusher-js';

export const recieveDistrictStandardsReports = (body) => {
  return { type: 'RECIEVE_DISTRICT_STANDARDS_REPORTS', body, };
};

export const switchClassroom = (classroom) => {
  return { type: 'SWITCH_CLASSROOM', classroom, };
};

export const switchSchool = (school) => {
  return { type: 'SWITCH_SCHOOL', school, };
};

export const switchTeacher = (teacher) => {
  return { type: 'SWITCH_TEACHER', teacher, };
}

export const initializePusherForDistrictStandardsReports = (adminId) => {
  return (dispatch) => {
    if (process.env.RAILS_ENV === 'development') {
      Pusher.logToConsole = true;
    }
    const pusher = new Pusher(process.env.PUSHER_KEY, { encrypted: true, });
    const channel = pusher.subscribe(adminId);
    channel.bind('district-standards-reports-found', () => {
      dispatch(getDistrictStandardsReports())
    });
  }
}

export const getDistrictStandardsReports = () => {
  return (dispatch) => {
    request.get({
      url: `${process.env.DEFAULT_URL}/api/v1/progress_reports/district_standards_reports`
    },
    (e, r, body) => {
      const parsedBody = JSON.parse(body)
      if (parsedBody.id) {
        dispatch(initializePusherForDistrictStandardsReports(String(parsedBody.id)))
      } else {
        dispatch(recieveDistrictStandardsReports(parsedBody))
      }
    });
  }
};
