import React from 'react';

export const Editable = ({ id, children }: { id: string, children: React.ReactNode }) => {
  // Your logic here
  return <div data-cms-id={id}>{children}</div>;
};