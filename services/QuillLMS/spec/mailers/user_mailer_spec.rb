require 'rails_helper'

describe UserMailer do

  describe 'welcome_email' do
    let(:user) { build(:user) }
    let(:mail) { described_class.welcome_email(user) }

    it 'should set the subject, receiver and the sender' do
      expect(mail.subject).to eq('Welcome to Quill!')
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(['hello@quill.org'])
    end
  end

  describe 'invitation_to_non_existing_user' do
    let(:invitation_hash) { { "inviter_name" => "test", "inviter_email" => "inviter@test.com", "invitee_email" => "invitee@test.com", classroom_names: ["classroom1"] } }
    let(:mail) { described_class.invitation_to_non_existing_user(invitation_hash) }

    it 'should set the subject, reply_to, receiver and the sender' do
      expect(mail.subject).to eq('test has invited you to co-teach on Quill.org!')
      expect(mail.to).to eq(["invitee@test.com"])
      expect(mail.from).to eq(['hello@quill.org'])
      expect(mail.reply_to).to eq(["inviter@test.com"])
    end
  end

  describe 'invitation_to_existing_user' do
    let(:invitation_hash) { { "inviter_name" => "test", "inviter_email" => "inviter@test.com", "invitee_email" => "invitee@test.com", classroom_names: ["classroom1"] } }
    let(:mail) { described_class.invitation_to_existing_user(invitation_hash) }

    it 'should set the subject, reply_to, receiver and the sender' do
      expect(mail.subject).to eq('test has invited you to co-teach on Quill.org!')
      expect(mail.to).to eq(["invitee@test.com"])
      expect(mail.from).to eq(['hello@quill.org'])
      expect(mail.reply_to).to eq(["inviter@test.com"])
    end
  end

  describe 'password_reset_email' do
    let!(:user) { create(:user) }

    it 'should set the subject, receiver and the sender' do
      user.refresh_token!
      mail = described_class.password_reset_email(user)
      expect(mail.subject).to eq("Reset your Quill password")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["hello@quill.org"])
    end
  end

  describe 'account_created_email' do
    let(:user) { build(:user) }
    let(:mail) { described_class.account_created_email(user, "test123", "admin") }

    it 'should set the subject, receiver and the sender' do
      expect(mail.subject).to eq("Welcome to Quill, An Administrator Created A Quill Account For You!")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["hello@quill.org"])
    end
  end

  describe 'join_school_email' do
    let(:user) { build(:user) }
    let(:school) { build(:school) }
    let(:mail) { described_class.join_school_email(user, school) }

    it 'should set the subject, receiver and the sender' do
      expect(mail.subject).to eq("#{user.first_name}, you need to link your account to your school")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["hello@quill.org"])
    end
  end

  describe 'lesson_plan_email' do
    let(:user) { build(:user) }
    let(:lesson) { build(:lesson) }
    let(:unit) { build(:unit) }
    let(:mail) { described_class.lesson_plan_email(user, [lesson], unit) }

    it 'should set the subject, receiver and the sender' do
      expect(mail.subject).to eq("Next Steps for the Lessons in Your New Activity Pack, #{unit.name}")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["amr.thameen@quill.org"])
    end
  end

  describe 'premium_user_subscription_email' do
    let(:user) { build(:user) }
    let(:mail) { described_class.premium_user_subscription_email(user) }

    it 'should set the subject, receiver and the sender' do
      expect(mail.subject).to eq("#{user.first_name}, your Quill account has been upgraded to Premium! ⭐️")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["hello@quill.org"])
    end
  end

  describe 'premium_school_subscription_email' do
    let(:admin) { build(:admin) }
    let(:school) { build(:school) }
    let(:user) { build(:admin) }
    let(:mail) { described_class.premium_school_subscription_email(user, school, admin) }

    it 'should set the subject, receiver and the sender' do
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["hello@quill.org"])
    end
  end

  describe 'new_admin_email' do
    let(:user) { build(:user) }
    let(:school) { build(:school) }
    let(:mail) { described_class.new_admin_email(user, school) }

    it 'should set the subject, receiver and the sender' do
      expect(mail.subject).to eq("#{user.first_name}, you are now an admin on Quill!")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["becca@quill.org"])
    end
  end

  describe 'premium_missing_school_email' do
    let(:user) { build(:user) }
    let(:mail) { described_class.premium_missing_school_email(user) }

    it 'should set the subject, receiver and the sender' do
      expect(mail.subject).to eq("#{user.name} has purchased School Premium for a missing school")
      expect(mail.to).to eq(["becca@quill.org", "amr@quill.org", "emilia@quill.org"])
      expect(mail.from).to eq(['hello@quill.org'])
    end
  end
end
