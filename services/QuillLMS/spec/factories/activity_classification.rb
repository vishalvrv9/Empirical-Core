FactoryBot.define do
  factory :activity_classification, aliases: [:classification] do
    sequence(:id)  { |n| 100 + n } # prevent id collisions by starting ids at 100
    sequence(:key) do |n|
      loop do
        possible_key = "key#{n}"
        break possible_key unless ActivityClassification.exists?(key: possible_key)
      end
    end
    app_name       { key }
    name           { "Quill #{key.titleize}" }
    module_url     { Faker::Internet.url }
    form_url       { Faker::Internet.url }
    order_number   { Faker::Number.digit }
    uid            { SecureRandom.urlsafe_base64 } # mock a uid

    # Because some of our activity classification code is currently hardcoded,
    # and because activity classifications are very static in our codebase,
    # let's just use an exact copy of the relevant activity categories here.
    # NOTE: this is bad practice and should later be changed.

    factory :diagnostic do
      id 4
      name 'Quill Diagnostic'
      key 'diagnostic'
      app_name 'diagnostic'
      uid 'vrG0Fh3VobdALnbs9x-xdA'
      order_number 0
      form_url 'https://connect.quill.org/#/play/diagnostic/'
      module_url 'https://connect.quill.org/#/play/diagnostic/'
      scored false
    end

    factory :proofreader do
      id 1
      name 'Quill Proofreader'
      key 'passage'
      app_name 'grammar'
      uid 'IACa8Egt7CvVYgtHPtEn2w'
      order_number 4
      form_url 'https://grammar.quill.org/play/pf'
      module_url 'https://grammar.quill.org/play/pf'
    end

    factory :grammar do
      id 2
      name 'Quill Grammar'
      key 'sentence'
      app_name 'grammar'
      uid 's2u3tVuguhfUjOQxDP-7RA'
      order_number 3
      form_url 'https://grammar.quill.org/play/sw'
      module_url 'https://grammar.quill.org/play/sw'
    end

    factory :connect do
      id 5
      name 'Quill Connect'
      key 'connect'
      app_name 'connect'
      uid '_o5-YkUO5wfTVAo9j0BweQ'
      order_number 2
      form_url 'https://connect.quill.org/#/play/lesson/'
      module_url 'https://connect.quill.org/#/play/lesson/'
    end

    factory :lesson do
      id 6
      name 'Quill Lessons'
      key 'lessons'
      app_name 'Lessons'
      uid '97_Rf602yUjT9oE_ztZpIA'
      order_number 1
      form_url 'https://connect.quill.org/#/'
      module_url 'https://connect.quill.org/#/play/class-lessons/'
      instructor_mode true
      locked_by_default true
      scored false
    end

  end
end
