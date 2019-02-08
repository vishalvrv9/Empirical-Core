require 'rails_helper'

describe Cms::TeacherSearchQuery do
  before do
    Timecop.freeze
  end

  after do 
    Timecop.return
  end

  describe '#run' do
    todays_date = Date.today
    let!(:user) { create(:user) }
    let!(:school) { create(:school) }
    let!(:subscription) { create(:subscription) }
    let!(:user_subscription) { create(:user_subscription, user: user, subscription: subscription) }
    let!(:activity_session) { create(:activity_session, user_id: user.id, completed_at: todays_date) }
    let!(:classroom) { create(:classroom, visible: true) }
    let!(:students_classrooms) { create(:students_classrooms, student: user, classroom: classroom) }
    let!(:classrooms_teacher) { create(:classrooms_teacher, classroom: classroom, user: user, role: "owner") }
    let!(:schools_users)  { create(:schools_users, user: user, school: school) }
    let!(:schools_admins) { create(:schools_admins, user: user, school: school) }
    let!(:subject) { described_class.new(school.id) }

    it 'should return the correct result in the right format' do
      output = subject.run
      expected = {
        teacher_name: user.name,
        number_classrooms: "1",
        number_students: "1",
        number_activities_completed: "1",
        last_active: (todays_date).strftime("%b %d,\u00A0%Y"),
        subscription: subscription.account_type,
        user_id: user.id.to_s,
        admin_id: schools_admins.id.to_s
        }
      expect(output).to eql(
        [expected.stringify_keys]
      )
    end
  end
end
