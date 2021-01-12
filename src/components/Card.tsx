import React from 'react';
import { css } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { useTheme, stylesFactory } from '@grafana/ui';

interface Props {
  children: React.ReactNode;
}

export const Card = ({ children }: Props) => {
  const theme = useTheme();
  const styles = getCardStyles(theme);

  return <div className={styles.root}>{children}</div>;
};

export const getCardStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    root: css`
      padding: ${theme.spacing.md};
      background-color: ${theme.colors.bg2};
      border-radius: ${theme.border.radius.sm};

      &:hover {
        background-color: #25272b;
        cursor: pointer;
      }
    `,
  };
});
