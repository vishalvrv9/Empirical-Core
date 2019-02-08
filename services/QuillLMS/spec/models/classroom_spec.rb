require 'rails_helper'

describe Classroom, type: :model do

  it { should validate_uniqueness_of(:code) }
  it { should validate_presence_of(:name) }

  it { should have_many(:classroom_units) }
  it { should have_many(:units).through(:classroom_units) }
  it { should have_many(:unit_activities).through(:units) }
  it { should have_many(:activities).through(:unit_activities) }
  it { should have_many(:activity_sessions).through(:classroom_units) }
  #check if the code is correct as assign activities model does not exist
  #it { should have_many(:sections).through(:assign_activities) }
  it { should have_many(:coteacher_classroom_invitations) }
  it { should have_many(:students_classrooms).with_foreign_key('classroom_id').dependent(:destroy).class_name("StudentsClassrooms") }
  it { should have_many(:students).through(:students_classrooms).source(:student).with_foreign_key('classroom_id').inverse_of(:classrooms).class_name("User") }
  it { should have_many(:classrooms_teachers).with_foreign_key('classroom_id') }
  it { should have_many(:teachers).through(:classrooms_teachers).source(:user) }

  it { is_expected.to callback(:hide_appropriate_classroom_units).after(:commit) }

  let(:classroom) { build(:classroom) }
  let(:teacher) { create(:teacher) }

  describe '#create_with_join' do

    context 'when passed valid classrooms data' do
      it "creates a classroom" do
        old_count = Classroom.all.count
        Classroom.create_with_join(classroom.attributes, teacher.id)
        expect(Classroom.all.count).to eq(old_count + 1)
      end

      it "creates a ClassroomsTeacher" do
        old_count = ClassroomsTeacher.all.count
        Classroom.create_with_join(classroom.attributes, teacher.id)
        expect(ClassroomsTeacher.all.count).to eq(old_count + 1)
      end

      it "makes the classroom teacher an owner if no third argument is passed" do
        old_count = ClassroomsTeacher.all.count
        Classroom.create_with_join(classroom.attributes, teacher.id)
        expect(ClassroomsTeacher.all.count).to eq(old_count + 1)
        expect(ClassroomsTeacher.last.role).to eq('owner')
      end
    end

    context 'when passed invalid classrooms data' do
      def invalid_classroom_attributes
        attributes = classroom.attributes
        attributes.delete("name")
        attributes
      end
      it "does not create a classroom" do
        old_count = Classroom.all.count
        Classroom.create_with_join(invalid_classroom_attributes, teacher.id)
        expect(Classroom.all.count).to eq(old_count)
      end

      it "does not create a ClassroomsTeacher" do
        old_count = ClassroomsTeacher.all.count
        Classroom.create_with_join(invalid_classroom_attributes, teacher.id)
        expect(ClassroomsTeacher.all.count).to eq(old_count)
      end

    end

  end

  describe '#coteachers' do
    let(:classroom) { build_stubbed(:classroom) }
    let(:teacher) { double(:teacher) }
    let(:user) { double(:user, teacher: teacher) }
    let(:students) { double(:students, where: [user]) }
    let(:classrooms_teachers) { double(:classrooms_teachers, includes: students) }

    before do
      allow(classroom).to receive(:classrooms_teachers).and_return(classrooms_teachers)
    end

    it 'should return the teachers' do
      expect(classroom.coteachers).to include(teacher)
    end
  end

  describe '#unique_topic_count' do
    let(:classroom) { create(:classroom) }
    let(:activity_session) { double(:activity_session, topic_count: 10) }

    context 'when unique topic count array exists' do
      before do
        allow(classroom).to receive(:unique_topic_count_array).and_return([activity_session])
      end

      it 'should return the topic count for the first memeber of the array' do
        expect(classroom.unique_topic_count).to eq(10)
      end
    end

    context 'when unique topic count array does not exist' do
      before do
        allow(classroom).to receive(:unique_topic_count_array).and_return([])
      end

      it 'should return the topic count for the first memeber of the array' do
        expect(classroom.unique_topic_count).to eq(nil)
      end
    end
  end

  describe '#unique_topic_count_array' do
    let(:classroom) { create(:classroom) }

    before do
      allow(ProgressReports::Standards::ActivitySession).to receive(:new).and_call_original
    end

    it 'should create a activity session progress report' do
      expect(ProgressReports::Standards::ActivitySession).to receive(:new).with(classroom.owner)
      classroom.unique_topic_count_array
    end
  end

  describe '#archived_classrooms_manager' do
    let(:classroom) { create(:classroom) }

    before do
      allow(classroom).to receive(:coteachers).and_return([])
    end

    it 'should return the correct hash' do
      expect(classroom.archived_classrooms_manager).to eq({
        createdDate: classroom.created_at.strftime("%m/%d/%Y"),
        className: classroom.name,
        id: classroom.id,
        studentCount: classroom.students.count,
        classcode: classroom.code,
        ownerName: classroom.owner.name,
        from_google: !!classroom.google_classroom_id,
        coteachers: []
        })
    end
  end

  describe '#hide_appropriate_classroom_units' do
    let(:classroom) { create(:classroom) }

    it 'should call hide_all_classroom_units if classroom not visible' do
      classroom.visible = false
      expect(classroom).to receive(:hide_all_classroom_units)
      classroom.hide_appropriate_classroom_units
    end

    it 'should not do anything if classroom visible' do
      classroom.visible = true
      expect(classroom).to_not receive(:hide_all_classroom_units)
      classroom.hide_appropriate_classroom_units
    end
  end

  describe '#with_student_ids' do
    let(:classroom) { create(:classroom) }

    it 'should return the attributes with student ids' do
      expect(classroom.with_students_ids).to eq(classroom.attributes.merge({student_ids: classroom.students.ids}))
    end
  end

  describe '#with_students' do
    let(:classroom) { create(:classroom) }

    it 'should return the attributes with the students' do
      expect(classroom.with_students).to eq(classroom.attributes.merge({students: classroom.students}))
    end
  end

  describe "#generate_code" do
    it "must not run before validate" do
      expect(classroom.code).to be_nil
    end
    it "must generate a code after validations" do
      classroom=create(:classroom)
      expect(classroom.code).to_not be_nil
    end

    it "does not generate a code twice" do
      classroom = create(:classroom)
      old_code = classroom.code
      classroom.update_attributes(name: 'Testy Westy')
      expect(classroom.code).to eq(old_code)
    end
  end

end
