class ActivitySerializer < ActiveModel::Serializer
  attributes :uid, :id, :name, :description, :flags, :data, :created_at, :updated_at, :anonymous_path, :activity_classification_id

  # has_one :classification, serializer: ClassificationSerializer
  # has_one :topic

  def anonymous_path
    if object.activity_classification_id != 6
  	  Rails.application.routes.url_helpers.anonymous_activity_sessions_path(activity_id: object.id)
    else
      "#{ENV['DEFAULT_URL']}/preview_lesson/#{object.uid}"
    end
  end

end
