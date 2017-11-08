require 'rails_helper'

describe Teachers::ProgressReports::Concepts::StudentsController, type: :controller do
  let!(:classroom_with_a_couple_students) {create (:classroom_with_a_couple_students)}
  let!(:classroom_with_one_student) {create (:classroom_with_one_student)}
  let!(:classroom_with_students_and_activities) {create (:classroom_with_students_and_activities)}

  context 'GET #index json' do
    context 'when logged in' do
      it 'includes a list of students in the JSON' do
        classrooms_arr = [{object: classroom_with_a_couple_students, class_size: 2}, {object: classroom_with_one_student, class_size: 1}, {object: classroom_with_students_and_activities, class_size: 5}]
        classrooms_arr.each do |classroom|
          binding.pry
          session[:user_id] = classroom[:object].id
          get :index, format: :json
          json = JSON.parse(response.body)
          binding.pry
        end


      end
    end
  end
end
