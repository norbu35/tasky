import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RatingStars } from '../../../src/components/ui/RatingStars';

jest.mock('lucide-react-native', () => {
  const RN = require('react-native');
  return {
    Star: ({ _color, _fill, _size, ...props }: any) => (
      <RN.Text testID="star-icon" {...props}>
        Star
      </RN.Text>
    ),
  };
});

describe('RatingStars', () => {
  it('renders 5 stars', () => {
    render(<RatingStars value={3} testID="rating" />);

    const stars = screen.getAllByTestId('star-icon');
    expect(stars).toHaveLength(5);
  });

  it('calls onChange with correct value when star pressed', () => {
    const onChange = jest.fn();
    render(<RatingStars value={2} onChange={onChange} testID="rating" />);

    // Press the 4th star — stars are wrapped in Pressable with accessibilityLabel
    const fourthStar = screen.getByLabelText('4 stars');
    fireEvent.press(fourthStar);

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('does not call onChange when readonly', () => {
    const onChange = jest.fn();
    render(<RatingStars value={3} onChange={onChange} readonly testID="rating" />);

    // In readonly mode, stars are wrapped in View, not Pressable
    // Pressing should not trigger onChange
    const stars = screen.getAllByTestId('star-icon');
    fireEvent.press(stars[0]);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders with correct accessibility label', () => {
    render(<RatingStars value={4} testID="rating" />);

    expect(screen.getByLabelText('Rating: 4 out of 5 stars')).toBeTruthy();
  });

  it('calls onChange with value 1 for first star', () => {
    const onChange = jest.fn();
    render(<RatingStars value={0} onChange={onChange} testID="rating" />);

    const firstStar = screen.getByLabelText('1 star');
    fireEvent.press(firstStar);

    expect(onChange).toHaveBeenCalledWith(1);
  });
});
