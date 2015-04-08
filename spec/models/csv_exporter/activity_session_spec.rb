require 'rails_helper'

describe CsvExporter::ActivitySession do
  include_context 'Activity Progress Report'
  let(:teacher) { mr_kotter }

  it_behaves_like 'CSV Exporter' do
    let(:expected_header_row) {
      ['Student', 'Activity', 'Score', 'Standard Level', 'Standard', 'App', 'Date']
    }

    let(:model_instance) {
      horshack_session
    }

    let(:filters) { { 'classroom_id' => sweathogs.id } }

    let(:expected_data_row) {
      [
        horshack_session.user.name,
        horshack_session.activity.name,
        horshack_session.percentage_as_decimal,
        horshack_session.activity.topic.section.name,
        horshack_session.activity.topic.name,
        # Concept (Topic Category(?)) -
        horshack_session.activity.classification.name,
        horshack_session.completed_at.to_formatted_s(:quill_default)

      ]
    }

    let(:expected_model_data_size) {
      sweathogs_sessions.size
    }
  end
end