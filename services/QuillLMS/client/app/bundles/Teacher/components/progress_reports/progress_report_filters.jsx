import React from 'react'
import DropdownFilter from './dropdown_filter.jsx'
import _ from 'underscore'

export default React.createClass({

  propTypes: {
    filterTypes: React.PropTypes.array.isRequired,
    classroomFilters: React.PropTypes.array.isRequired,
    studentFilters: React.PropTypes.array.isRequired,
    unitFilters: React.PropTypes.array.isRequired,
    selectUnit: React.PropTypes.func.isRequired,
    selectClassroom: React.PropTypes.func.isRequired,
    selectStudent: React.PropTypes.func.isRequired
  },

  activeFilter: function(selected, options) {
    if(!selected || !options) { return ''; }
    if(selected.value != options[0].value) {
      return 'actively-selected';
    } else {
      return '';
    }
  },

  classroomFilter: function() {
    return (
      <div key="classroom-filter" className="col-xs-12 col-sm-4 col-md-4 col-lg-4 col-xl-4 classroom-filter">
        <DropdownFilter selectedOption={this.props.selectedClassroom} options={this.props.classroomFilters} selectOption={this.props.selectClassroom} className={this.activeFilter(this.props.selectedClassroom, this.props.classroomFilters)} />
      </div>
    );
  },

  unitFilter: function() {
    return (
      <div key="unit-filter" className="col-xs-12 col-sm-4 col-md-4 col-lg-4 col-xl-4 unit-filter">
        <DropdownFilter selectedOption={this.props.selectedUnit} options={this.props.unitFilters} selectOption={this.props.selectUnit} className={this.activeFilter(this.props.selectedUnit, this.props.unitFilters)} />
      </div>
    );
  },

  studentFilter: function() {
    return (
      <div key="student-filter" className="col-xs-12 col-sm-4 col-md-4 col-lg-4 col-xl-4 student-filter">
        <DropdownFilter selectedOption={this.props.selectedStudent} options={this.props.studentFilters} selectOption={this.props.selectStudent} className={this.activeFilter(this.props.selectedStudent, this.props.studentFilters)} />
      </div>
    );
  },

  render: function() {
    var filters = [];
    if (_.include(this.props.filterTypes, 'classroom')) {
      filters.push(this.classroomFilter());
    }

    if (_.include(this.props.filterTypes, 'unit')) {
      filters.push(this.unitFilter());
    }

    if (_.include(this.props.filterTypes, 'student')) {
      filters.push(this.studentFilter());
    }

    return (
      <div className="row activity-page-dropdown-wrapper progress-report-filters">
        {filters}
      </div>
    );
  }
});
