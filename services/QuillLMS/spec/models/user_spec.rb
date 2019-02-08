
require 'rails_helper'

describe User, type: :model do

  it { is_expected.to callback(:capitalize_name).before(:save) }
  it { is_expected.to callback(:generate_student_username_if_absent).before(:save) }
  it { is_expected.to callback(:prep_authentication_terms).before(:validation) }
  it { is_expected.to callback(:check_for_school).after(:save) }

  #TODO the validation uses a proc, figure out how to stub that
  #it { is_expected.to callback(:update_invitiee_email_address).after(:save).if(proc) }

  it { should have_many(:notifications) }
  it { should have_many(:checkboxes) }
  it { should have_many(:invitations).with_foreign_key('inviter_id') }
  it { should have_many(:objectives).through(:checkboxes) }
  it { should have_one(:schools_users) }
  it { should have_one(:school).through(:schools_users) }
  it { should have_many(:schools_admins).class_name('SchoolsAdmins') }
  it { should have_many(:administered_schools).through(:schools_admins).source(:school).with_foreign_key('user_id') }
  it { should have_many(:classrooms_teachers) }
  it { should have_many(:classrooms_i_teach).through(:classrooms_teachers).source(:classroom) }
  it { should have_and_belong_to_many(:districts) }
  it { should have_one(:ip_location) }
  it { should have_many(:user_milestones) }
  it { should have_many(:milestones).through(:user_milestones) }

  it { should delegate_method(:name).to(:school).with_prefix(:school) }
  it { should delegate_method(:mail_city).to(:school).with_prefix(:school) }
  it { should delegate_method(:mail_state).to(:school).with_prefix(:school) }

  it { should validate_presence_of(:name) }
  it { should validate_presence_of(:password) }

  #TODO matchers don't support if conditions
  #it { should validate_presence_of(:email).on(:create) }
  #it { should validate_uniqueness_of(:email).on(:create) }
  #it { should validate_presence_of(:username).on(:create) }
  #it { should validate_uniqueness_of(:username).on(:create) }

  it { should validate_presence_of(:username).on(:create) }

  it { should have_secure_password }

  let(:user) { build(:user) }
  let!(:user_with_original_email) { build(:user, email: 'fake@example.com') }

  describe 'flags' do

    describe 'validations' do
      it 'does not raise an error when the flags are in the VALID_FLAGS array' do
        User::VALID_FLAGS.each do |flag|
          expect{ user.update(flags: user.flags.push(flag))}.not_to raise_error
        end
      end

      it 'raises an error if the flag is not in the array' do
        expect {
          user.update!(flags: user.flags.push('wrong'))
        }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end

    describe '#testing_flag' do
      it "returns nil if the user does not have a flag from the User::TESTING_FLAGS array" do
        user.update(flags: [User::PERMISSIONS_FLAGS.first])
        expect(user.testing_flag).to eq(nil)
      end
      it "returns nil if the user does any flags" do
        expect(user.testing_flag).to eq(nil)
      end
      it "returns a flag from the User::TESTING_FLAGS array if the user does have one" do
        sample_testing_flag = User::TESTING_FLAGS.first
        user.update(flags: [sample_testing_flag])
        expect(user.testing_flag).to eq(sample_testing_flag)
      end
    end

    describe '#auditor?' do
      it 'returns true when the user has an auditor flag' do
        user.update(flags: ['auditor'])
        expect(user.auditor?).to eq(true)
      end

      it 'returns false when the user does not have an auditor flag' do
        expect(user.auditor?).to eq(false)
      end
    end

  end

  describe '#last_four' do
    it "returns nil if a user does not have a stripe_customer_id" do
      expect(user.last_four).to eq(nil)
    end

    it "calls Stripe::Customer.retrieve with the current user's stripe_customer_id " do
      user.update(stripe_customer_id: 10)
      expect(Stripe::Customer).to receive(:retrieve).with(user.stripe_customer_id) {
        double('retrieve', sources: double(data: double(first: double(last4: 1000))))
      }
      expect(user.last_four).to eq(1000)
    end
  end

  describe '#utc_offset' do
    it "returns 0 if the user does not have a timezone" do
      expect(user.utc_offset).to eq(0)
    end

    it "returns a negative number if the user has a timezone that is behind utc" do
      user.update(time_zone: 'America/New_York')
      expect(user.utc_offset).to be < 0
    end

    it "returns a postive number if the user has a timezone that is ahead of utc" do
      user.update(time_zone: 'Australia/Perth')
      expect(user.utc_offset).to be > 0
    end
  end

  describe 'subscription methods' do

    context('subscription methods') do
      let(:user) { create(:user) }
      let!(:subscription) { create(:subscription, expiration: Date.tomorrow) }
      let!(:user_subscription) { create(:user_subscription, user: user, subscription: subscription) }

      describe('#subscription_authority_level') do
        let!(:school) {create(:school)}
        let!(:school_subscription) {create(:school_subscription, school: school, subscription: subscription)}

        it "returns 'purchaser' if the user is the purchaser" do
          subscription.update(purchaser_id: user.id)
          expect(user.subscription_authority_level(subscription.id)).to eq('purchaser')
        end

        it "returns 'authorizer' if the user is the authorizer" do
          school.update(authorizer: user)
          SchoolsUsers.create(user: user, school: school)
          user.reload
          expect(user.subscription_authority_level(subscription.id)).to eq('authorizer')
        end

        it "returns 'coordinator' if the user is the coordinator" do
          school.update(coordinator: user)
          SchoolsUsers.create(user: user, school: school)
          user.reload
          expect(user.subscription_authority_level(subscription.id)).to eq('coordinator')
        end

        it "returns nil if the user has no authority" do
          expect(user.subscription_authority_level(subscription.id)).to eq(nil)
        end
      end

      describe '#last_expired_subscription' do
        let!(:subscription2) { create(:subscription, expiration: Date.yesterday) }
        let!(:user_subscription2) { create(:user_subscription, user: user, subscription: subscription2) }

        it "returns the user's most recently expired subscription" do
          subscription.update(expiration: Date.today - 10)
          expect(user.reload.last_expired_subscription).to eq(subscription2)
        end

        it "returns nil if the user does not have a recently expired subscription" do
          user.subscriptions.destroy_all
          expect(user.subscription).not_to be
        end
      end

      describe('#eligible_for_new_subscription?') do
        it "returns true if the user does not have a subscription" do
          user.reload.subscription.destroy
          expect(user.eligible_for_new_subscription?).to be
        end

        it "returns true if the user has a subscription with a trial account type" do
          Subscription::TRIAL_TYPES.each do |type|
            subscription.update(account_type: type)
            expect(user.reload.eligible_for_new_subscription?).to be true
          end
        end

        it "returns false if the user has a subscription that does not have a trial account type" do
          (Subscription::ALL_PAID_TYPES).each do |type|
            subscription.update(account_type: type)
            expect(user.reload.eligible_for_new_subscription?).to be false
          end
        end
      end



      describe('#subscription') do
        it 'returns a subscription if a valid one exists' do
          expect(user.reload.subscription).to eq(subscription)
        end

        it 'returns the subscription with the latest expiration date multiple valid ones exists' do
          later_subscription = create(:subscription, expiration: Date.today + 365)
          create(:user_subscription, user: user, subscription: later_subscription)
          expect(user.reload.subscription).to eq(later_subscription)
        end

        it 'returns nil if a valid subscription does not exist' do
          subscription.update(expiration: Date.yesterday)
          expect(user.reload.subscription).to eq(nil)
        end
      end

      describe('#present_and_future_subscriptions') do
        it 'returns an empty array if there are no subscriptions with expirations in the future' do
          subscription.update(expiration: Date.yesterday)
          expect(user.present_and_future_subscriptions).to be_empty
        end

        it 'returns an array including user.subscription if user has a valid subscription' do
          expect(user.reload.present_and_future_subscriptions).to include(user.subscription)
        end

        it 'returns an array including subscriptions that have not started yet, as long as their expiration is in the future and they have not been de-activated' do
          later_subscription = create(:subscription, start_date: Date.today + 300, expiration: Date.today + 365)
          create(:user_subscription, user: user, subscription: later_subscription)
          expect(user.present_and_future_subscriptions).to include(later_subscription)
        end

        it 'does not return subscriptions that have been deactivated, even if their expiration date is in the future' do
          de_activated_subscription = create(:subscription, start_date: Date.today + 300, expiration: Date.today + 365, de_activated_date: Date.yesterday)
          create(:user_subscription, user: user, subscription: de_activated_subscription)
          expect(user.present_and_future_subscriptions).not_to include(de_activated_subscription)
        end
      end
    end



  end

  describe 'constants' do
    it "should give the correct value for all the contstants" do
      expect(User::ROLES).to eq(%w(student teacher staff))
      expect(User::SAFE_ROLES).to eq(%w(student teacher))
      expect(User::VALID_EMAIL_REGEX).to eq(/\A[\w+\-.]+@[a-z\d\-]+(\.[a-z\d\-]+)*\.[a-z]+\z/i)
    end
  end

  describe '#capitalize_name' do
    let(:user) { create(:user) }

    it 'should set the name as a capitalized name if name is single' do
      user.name = "test"
      expect(user.capitalize_name).to eq("Test")
      expect(user.name).to eq("Test")
    end

    it 'should capitalize both first name and last name if exists' do
      user.name = "test test"
      expect(user.capitalize_name).to eq("Test Test")
      expect(user.name).to eq("Test Test")
    end
  end

  describe '#admin?' do
    let!(:user) { create(:user) }

    context 'when admin exists' do
      let!(:schools_admins) { create(:schools_admins, user: user) }

      it 'should return true' do
        expect(user.admin?).to eq true
      end
    end

    context 'when admin does not exist' do
      it 'should return false' do
        expect(user.admin?).to eq false
      end
    end
  end

  describe 'serialized' do
    let(:user) { create(:user) }

    it 'should return the right seralizer object' do
      expect(user.serialized).to be_a("#{user.role.capitalize}Serializer".constantize)
    end
  end

  describe '#newsletter?' do
    context 'user.send_newsletter = false' do
      let(:teacher) { create(:user, send_newsletter: false) }

      it 'returns false' do
        expect(teacher.newsletter?).to eq(false)
      end
    end

    context 'user.send_newsletter = true' do
      let(:teacher) { create(:user, send_newsletter: true) }

      it 'returns true' do
        expect(teacher.newsletter?).to eq(true)
      end
    end
  end

  describe '#clever_district_id' do
    let(:user) { build_stubbed(:user) }
    let(:district) { double(:district, id: 1) }
    let(:clever_user) { double(:clever_user, district: district) }

    before do
      allow(user).to receive(:clever_user).and_return(clever_user)
    end

    it 'should return the distric id' do
      expect(user.clever_district_id).to eq(district.id)
    end
  end

  describe '#send_account_created_email' do
    let(:user) { create(:user) }

    before do
      allow(UserMailer).to receive(:account_created_email).and_return(double(:email, deliver_now!: true))
    end

    it 'should send the mail with user mailer' do
      expect(UserMailer).to receive(:account_created_email).with(user, "pass", "name")
      user.send_account_created_email("pass", "name")
    end
  end

  describe '#send_invitation_to_non_existing_user' do
    let(:user) { create(:user) }

    before do
      allow(UserMailer).to receive(:invitation_to_non_existing_user).and_return(double(:email, deliver_now!: true))
    end

    it 'should send the invitation received email' do
      expect(UserMailer).to receive(:invitation_to_non_existing_user).with({test: "test"})
      user.send_invitation_to_non_existing_user({test: "test"})
    end
  end

  describe "#send_invitation_to_existing_user" do
    let(:user) { create(:user) }

    before do
      allow(UserMailer).to receive(:invitation_to_existing_user).and_return(double(:email, deliver_now!: true))
    end

    it 'should send the invitation to existing user' do
      expect(UserMailer).to receive(:invitation_to_existing_user).with({test: "test"})
      user.send_invitation_to_existing_user({test: "test"})
    end
  end

  describe '#send_join_school_email' do
    let(:user) { create(:user) }
    let(:school) { double(:school) }

    before do
      allow(UserMailer).to receive(:join_school_email).and_return(double(:email, deliver_now!: true))
    end

    it 'should send the join school email' do
      expect(UserMailer).to receive(:join_school_email).with(user, school)
      user.send_join_school_email(school)
    end
  end

  describe '#send_lesson_plan_email' do
    let(:user) { create(:user) }
    let(:lessons) { double(:lessons) }
    let(:unit) { double(:unit) }

    before do
      allow(UserMailer).to receive(:lesson_plan_email).and_return(double(:email, deliver_now!: true))
    end

    it 'should send the lesson plan email' do
      expect(UserMailer).to receive(:lesson_plan_email).with(user, lessons, unit)
      user.send_lesson_plan_email(lessons, unit)
    end
  end

  describe '#send_premium_user_subscription_email' do
    let(:user) { create(:user) }

    before do
      allow(UserMailer).to receive(:premium_user_subscription_email).and_return(double(:email, deliver_now!: true))
    end

    it 'should send the premium user subscription email' do
      expect(UserMailer).to receive(:premium_user_subscription_email).with(user)
      user.send_premium_user_subscription_email
    end
  end

  describe '#send_premium_school_subscription_email' do
    let(:user)  { create(:user) }
    let(:school) { double(:school) }
    let(:admin) { double(:admin) }

    before do
      allow(UserMailer).to receive(:premium_school_subscription_email).and_return(double(:email, deliver_now!: true))
    end

    it 'should send the premium school subscription email' do
      expect(UserMailer).to receive(:premium_school_subscription_email).with(user, school, admin)
      user.send_premium_school_subscription_email(school, admin)
    end
  end

  describe '#send_new_admin_email' do
    let(:user) { create(:user) }
    let(:school) { double(:school) }

    before do
      allow(UserMailer).to receive(:new_admin_email).and_return(double(:email, deliver_now!: true))
    end

    it 'should send the new admin email' do
      expect(UserMailer).to receive(:new_admin_email).with(user, school)
      user.send_new_admin_email(school)
    end
  end

  describe '#delete_classroom_minis_cache' do
    let(:user) { create(:user) }

    it 'should clear the class_room_minis cache' do
      $redis.set("user_id:#{user.id}_classroom_minis", "anything")
      user.delete_classroom_minis_cache
      expect($redis.get("user_id:#{user.id}_classroom_minis")).to eq(nil)
    end
  end

  describe '#delete_struggling_students_cache' do
    let(:user) { create(:user) }

    it 'should clear the class_room_minis cache' do
      $redis.set("user_id:#{user.id}_struggling_students", "anything")
      user.delete_struggling_students_cache
      expect($redis.get("user_id:#{user.id}_struggling_students")).to eq(nil)
    end
  end

  describe '#delete_dashboard_caches' do
    let(:user) { create(:user) }

    it 'should delete all the three caches' do
      expect(user).to receive(:delete_classroom_minis_cache)
      expect(user).to receive(:delete_struggling_students_cache)
      expect(user).to receive(:delete_difficult_concepts_cache)
      user.delete_dashboard_caches
    end
  end

  describe '#coteacher_invitations' do
    let(:user) { create(:user) }
    let(:invitation) { create(:invitation, archived: false, invitation_type: 'coteacher', invitee_email: user.email) }

    it 'should return the invitation' do
      expect(user.coteacher_invitations).to include(invitation)
    end
  end

  describe '#generate_teacher_account_info' do
    let(:user) { create(:user) }
    let(:premium_state) { double(:premium_state) }
    let(:school) { double(:school) }
    let(:hash) {
      user.attributes.merge!({
        subscription: {'subscriptionType' => premium_state},
        school: school
        })
    }

    before do
      allow(user).to receive(:school).and_return(school)
      allow(user).to receive(:subscription).and_return(false)
      allow(user).to receive(:premium_state).and_return(premium_state)
    end

    it 'should give the correct hash' do
      expect(user.generate_teacher_account_info).to eq(hash)
    end
  end

  describe '#delete_difficult_concepts_cache' do
    let(:user) { create(:user) }

    it 'should clear the class_room_minis cache' do
      $redis.set("user_id:#{user.id}_difficult_concepts", "anything")
      user.delete_difficult_concepts_cache
      expect($redis.get("user_id:#{user.id}_difficult_concepts")).to eq(nil)
    end
  end

  describe "default scope" do
    let(:user1) { create(:user) }
    let(:user2) { create(:user) }
    let(:user2) { create(:user, role: 'temporary') }

    it 'must list all users but the ones with temporary role' do
      User.all.each do |u|
        expect(u.role).to_not eq 'temporary'
      end
    end
  end

  describe 'User scope' do
    describe '::ROLES' do
      it 'must contain all roles' do
        %w(student teacher staff).each do |role|
          expect(User::ROLES).to include role
        end
      end
    end

    describe '::SAFE_ROLES' do
      it 'must contain safe roles' do
        %w(student teacher).each do |role|
          expect(User::SAFE_ROLES).to include role
        end
      end
    end
  end

  # TODO: email is taken as username and email
  describe '.authenticate' do
    let(:username)          { 'Test' }
    let(:username_password) { '123456' }

    let(:email)          { 'Test@example.com' }
    let(:email_password) { '654321' }

    before do
      create(:user, username: username, password: username_password)
      create(:user, email: email, password: email_password)
    end

    subject(:authentication_result) do
      user = User.find_by_username_or_email login_name
      user.authenticate(password)
    end

    %i(email username).each do |cred_base|
      context "with #{cred_base}" do
        let(:password_val) { send(:"#{cred_base}_password") }

        %i(original swapped).each do |name_case|
          case_mod = if name_case == :swapped
                       :swapcase # e.g., "a B c" => "A b C"
                     else
                       :to_s
                     end

          context "#{name_case} case" do
            # e.g., send(:username).send(:to_s),
            #       send(:email   ).send(:swapcase),
            #       etc.
            let(:login_name) { send(cred_base).send(case_mod) }

            context 'with incorrect password' do
              let(:password) { "wrong #{password_val} wrong" }

              it 'fails' do
                expect(authentication_result).to be_falsy
              end
            end

            context 'with correct password' do
              let(:password) { password_val }

              it 'succeeds' do
                expect(authentication_result).to be_truthy
              end
            end
          end
        end
      end
    end
  end

  describe '#redeem_credit' do
    let!(:postive_credit_transaction) { create(:credit_transaction, user: user, amount: 50) }
    let!(:negative_credit_transaction) { create(:credit_transaction, user: user, amount: -5) }

    context 'when the user has a positive balance' do

      context 'and no extant subscription' do

        it "creates a credit transaction that clears the user's credit" do
          user.redeem_credit
          expect(CreditTransaction.last.amount).to eq(-45)
        end

        describe 'the new subscription given to the user' do
          it 'exists' do
            original_subscription_count = user.subscriptions.count
            user.redeem_credit
            expect(user.subscriptions.count).to be > original_subscription_count
          end

          it 'starts immediately' do
            subscription = user.redeem_credit
            expect(subscription.start_date).to eq(Date.today)
          end

          it "with the user as the contact" do
            subscription = user.redeem_credit
            expect(subscription.purchaser).to eq(user)
          end
        end
      end

      context 'and an extant subscription' do
        it "creates a new subscription" do
          subscription = create(:subscription, expiration: Date.today + 3.days)
          create(:user_subscription, user: user, subscription: subscription)

          expect{ user.redeem_credit }.to change(Subscription, :count).by(1)
        end

        it "creates a new subscription with the start date equal to last subscription expiration" do
          subscription = create(:subscription, expiration: Date.today + 3.days)
          create(:user_subscription, user: user, subscription: subscription)

          previous_subscription = user.subscriptions.last
          last_subscription = user.redeem_credit

          expect(last_subscription.start_date).to eq(previous_subscription.expiration)
        end
      end
    end

    context 'when the user does not have a positive balance' do
      it 'does not create an additional credit transaction' do
        negative_credit_transaction.update(amount: postive_credit_transaction.amount * -1)
        # negative credit transaction is the negative value of the positive one here
        old_transaction_count = CreditTransaction.all.count
        user.redeem_credit
        expect(CreditTransaction.all.count).to eq(old_transaction_count)
      end

      it 'does not create a new subscription' do
        negative_credit_transaction.update(amount: postive_credit_transaction.amount * -1)
        original_subscription_count = user.subscriptions.count
        user.redeem_credit
        expect(user.subscriptions.count).to eq(original_subscription_count)
      end
    end
  end

  describe '#password?' do
    it 'returns false if password is not present' do
      user = build(:user, password: nil)
      expect(user.send(:password?)).to be false
    end

    it 'returns true if password is present' do
      user = build(:user, password: 'something')
      expect(user.send(:password?)).to be true
    end
  end

  describe '#role=' do
    it 'return role name' do
      user = build(:user)
      expect(user.role = 'newrole').to eq 'newrole'
    end
  end

  describe '#role' do
    let(:user) { build(:user) }

    it 'returns role as instance of ActiveSupport::StringInquirer' do
      user.role = 'newrole'
      expect(user.role).to be_a ActiveSupport::StringInquirer
    end

    it 'returns true for correct role' do
      user.role = 'newrole'
      expect(user.role.newrole?).to be true
    end

    it 'returns false for incorrect role' do
      user.role = 'newrole'
      expect(user.role.invalidrole?).to be false
    end
  end

  describe '#clear_data' do
    let(:user) { create(:user, google_id: 'sergey_and_larry_were_here') }
    let!(:auth_credential) { create(:auth_credential, user: user) }
    before(:each) { user.clear_data }

    it "changes the user's email to one that is not personally identiable" do
      expect(user.email).to eq("deleted_user_#{user.id}@example.com")
    end

    it "changes the user's username to one that is not personally identiable" do
      expect(user.username).to eq("deleted_user_#{user.id}")
    end

    it "changes the user's name to one that is not personally identiable" do
      expect(user.name).to eq("Deleted User_#{user.id}")
    end

    it "removes the google id" do
      expect(user.google_id).to be nil
    end

    it "destroys associated auth credentials if present" do
      expect(user.reload.auth_credential).to be nil
    end
  end

  describe '#safe_role_assignment' do
    let(:user) { build(:user) }

    it "must assign 'user' role by default" do
      expect(user.safe_role_assignment('nil')).to eq('user')
    end

    it "must assign 'teacher' role even with spaces" do
      expect(user.safe_role_assignment(' teacher ')).to eq('teacher')
    end

    it "must assign 'teacher' role when it's chosen" do
      expect(user.safe_role_assignment('teacher')).to eq('teacher')
    end

    it "must assign 'student' role when it's chosen" do
      expect(user.safe_role_assignment('student')).to eq('student')
    end

    it "must change the role to 'student' inside the instance" do
      user.safe_role_assignment 'student'
      expect(user.role).to be_student
    end
  end

  describe '#permanent?' do
    let(:user) { build(:user) }

    it 'must be true for user' do
      user.safe_role_assignment 'user'
      expect(user).to be_permanent
    end

    it 'must be true for teacher' do
      user.safe_role_assignment 'teacher'
      expect(user).to be_permanent
    end

    it 'must be true for student' do
      user.safe_role_assignment 'student'
      expect(user).to be_permanent
    end
  end

  describe '#requires_password?' do
    let(:user) { build(:user) }

    it 'returns true for all roles but temporary' do
      user.safe_role_assignment 'user'
      expect(user.send(:requires_password?)).to eq(true)
    end
  end

  describe '#generate_password' do
    let(:user) { build(:user, password: 'currentpassword', last_name: 'lastname') }

    it 'sets password to value of last_name' do
      user.generate_password
      expect(user.password).to eq(user.last_name)
    end
  end

  describe '#generate_username' do
    let!(:classroom) { create(:classroom, code: 'cc') }
    let!(:user) { build(:user, first_name: 'first', last_name: 'last', classrooms: [classroom]) }

    it 'generates last name, first name, and class code' do
      expect(user.send(:generate_username, classroom.id)).to eq('first.last@cc')
    end

    it 'handles students with identical names and classrooms' do
      user1 = build(:user, first_name: 'first', last_name: 'last', classrooms: [classroom])
      user1.generate_student(classroom.id)
      user1.save
      user2 = build(:user, first_name: 'first', last_name: 'last', classrooms: [classroom])
      expect(user2.send(:generate_username, classroom.id)).to eq('first.last2@cc')
    end
  end

  describe '#email_required?' do
    let(:user) { build(:user) }

    it 'returns true for teacher' do
      user.safe_role_assignment 'teacher'
      expect(user.send(:email_required?)).to eq(true)
    end

    it 'returns false for temporary role' do
      user.safe_role_assignment 'temporary'
      expect(user.send(:email_required?)).to eq(false)
    end
  end

  describe '#refresh_token!' do
    let(:user) { build(:user) }

    it 'must change the token value' do
      expect(user.token).to be_nil
      expect(user.refresh_token!).to eq(true)
      expect(user.token).to_not be_nil
    end
  end

  context 'when it runs validations' do
    let(:user) { build(:user) }

    it 'is valid with valid attributes' do
      expect(user).to be_valid
    end

    describe 'password attibute' do
      context 'when role requires password' do
        it 'is invalid without password' do
          user = build(:user,  password: nil)
          user.safe_role_assignment 'student'
          expect(user).to_not be_valid
        end

        it 'is valid with password' do
          user = build(:user, password: 'somepassword')
          user.safe_role_assignment 'student'
          expect(user).to be_valid
        end
      end
    end

    describe 'email attribute' do
      it 'is invalid when email is not unique' do
        create(:user, email: 'test@test.lan')
        user = build(:user,  email: 'test@test.lan')
        expect(user).to_not be_valid
      end

      it 'is valid when email is not unique' do
        user = build(:user,  email: 'unique@test.lan')
        expect(user).to be_valid
      end

      context 'when role requires email' do
        it 'is invalid without email' do
          user.safe_role_assignment 'teacher'
          user.email = nil
          expect(user).to_not be_valid
        end

        it 'is valid with email' do
          user.safe_role_assignment 'student'
          user.email = 'email@test.lan'
          expect(user).to be_valid
        end
      end

      context 'when role does not require email' do
        it 'is valid without email' do
          user.safe_role_assignment 'temporary'
          user.email = nil
          expect(user).to be_valid
        end
      end

      context 'when there is an existing user' do
        it 'can update other parts of its record even if it is does not have a unique email' do
          user = User.new(email: user_with_original_email.email)
          expect(user.save(validate: false)).to be
        end
        it 'cannot update its email to an existing one' do
          user = User.create(email: 'whatever@example.com', name: 'whatever whatever')
          user.save(validate: false)
          expect(user.update(email: user_with_original_email.email)).to_not be(false)
        end
      end
    end

    describe 'username attribute' do
      it 'is invalid when not unique' do
        create(:user, username: 'testtest.lan')
        user = build(:user, username: 'testtest.lan')
        expect(user).to_not be_valid
      end

      it 'uniqueness is enforced on extant users changing to an existing username' do
        user1 = create(:user)
        user2 = create(:user)
        expect(user2.update(username: user1.username)).to be(false)
      end
      it 'uniqueness is not enforced on non-unique usernames changing other fields' do
        user1 = create(:user, username: 'testtest.lan')
        user2 = build(:user, username: 'testtest.lan')
        user2.save(validate: false)
        expect(user2.username).to eq(user1.username)
      end

      it 'is invalid when it is formatted like an email' do
        user = build(:user, username: 'testing@example.com')
        expect(user).to_not be_valid
      end

      it 'email formatting is not enforced on usernames when other fields are changed' do
        user = build(:user, username: 'testing@example.com')
        user.save(validate: false)
        expect(user.update(password: 'password')).to be
      end

      context 'role is permanent' do
        it 'is invalid without username and email' do
          user.safe_role_assignment 'student'
          user.email = nil
          user.username = nil
          expect(user).to_not be_valid
        end

        it 'is valid with username' do
          user.safe_role_assignment 'student'
          user.email = nil
          user.username = 'testusername'
          expect(user).to be_valid
        end
      end

      context 'not permanent role' do
        it 'is valid without username and email' do
          user.safe_role_assignment 'temporary'
          user.email = nil
          expect(user).to be_valid
        end
      end
    end
  end

  describe '#name' do
    context 'with valid inputs' do
      it 'has a first_name only' do
        user.last_name = nil
        expect(user.name).to eq(user.first_name)
      end

      it 'has a last name only' do
        user.first_name = nil
        expect(user.name).to eq(user.last_name)
      end
    end
  end

  describe '#student?' do
    let(:user) { build(:user) }

    it "must be true for 'student' roles" do
      user.safe_role_assignment 'student'
      expect(user).to be_student
    end

    it 'must be false for other roles' do
      user.safe_role_assignment 'other'
      expect(user).to_not be_student
    end
  end

  describe '#teacher?' do
    let(:user) { build(:user) }

    it "must be true for 'teacher' roles" do
      user.safe_role_assignment 'teacher'
      expect(user).to be_teacher
    end

    it 'must be false for other roles' do
      user.safe_role_assignment 'other'
      expect(user).to_not be_teacher
    end
  end

  describe '#staff?' do
    let(:user)  { build(:user, role: 'user') }
    let(:staff) { build(:staff) }

    it 'must be true for staff role' do
      expect(staff).to be_staff
    end

    it 'must be false for another roles' do
      expect(user).to_not be_staff
    end
  end

  describe '#generate_student' do
    let(:classroom) { create(:classroom, code: '101') }

    subject do
      student = classroom.students.build(first_name: 'John', last_name: 'Doe')
      student.generate_student(classroom.id)
      student
    end

    describe '#username' do
      subject { super().username }
      it { is_expected.to eq('John.Doe@101') }
    end

    describe '#role' do
      subject { super().role }
      it { is_expected.to eq('student') }
    end

    it 'should authenticate with last name' do
      expect(subject.authenticate('Doe')).to be_truthy
    end
  end

  describe '#newsletter?' do
    let(:user) { build(:user) }

    it 'returns true when send_newsletter is true' do
      user.send_newsletter = true
      expect(user.send(:newsletter?)).to eq(true)
    end

    it 'returns false when send_newsletter is false' do
      user.send_newsletter = false
      expect(user.send(:newsletter?)).to eq(false)
    end
  end

  describe '#sorting_name' do
    subject(:sort_name) { user.sorting_name }

    context 'given distinct first and last names' do
      let(:first_name) { 'John' }
      let(:last_name)  { 'Doe' }
      let(:user) do
        build(:user, first_name: first_name,
                     last_name: last_name)
      end

      it 'returns "last, first"' do
        expect(sort_name).to eq "#{last_name}, #{first_name}"
      end
    end

    context 'given distinct only a single :name' do
      let(:name) { 'SingleName' }
      let(:user) { User.new(name: name) }

      before(:each) { user.name = name }

      it 'returns "name, name"' do
        expect(sort_name).to eq "#{name}, #{name}"
      end
    end
  end

  describe '#subscribe_to_newsletter' do
    let(:user) { build(:user, role: role, send_newsletter: newsletter) }

    context 'role = teacher and send_newsletter = false' do
      let(:newsletter) { false }
      let(:role) { 'teacher' }

      it 'does call the newsletter worker' do
        expect(SubscribeToNewsletterWorker).to receive(:perform_async)
        user.subscribe_to_newsletter
      end
    end

    context 'role = teacher and send_newsletter = true' do
      let(:newsletter) { true }
      let(:role) { 'teacher' }

      it 'does call the newsletter worker' do
        expect(SubscribeToNewsletterWorker).to receive(:perform_async)
        user.subscribe_to_newsletter
      end
    end

    context 'role = student and send_newsletter = false' do
      let(:newsletter) { false }
      let(:role) { 'student' }

      it 'does not call the newsletter worker' do
        expect(SubscribeToNewsletterWorker).to_not receive(:perform_async)
        user.subscribe_to_newsletter
      end
    end

    context 'role = student and send_newsletter = true' do
      let(:newsletter) { true }
      let(:role) { 'student' }

      it 'does not call the newsletter worker' do
        expect(SubscribeToNewsletterWorker).to_not receive(:perform_async)
        user.subscribe_to_newsletter
      end
    end
  end

  describe '#send_welcome_email' do
    let(:user) { build(:user) }

    it 'sends welcome given email' do
      user.email = 'present@exmaple.lan'
      expect { user.send(:send_welcome_email) }.to change { ActionMailer::Base.deliveries.count }.by(1)
    end

    it 'does not send welcome without email' do
      user.email = nil
      expect { user.send(:send_welcome_email) }.to_not change { ActionMailer::Base.deliveries.count }
    end
  end

  describe 'can behave as either a student or teacher' do
    context 'when behaves like student' do
      it_behaves_like 'student'
    end

    context 'when behaves like teacher' do
      it_behaves_like 'teacher'
    end
  end

  describe '#update_invitee_email_address' do
    let!(:invite_one) { create(:invitation) }
    let!(:old_email) { invite_one.invitee_email }
    let!(:invite_two) { create(:invitation, invitee_email: old_email) }

    it 'should update invitee email address in invitations table if email changed' do
      new_email = Faker::Internet.safe_email
      User.find_by_email(old_email).update(email: new_email)
      expect(Invitation.where(invitee_email: old_email).count).to be(0)
      expect(Invitation.where(invitee_email: new_email).count).to be(2)
    end
  end

  it 'does not care about all the validation stuff when the user is temporary'
  it 'disallows regular assignment of roles that are restricted'

  describe '#generate_referrer_id' do
    it 'creates ReferrerUser with the correct referrer code when a teacher is created' do
      referrer_users = ReferrerUser.count
      teacher = create(:teacher)
      expect(ReferrerUser.count).to be(referrer_users + 1)
      expect(teacher.referral_code).to eq(teacher.name.downcase.gsub(/[^a-z ]/, '').gsub(' ', '-') + '-' + teacher.id.to_s)
    end

    it 'does not create a new ReferrerUser when a student is created' do
      referrer_users = ReferrerUser.count
      create(:student)
      expect(ReferrerUser.count).to be(referrer_users)
    end
  end
end
