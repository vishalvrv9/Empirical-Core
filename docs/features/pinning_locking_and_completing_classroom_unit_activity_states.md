# Pinning, Locking, and Completing Classroom Unit Activity States

## Pinned

### What does it mean and what are its consequences?
A classroom unit activity state that is "pinned" for a student is intended to be one that they take immediate action on, by joining the lesson in the case of lesson activities. It will automatically take the place of the 'Next Activity' listed on the top of the student profile. We use Pusher to ensure that pinned classroom activities are shown in this way as soon as they are pinned, without the student having to refresh the page.

### Default state
By default, lessons are not pinned.

### Pinning a lesson
Lesson classroom unit activity states become pinned when teachers launch them for a given classroom. Right now, we have no way for teachers to manually pin classroom unit activity states.

> Note that previewing a lesson is not the same as launching it, and will not pin the classroom activity.

### Unpinning a lesson
Lessons can become unpinned through the following paths:

- Saving and exiting a lesson
- Completing a lesson
  - Clicking the "End Lesson" button on the last slide of a lesson
  - Choosing a follow up action on the last slide of a lesson
  - Clicking "Mark Lesson As Completed" from the My Lessons page after having exited a started lesson
  - Clicking 'Mark Lesson As Completed' from the modal that appears after a lesson tab has been left open for twelve hours
- Pinning another lesson


### Other notes
> There can only be one pinned classroom activity per classroom at a time.

## Locked

### What does it mean and what are its consequences?
A classroom unit activity state that is locked is one that students should not begin playing without further action from their teacher. On their student profile, it will render with the static text 'Locked by teacher', and not be clickable.

### Default state
Lesson classroom unit activity states are locked by default due to an after_create callback on the classroom unit activity state model. Note that this callback will not fire if a create method that evades callbacks is used, so lesson classroom unit activity states should be explicitly created with locked: true in that instance.

### Unlocking a lesson
Lesson classroom unit activity states become unlocked when teachers launch them. Right now, we have no way for teachers to manually unlock activities.

> Previewing a lesson is not the same as launching it, and will not unlock the classroom activity.

### Relocking a lesson
Lesson classroom unit activity states can become relocked through the following paths:

- Saving and exiting a lesson
- Completing a lesson
  - Clicking the "End Lesson" button on the last slide of a lesson
  - Choosing a follow up action on the last slide of a lesson
  - Clicking "Mark Lesson As Completed" from the My Lessons page after having exited a started lesson
  - Clicking 'Mark Lesson As Completed' from the modal that appears after a lesson tab has been left open for twelve hours

## Completed

### What does it mean and what are its consequences?
A completed classroom unit activity state is one that has been marked completed by the teacher, and which is not intended to be revisited. It is marked as completed and inaccessible from the students' profile. Students that were present for a completed lesson will have it indicated in blue on the Activity Summary, while students that were not will have an X over the activity icon to indicate that they missed it.

### Default state
Classroom unit activity states are not completed by default.

### Completing a lesson
Classroom unit activity states can be completed in the following ways:
- Clicking the "End Lesson" button on the last slide of a lesson
- Choosing a follow up action on the last slide of a lesson
- Clicking "Mark Lesson As Completed" from the My Lessons page after having exited a started lesson
- Clicking 'Mark Lesson As Completed' from the modal that appears after a lesson tab has been left open for twelve hours

## General notes

A classroom unit activity state should never be pinned and locked at the same time. There is no database- or model-level restriction against this, but if a classroom unit activity state is getting pinned it should always also be getting unlocked at the same time. Likewise with pinned and completed classroom unit activity states.
