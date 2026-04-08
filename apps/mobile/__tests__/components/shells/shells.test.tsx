import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { ScreenContainer } from '../../../src/components/shells/ScreenContainer';
import { InsetScrollView } from '../../../src/components/shells/InsetScrollView';
import { StickyActionBar } from '../../../src/components/shells/StickyActionBar';

describe('ScreenContainer', () => {
  it('renders children', () => {
    const { getByText } = render(
      <ScreenContainer>
        <Text>Hello</Text>
      </ScreenContainer>,
    );
    expect(getByText('Hello')).toBeTruthy();
  });

  it('passes testID to the root element', () => {
    const { getByTestId } = render(
      <ScreenContainer testID="screen-container">
        <Text>Hello</Text>
      </ScreenContainer>,
    );
    expect(getByTestId('screen-container')).toBeTruthy();
  });

  it('accepts a className prop', () => {
    // Just verifying it renders without error when className is passed
    const { getByText } = render(
      <ScreenContainer className="bg-surface">
        <Text>Hello</Text>
      </ScreenContainer>,
    );
    expect(getByText('Hello')).toBeTruthy();
  });
});

describe('InsetScrollView', () => {
  it('renders children', () => {
    const { getByText } = render(
      <InsetScrollView>
        <Text>Scrollable content</Text>
      </InsetScrollView>,
    );
    expect(getByText('Scrollable content')).toBeTruthy();
  });

  it('accepts a className prop', () => {
    const { getByText } = render(
      <InsetScrollView className="bg-background">
        <Text>Scrollable content</Text>
      </InsetScrollView>,
    );
    expect(getByText('Scrollable content')).toBeTruthy();
  });
});

describe('StickyActionBar', () => {
  it('renders children', () => {
    const { getByText } = render(
      <StickyActionBar>
        <Text>Action</Text>
      </StickyActionBar>,
    );
    expect(getByText('Action')).toBeTruthy();
  });

  it('passes testID to the root element', () => {
    const { getByTestId } = render(
      <StickyActionBar testID="sticky-bar">
        <Text>Action</Text>
      </StickyActionBar>,
    );
    expect(getByTestId('sticky-bar')).toBeTruthy();
  });

  it('accepts a className prop', () => {
    const { getByText } = render(
      <StickyActionBar className="bg-primary">
        <Text>Action</Text>
      </StickyActionBar>,
    );
    expect(getByText('Action')).toBeTruthy();
  });
});
