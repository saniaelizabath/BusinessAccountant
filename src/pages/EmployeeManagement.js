// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase';
// import {
//   collection,
//   addDoc,
//   getDocs,
//   query,
//   where,
//   deleteDoc,
//   doc,
//   Timestamp,
// } from 'firebase/firestore';

// function EmployeeManagement() {
//   const [employeeName, setEmployeeName] = useState('');
//   const [date, setDate] = useState('');
//   const [wage, setWage] = useState('');
//   const [message, setMessage] = useState('');
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [showEmployees, setShowEmployees] = useState(false);
//   const [employees, setEmployees] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [userId, setUserId] = useState(null);

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged((user) => {
//       if (user) {
//         setUserId(user.uid);
//       } else {
//         setUserId(null);
//         setEmployees([]);
//         setMessage("Please log in to view employee data.");
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!employeeName || !date || !wage) {
//       setMessage("All fields are required!");
//       return;
//     }

//     if (!userId) {
//       setMessage("You must be logged in to add employees.");
//       return;
//     }

//     try {
//       const userEmployeesRef = collection(db, 'users', userId, 'employees');
//       await addDoc(userEmployeesRef, {
//         name: employeeName,
//         date: Timestamp.fromDate(new Date(date)),
//         wage: parseFloat(wage),
//         createdAt: new Date(),
//       });

//       setMessage("Employee added successfully!");
//       setEmployeeName('');
//       setDate('');
//       setWage('');
//       if (showEmployees) handleShowEmployees();
//     } catch (err) {
//       console.error("Error adding employee: ", err);
//       setMessage("Error adding employee");
//     }
//   };

//   const handleShowEmployees = async () => {
//     if (!userId) {
//       setMessage("Please log in to view employees.");
//       return;
//     }

//     if (!showEmployees) {
//       const userEmployeesRef = collection(db, 'users', userId, 'employees');
//       const querySnapshot = await getDocs(userEmployeesRef);
//       const employeeList = querySnapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
//       setEmployees(employeeList);
//     }

//     setShowEmployees(!showEmployees);
//   };

//   const handleDelete = async (employeeId) => {
//     try {
//       await deleteDoc(doc(db, 'users', userId, 'employees', employeeId));
//       setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
//       setMessage("Employee record deleted.");
//     } catch (error) {
//       console.error("Error deleting employee:", error);
//       setMessage("Error deleting employee.");
//     }
//   };

//   const filteredEmployees = employees.filter(emp =>
//     emp.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div style={{ padding: '20px' }}>
//       <h2>Employee Management</h2>

//       <button onClick={() => setShowAddForm(!showAddForm)}>
//         {showAddForm ? 'Close ✖' : 'Add Employee'}
//       </button>

//       <button onClick={handleShowEmployees} style={{ marginLeft: '10px' }}>
//         {showEmployees ? 'Hide Employees ✖' : 'View Employees'}
//       </button>

//       {showAddForm && (
//         <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
//           <input
//             type="text"
//             placeholder="Employee Name"
//             value={employeeName}
//             onChange={(e) => setEmployeeName(e.target.value)}
//             required
//           /><br /><br />
//           <input
//             type="date"
//             value={date}
//             onChange={(e) => setDate(e.target.value)}
//             required
//           /><br /><br />
//           <input
//             type="number"
//             placeholder="Wage (₹)"
//             value={wage}
//             onChange={(e) => setWage(e.target.value)}
//             required
//           /><br /><br />
//           <button type="submit">Add Employee</button>
//         </form>
//       )}

//       {message && <p>{message}</p>}

//       {showEmployees && (
//         <div style={{ marginTop: '20px' }}>
//           <h3>Employee List:</h3>
//           <input
//             type="text"
//             placeholder="Search by name"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             style={{ marginBottom: '10px', padding: '5px', width: '300px' }}
//           />
//           {filteredEmployees.length === 0 ? (
//             <p>No employee matches your search.</p>
//           ) : (
//             <table border="1" cellPadding="10" cellSpacing="0">
//               <thead>
//                 <tr>
//                   <th>Name</th>
//                   <th>Date</th>
//                   <th>Wage (₹)</th>
//                   <th>Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredEmployees.map(emp => (
//                   <tr key={emp.id}>
//                     <td>{emp.name}</td>
//                     <td>{emp.date?.toDate().toLocaleDateString()}</td>
//                     <td>{emp.wage}</td>
//                     <td>
//                       <button onClick={() => handleDelete(emp.id)}>🗑 Delete</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// export default EmployeeManagement;





import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';

function EmployeeManagement() {
  const [employeeName, setEmployeeName] = useState('');
  const [date, setDate] = useState('');
  const [wage, setWage] = useState('');
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEmployees, setShowEmployees] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setEmployees([]);
        setMessage("Please log in to view employee data.");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeName || !date || !wage) {
      setMessage("All fields are required!");
      return;
    }

    if (!userId) {
      setMessage("You must be logged in.");
      return;
    }

    const userEmployeesRef = collection(db, 'users', userId, 'employees');

    try {
      if (editingId) {
        const empRef = doc(db, 'users', userId, 'employees', editingId);
        await updateDoc(empRef, {
          name: employeeName,
          date: Timestamp.fromDate(new Date(date)),
          wage: parseFloat(wage),
        });
        setMessage("Employee record updated!");
        setEditingId(null);
      } else {
        await addDoc(userEmployeesRef, {
          name: employeeName,
          date: Timestamp.fromDate(new Date(date)),
          wage: parseFloat(wage),
          createdAt: new Date(),
        });
        setMessage("Employee added successfully!");
      }

      setEmployeeName('');
      setDate('');
      setWage('');
      if (showEmployees) handleShowEmployees();
    } catch (err) {
      console.error("Error saving employee: ", err);
      setMessage("Error saving employee.");
    }
  };

  const handleShowEmployees = async () => {
    if (!userId) {
      setMessage("Please log in to view employees.");
      return;
    }

    const userEmployeesRef = collection(db, 'users', userId, 'employees');
    const querySnapshot = await getDocs(userEmployeesRef);
    const employeeList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setEmployees(employeeList);
    setShowEmployees(!showEmployees);
  };

  const handleDelete = async (employeeId) => {
    try {
      await deleteDoc(doc(db, 'users', userId, 'employees', employeeId));
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      setMessage("Employee record deleted.");
    } catch (error) {
      console.error("Error deleting employee:", error);
      setMessage("Error deleting employee.");
    }
  };

  const handleEdit = (emp) => {
    setEmployeeName(emp.name);
    setDate(emp.date?.toDate().toISOString().split('T')[0]);
    setWage(emp.wage);
    setEditingId(emp.id);
    setShowAddForm(true);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedByName = filteredEmployees.reduce((acc, emp) => {
    const name = emp.name;
    if (!acc[name]) acc[name] = { total: 0, entries: [] };
    acc[name].total += parseFloat(emp.wage);
    acc[name].entries.push(emp);
    return acc;
  }, {});

  return (
    <div style={{ padding: '20px' }}>
      <h2>Employee Management</h2>

      <button onClick={() => {
        setShowAddForm(!showAddForm);
        setEditingId(null);
        setEmployeeName('');
        setDate('');
        setWage('');
      }}>
        {showAddForm ? 'Close ✖' : 'Add Employee'}
      </button>

      <button onClick={handleShowEmployees} style={{ marginLeft: '10px' }}>
        {showEmployees ? 'Hide Employees ✖' : 'View Employees'}
      </button>

      {showAddForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <input
            type="text"
            placeholder="Employee Name"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            required
          /><br /><br />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          /><br /><br />
          <input
            type="number"
            placeholder="Wage (₹)"
            value={wage}
            onChange={(e) => setWage(e.target.value)}
            required
          /><br /><br />
          <button type="submit">{editingId ? "Update" : "Add"} Employee</button>
        </form>
      )}

      {message && <p>{message}</p>}

      {showEmployees && (
        <div style={{ marginTop: '20px' }}>
          <h3>Employee Records</h3>
          <input
            type="text"
            placeholder="Search by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: '10px', padding: '5px', width: '300px' }}
          />

          {Object.keys(groupedByName).length === 0 ? (
            <p>No employee matches your search.</p>
          ) : (
            Object.entries(groupedByName).map(([name, group]) => (
              <div key={name} style={{ marginBottom: '20px' }}>
                <h4>{name} — Total Wage: ₹{group.total.toFixed(2)}</h4>
                <table border="1" cellPadding="10" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Wage (₹)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.entries.map((emp) => (
                      <tr key={emp.id}>
                        <td>{emp.date?.toDate().toLocaleDateString()}</td>
                        <td>{emp.wage}</td>
                        <td>
                          <button onClick={() => handleEdit(emp)}>✏ Edit</button>
                          <button onClick={() => handleDelete(emp.id)} style={{ marginLeft: '10px' }}>
                            🗑 Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default EmployeeManagement;
