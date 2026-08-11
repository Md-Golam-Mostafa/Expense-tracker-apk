/**
 * Web entry point for react-native-web.
 * Metro resolves this when bundling with --platform web.
 *
 * @format
 */

import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// TEMP: error boundary to surface component stacks during debugging.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    const pre = document.getElementById('err');
    if (pre) {
      pre.style.display = 'block';
      pre.textContent =
        'REACT ERROR: ' +
        (error && error.stack ? error.stack : error) +
        '\n\nCOMPONENT STACK:\n' +
        (info && info.componentStack ? info.componentStack : 'n/a');
    }
  }
  render() {
    if (this.state.error) {
      return null;
    }
    return this.props.children;
  }
}

AppRegistry.registerComponent(appName, () => () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
));
AppRegistry.runApplication(appName, {
  rootTag: document.getElementById('root'),
});
