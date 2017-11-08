require 'rails_helper'

RSpec.describe ClassroomsTeacher, type: :model do
  describe 'validations' do
    it 'should prevent saving arbitrary role' do
      let(:classrooms_teacher) { create(:classrooms_teacher, role: 'hippopotamus') }
      expect(classrooms_teacher).to_not be_valid
    end

    it 'should require a user_id that is not null' do
      let(:classrooms_teacher) { create(:classrooms_teacher, user_id: nil) }
      expect(classrooms_teacher).to_not be_valid
    end

    it 'should require a classroom_id that is not null' do
      let(:classrooms_teacher) { create(:classrooms_teacher, classroom_id: nil) }
      expect(classrooms_teacher).to_not be_valid
    end
  end

  # describe 'callbacks' do
  #   it 'should trigger_analytics_events_for_classroom_creation on create commit' do
  #
  #   end
  #
  #   it 'should delete_classroom_minis_cache on create' do
  #
  #   end
  # end

  describe 'associations' do
    let(:classroom) { create(:classroom, :with_no_teacher) }
    let(:teacher) { create(:teacher) }
    let(:classrooms_teacher) { create(:classrooms_teacher,
      classroom_id: classroom.id,
      teacher_id: teacher.id
    )}

    it 'should get the right teacher' do
      expect(classrooms_teacher.teacher).to be(teacher)
    end

    it 'should get the right classroom' do
      expect(classrooms_teacher.classroom).to be(classroom)
    end
  end
end
