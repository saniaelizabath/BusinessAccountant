// import React from 'react';
// import { signOut } from 'firebase/auth';
// import { auth } from '../firebase';
// import { useNavigate, Link } from 'react-router-dom';

// const Dashboard = () => {
//   const navigate = useNavigate();

//   const handleLogout = async () => {
//     try {
//       await signOut(auth);
//       navigate('/'); // ✅ Redirect to Start page after logout
//     } catch (error) {
//       console.error("Logout failed:", error);
//     }
//   };

//   return (
//     <div style={{ padding: '20px' }}>
//       <h2>Dashboard</h2>

//       <div style={{ margin: '20px 0' }}>
//         <Link to="/products">
//           <button style={{ marginRight: '10px' }}>➕ Add Products</button>
//         </Link>
//         {/* You can add more buttons here, like "View Orders" or "Customers" later */}
//       </div>

//       <button onClick={handleLogout} style={{ backgroundColor: 'red', color: 'white' }}>
//         Logout
//       </button>
//     </div>
//   );
// };

// export default Dashboard;





import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); // ✅ Redirect to Start page after logout
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard</h2>

      <div style={{ margin: '20px 0' }}>
        <Link to="/products">
          <button style={{ marginRight: '10px' }}>➕ Add Products</button>
        </Link>

        <Link to="/orders">
          <button style={{ marginRight: '10px' }}>📋 Customer Orders</button>
        </Link>

        <Link to="/stock">
          <button style={{ marginRight: '10px' }}>📦 Stock Management</button>
        </Link>

        <Link to="/rawmaterials">
          <button style={{ marginRight: '10px' }}> Raw Materials Management</button>
        </Link>

        <Link to="/employeemanagement">
          <button style={{ marginRight: '10px' }}> Employee Management</button>
        </Link>
      </div>

      <button onClick={handleLogout} style={{ backgroundColor: 'red', color: 'white' }}>
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
