import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { hideNativeSplash } from '../utils/nativeSplash';

/**
 * Last line of defence for the whole app.
 *
 * In a release build an uncaught render error unmounts the entire React tree
 * and leaves a blank screen — behind the launch screen, if it happens during
 * boot, which looks exactly like "stuck on splash". This boundary releases
 * the launch screen and shows a recoverable screen instead.
 *
 * Deliberately plain: system font and hard-coded colours, because the thing
 * that failed may be the font or theme loading itself.
 */
export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, attempt: 0 };
    this.retry = this.retry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    hideNativeSplash();
    console.error('[app] uncaught render error', error, info?.componentStack);
  }

  retry() {
    // A new key remounts the tree from scratch — a fresh boot, not a re-render
    // of the broken state.
    this.setState((s) => ({ error: null, attempt: s.attempt + 1 }));
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            Stage hit an unexpected problem. Tap below to reload — your account and follows are safe.
          </Text>
          <TouchableOpacity style={styles.btn} activeOpacity={0.85} onPress={this.retry}>
            <Text style={styles.btnText}>Reload</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>;
  }
}

AppErrorBoundary.propTypes = { children: PropTypes.node };

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#0B0000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  body: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  btn: {
    marginTop: 24,
    backgroundColor: '#FF3B3B',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
  },
  btnText: { color: '#000', fontSize: 14, fontWeight: '700' },
});
