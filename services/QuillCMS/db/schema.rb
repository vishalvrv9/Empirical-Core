# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20181126221244) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "responses", force: :cascade do |t|
    t.string "uid"
    t.integer "parent_id"
    t.string "parent_uid"
    t.string "question_uid"
    t.string "author"
    t.text "text"
    t.text "feedback"
    t.integer "count", default: 1
    t.integer "first_attempt_count", default: 0
    t.integer "child_count", default: 0
    t.boolean "optimal"
    t.boolean "weak"
    t.jsonb "concept_results"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "spelling_error", default: false
    t.index ["optimal"], name: "index_responses_on_optimal"
    t.index ["question_uid"], name: "index_responses_on_question_uid"
    t.index ["uid"], name: "index_responses_on_uid"
  end

end
