require 'rails_helper'

describe AssignRecommendationsWorker do
  let(:subject) { described_class.new }

  describe "#perform" do
    before do
      allow(Units::Creator).to receive(:assign_unit_template_to_one_class) { true }
      allow(Units::Updater).to receive(:assign_unit_template_to_one_class) { true }
    end

    context 'when no units is found' do
      context 'when unit was found with the unit template name' do
        let(:unit_template) { create(:unit_template) }
        let(:classroom) { create(:classroom) }
        let(:teacher) { classroom.owner }
        let(:student) { create(:student) }
        let!(:unit) { create(:unit, name: unit_template.name, user: teacher, visible: false) }

        let(:analyzer) { double(:analyzer, track: true) }

        def call_method
          subject.perform(
              unit_template.id,
              classroom.id,
              [student.id],
              "last",
              "lesson"
          )
        end

        before do
          allow(Analyzer).to receive(:new) { analyzer }
          allow(PusherRecommendationCompleted).to receive(:run) { true }
        end

        it 'should make there unit visible and assign unit template to one class' do
          call_method
          expect(unit.reload.visible).to eq true
        end

        it 'should track the recommendation assignment' do
          expect(analyzer).to receive(:track).with(teacher, SegmentIo::Events::ASSIGN_RECOMMENDATIONS)
          call_method
        end

        it 'should run the pusher recommendations' do
          expect(PusherRecommendationCompleted).to receive(:run).with(classroom, unit_template.id, "lesson")
          call_method
        end

        it 'should update the unit and assign it to one class' do
          expect(Units::Updater).to receive(:assign_unit_template_to_one_class).with(
              unit.id,
              {
                  id: classroom.id,
                  student_ids: [student.id],
                  assign_on_join: false
              },
              unit_template.id,
              teacher.id
          )
          call_method
        end
      end

      context 'when unit was not found with the unit template name' do
        let(:unit_template) { create(:unit_template) }
        let(:classroom) { create(:classroom) }
        let(:teacher) { classroom.owner }
        let(:student) { create(:student) }
        let(:analyzer) { double(:analyzer, track: true) }

        def call_method
          subject.perform(
              unit_template.id,
              classroom.id,
              [student.id],
              "last",
              "lesson"
          )
        end

        before do
          allow(Analyzer).to receive(:new) { analyzer }
          allow(PusherRecommendationCompleted).to receive(:run) { true }
        end

        it 'should track the recommendation assignment' do
          expect(analyzer).to receive(:track).with(teacher, SegmentIo::Events::ASSIGN_RECOMMENDATIONS)
          call_method
        end

        it 'should run the pusher recommendations' do
          expect(PusherRecommendationCompleted).to receive(:run).with(classroom, unit_template.id, "lesson")
          call_method
        end

        it 'should update the unit and assign it to one class' do
          expect(Units::Creator).to receive(:assign_unit_template_to_one_class).with(
              teacher.id,
              unit_template.id,
              {
                  id: classroom.id,
                  student_ids: [student.id],
                  assign_on_join: false
              },
          )
          call_method
        end
      end
    end

    context 'when more than one unit is found' do
      let(:unit_template) { create(:unit_template) }
      let(:classroom) { create(:classroom) }
      let(:teacher) { classroom.owner }
      let(:student) { create(:student) }
      let!(:unit) { create(:unit, unit_template: unit_template, user: teacher, visible: false, updated_at: Date.today) }
      let!(:unit1) { create(:unit, unit_template: unit_template, user: teacher, visible: false, updated_at: Date.today-1.day) }

      let(:analyzer) { double(:analyzer, track: true) }

      def call_method
        subject.perform(
            unit_template.id,
            classroom.id,
            [student.id],
            "last",
            "lesson"
        )
      end

      before do
        allow(Analyzer).to receive(:new) { analyzer }
        allow(PusherRecommendationCompleted).to receive(:run) { true }
      end

      it 'should make the unit visible' do
        call_method
        expect(unit.reload.visible).to eq true
      end

      it 'should track the recommendation assignment' do
        expect(analyzer).to receive(:track).with(teacher, SegmentIo::Events::ASSIGN_RECOMMENDATIONS)
        call_method
      end

      it 'should run the pusher recommendations' do
        expect(PusherRecommendationCompleted).to receive(:run).with(classroom, unit_template.id, "lesson")
        call_method
      end

      it 'should update the unit and assign it to one class' do
        expect(Units::Updater).to receive(:assign_unit_template_to_one_class).with(
            unit.id,
            {
                id: classroom.id,
                student_ids: [student.id],
                assign_on_join: false
            },
            unit_template.id,
            teacher.id
        )
        call_method
      end
    end

    context 'when only one unit is found' do
      let(:unit_template) { create(:unit_template) }
      let(:classroom) { create(:classroom) }
      let(:teacher) { classroom.owner }
      let(:student) { create(:student) }
      let!(:unit) { create(:unit, unit_template: unit_template, user: teacher, visible: false) }

      let(:analyzer) { double(:analyzer, track: true) }

      def call_method
        subject.perform(
            unit_template.id,
            classroom.id,
            [student.id],
            "last",
            "lesson"
        )
      end

      before do
        allow(Analyzer).to receive(:new) { analyzer }
        allow(PusherRecommendationCompleted).to receive(:run) { true }
      end

      it 'should make the unit visible' do
        call_method
        expect(unit.reload.visible).to eq true
      end

      it 'should track the recommendation assignment' do
        expect(analyzer).to receive(:track).with(teacher, SegmentIo::Events::ASSIGN_RECOMMENDATIONS)
        call_method
      end

      it 'should run the pusher recommendations' do
        expect(PusherRecommendationCompleted).to receive(:run).with(classroom, unit_template.id, "lesson")
        call_method
      end

      it 'should update the unit and assign it to one class' do
        expect(Units::Updater).to receive(:assign_unit_template_to_one_class).with(
            unit.id,
            {
              id: classroom.id,
              student_ids: [student.id],
              assign_on_join: false
            },
            unit_template.id,
            teacher.id
        )
        call_method
      end
    end
  end
end
