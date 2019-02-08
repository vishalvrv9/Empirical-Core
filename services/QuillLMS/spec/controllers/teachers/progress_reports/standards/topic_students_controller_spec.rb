require 'rails_helper'

describe Teachers::ProgressReports::Standards::TopicStudentsController, type: :controller do
  include_context 'Topic Progress Report'

  it_behaves_like 'Progress Report' do
    let(:default_filters) { {classroom_id: full_classroom.id, topic_id: first_grade_topic.id }}
    let(:result_key) { 'students' }
    let(:expected_result_count) { first_grade_topic_students.size }

    it_behaves_like "exporting to CSV"
  end
end
