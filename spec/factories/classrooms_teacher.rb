FactoryBot.define do
  factory :classrooms_teacher do
    role 'owner'
    user_id {cre ate(:teacher).id}
    classroom_id {create(:classroom).id}

    trait :classroom_has_students_and_activities do
      classroom_id { create(:classroom_with_students_and_activities).id }
    end
  end
end
