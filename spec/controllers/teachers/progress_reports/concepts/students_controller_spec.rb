require 'rails_helper'

describe Teachers::ProgressReports::Concepts::StudentsController, type: :controller do
  let(:alice) { create(:student, name: "Alice Cool") }
  let(:fred) { create(:student, name: "Fred Kewl") }
  let(:zojirushi) { create(:student, name: "Zojirushi Kewel") }

  let(:concept) { create(:concept) }
  let(:hidden_concept) { create(:concept, name: "Hidden") }

  # Boilerplate
  let!(:classroom) { create(:classroom,
    name: "Bacon Weaving",
    students: [alice, fred, zojirushi]) }

  let(:activity) { create(:activity) }
  let(:unit) { create(:unit, user: classroom.teacher ) }
  let(:classroom_activity) { create(:classroom_activity,
                                          classroom: classroom,
                                          activity: activity,
                                          assign_on_join: true,
                                          unit: unit) }


  # Create 2 activity session for each student, one with the concept tags, one without
  let(:alice_session) { create(:completed_activity_session_with_random_concept_results, user: alice)}

  let(:fred_session) { create(:completed_activity_session_with_random_concept_results, user: fred)}

  # Zojirushi has no concept tag results, so should not display
  # in the progress report
  let(:zojirushi_session) { create(:activity_session, :finished,
                                      classroom_activity: classroom_activity,
                                      user: zojirushi,
                                      activity: activity,
                                      percentage: 0.75) }

  let(:visible_students) { [alice, fred] }
  let(:classrooms) { [classroom] }

  before do
    # Incorrect result for Alice
    # alice_session.concept_results.create!(
    #   concept: concept,
    #   metadata: {
    #     "correct" => 0
    #   })
    #
    # # Correct result for Alice
    # alice_session.concept_results.create!(
    #   concept: concept,
    #   metadata: {
    #     "correct" => 1
    #   })
    #
    # # Incorrect result for Fred
    # fred_session.concept_results.create!(
    #   concept: concept,
    #   metadata: {
    #     "correct" => 0
    #   })

    # Correct result for Fred for hidden tag (not displayed)
    fred_session.concept_results.create!(
      concept: hidden_concept,
      metadata: {
        "correct" => 1
      })
  end
  it_behaves_like 'Progress Report' do
    let(:result_key) { 'students' }
    let(:expected_result_count) { visible_students.size }
  end

  context 'GET #index json' do
    context 'when logged in' do
      it 'includes a list of students in the JSON' do
        session[:user_id] = teacher.id
        get :index, format: :json
        json = JSON.parse(response.body)
        alice_json = json['students'][0]
        expect(alice_json['name']).to eq(alice.name)
        expect(alice_json['total_result_count'].to_i).to eq(alice_session.concept_results.size)
        expect(alice_json['correct_result_count'].to_i).to eq(1)
        expect(alice_json['incorrect_result_count'].to_i).to eq(1)
      end
    end
  end
end
