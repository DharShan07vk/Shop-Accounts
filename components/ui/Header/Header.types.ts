import { ViewStyle, TextStyle } from 'react-native';
import React from 'react';

export interface HeaderProps {
  /**
   * Title text for the header
   */
  title?: string;
  
  /**
   * Whether to show a back button on the left
   */
  showBack?: boolean;
  
  /**
   * Element to display on the right side
   */
  rightElement?: React.ReactNode;
  
  /**
   * Additional style for the container
   */
  style?: ViewStyle;
  
  /**
   * Additional style for the title
   */
  titleStyle?: TextStyle;
}
