import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

function RawMaterials() {
  const [userId, setUserId] = useState(null);
  const [message, setMessage] = useState('');

  const [purchaseDate, setPurchaseDate] = useState('');
  const [usageDate, setUsageDate] = useState('');

  const [purchaseItems, setPurchaseItems] = useState([{ material: '', quantity: '', price: '' }]);
  const [usageItems, setUsageItems] = useState([{ material: '', quantity: '' }]);

  const [availableMaterials, setAvailableMaterials] = useState({});

  const [allPurchases, setAllPurchases] = useState([]);
  const [allUsages, setAllUsages] = useState([]);
  const [showPurchases, setShowPurchases] = useState(false);
  const [showUsages, setShowUsages] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [editingUsage, setEditingUsage] = useState(null);

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
    },
    title: {
      fontSize: '2.2rem',
      marginBottom: '20px',
      color: '#2563eb',
      fontWeight: '600',
    },
    subtitle: {
      fontSize: '1.5rem',
      marginBottom: '15px',
      color: '#1e40af',
      fontWeight: '500',
    },
    section: {
      marginBottom: '40px',
      background: '#ffffff',
      borderRadius: '12px',
      padding: '25px',
      border: '1px solid #e5e7eb',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    inputGroup: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      alignItems: 'center',
      padding: '15px',
      background: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
    },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      background: '#fff',
      color: '#333',
      fontSize: '0.95rem',
      transition: 'border-color 0.2s ease',
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
    },
    primaryButton: {
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
    },
    dangerButton: {
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0',
      marginTop: '20px',
    },
    tableHeader: {
      background: '#f8fafc',
      color: '#4b5563',
      padding: '15px',
      textAlign: 'left',
      fontSize: '0.95rem',
      fontWeight: '600',
      borderBottom: '2px solid #e5e7eb',
    },
    tableCell: {
      padding: '15px',
      color: '#333',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '0.95rem',
    },
    message: {
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      backgroundColor: '#f0f9ff',
      border: '1px solid #bae6fd',
      color: '#0369a1',
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      marginTop: '20px',
    },
    stockCard: {
      background: '#f8fafc',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '10px',
      border: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    materialName: {
      fontSize: '1.1rem',
      fontWeight: '500',
      color: '#2563eb',
    },
    quantity: {
      fontSize: '1rem',
      color: '#059669',
      fontWeight: '500',
    },
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
        calculateAvailableQuantities(user.uid);
      } else {
        setUserId(null);
        setAvailableMaterials({});
      }
    });

    return () => unsubscribe();
  }, []);

  const handlePurchaseChange = (index, field, value) => {
    const updated = [...purchaseItems];
    updated[index][field] = value;
    setPurchaseItems(updated);
  };

  const handleUsageChange = (index, field, value) => {
    const updated = [...usageItems];
    updated[index][field] = value;
    setUsageItems(updated);
  };

  const addPurchaseRow = () => setPurchaseItems([...purchaseItems, { material: '', quantity: '', price: '' }]);
  const removePurchaseRow = (index) => setPurchaseItems(purchaseItems.filter((_, i) => i !== index));

  const addUsageRow = () => setUsageItems([...usageItems, { material: '', quantity: '' }]);
  const removeUsageRow = (index) => setUsageItems(usageItems.filter((_, i) => i !== index));

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    if (!purchaseDate) {
      setMessage("Date is required.");
      return;
    }

    try {
      const batch = purchaseItems.filter(item => item.material && item.quantity && item.price);
      for (let item of batch) {
        await addDoc(collection(db, 'users', userId, 'raw_material_purchases'), {
          material: item.material,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price),
          date: Timestamp.fromDate(new Date(purchaseDate)),
        });
      }
      setPurchaseItems([{ material: '', quantity: '', price: '' }]);
      setPurchaseDate('');
      setMessage("Raw materials added.");
      calculateAvailableQuantities(userId);
    } catch (err) {
      console.error(err);
      setMessage("Error adding raw materials.");
    }
  };

  const handleAddUsage = async (e) => {
    e.preventDefault();
    if (!usageDate) {
      setMessage("Date is required.");
      return;
    }

    try {
      const batch = usageItems.filter(item => item.material && item.quantity);
      for (let item of batch) {
        await addDoc(collection(db, 'users', userId, 'raw_material_usages'), {
          material: item.material,
          quantity: parseFloat(item.quantity),
          date: Timestamp.fromDate(new Date(usageDate)),
        });
      }
      setUsageItems([{ material: '', quantity: '' }]);
      setUsageDate('');
      setMessage("Raw material usage recorded.");
      calculateAvailableQuantities(userId);
    } catch (err) {
      console.error(err);
      setMessage("Error recording usage.");
    }
  };

  const calculateAvailableQuantities = async (uid) => {
    const purchasesSnapshot = await getDocs(collection(db, 'users', uid, 'raw_material_purchases'));
    const usagesSnapshot = await getDocs(collection(db, 'users', uid, 'raw_material_usages'));

    const purchaseMap = {};
    purchasesSnapshot.forEach(doc => {
      const { material, quantity } = doc.data();
      if (!purchaseMap[material]) purchaseMap[material] = 0;
      purchaseMap[material] += quantity;
    });

    usagesSnapshot.forEach(doc => {
      const { material, quantity } = doc.data();
      if (!purchaseMap[material]) purchaseMap[material] = 0;
      purchaseMap[material] -= quantity;
    });

    setAvailableMaterials(purchaseMap);
  };

  const fetchAllEntries = async () => {
    const purchaseSnapshot = await getDocs(collection(db, 'users', userId, 'raw_material_purchases'));
    const usageSnapshot = await getDocs(collection(db, 'users', userId, 'raw_material_usages'));

    setAllPurchases(purchaseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setAllUsages(usageSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const updatePurchase = async () => {
    const docRef = doc(db, 'users', userId, 'raw_material_purchases', editingPurchase.id);
    await updateDoc(docRef, {
      material: editingPurchase.material,
      quantity: parseFloat(editingPurchase.quantity),
      price: parseFloat(editingPurchase.price),
    });
    setEditingPurchase(null);
    fetchAllEntries();
    calculateAvailableQuantities(userId);
  };

  const updateUsage = async () => {
    const docRef = doc(db, 'users', userId, 'raw_material_usages', editingUsage.id);
    await updateDoc(docRef, {
      material: editingUsage.material,
      quantity: parseFloat(editingUsage.quantity),
    });
    setEditingUsage(null);
    fetchAllEntries();
    calculateAvailableQuantities(userId);
  };

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>Raw Material Management</h1>
        </div>

        {message && <div style={styles.message}>{message}</div>}

        {/* Add Purchases Section */}
        <div style={styles.section}>
          <h2 style={styles.subtitle}>Add Raw Material Purchases</h2>
          <form onSubmit={handleAddPurchase} style={styles.form}>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              style={styles.input}
              required
            />
            {purchaseItems.map((item, index) => (
              <div key={index} style={styles.inputGroup}>
                <input 
                  type="text" 
                  placeholder="Material"
                  value={item.material}
                  onChange={(e) => handlePurchaseChange(index, 'material', e.target.value)}
                  style={styles.input}
                  required 
                />
                <input 
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) => handlePurchaseChange(index, 'quantity', e.target.value)}
                  style={styles.input}
                  required 
                />
                <input 
                  type="number"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) => handlePurchaseChange(index, 'price', e.target.value)}
                  style={styles.input}
                  required 
                />
                <button 
                  type="button"
                  onClick={() => removePurchaseRow(index)}
                  style={{...styles.button, ...styles.dangerButton}}
                >
                  Remove
                </button>
              </div>
            ))}
            <div style={styles.buttonGroup}>
              <button 
                type="button"
                onClick={addPurchaseRow}
                style={styles.button}
              >
                + Add More
              </button>
              <button 
                type="submit"
                style={{...styles.button, ...styles.primaryButton}}
              >
                Add Purchases
              </button>
            </div>
          </form>
        </div>

        {/* Add Usages Section */}
        <div style={styles.section}>
          <h2 style={styles.subtitle}>Enter Raw Material Usage</h2>
          <form onSubmit={handleAddUsage} style={styles.form}>
            <input
              type="date"
              value={usageDate}
              onChange={(e) => setUsageDate(e.target.value)}
              style={styles.input}
              required
            />
            {usageItems.map((item, index) => (
              <div key={index} style={styles.inputGroup}>
                <input 
                  type="text"
                  placeholder="Material"
                  value={item.material}
                  onChange={(e) => handleUsageChange(index, 'material', e.target.value)}
                  style={styles.input}
                  required 
                />
                <input 
                  type="number"
                  placeholder="Quantity Used"
                  value={item.quantity}
                  onChange={(e) => handleUsageChange(index, 'quantity', e.target.value)}
                  style={styles.input}
                  required 
                />
                <button 
                  type="button"
                  onClick={() => removeUsageRow(index)}
                  style={{...styles.button, ...styles.dangerButton}}
                >
                  Remove
                </button>
              </div>
            ))}
            <div style={styles.buttonGroup}>
              <button 
                type="button"
                onClick={addUsageRow}
                style={styles.button}
              >
                + Add More
              </button>
              <button 
                type="submit"
                style={{...styles.button, ...styles.primaryButton}}
              >
                Record Usage
              </button>
            </div>
          </form>
        </div>

        {/* Available Stock Section */}
        <div style={styles.section}>
          <h2 style={styles.subtitle}>Available Raw Material Stock</h2>
          {Object.keys(availableMaterials).length === 0 ? (
            <div style={styles.message}>No data available.</div>
          ) : (
            Object.entries(availableMaterials).map(([name, qty]) => (
              <div key={name} style={styles.stockCard}>
                <span style={styles.materialName}>{name}</span>
                <span style={styles.quantity}>{qty} units</span>
              </div>
            ))
          )}
        </div>

        {/* View Records Section */}
        <div style={styles.buttonGroup}>
          <button
            style={{...styles.button, ...(showPurchases ? styles.primaryButton : {})}}
            onClick={() => {
              fetchAllEntries();
              setShowPurchases(!showPurchases);
              setShowUsages(false);
            }}
          >
            {showPurchases ? "Hide Purchases" : "Show All Purchases"}
          </button>

          <button
            style={{...styles.button, ...(showUsages ? styles.primaryButton : {})}}
            onClick={() => {
              fetchAllEntries();
              setShowUsages(!showUsages);
              setShowPurchases(false);
            }}
          >
            {showUsages ? "Hide Usages" : "Show All Usages"}
          </button>
        </div>

        {showPurchases && (
          <div style={styles.section}>
            <h2 style={styles.subtitle}>All Purchases</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Material</th>
                    <th style={styles.tableHeader}>Quantity</th>
                    <th style={styles.tableHeader}>Price</th>
                    <th style={styles.tableHeader}>Date</th>
                    <th style={styles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allPurchases.map(p => (
                    <tr key={p.id}>
                      {editingPurchase?.id === p.id ? (
                        <>
                          <td style={styles.tableCell}>
                            <input 
                              value={editingPurchase.material}
                              onChange={(e) => setEditingPurchase({ ...editingPurchase, material: e.target.value })}
                              style={styles.input}
                            />
                          </td>
                          <td style={styles.tableCell}>
                            <input 
                              value={editingPurchase.quantity}
                              onChange={(e) => setEditingPurchase({ ...editingPurchase, quantity: e.target.value })}
                              style={styles.input}
                              type="number"
                            />
                          </td>
                          <td style={styles.tableCell}>
                            <input 
                              value={editingPurchase.price}
                              onChange={(e) => setEditingPurchase({ ...editingPurchase, price: e.target.value })}
                              style={styles.input}
                              type="number"
                            />
                          </td>
                          <td style={styles.tableCell}>
                            {p.date?.toDate ? p.date.toDate().toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={styles.tableCell}>
                            <div style={styles.buttonGroup}>
                              <button 
                                onClick={updatePurchase}
                                style={{...styles.button, ...styles.primaryButton}}
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => setEditingPurchase(null)}
                                style={{...styles.button, ...styles.dangerButton}}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{...styles.tableCell, fontWeight: '500'}}>{p.material}</td>
                          <td style={styles.tableCell}>{p.quantity}</td>
                          <td style={styles.tableCell}>₹{p.price}</td>
                          <td style={styles.tableCell}>
                            {p.date?.toDate ? p.date.toDate().toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={styles.tableCell}>
                            <button 
                              onClick={() => setEditingPurchase(p)}
                              style={{...styles.button, ...styles.primaryButton}}
                            >
                              Edit
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showUsages && (
          <div style={styles.section}>
            <h2 style={styles.subtitle}>All Usages</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Material</th>
                    <th style={styles.tableHeader}>Quantity Used</th>
                    <th style={styles.tableHeader}>Date</th>
                    <th style={styles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsages.map(u => (
                    <tr key={u.id}>
                      {editingUsage?.id === u.id ? (
                        <>
                          <td style={styles.tableCell}>
                            <input 
                              value={editingUsage.material}
                              onChange={(e) => setEditingUsage({ ...editingUsage, material: e.target.value })}
                              style={styles.input}
                            />
                          </td>
                          <td style={styles.tableCell}>
                            <input 
                              value={editingUsage.quantity}
                              onChange={(e) => setEditingUsage({ ...editingUsage, quantity: e.target.value })}
                              style={styles.input}
                              type="number"
                            />
                          </td>
                          <td style={styles.tableCell}>
                            {u.date?.toDate ? u.date.toDate().toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={styles.tableCell}>
                            <div style={styles.buttonGroup}>
                              <button 
                                onClick={updateUsage}
                                style={{...styles.button, ...styles.primaryButton}}
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => setEditingUsage(null)}
                                style={{...styles.button, ...styles.dangerButton}}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{...styles.tableCell, fontWeight: '500'}}>{u.material}</td>
                          <td style={styles.tableCell}>{u.quantity}</td>
                          <td style={styles.tableCell}>
                            {u.date?.toDate ? u.date.toDate().toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={styles.tableCell}>
                            <button 
                              onClick={() => setEditingUsage(u)}
                              style={{...styles.button, ...styles.primaryButton}}
                            >
                              Edit
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RawMaterials;