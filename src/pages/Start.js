// src/pages/Start.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Start = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Welcome to Cement Accounting</h1>
      <button
        onClick={() => navigate('/signup')}
        style={{ margin: '20px', padding: '10px 20px' }}
      >
        Sign Up
      </button>
      <button
        onClick={() => navigate('/login')}
        style={{ margin: '20px', padding: '10px 20px' }}
      >
        Log In
      </button>
    </div>
  );
};

export default Start;
