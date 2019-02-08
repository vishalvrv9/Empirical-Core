import React from 'react';
import { connect } from 'react-redux';
import LoadingSpinner from '../../Teacher/components/shared/loading_indicator';
import StandardsReports from '../components/standards_reports';
import {
  switchClassroom,
  switchSchool,
  switchTeacher,
  getDistrictStandardsReports,
} from '../../../actions/district_standards_reports';

class DistrictStandardsReports extends React.Component {
  componentDidMount() {
    const { getDistrictStandardsReports, } = this.props;
    getDistrictStandardsReports();
  }

  render() {
    const { loading, } = this.props;

    if (loading) {
      return <LoadingSpinner />;
    }
    return (<StandardsReports {...this.props} />);
  }
}

function getClassroomNames(classrooms, selectedSchool, selectTeacher) {
  let filtered = filterBySchool(classrooms, selectedSchool);
  filtered = filterByTeacher(filtered, selectTeacher);
  const names = filtered.map(row => row.classroom_name);
  return ['All Classrooms', ...new Set(names)];
}

function getSchoolNames(classrooms) {
  const names = classrooms.map(row => row.school_name);
  return ['All Schools', ...new Set(names)];
}

function getTeacherNames(classrooms, selectedSchool) {
  const filtered = filterBySchool(classrooms, selectedSchool);
  const names = filtered.map(row => row.teacher_name);
  return ['All Teachers', ...new Set(names)];
}

function formatDataForCSV(data) {
  const csvData = [];
  const csvHeader = [
    'Standard Level',
    'Standard Name',
    'Students',
    'Proficient',
    'Activities'
  ];
  const csvRow = row => [
    row.section_name,
    row.name,
    row.total_student_count,
    row.proficient_count,
    row.total_activity_count
  ];

  csvData.push(csvHeader);
  data.forEach(row => csvData.push(csvRow(row)));

  return csvData;
}

function filterBySchool(classrooms, selected) {
  if (selected !== 'All Schools') {
    return classrooms.filter(row => row.school_name === selected);
  }

  return classrooms;
}

function filterByClass(classrooms, selected) {
  if (selected !== 'All Classrooms') {
    return classrooms.filter(row => row.classroom_name === selected);
  }

  return classrooms;
}

function filterByTeacher(classrooms, selected) {
  if (selected !== 'All Teachers') {
    return classrooms.filter(row => row.teacher_name === selected);
  }

  return classrooms;
}

function filterClassrooms(
  classrooms,
  selectedSchool,
  selectedTeacher,
  selectedClassroom
) {
  let filtered = filterBySchool(classrooms, selectedSchool);
  filtered = filterByTeacher(filtered, selectedTeacher);
  filtered = filterByClass(filtered, selectedClassroom);

  return filtered;
}

const mapStateToProps = (state) => {
  const filteredStandardsReportsData = filterClassrooms(
    state.district_standards_reports.standardsReportsData,
    state.district_standards_reports.selectedSchool,
    state.district_standards_reports.selectedTeacher,
    state.district_standards_reports.selectedClassroom
  );

  const teacherNames = getTeacherNames(
    state.district_standards_reports.standardsReportsData,
    state.district_standards_reports.selectedSchool
  );

  const classroomNames = getClassroomNames(
    state.district_standards_reports.standardsReportsData,
    state.district_standards_reports.selectedSchool,
    state.district_standards_reports.selectedTeacher,
  );

  return {
    loading: state.district_standards_reports.loading,
    errors: state.district_standards_reports.errors,
    selectedClassroom: state.district_standards_reports.selectedClassroom,
    selectedSchool: state.district_standards_reports.selectedSchool,
    selectedTeacher: state.district_standards_reports.selectedTeacher,
    standardsReportsData: state.district_standards_reports.standardsReportsData,
    filteredStandardsReportsData,
    csvData: formatDataForCSV(filteredStandardsReportsData),
    classroomNames,
    teacherNames,
    schoolNames: getSchoolNames(state.district_standards_reports.standardsReportsData),
  };
};
const mapDispatchToProps = dispatch => ({
  switchSchool: school => dispatch(switchSchool(school)),
  switchClassroom: classroom => dispatch(switchClassroom(classroom)),
  switchTeacher: teacher => dispatch(switchTeacher(teacher)),
  getDistrictStandardsReports: () => dispatch(getDistrictStandardsReports()),
});

export default connect(mapStateToProps, mapDispatchToProps)(DistrictStandardsReports);
