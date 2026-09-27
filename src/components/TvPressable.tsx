import React, { useState } from "react";
import {
  Pressable,
  PressableProps,
  PressableStateCallbackType,
} from "react-native";
import { styles } from "../styles/appStyles";

type TvPressableState = PressableStateCallbackType & { focused: boolean };

export const TvPressable: React.FC<PressableProps> = ({
  onFocus,
  onBlur,
  style,
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      {...props}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={(state) => [
        typeof style === "function"
          ? style({ ...state, focused } as TvPressableState)
          : style,
        focused && styles.tvFocusedControl,
      ]}
    />
  );
};
