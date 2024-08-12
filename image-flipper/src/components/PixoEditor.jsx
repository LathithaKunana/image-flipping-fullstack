import React from 'react';
import React,{ useEffect } from 'react';

export const PixoEditor = ({ src, onChange }) => {
  useEffect(() => {
    if (src) {
      const pixo = new window.Pixo.Bridge({
        url: 'https://editor.pixoeditor.com/editor/',
        onSave: (output) => {
          onChange(output.url);
        },
      });
      pixo.open(src);
    }
  }, [src]);

  return null;
};

