// src/pages/Start.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Start = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5',
      fontFamily: 'Segoe UI, Arial, sans-serif'
    }}>
      <div style={{
        background: '#fff',
        padding: '48px 36px',
        borderRadius: '18px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        minWidth: '320px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          color: '#1976d2',
          fontWeight: 700,
          marginBottom: '32px',
          fontSize: '2.2rem',
          letterSpacing: '0.5px'
        }}>
          Welcome to Cement Accounting
        </h1>
        <button
          onClick={() => navigate('/signup')}
          style={{
            width: '100%',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            padding: '14px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '1.1rem',
            cursor: 'pointer',
            marginBottom: '18px',
            transition: 'background 0.2s'
          }}
        >
          Sign Up
        </button>
        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%',
            background: '#fff',
            color: '#1976d2',
            border: '2px solid #1976d2',
            padding: '14px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '1.1rem',
            cursor: 'pointer',
            marginBottom: '8px',
            transition: 'background 0.2s, color 0.2s'
          }}
        >
          Log In
        </button>
      </div>
    </div>
  );
};

export default Start;
