require 'rails_helper'

describe TeachersController, type: :controller do

  let(:teacher) { create(:teacher, :with_classrooms_students_and_activities) }
  let!(:co_taught_classroom) {create(:classroom, :with_no_teacher)}
  let!(:co_taught_classrooms_teacher) {create(:classrooms_teacher, classroom: co_taught_classroom, user: teacher, role: 'coteacher')}

  before do
    allow(controller).to receive(:current_user) { teacher }
  end

  # describe '#create' do
  #   let!(:school) { create(:school) }
  #
  #   context 'when schools admins is found' do
  #     let!(:schools_admins) { create(:schools_admins, school: school, user: teacher) }
  #
  #     context 'when teacher is found' do
  #       context 'when schools users exists' do
  #         let!(:schools_users) { create(:schools_users, user: teacher, school: school) }
  #
  #         it 'should render the teacher is already registered to school' do
  #           post :create, id: school.id, teacher: { first_name: "some_name", last_name: "last_name", email: teacher.email }
  #           expect(response.body).to eq({message: "some_name last_name is already registered to #{school.name}"})
  #         end
  #       end
  #
  #       context 'when school users do not exist' do
  #         it 'should render that email has been sent to teacher and kick off join school email worker' do
  #           expect(JoinSchoolEmailWorker).to receive(:perform_async).with(teacher.id, school.id)
  #           post :create, id: school.id, teacher: { first_name: "some_name", last_name: "last_name", email: teacher.email }
  #           expect(response.body).to eq({message: "An email has been sent to #{teacher.email}"}.to_json)
  #         end
  #       end
  #     end
  #
  #     context 'when teacher is not found'  do
  #       it 'should create a new teacher and jointhem to the school' do
  #         expect(AccountCreatedEmailWorker).to receive(:perform_async)
  #         post :create, id: school.id, teacher: { first_name: "some_name", last_name: "last_name", email: "test@email.com" }
  #         expect(response.body).to eq({message: "An email has been to test@email.com asking them to set up their account."}.to_json)
  #       end
  #     end
  #   end
  #
  #   context 'when schools admins is not found' do
  #     it 'should render something went wrong' do
  #       post :create, id: school.id, teacher: { first_name: "some_name", last_name: "last_name", email: "test@email.com" }
  #       expect(response.body).to eq( {errors: 'Something went wrong. If this problem persists, please contact us at hello@quill.org'}.to_json)
  #       expect(response.code).to eq"422"
  #     end
  #   end
  # end

  describe '#admin_dashboard' do
    it 'render admin dashboard' do
      get :admin_dashboard
      expect(response).to redirect_to profile_path
    end
    it 'render admin dashboard' do
      user = create(:user)
      user.schools_admins.create
      allow(controller).to receive(:current_user) { user }
      get :admin_dashboard  
      expect(response).to render_template('admin')
    end
  end

  describe '#current_user_json' do
    it 'render current user json' do
      get :current_user_json
      expect(response.body).to  eq teacher.to_json
    end
  end

  describe '#classrooms_i_teach_with_students' do

    it 'returns the classrooms with students of the current user' do
      get :classrooms_i_teach_with_students
      expect(response.body).to eq({classrooms: teacher.classrooms_i_teach_with_students}.to_json)
    end

    it 'returns the classrooms the current user owns' do
      get :classrooms_i_teach_with_students
      expect(response.body).to eq({classrooms: teacher.classrooms_i_teach_with_students}.to_json)
    end
  end

  describe '#classrooms_i_own_with_students' do

    it 'returns the classrooms with students the current user owns' do
      get :classrooms_i_own_with_students
      expect(response.body).to eq({classrooms: teacher.classrooms_i_own_with_students}.to_json)
    end

    it 'does not return the classrooms with students the current user coteaches' do
      get :classrooms_i_own_with_students
      expect(response.body).not_to eq({classrooms: teacher.classrooms_i_teach_with_students}.to_json)
    end
  end



end
