FactoryBot.define do
  factory :classrooms_teacher do
    role 'owner'
    user_id {create(:teacher).id}
    classroom_id {create(:classroom).id}

    factory :classroom_has_students_and_activities do
      classroom_id { create(:classroom_with_students_and_activities).id }
    end
  end
end
