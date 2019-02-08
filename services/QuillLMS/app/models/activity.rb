class Activity < ActiveRecord::Base
  include Flags
  include Uid

  has_and_belongs_to_many :unit_templates
  belongs_to :classification, class_name: 'ActivityClassification', foreign_key: 'activity_classification_id'
  belongs_to :topic

  has_one :section, through: :topic

  belongs_to :follow_up_activity, class_name: "Activity", foreign_key: "follow_up_activity_id"

  has_many :unit_activities, dependent: :destroy
  has_many :units, through: :unit_activities
  has_many :classroom_units, through: :units
  has_many :classrooms, through: :classroom_units
  has_many :recommendations, dependent: :destroy
  has_many :activity_category_activities, dependent: :destroy
  has_many :activity_categories, through: :activity_category_activities
  before_create :flag_as_beta, unless: :flags?
  after_commit :clear_activity_search_cache

  delegate :form_url, to: :classification, prefix: true

  scope :production, -> {
    where(<<-SQL, :production)
      activities.flags = '{}' OR ? = ANY (activities.flags)
    SQL
  }

  scope :beta_user, -> { where("'beta' = ANY(activities.flags) OR 'production' = ANY(activities.flags)")}
  scope :alpha_user, -> { where("'alpha' = ANY(activities.flags) OR 'beta' = ANY(activities.flags) OR 'production' = ANY(activities.flags)")}

  scope :with_classification, -> { includes(:classification).joins(:classification) }

  def self.diagnostic_activity_ids
    ActivityClassification.find_by(key: 'diagnostic')&.activities&.pluck(:id) || []
  end

  def self.activity_with_recommendations_ids
    Recommendation.all.map(&:activity_id).uniq
  end

  def self.find_by_id_or_uid(arg)
    begin
      find_by!(uid: arg)
    rescue ActiveRecord::RecordNotFound
      find(arg)
    rescue ActiveRecord::RecordNotFound
      raise ActiveRecord::RecordNotFound.new(
        "Couldn't find Activity with 'id' or 'uid'=#{arg}"
      )
    end
  end

  def topic_uid= uid
    self.topic_id = Topic.find_by_uid(uid).id
  end

  def activity_classification_uid= uid
    self.activity_classification_id = ActivityClassification.find_by(uid: uid).id
  end

  def self.user_scope(user_flag)
    if user_flag == 'alpha'
      Activity.alpha_user
    elsif user_flag == 'beta'
      Activity.beta_user
    else
      Activity.production
    end
  end

  def classification_key= key
    self.classification = ActivityClassification.find_by_key(key)
  end

  def classification_key
    classification.try(:key)
  end

  def form_url
    url = Addressable::URI.parse(classification.form_url)

    if uid.present?
      params = (url.query_values || {})
      params[:uid] = uid
      url.query_values = params
    end

    url
  end

  def module_url(activity_session)
    @activity_session = activity_session
    initial_params = {student: activity_session.uid}
    module_url_helper(initial_params)
  end

  def anonymous_module_url
    initial_params = {anonymous: true}
    module_url_helper(initial_params)
  end

  # TODO cleanup
  def flag flag = nil
    return super(flag) unless flag.nil?
    flags.first
  end

  def flag= flag
    flag = :archived if flag.to_sym == :archive
    self.flags = [flag]
  end

  def clear_activity_search_cache
    # can't call class methods from callback
    self.class.clear_activity_search_cache
  end

  def self.clear_activity_search_cache
    %w(private_ production_ beta_ alpha_).push('').each do |flag|
      $redis.del("default_#{flag}activity_search")
    end
  end

  def self.set_activity_search_cache
    $redis.set('default_activity_search', ActivitySearchWrapper.new.search.to_json)
  end

  def is_lesson?
    self.activity_classification_id == 6
  end

  private

  def flag_as_beta
    flag 'beta'
  end

  def lesson_url_helper
    base = classification.module_url
    lesson = uid + '?'
    classroom_unit_id = @activity_session.classroom_unit.id.to_s
    student_id = @activity_session.uid
    url = base + lesson + 'classroom_unit_id=' + classroom_unit_id + '&student=' + student_id
    @url = Addressable::URI.parse(url)
  end

  def module_url_helper(initial_params)
    if classification.key == 'lessons'
      lesson_url_helper
    else
      @url = Addressable::URI.parse(classification.module_url)
      params = (@url.query_values || {})
      params.merge!(initial_params)
      params[:uid] = uid if uid.present?
      @url.query_values = params
      fix_angular_fragment!
    end
  end

  def fix_angular_fragment!
    unless @url.fragment.blank?
      @url.path = "/##{@url.fragment}"
      @url.fragment = nil
    end

    return @url
  end
end
