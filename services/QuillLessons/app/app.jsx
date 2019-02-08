// import 'babel-polyfill';
import Promise from 'promise-polyfill';
import BackOff from './utils/backOff';
import React from 'react';
import { render } from 'react-dom';
import createStore from './utils/configureStore';
import { Provider } from 'react-redux';
import { Router, Route, IndexRoute, } from 'react-router';
import { syncHistoryWithStore, routerReducer } from 'react-router-redux';
import createHashHistory from 'history/lib/createHashHistory';
import 'styles/style.scss';
import Raven from 'raven-js';
import quillNormalizer from './libs/quillNormalizer';
import SocketProvider from './components/socketProvider';

// To add to window
if (!window.Promise) {
  window.Promise = Promise;
}

if (process.env.NODE_ENV === 'production') {
  Raven
  .config(
    'https://528794315c61463db7d5181ebc1d51b9@sentry.io/210579',
    {
      environment: process.env.NODE_ENV,
    }
  )
  .install();
}

BackOff();
const hashhistory = createHashHistory({ queryKey: false, });
const store = createStore();

// create an enhanced history that syncs navigation events with the store
const history = syncHistoryWithStore(hashhistory, store);

const root = document.getElementById('root');

const rootRoute = {
  childRoutes: [{
    path: '/',
    childRoutes: [
      require('./routers/Admin/index').default,
      require('./routers/Play/index').default,
      require('./routers/Teach/index').default,
      require('./routers/Customize/index').default
    ],
  }],
};

render((
  <Provider store={store}>
    <SocketProvider>
      <Router history={history} routes={rootRoute} />
    </SocketProvider>
  </Provider>),
  root
);

String.prototype.quillNormalize = quillNormalizer;
