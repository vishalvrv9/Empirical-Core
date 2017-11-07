FactoryBot.define do
  factory :classrooms_teacher do
    user_id {create(:teacher).id}
    classroom_id {create(:classroom).id}
    role 'owner'

    trait :classroom_has_students_and_activities do
      classroom_id { create(:classroom_with_students_and_activities).id }
    end
  end
end
