import React from 'react';
import {describe, it, expect, jest} from '@jest/globals';
import ReactTestRenderer, {act} from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {getItem: async () => (global as any).__session ?? null, setItem: async () => {}, removeItem: async () => {}},
}));
jest.mock('react-native-image-picker', () => ({launchCamera: jest.fn(), launchImageLibrary: jest.fn()}));
jest.mock('@react-native-documents/picker', () => ({pick: jest.fn(), types: {images: 'i', pdf: 'p'}, isErrorWithCode: () => false, errorCodes: {}}));
jest.mock('@react-native-community/datetimepicker', () => ({DateTimePickerAndroid: {open: jest.fn()}}));
jest.mock('react-native-safe-area-context', () => {
  const R = require('react');
  return {SafeAreaProvider: ({children}: any) => R.createElement(R.Fragment, null, children), useSafeAreaInsets: () => ({top: 24, bottom: 0, left: 0, right: 0})};
});

// Animations are exercised on-device; stub them so the render test stays deterministic.
jest.mock('../src/components/motion', () => {
  const R = require('react');
  const pass = ({children}: any) => R.createElement(R.Fragment, null, children);
  return {PageIn: pass, Floating: pass, Pulse: pass, Aurora: pass, Marquee: pass, Blob: () => null, usePingPong: () => 0, palette: {}};
});

describe('app smoke', () => {
  it('mounts the auth landing screen without crashing', async () => {
    const App = require('../App').default;
    let tree: any;
    await act(async () => {tree = ReactTestRenderer.create(<App />);});
    await act(async () => {await new Promise(r => setTimeout(r, 50));});
    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Good people.');
    expect(json).toContain('Sign up to hire help');
    await act(async () => {tree.unmount();});
  });

  const mountWith = async (session: object) => {
    (global as any).__session = JSON.stringify(session);
    const App = require('../App').default;
    let tree: any;
    await act(async () => {tree = ReactTestRenderer.create(<App />);});
    await act(async () => {await new Promise(r => setTimeout(r, 50));});
    const json = JSON.stringify(tree.toJSON());
    await act(async () => {tree.unmount();});
    return json;
  };
  const base = {past: [], name: 'Akshaa', phone: '9876543210', authenticated: true, online: false, setup: true, city: 'Pune', booking: null};
  it('renders the customer home with dock for a signed-in customer', async () => {
    const json = await mountWith({...base, role: 'customer'});
    expect(json).toContain('Who do you need');
    expect(json).toContain('Popular services');
    expect(json).toContain('Discover');
  });
  it('renders the professional home for a signed-in professional', async () => {
    const json = await mountWith({...base, role: 'professional'});
    expect(json).toContain('Today’s earnings');
    expect(json).toContain('Earnings');
  });
});
