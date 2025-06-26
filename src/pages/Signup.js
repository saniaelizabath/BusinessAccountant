// src/pages/Signup.js
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Signup successful!');
      navigate('/dashboard');
    } catch (error) {
      alert(error.message);
    }
  };

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
        padding: '40px 32px',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        minWidth: '320px',
        maxWidth: '350px',
        width: '100%'
      }}>
        <h2 style={{
          textAlign: 'center',
          color: '#1976d2',
          fontWeight: 700,
          marginBottom: '28px',
          fontSize: '2rem'
        }}>Signup</h2>
        <form onSubmit={handleSignup}>
          <input
            type="email"
            placeholder="Email"
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '18px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border 0.2s',
              boxSizing: 'border-box'
            }}
          />
          <input
            type="password"
            placeholder="Password"
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '24px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border 0.2s',
              boxSizing: 'border-box'
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
