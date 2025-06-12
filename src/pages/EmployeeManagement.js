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

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '40px',
    },
    contentWrapper: {
      maxWidth: '1200px',
      margin: '0 auto',
      background: '#ffffff',
      borderRadius: '15px',
      padding: '30px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
    },
    header: {
      marginBottom: '30px',
      borderBottom: '1px solid #e5e7eb',
      paddingBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: '2.2rem',
      color: '#2563eb',
      fontWeight: '600',
      margin: 0,
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
    },
    button: {
      padding: '12px 24px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.95rem',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#fff',
      color: '#2563eb',
      border: '1px solid #2563eb',
      '&:hover': {
        backgroundColor: '#f8fafc',
      },
    },
    primaryButton: {
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      '&:hover': {
        backgroundColor: '#1d4ed8',
      },
    },
    dangerButton: {
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      '&:hover': {
        backgroundColor: '#dc2626',
      },
    },
    form: {
      background: '#f8fafc',
      padding: '25px',
      borderRadius: '12px',
      marginBottom: '30px',
      border: '1px solid #e5e7eb',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    label: {
      fontSize: '0.95rem',
      fontWeight: '500',
      color: '#4b5563',
    },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      background: '#fff',
      color: '#333',
      fontSize: '0.95rem',
      transition: 'border-color 0.2s ease',
      '&:focus': {
        outline: 'none',
        borderColor: '#2563eb',
        boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
      },
    },
    message: {
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      backgroundColor: '#f0f9ff',
      border: '1px solid #bae6fd',
      color: '#0369a1',
    },
    searchContainer: {
      marginBottom: '30px',
    },
    searchInput: {
      width: '100%',
      maxWidth: '400px',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      background: '#fff',
      color: '#333',
      fontSize: '0.95rem',
      transition: 'all 0.2s ease',
      '&:focus': {
        outline: 'none',
        borderColor: '#2563eb',
        boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
      },
    },
    employeeGroup: {
      background: '#ffffff',
      borderRadius: '12px',
      marginBottom: '20px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
    },
    employeeHeader: {
      padding: '20px',
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e5e7eb',
    },
    employeeName: {
      fontSize: '1.2rem',
      fontWeight: '600',
      color: '#2563eb',
      marginBottom: '5px',
    },
    totalWage: {
      fontSize: '1rem',
      color: '#059669',
      fontWeight: '500',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0',
    },
    tableHeader: {
      padding: '15px 20px',
      textAlign: 'left',
      fontSize: '0.95rem',
      fontWeight: '600',
      color: '#4b5563',
      background: '#f8fafc',
      borderBottom: '1px solid #e5e7eb',
    },
    tableCell: {
      padding: '15px 20px',
      fontSize: '0.95rem',
      color: '#333',
      borderBottom: '1px solid #e5e7eb',
    },
    actionButton: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      marginRight: '8px',
    },
    editButton: {
      backgroundColor: '#2563eb',
      color: 'white',
      '&:hover': {
        backgroundColor: '#1d4ed8',
      },
    },
    deleteButton: {
      backgroundColor: '#ef4444',
      color: 'white',
      '&:hover': {
        backgroundColor: '#dc2626',
      },
    },
  };

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
      // Ensure date is always stored as Firestore Timestamp
      const dateTimestamp = Timestamp.fromDate(new Date(date));
      
      if (editingId) {
        const empRef = doc(db, 'users', userId, 'employees', editingId);
        await updateDoc(empRef, {
          name: employeeName,
          date: dateTimestamp,
          wage: parseFloat(wage),
        });
        setMessage("Employee record updated!");
        setEditingId(null);
      } else {
        await addDoc(userEmployeesRef, {
          name: employeeName,
          date: dateTimestamp,
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

  // Helper function to safely format dates
  const formatDate = (dateField) => {
    if (!dateField) return 'N/A';
    
    try {
      // Handle Firestore Timestamp
      if (dateField instanceof Timestamp) {
        return dateField.toDate().toLocaleDateString();
      }
      // Handle regular Date object
      if (dateField instanceof Date) {
        return dateField.toLocaleDateString();
      }
      // Handle string dates
      if (typeof dateField === 'string') {
        return new Date(dateField).toLocaleDateString();
      }
      // Handle date objects from Firestore that might not be Timestamps
      if (dateField.seconds) {
        return new Timestamp(dateField.seconds, dateField.nanoseconds).toDate().toLocaleDateString();
      }
      return 'N/A';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
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
    setEmployeeName(emp.name || '');
    // Safely handle date conversion
    try {
      const dateValue = emp.date instanceof Timestamp ? 
        emp.date.toDate().toISOString().split('T')[0] : 
        new Date(emp.date).toISOString().split('T')[0];
      setDate(dateValue);
    } catch (error) {
      console.error('Error setting date:', error);
      setDate('');
    }
    setWage(emp.wage?.toString() || '');
    setEditingId(emp.id);
    setShowAddForm(true);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedByName = filteredEmployees.reduce((acc, emp) => {
    const name = emp.name || 'Unknown';
    if (!acc[name]) acc[name] = { total: 0, entries: [] };
    acc[name].total += parseFloat(emp.wage || 0);
    acc[name].entries.push(emp);
    return acc;
  }, {});

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>Employee Management</h1>
          <div style={styles.buttonGroup}>
            <button 
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingId(null);
                setEmployeeName('');
                setDate('');
                setWage('');
              }}
              style={{
                ...styles.button,
                ...(showAddForm ? {} : styles.primaryButton),
              }}
            >
              {showAddForm ? '✖ Close Form' : '➕ Add Employee'}
            </button>
            <button 
              onClick={handleShowEmployees}
              style={{
                ...styles.button,
                ...(showEmployees ? styles.primaryButton : {}),
              }}
            >
              {showEmployees ? '✖ Hide Records' : '📋 View Records'}
            </button>
          </div>
        </div>

        {message && <div style={styles.message}>{message}</div>}

        {showAddForm && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Employee Name</label>
                <input
                  type="text"
                  placeholder="Enter employee name"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Wage (₹)</label>
                <input
                  type="number"
                  placeholder="Enter wage amount"
                  value={wage}
                  onChange={(e) => setWage(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>
            <div style={styles.buttonGroup}>
              <button 
                type="submit"
                style={{...styles.button, ...styles.primaryButton}}
              >
                {editingId ? "✏ Update Employee" : "➕ Add Employee"}
              </button>
            </div>
          </form>
        )}

        {showEmployees && (
          <div>
            <div style={styles.searchContainer}>
              <input
                type="text"
                placeholder="🔍 Search employees by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            {Object.keys(groupedByName).length === 0 ? (
              <div style={styles.message}>No employees match your search.</div>
            ) : (
              Object.entries(groupedByName).map(([name, group]) => (
                <div key={name} style={styles.employeeGroup}>
                  <div style={styles.employeeHeader}>
                    <div style={styles.employeeName}>{name}</div>
                    <div style={styles.totalWage}>
                      Total Wage: ₹{group.total.toFixed(2)}
                    </div>
                  </div>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.tableHeader}>Date</th>
                        <th style={styles.tableHeader}>Wage (₹)</th>
                        <th style={styles.tableHeader}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.entries.map((emp) => (
                        <tr key={emp.id}>
                          <td style={styles.tableCell}>{formatDate(emp.date)}</td>
                          <td style={styles.tableCell}>
                            {parseFloat(emp.wage || 0).toFixed(2)}
                          </td>
                          <td style={styles.tableCell}>
                            <button
                              onClick={() => handleEdit(emp)}
                              style={{...styles.actionButton, ...styles.editButton}}
                            >
                              ✏ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(emp.id)}
                              style={{...styles.actionButton, ...styles.deleteButton}}
                            >
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
    </div>
  );
}

export default EmployeeManagement;