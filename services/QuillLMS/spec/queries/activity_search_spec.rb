require 'rails_helper'

describe ActivitySearch do
  describe 'search' do
    let!(:activity_classification) { create(:activity_classification) }
    let!(:topic) { create(:topic) }
    let!(:section) { create(:section) }
    let!(:activity) { create(:activity, activity_categories: [], flags: %w{beta production}, activity_classification_id: activity_classification.id, topic: topic, section: section) }
    let!(:activity_category) { create(:activity_category, activities: [activity]) }
    let!(:activity_category_activity) { create(:activity_category_activity, activity_category: activity_category, activity: activity) }

    it 'should get the correct attributes based on the flag given' do
      expect(described_class.search("beta").first).to eq(
        {
          "activity_name" => activity.name,
          "activity_description" => activity.description ,
          "activity_flag" => "{beta,production}",
          "activity_id" => activity.id.to_s,
          "activity_uid" => activity.uid,
          "activity_category_id" => activity_category.id.to_s,
          "activity_category_name" => activity_category.name,
          "section_id" => section.id.to_s,
          "section_name" => section.name,
          "topic_name" => topic.name,
          "classification_id" => activity_classification.id.to_s
        }
      )
    end
  end
end