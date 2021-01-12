import React from 'react';
import { css } from 'emotion';
import { useTheme } from '@grafana/ui';

interface Props {
  children: React.ReactNode;
  columns: number;
}

export const Grid = ({ children, columns }: Props) => {
  const theme = useTheme();

  const templateColumns = Array.from({ length: columns })
    .map(_ => `${100 / columns}%`)
    .join(' ');

  return (
    <div
      className={css`
        display: grid;
        grid-template-columns: ${templateColumns};
        grid-gap: ${theme.spacing.sm};
        font-size: ${theme.typography.size.lg};
      `}
    >
      {children}
    </div>
  );
};
