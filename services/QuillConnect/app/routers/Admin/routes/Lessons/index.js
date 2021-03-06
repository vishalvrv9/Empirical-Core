import Lessons from 'components/lessons/lessons.jsx';

export default {
  path: 'lessons',
  indexRoute: {
    component: Lessons,
  },
  getChildRoutes: (partialNextState, cb) => {
    Promise.all([
      System.import('./lesson.js'),
      System.import('./lessonResults.js')
    ])
    .then(modules => cb(null, modules.map(module => module.default)))
    .catch(err => console.error('Dynamic page loading failed', err));
  },

};