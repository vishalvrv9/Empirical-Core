'use strict';
import React from 'react'
import _ from 'underscore'
import EducatorType from '../new/educator_type';
import AnalyticsWrapper from '../../shared/analytics_wrapper'

export default React.createClass({
  propTypes: {
    updateSchool: React.PropTypes.func.isRequired,
    requestSchools: React.PropTypes.func.isRequired,
    selectedSchool: React.PropTypes.object,
    schoolOptions: React.PropTypes.array,
    errors: React.PropTypes.array
  },

  getInitialState: function(){
    return {editSchool: false}
  },

  updateZip: function (event) {
    var zip = event.target.value
    if (zip.length == 5) {
      this.props.requestSchools(zip);
    }
  },

  modal: function(){
    return (
      <div className="modal fade" id="myModal" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
              <div className='container'>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                      <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true"><i className="fa fa-close"></i></span></button>
                  </div>
                    <EducatorType analytics={new AnalyticsWrapper()} modal='true'/>
                </div>
              </div>
              </div>
            </div>)
  },

  determineDefaultZip: function () {
    var zip;
    if (this.props.selectedSchool == null) {
      zip = null;
    } else {
      zip = this.props.selectedSchool.zipcode;
    }
    return zip;
  },

  selectOption: function (event) {
    var schoolId, schoolObject;
    schoolId = event.target.value;
    schoolObject = this.props.schoolOptions.find((so) => { return so.id == parseInt(schoolId) })
    this.props.updateSchool(schoolObject);
  },

  schoolName: function(){
    if (this.props.selectedSchool && this.props.selectedSchool.text) {
      return this.props.selectedSchool.text;
    }
  },

  editSchool: function(){
    this.setState({editSchool: true})
  },

  editschoolButton: function(){
    var action = this.props.selectedSchool && this.props.selectedSchool.text ?
                'Edit' : 'Add'
    return(
    <button type='button' className='form-button button btn button-blue add-school' data-toggle="modal" data-target="#myModal">
      {action + ' School'}
    </button>
    )
  },

  render: function () {
    var schoolOptions, initialValue;
    if (this.props.schoolOptions.length == 0) {
      schoolOptions = <option value="enter-zipcode">Enter Your School&#39;s Zip Code</option>;
      initialValue = 'enter-zipcode';
    } else {
      schoolOptions = _.map(this.props.schoolOptions, function (schoolOption) {
        return <option key={schoolOption.id} value={schoolOption.id}>{schoolOption.text}</option>;
      });
      if ((this.props.selectedSchool != null) && (this.props.schoolOptions[0] != null) && (this.props.selectedSchool.zipcode == this.props.schoolOptions[0].zipcode)) {
        initialValue = this.props.selectedSchool.id;
      } else {
        var defaultOption = <option key='choose' value="choose">Choose Your School</option>;
        initialValue = 'choose';
        schoolOptions.unshift(defaultOption);
      }
    }

    if (this.props.isForSignUp) {
      return (
        <div>
              <div className='zip-row'>
                <div className='zip'>
                  Add Your School's ZIP Code
                </div>
                <div>
                  <input name='zip'
                         id='zip'
                         ref='zip'
                         className='zip-input'
                         onChange={this.updateZip}
                         placeholder="Zip"/>
                </div>
              </div>
              <div className='name'>
                  School Name
              </div>
                <div>
                  <select ref='select'
                          id='select_school'
                          value={initialValue}
                          onChange={this.selectOption}>
                    {schoolOptions}
                  </select>
                </div>
                </div>
      );
    } else {
      return (
        <div>
        <div className='form-row'>
          <div className='form-label'>
            School
          </div>
          <div className='form-input'>
            <input
                    className='inactive'
                    defaultValue={this.schoolName()}
                    readOnly>
            </input>
          </div>
          {this.editschoolButton()}
        </div>
        {this.modal()}
      </div>
      );
    }
  }
});
