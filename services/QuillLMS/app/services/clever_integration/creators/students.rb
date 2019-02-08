module CleverIntegration::Creators::Students

  def self.run(parsed_students_response)
    students = parsed_students_response.map do |parsed_student_response|
      student = self.create_student(parsed_student_response)
      student
    end
    students
  end

  private

  def self.create_student(parsed_student_response)
    student = User.find_or_initialize_by(clever_id: parsed_student_response[:clever_id])
    student.update(parsed_student_response.merge({
      role: 'student',
      account_type: 'Clever'
    }))
    if student.errors.any?
      student.update(parsed_student_response.merge({
        email: nil,
        role: 'student',
        account_type: 'Clever'
      }))
    end
    if student.errors.any?
      student.update(parsed_student_response.merge({
        username: nil,
        role: 'student',
        account_type: 'Clever'
      }))
    end
    student.reload if student.id?
  end
end
