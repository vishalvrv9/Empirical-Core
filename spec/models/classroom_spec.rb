require 'rails_helper'

describe Classroom, type: :model do

  let(:classroom) { build(:classroom) }
  let(:teacher) { create(:teacher)}

  context "when created" do

    it 'must be valid with valid info' do
    	expect(classroom).to be_valid
    end

  end

  context "when is created" do
    before do
      @classroom = build(:classroom, name: nil)
    end
    it 'must have a name' do
      expect(@classroom.save).to be(false)
    end
  end

  context "when is created" do
  	before do
  		@classroom = create(:classroom)
  	end
  	it "must generate a valid code" do
  		expect(@classroom.code).not_to be_empty
  	end
  end

  context "when is created" do
    before do
      @classroom = create(:classroom)
    end
    it "must have a unique name" do
      pending("need to reflect and handle non-unique class name specs")
      other_classroom = build(:classroom, teacher_id: @classroom.teacher_id, name: @classroom.name)
      other_classroom.save
      expect(other_classroom.errors).to include(:name)
    end
  end


  describe "#classroom_activity_for" do
    before do
      @activity=Activity.create!()
    end

  	it "returns nil when none associated" do
  		expect(classroom.classroom_activity_for(@activity)).to be_nil
  	end

    it "returns a classroom activity when it's associated" do
    end

  end

  describe '#classrooms_teachers' do
    let(:classroom) {create(:classroom)}
    it "returns the classrooms_teachers associated with the classroom" do
      expect(classroom.classrooms_teachers).to_not be_empty
      expect(classroom.classrooms_teachers).to eq(ClassroomsTeacher.where(classroom_id: classroom.id))
    end
  end

  describe '#teacher' do
    let(:classroom) {create(:classroom)}
    it "returns the classrooms owner" do
      expect(classroom.teacher).to eq(classroom.classrooms_teachers.first.teacher)
    end
  end

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
