class RemoveCategoryFromCriteria < ActiveRecord::Migration
  def up
    remove_column :criteria, :category
  end

  def down
    add_column :categories, :integer, null: false
  end
end
