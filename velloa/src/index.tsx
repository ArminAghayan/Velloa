import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { AuthProvider } from './pages/Auth/AuthContext';
import { Provider } from 'react-redux';
import store from '../'

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);