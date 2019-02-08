export default {
  path: 'play/',
  getChildRoutes: (partialNextState, cb) => {
    Promise.all([
      import(/* webpackChunkName: "play-classroom-lesson" */ './routes/ClassroomLessons/index.js')
    ])
    .then(modules => cb(null, modules.map(module => module.default)))
    .catch(err => console.error('Dynamic page loading failed', err));
  },
  getComponent: (nextState, cb) => {
    require.ensure([], (require) => {
      cb(null, require('../../components/studentRoot').default);
    }, 'student-root');
  },
};
