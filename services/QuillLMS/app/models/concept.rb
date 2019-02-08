class Concept < ActiveRecord::Base
  include Uid
  belongs_to :parent, class_name: 'Concept', foreign_key: :parent_id
  belongs_to :replacement, class_name: 'Concept', foreign_key: :replacement_id
  validates :name, presence: true
  has_many :concept_results

  def lineage
    family_tree = self.name
    if self.parent
      family_tree = self.parent.name+' | '+family_tree
    end
    if self.parent and self.parent.parent
      family_tree = self.parent.parent.name+' | '+family_tree
    end
    family_tree
  end

  # need the below because those making POST requests to /api/v1/concepts know only uids, not ids
  def parent_uid= uid
    self.parent_id = Concept.find_by(uid: uid).id
  end

  def replacement_uid= uid
    self.replacement_id = Concept.find_by(uid: uid).id
  end

  # Find all the concepts that are not a parent of any other concept
  def self.leaf_nodes
    concepts = Concept.arel_table
    distinct_parent_ids = concepts.project('DISTINCT(parent_id)')
                                  .where(concepts[:parent_id].not_eq(nil))
    where.not(concepts[:id].in(distinct_parent_ids))
  end

  def self.all_with_level
    # https://github.com/dockyard/postgres_ext/blob/master/docs/querying.md
    concept2 = Concept.select(:id, :name, :uid, :parent_id, '2 AS level', :description).where(parent_id: nil, visible: true)
    concept1 = Concept.select(:id, :name, :uid, :parent_id, '1 AS level', :description).where(parent_id: concept2.ids, visible: true)
    concept0 = Concept.select(:id, :name, :uid, :parent_id, '0 AS level', :description).where(parent_id: concept1.ids, visible: true)
    concept2 + concept1 + concept0
  end

  def self.childless_only
    Concept.find_by_sql("
      SELECT concepts.id, concepts.name, concepts.uid, concepts.parent_id, concepts.created_at, concepts.visible::BOOLEAN FROM concepts
      LEFT JOIN concepts AS children ON children.parent_id = concepts.id
      WHERE children.id is null
    ")
  end

  def self.find_by_id_or_uid(arg)
    begin
      find(arg)
    rescue ActiveRecord::RecordNotFound
      find_by(uid: arg)
    rescue ActiveRecord::RecordNotFound
      raise ActiveRecord::RecordNotFound.new(
        "Couldn't find Concept with 'id' or 'uid'=#{arg}"
      )
    end
  end
end
