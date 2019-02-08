import React from 'react';
import request from 'request';
import Units from '../../lesson_planner/manage_units/activities_units.jsx';
import LoadingSpinner from '../../shared/loading_indicator.jsx';
import EmptyProgressReport from '../../shared/EmptyProgressReport.jsx';
import ItemDropdown from '../../general_components/dropdown_selectors/item_dropdown';
import getParameterByName from '../../modules/get_parameter_by_name';

'use strict';

export default React.createClass({

  getInitialState() {
    return {
      allUnits: [],
      units: [],
      loaded: false,
      selectedClassroomId: getParameterByName('classroom_id'),
      activityWithRecommendationsIds: [],
    };
  },

  componentWillMount() {
    document.getElementsByClassName('diagnostic-tab')[0].classList.remove('active');
    document.getElementsByClassName('activity-analysis-tab')[0].classList.add('active');
  },

  componentDidMount() {
    this.getClassrooms();
    this.getUnits();
    this.getRecommendationIds();
    window.onpopstate = () => {
      this.setState({ loaded: false, selectedClassroomId: getParameterByName('classroom_id'), });
      this.getUnitsForCurrentClass();
    };
  },

  getRecommendationIds() {
    fetch(`${process.env.DEFAULT_URL}/teachers/progress_reports/activity_with_recommendations_ids`, {
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
  }).then((response) => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    }).then((response) => {
      this.setState({ activityWithRecommendationsIds: response.activityWithRecommendationsIds, });
    }).catch((error) => {
      console.log('error', error);
    });
  },

  getClassrooms() {
    request.get(`${process.env.DEFAULT_URL}/teachers/classrooms/classrooms_i_teach`, (error, httpStatus, body) => {
      const classrooms = JSON.parse(body).classrooms;
      console.log('classrooms', classrooms.length);
      if (classrooms.length > 0) {
        this.setState({ classrooms, }, () => this.getUnits());
      } else {
        this.setState({ empty: true, loaded: true, });
      }
  	});
  },

  populateCompletionAndAverageScore(data) {
    data.forEach((u) => {
      request.get(`${process.env.DEFAULT_URL}/teachers/units/score_info_for_activity/${u.activity_id}?classroom_unit_id=${u.classroom_unit_id}`, (error, httpStatus, body) => {
        this.state.allUnits.forEach((stateUnit) => {
          if (typeof stateUnit.classroomActivities.get(u.activity_id) != 'undefined' ) {
            stateUnit.classroomActivities.get(u.activity_id).cumulativeScore = JSON.parse(body).cumulative_score;
            stateUnit.classroomActivities.get(u.activity_id).completedCount = JSON.parse(body).completed_count;
          }
        })
        this.forceUpdate();
      })
    });
  },

  getUnits() {
    request.get(`${process.env.DEFAULT_URL}/teachers/units?report=true`, (error, httpStatus, body) => {
      this.setAllUnits(JSON.parse(body));
      this.populateCompletionAndAverageScore(JSON.parse(body));
    })
  },

  getUnitsForCurrentClass() {
    if (this.state.selectedClassroomId) {
      const selectedClassroom = this.state.classrooms.find(c => c.id === Number(this.state.selectedClassroomId));
      const unitsInCurrentClassroom = this.state.allUnits.filter(unit => unit.classrooms.find(classroom => selectedClassroom.name === classroom.name));
      this.setState({ units: unitsInCurrentClassroom, loaded: true, });
    } else {
      this.setState({ units: this.state.allUnits, loaded: true, });
    }
  },

  setAllUnits(data) {
    this.setState({ allUnits: this.parseUnits(data), }, this.getUnitsForCurrentClass);
  },
  addMissingInfo(data) {
    alert('adding missing information');
  },

  generateNewCaUnit(u) {
    const assignedStudentCount = this.assignedStudentCount(u);
    const classroom = { name: u.class_name, totalStudentCount: u.class_size, assignedStudentCount, };
    const caObj = {
      classrooms: [classroom],
      classroomActivities: new Map(),
      unitId: u.unit_id,
      unitCreated: u.unit_created_at,
      unitName: u.unit_name,
    };
    caObj.classroomActivities.set(u.activity_id, {
      name: u.activity_name,
      activityId: u.activity_id,
      created_at: u.unit_activity_created_at,
      uaId: u.unit_activity_id,
      cuId: u.classroom_unit_id,
      activityClassificationId: u.activity_classification_id,
      classroomId: u.classroom_id,
      ownedByCurrentUser: u.owned_by_current_user === 't',
      ownerName: u.owner_name,
      dueDate: u.due_date,
      numberOfAssignedStudents: assignedStudentCount,
      completedCount: u.completed_count,
      cumulativeScore: u.classroom_cumulative_score,
    });
    return caObj;
  },

  parseUnits(data) {
    const parsedUnits = {};
    data.forEach((u) => {
      const assignedStudentCount = this.assignedStudentCount(u);
      if (!parsedUnits[u.unit_id]) {
        // if this unit doesn't exist yet, go create it with the info from the first ca
        parsedUnits[u.unit_id] = this.generateNewCaUnit(u);
      } else {
        const caUnit = parsedUnits[u.unit_id];
        if (caUnit.classrooms.findIndex(c => c.name === u.class_name) === -1) {
          // add the info and student count from the classroom if it hasn't already been done
          const classroom = { name: u.class_name, totalStudentCount: u.class_size, assignedStudentCount, };
          caUnit.classrooms.push(classroom);
        }
        // if the activity info already exists, add to the completed count
				// otherwise, add the activity info if it doesn't already exist
        let completedCount,
          cumulativeScore;
        if (caUnit.classroomActivities.has(u.activity_id)) {
          completedCount = Number(caUnit.classroomActivities.get(u.activity_id).completedCount) + Number(u.completed_count);
          cumulativeScore = Number(caUnit.classroomActivities.get(u.activity_id).cumulativeScore) + Number(u.classroom_cumulative_score);
        } else {
          cumulativeScore = Number(u.classroom_cumulative_score);
          completedCount = Number(u.completed_count);
        }
        //completedCount = Number(4); // number of srudents who completed
        //cumulativeScore = Number(332); // cumulative percentage for those //completed --- 83*4
        caUnit.classroomActivities.set(u.activity_id, this.classroomActivityData(u, assignedStudentCount, completedCount, cumulativeScore));
      }
    });
    return this.orderUnits(parsedUnits);
  },

  classroomActivityData(u, assignedStudentCount, completedCount, cumulativeScore) {
    return {
      name: u.activity_name,
      uaId: u.unit_activity_id,
      cuId: u.classroom_unit_id,
      activityId: u.activity_id,
      created_at: u.unit_activity_created_at,
      activityClassificationId: u.activity_classification_id,
      classroomId: u.classroom_id,
      ownedByCurrentUser: u.owned_by_current_user === 't',
      ownerName: u.owner_name,
      createdAt: u.ca_created_at,
      dueDate: u.due_date,
      numberOfAssignedStudents: assignedStudentCount,
      cumulativeScore,
      completedCount,
    };
  },

  assignedStudentCount(u) {
    return u.number_of_assigned_students ? u.number_of_assigned_students : u.class_size;
  },

  orderUnits(units) {
    const unitsArr = [];
    Object.keys(units).forEach(unitId => unitsArr.push(units[unitId]));
    return unitsArr;
  },

  switchClassrooms(classroom) {
    const path = '/teachers/progress_reports/diagnostic_reports/#/activity_packs';
   	window.history.pushState({}, '', classroom.id ? `${path}?classroom_id=${classroom.id}` : path);
 		this.setState({ selectedClassroomId: classroom.id, }, () => this.getUnitsForCurrentClass());
  },

  stateBasedComponent() {
    if (!this.state.loaded) {
      return <LoadingSpinner />;
    }
    let content;

    const allClassroomsClassroom = { name: 'All Classrooms', };
    const classrooms = [allClassroomsClassroom].concat(this.state.classrooms);
    const classroomWithSelectedId = classrooms.find(classroom =>
      classroom && classroom.id === Number(this.state.selectedClassroomId)
    );
    const selectedClassroom = classroomWithSelectedId || allClassroomsClassroom;

    if (!this.state.classrooms || this.state.classrooms.filter(Boolean).length === 0) {
      content = <EmptyProgressReport missing="classrooms" />;
    } else if (this.state.units.length === 0 && this.state.selectedClassroomId) {
      content = (
        <EmptyProgressReport
          missing="activitiesForSelectedClassroom"
          onButtonClick={() => {
            this.setState({ selectedClassroomId: null, loaded: false, });
            this.getUnitsForCurrentClass();
          }}
        />);
    } else if (this.state.units.length === 0) {
      content = <EmptyProgressReport missing="activities" />;
    } else {
      content = (<Units
        report={Boolean(true)}
        activityReport={Boolean(true)}
        data={this.state.units}
        activityWithRecommendationsIds={this.state.activityWithRecommendationsIds}
      />);
    }

    return (
      <div className="activity-analysis">
        <h1>Activity Analysis</h1>
        <p>Open an activity analysis to view students' responses, the overall results on each question, and the concepts students need to practice.</p>
        <div className="classroom-selector">
          <p>Select a classroom:</p>
          <ItemDropdown
            items={classrooms.filter(Boolean)}
            callback={this.switchClassrooms}
            selectedItem={selectedClassroom}
          />
        </div>
        {content}
      </div>
    );
  },

  render() {
    return (
      <div className="container manage-units">
        {this.stateBasedComponent()}
      </div>
    );
  },

});
