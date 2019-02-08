class Recommendation < ActiveRecord::Base
  belongs_to :activity
  belongs_to :unit_template
  has_many :criteria, dependent: :destroy
  validates :name, length: { minimum: 2, maximum: 150 }
  validates :name, :activity, :category, :unit_template, presence: true

  default_scope { order(order: :asc) }

  enum category: { independent_practice: 0, group_lesson: 1 }
end
