FactoryBot.define do
  factory :objective do
    sequence(:name)               { |n| "Objective #{n}" }
    help_info                     { Faker::Internet.url }
    action_url                    { "#/#{Faker::Internet.slug}" }
    section                       'Getting Started'
    sequence(:section_placement)

    # Because some of our objectives and checkboxes code is currently hardcoded,
    # and because these are very static in our codebase, we are going to create
    # exact replicas of them here. This is bad practice and should be changed.

    factory :create_a_classroom do
      name              { 'Create a Classroom' }
      help_info         { 'http://support.quill.org/knowledgebase/articles/369605' }
      section           'Getting Started'
      action_url        { '/teachers/classrooms/new' }
      section_placement { 1 }
    end

    factory :add_students do
      name              { 'Add Students' }
      help_info         { 'http://support.quill.org/knowledgebase/articles/369608' }
      section           'Getting Started'
      action_url        { '/teachers/add_students' }
      section_placement { 2 }
    end

    factory :assign_featured_activity_pack do
      name              { 'Assign Featured Activity Pack' }
      help_info         { 'http://support.quill.org/knowledgebase/articles/843639' }
      section           'Getting Started'
      action_url        { '/activities/packs' }
      section_placement { 3 }
    end

    factory :add_school do
      name              { 'Add School' }
      help_info         { 'http://support.quill.org/knowledgebase/articles/897621-add-your-school' }
      section           'Getting Started'
      action_url        { '/teachers/my_account' }
      section_placement { 5 }
    end

    factory :assign_entry_diagnostic do
      name              { 'Assign Entry Diagnostic' }
      help_info         { 'http://support.quill.org/knowledgebase/articles/1144849' }
      section           'Getting Started'
      action_url        { '/teachers/classrooms/activity_planner/assign-a-diagnostic' }
      section_placement { 4 }
    end

    factory :build_your_own_activity_pack do
      name              { 'Build Your Own Activity Pack' }
      help_info         { 'http://support.quill.org/knowledgebase/articles/369614' }
      section           'Other'
      action_url        { '/teachers/classrooms/lesson_planner' }
      section_placement { 6 }
    end
  end
end
