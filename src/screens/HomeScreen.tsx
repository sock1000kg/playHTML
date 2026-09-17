import React from 'react';

export const HomeScreen: React.FC<{ onStartLocal: () => void }> = ({ onStartLocal }) => {
  return (
    <div style={{ padding: 20 }}>
      <h1>Sketchvote</h1>
      <button onClick={onStartLocal}>Start Local Test</button>
    </div>
  );
};

