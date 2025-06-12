import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import Chatbot from '../components/Chatbot';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const DashboardCard = ({ title, icon, to, color }) => (
    <Link to={to} className="no-underline">
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '20px',
        margin: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '150px',
        border: '1px solid #eee',
        ':hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }
      }}>
        <div style={{
          fontSize: '2rem',
          marginBottom: '10px',
          color: color
        }}>
          {icon}
        </div>
        <div style={{
          fontSize: '1.1rem',
          fontWeight: '500',
          color: '#333',
          textAlign: 'center'
        }}>
          {title}
        </div>
      </div>
    </Link>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '30px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            color: '#2c3e50',
            margin: 0
          }}>Business Dashboard</h1>
          
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'background-color 0.2s'
            }}
          >
            🚪 Logout
          </button>
        </div>

        {/* Management Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <DashboardCard
            title="Products Management"
            icon="➕"
            to="/products"
            color="#4CAF50"
          />
          <DashboardCard
            title="Customer Orders"
            icon="📋"
            to="/orders"
            color="#2196F3"
          />
          <DashboardCard
            title="Stock Management"
            icon="📦"
            to="/stock"
            color="#FF9800"
          />
          <DashboardCard
            title="Raw Materials"
            icon="🏭"
            to="/rawmaterials"
            color="#9C27B0"
          />
          <DashboardCard
            title="Employee Management"
            icon="👥"
            to="/employeemanagement"
            color="#607D8B"
          />
          <DashboardCard
            title="Monthly Revenue"
            icon="��"
            to="/monthlyrevenue"
            color="#E91E63"
          />
        </div>

        {/* AI Assistant Section */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginTop: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '2rem', marginRight: '15px' }}>🤖</span>
            <div>
              <h3 style={{
                margin: '0',
                color: '#2c3e50',
                fontSize: '1.5rem'
              }}>AI Business Assistant</h3>
              <p style={{
                margin: '5px 0 0 0',
                color: '#666',
                fontSize: '1rem'
              }}>Ask questions about your business data in natural language</p>
            </div>
          </div>
          
          <Chatbot />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;