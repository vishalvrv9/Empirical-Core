module AdminDemo::Helpers
  def get_example_user_attributes(example_user_id)
    example_user = User.find(example_user_id)
    example_classroom_ids = example_user.classrooms_i_teach.map{|x| x.id}
    example_classroom_students = example_user.classrooms_i_teach.map{|x| [x.id, x.students.pluck(:id)]}.to_h
    return {
      example_user: example_user,
      example_classroom_ids: example_classroom_ids,
      example_classroom_students: example_classroom_students, 
    }
  end
end

namespace 'admin_demo' do 

  task create: :environment do
    

  end

end