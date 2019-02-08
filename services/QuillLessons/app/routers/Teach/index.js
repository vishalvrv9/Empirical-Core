export default {
  path: 'teach/',
  getChildRoutes: (partialNextState, cb) => {
    Promise.all([
      import(/* webpackChunkName: "teach-classroom-lesson" */ './routes/ClassroomLessons/index.js')
    ])
    .then(modules => cb(null, modules.map(module => module.default)))
    .catch(err => console.error('Dynamic page loading failed', err))
  },
  getComponent: (nextState, cb) => {
    require.ensure([], (require) => {
      cb(null, require('components/root').default);
    }, 'root');
  },
};
