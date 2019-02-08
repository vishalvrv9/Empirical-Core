namespace :uid do
  desc 'generate uids'
  task :generate => :environment do
    generate_uids
  end

  def generate_uids
    [Topic, TopicCategory, Section, Concept, ActivityClassification].each do |model|
      model.find_each do |record|
        record.send(:generate_uid)
        record.save
      end
    end
  end
end