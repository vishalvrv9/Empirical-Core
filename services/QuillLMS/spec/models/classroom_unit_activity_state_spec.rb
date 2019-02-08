require 'rails_helper'

describe ClassroomUnitActivityState, type: :model, redis: :true do

  it { should belong_to(:unit_activity) }
  it { should belong_to(:classroom_unit) }

  it { is_expected.to callback(:update_lessons_cache_with_data).after(:save) }
  it { is_expected.to callback(:lock_if_lesson).after(:create) }

  let!(:activity_classification_6) { create(:lesson)}
  let!(:activity) { create(:activity, activity_classification_id: 6) }
  let!(:student) { create(:user, role: 'student', username: 'great', name: 'hi hi', password: 'pwd') }
  let!(:classroom) { create(:classroom, students: [student]) }
  let!(:teacher) {classroom.owner}
  let!(:unit) { create(:unit, name: 'Tapioca', user: teacher) }
  let!(:unit_activity) { create(:unit_activity, unit: unit, activity: activity) }
  let!(:classroom_unit ) { create(:classroom_unit , unit: unit, classroom: classroom, assigned_student_ids: [student.id]) }
  let!(:cua ) { create(:classroom_unit_activity_state, unit_activity: unit_activity, classroom_unit: classroom_unit)}

  describe '#visible' do
    after(:each) do
      classroom_unit.update(visible: true)
      unit_activity.update(visible: true)
    end
    it "returns true if both the classroom unit and the unit activity are visible" do
      expect(cua.visible).to be
    end

    it "returns false if the classroom unit is not visible" do
      classroom_unit.update(visible: false)
      expect(cua.visible).to be false
    end

    it "returns false if the unit activity is not visible" do
      unit_activity.update(visible: false)
      expect(cua.visible).to be false
    end
  end

  describe 'caching lessons upon assignemnt' do
    before(:each) do
      $redis.redis.flushdb
      cua.save
    end

    it "creates a redis key for the user if there isn't one" do
      expect($redis.get("user_id:#{classroom_unit.classroom.owner.id}_lessons_array")).to be
    end

    it "caches data about the assignment" do
      lesson_data = {"classroom_unit_id" => cua.classroom_unit.id,
        "classroom_unit_activity_state_id" => cua.id,
        "activity_id" => cua.unit_activity.activity.id,
        "activity_name" => cua.unit_activity.activity.name,
        "unit_id" => cua.classroom_unit.unit_id,
        "completed" => cua.completed
      }
      expect($redis.get("user_id:#{classroom_unit.classroom.owner.id}_lessons_array")).to eq([lesson_data].to_json)
    end

    it "caches data about subsequent assignment" do
      classroom2 = create(:classroom, students: [student])

      classroom_unit2 = create(:classroom_unit , unit: unit, classroom: classroom2, assigned_student_ids: [student.id])

      cua2 = create(:classroom_unit_activity_state, unit_activity: unit_activity, classroom_unit: classroom_unit2)

      classroom2.teachers.destroy_all
      create(:classrooms_teacher, user_id: teacher.id, classroom_id: classroom2.id)
      cua2.save
      lesson_data = {"classroom_unit_id" => cua.classroom_unit.id,
        "classroom_unit_activity_state_id" => cua.id,
        "activity_id" => cua.unit_activity.activity.id,
        "activity_name" => cua.unit_activity.activity.name,
        "unit_id" => cua.classroom_unit.unit_id,
        "completed" => cua.completed
      }
      lesson_2_data = {"classroom_unit_id" => cua2.classroom_unit.id,
        "classroom_unit_activity_state_id" => cua2.id,
        "activity_id" => cua2.unit_activity.activity.id,
        "activity_name" => cua2.unit_activity.activity.name,
        "unit_id" => cua2.classroom_unit.unit_id,
        "completed" => cua2.completed
      }
      expect($redis.get("user_id:#{classroom_unit2.classroom.owner.id}_lessons_array")).to eq([lesson_data, lesson_2_data].to_json)
    end
  end

end
