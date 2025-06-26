import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

function StockManagement() {
  const [userId, setUserId] = useState(null);
  const [products, setProducts] = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [stockSummary, setStockSummary] = useState([]);
  const [entries, setEntries] = useState([
    { date: '', itemName: '', itemDescription: '', rate: 0, quantity: 1 }
  ]);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('entries'); // 'entries' or 'summary'

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
        fetchProducts(user.uid);
        fetchStock(user.uid);
        fetchCustomerOrders(user.uid);
      }
    });
  }, []);

  useEffect(() => {
    if (stockEntries.length > 0 || customerOrders.length > 0) {
      calculateStockSummary();
    }
  }, [stockEntries, customerOrders]);

  const fetchProducts = async (uid) => {
    try {
      const productsRef = collection(db, 'users', uid, 'products');
      const snapshot = await getDocs(productsRef);
      const productList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productList);
      console.log('Products fetched:', productList);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const fetchStock = async (uid) => {
    try {
      const stockRef = collection(db, 'users', uid, 'stock');
      const snapshot = await getDocs(stockRef);
      const stockList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStockEntries(stockList);
      console.log('Stock entries fetched:', stockList);
    } catch (error) {
      console.error('Error fetching stock:', error);
      setStockEntries([]);
    }
  };

  const fetchCustomerOrders = async (uid) => {
    try {
      let ordersRef = collection(db, 'users', uid, 'customerOrders');
      let snapshot = await getDocs(ordersRef);
      
      const ordersList = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('=== RAW ORDER DATA ===');
        console.log('Document ID:', doc.id);
        console.log('Full data object:', data);
        console.log('Data keys:', Object.keys(data));
        
        if (data.items) console.log('data.items:', data.items);
        if (data.orderItems) console.log('data.orderItems:', data.orderItems);
        if (data.products) console.log('data.products:', data.products);
        
        console.log('=== END ORDER DATA ===');
        
        return {
          id: doc.id,
          ...data
        };
      });
      
      setCustomerOrders(ordersList);
      console.log('Total customer orders fetched:', ordersList.length);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      setCustomerOrders([]);
    }
  };

  const calculateStockSummary = () => {
    console.log('=== CALCULATING STOCK SUMMARY ===');
    console.log('Stock entries count:', stockEntries.length);
    console.log('Customer orders count:', customerOrders.length);

    // Group stock entries by itemName and itemDescription
    const productionStock = {};
    
    stockEntries.forEach(entry => {
      const key = `${entry.itemName || ''}_${entry.itemDescription || ''}`;
      if (!productionStock[key]) {
        productionStock[key] = {
          itemName: entry.itemName || '',
          itemDescription: entry.itemDescription || '',
          rate: entry.rate || 0,
          totalProduced: 0,
          lastDate: entry.date || ''
        };
      }
      productionStock[key].totalProduced += Number(entry.quantity) || 0;
      if (entry.date > productionStock[key].lastDate) {
        productionStock[key].lastDate = entry.date;
      }
    });

    console.log('Production stock:', productionStock);

    // Calculate sold quantities from customer orders
    const soldStock = {};
    
    customerOrders.forEach((order, orderIndex) => {
      console.log(`\n--- Processing Order ${orderIndex + 1} ---`);
      console.log('Order ID:', order.id);
      console.log('Order object keys:', Object.keys(order));
      
      let items = [];
      
      if (order.items && Array.isArray(order.items)) {
        items = order.items;
        console.log('Found items in order.items:', items);
      } else if (order.orderItems && Array.isArray(order.orderItems)) {
        items = order.orderItems;
        console.log('Found items in order.orderItems:', items);
      } else if (order.products && Array.isArray(order.products)) {
        items = order.products;
        console.log('Found items in order.products:', items);
      } else {
        console.log('No array found, checking for individual item properties...');
        
        const possibleItemFields = Object.keys(order).filter(key => 
          key.startsWith('item') || key.includes('Item') || key.includes('product')
        );
        console.log('Possible item fields:', possibleItemFields);
        
        if (order.itemName && order.itemDescription) {
          items = [{
            itemName: order.itemName,
            itemDescription: order.itemDescription,
            quantity: order.quantity || 1,
            rate: order.rate || 0
          }];
          console.log('Reconstructed single item from order fields:', items);
        }
      }
      
      console.log(`Processing ${items.length} items from this order:`);
      
      items.forEach((item, itemIndex) => {
        console.log(`  Item ${itemIndex + 1}:`, item);
        
        if (item && item.itemName && item.itemDescription) {
          const key = `${item.itemName}_${item.itemDescription}`;
          if (!soldStock[key]) {
            soldStock[key] = 0;
          }
          const quantity = Number(item.quantity) || 0;
          soldStock[key] += quantity;
          console.log(`    Added ${quantity} to ${key}, total now: ${soldStock[key]}`);
        } else {
          console.log('    Skipping item - missing name or description:', item);
        }
      });
    });

    console.log('\n=== FINAL SOLD STOCK SUMMARY ===');
    console.log('Sold stock totals:', soldStock);

    // Combine production and sales data
    const summary = Object.keys(productionStock).map(key => {
      const production = productionStock[key];
      const sold = soldStock[key] || 0;
      const remainingStock = production.totalProduced - sold;

      console.log(`${key}: Produced ${production.totalProduced}, Sold ${sold}, Remaining ${remainingStock}`);

      return {
        itemName: production.itemName,
        itemDescription: production.itemDescription,
        rate: production.rate,
        lastDate: production.lastDate,
        totalProduced: production.totalProduced,
        totalSold: sold,
        remainingStock: remainingStock
      };
    });

    // Also include items that were sold but not in production (if any)
    Object.keys(soldStock).forEach(key => {
      if (!productionStock[key]) {
        const [itemName, itemDescription] = key.split('_');
        console.log(`Warning: Found sold item not in production: ${key}`);
        summary.push({
          itemName: itemName || '',
          itemDescription: itemDescription || '',
          rate: 0,
          lastDate: '',
          totalProduced: 0,
          totalSold: soldStock[key],
          remainingStock: -soldStock[key]
        });
      }
    });

    summary.sort((a, b) => a.itemName.localeCompare(b.itemName));
    console.log('\n=== FINAL SUMMARY ===');
    console.log('Summary items:', summary);
    setStockSummary(summary);
  };

  const handleEntryChange = (index, field, value) => {
    const updated = [...entries];
    updated[index][field] = field === 'rate' || field === 'quantity' ? Number(value) : value;

    // If item name changed, clear description and rate, then update suggestions
    if (field === 'itemName') {
      updated[index].itemDescription = '';
      updated[index].rate = 0;
    }

    // If both item name and description are selected, auto-populate rate
    if (field === 'itemDescription' || (field === 'itemName' && updated[index].itemDescription)) {
      const currentEntry = updated[index];
      const matched = products.find(
        (p) =>
          p.itemName === currentEntry.itemName &&
          p.itemDescription === currentEntry.itemDescription
      );

      if (matched) {
        updated[index].rate = matched.rate;
      }
    }

    setEntries(updated);
  };

  const addNewEntryRow = () => {
    setEntries([
      ...entries,
      { date: '', itemName: '', itemDescription: '', rate: 0, quantity: 1 }
    ]);
  };

  const removeEntryRow = (index) => {
    if (entries.length > 1) {
      const updated = entries.filter((_, i) => i !== index);
      setEntries(updated);
    }
  };

  const handleSubmit = async () => {
    if (!userId) return;

    const stockRef = collection(db, 'users', userId, 'stock');

    for (const entry of entries) {
      if (!entry.date || !entry.itemName || !entry.itemDescription) {
        alert('Please fill all required fields for each entry');
        return;
      }

      const dataToSave = {
        ...entry,
        rate: Number(entry.rate),
        quantity: Number(entry.quantity)
      };

      if (editingId) {
        const docRef = doc(stockRef, editingId);
        await updateDoc(docRef, dataToSave);
      } else {
        await addDoc(stockRef, dataToSave);
      }
    }

    setEditingId(null);
    setEntries([{ date: '', itemName: '', itemDescription: '', rate: 0, quantity: 1 }]);
    fetchStock(userId);
  };

  const handleEdit = (entry) => {
    setEntries([entry]);
    setEditingId(entry.id || null);
    setActiveTab('entries');
  };

  const handleDelete = async (id) => {
    if (!userId) return;
    if (window.confirm('Are you sure you want to delete this stock entry?')) {
      await deleteDoc(doc(db, 'users', userId, 'stock', id));
      fetchStock(userId);
    }
  };

  const handleRefreshData = () => {
    if (userId) {
      fetchProducts(userId);
      fetchStock(userId);
      fetchCustomerOrders(userId);
    }
  };

  const totalWorth = stockEntries.reduce((sum, e) => sum + (Number(e.rate) * Number(e.quantity)), 0);
  const totalRemainingWorth = stockSummary.reduce((sum, item) => sum + (Number(item.rate) * Number(item.remainingStock)), 0);

  // Get unique item names for suggestions
  const uniqueItemNames = [...new Set(products.map(p => p.itemName))].sort();

  // Add styles
  const styles = {
    mainContainer: {
      maxWidth: '900px',
      margin: '40px auto',
      padding: '32px',
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      fontFamily: 'Segoe UI, Arial, sans-serif',
    },
    sectionHeader: {
      color: '#007bff',
      fontWeight: 700,
      fontSize: '1.5rem',
      marginBottom: '18px',
      marginTop: '32px',
      letterSpacing: '0.5px',
    },
    button: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      padding: '10px 22px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 500,
      fontSize: '1rem',
      marginRight: '10px',
      transition: 'background 0.2s',
    },
    buttonSecondary: {
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      padding: '10px 22px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 500,
      fontSize: '1rem',
      marginRight: '10px',
      transition: 'background 0.2s',
    },
    input: {
      width: '100%',
      padding: '10px',
      borderRadius: '6px',
      border: '1px solid #ccc',
      marginBottom: '12px',
      fontSize: '1rem',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'border 0.2s',
    },
    card: {
      background: '#f8f9fa',
      borderRadius: '10px',
      padding: '24px',
      marginBottom: '32px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '24px',
      fontSize: '1rem',
    },
    th: {
      background: '#f1f3f6',
      color: '#333',
      fontWeight: 600,
      padding: '12px',
      borderBottom: '2px solid #dee2e6',
      position: 'sticky',
      top: 0,
      zIndex: 1,
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #eee',
      background: '#fff',
    },
    trStriped: {
      background: '#f9fbfd',
    },
    tabButton: isActive => ({
      padding: '10px 20px',
      marginRight: '10px',
      backgroundColor: isActive ? '#007bff' : '#f8f9fa',
      color: isActive ? 'white' : 'black',
      border: '1px solid #dee2e6',
      cursor: 'pointer',
      borderRadius: '5px 5px 0 0',
      fontWeight: 600,
      fontSize: '1rem',
      transition: 'background 0.2s',
    }),
    small: {
      color: '#dc3545',
      fontSize: '0.95em',
    },
    totalBox: {
      marginTop: '18px',
      padding: '14px',
      background: '#e8f5e8',
      borderRadius: '6px',
      fontWeight: 600,
      fontSize: '1.1rem',
      color: '#28a745',
    },
    debug: {
      backgroundColor: '#f8f9fa',
      padding: '10px',
      marginBottom: '20px',
      borderRadius: '4px',
      fontSize: '12px',
    },
  };

  return (
    <div style={styles.mainContainer}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={styles.sectionHeader}>Stock Management</h2>
        <button 
          onClick={handleRefreshData}
          style={{ ...styles.button, backgroundColor: '#17a2b8' }}
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Debug Information */}
      <div style={styles.debug}>
        <strong>Debug Info:</strong> Stock Entries: {stockEntries.length} | Customer Orders: {customerOrders.length} | Summary Items: {stockSummary.length}
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #dee2e6' }}>
        <button 
          style={styles.tabButton(activeTab === 'entries')}
          onClick={() => setActiveTab('entries')}
        >
          Stock Entries
        </button>
        <button 
          style={styles.tabButton(activeTab === 'summary')}
          onClick={() => setActiveTab('summary')}
        >
          Stock Summary
        </button>
      </div>

      {activeTab === 'entries' && (
        <div style={styles.card}>
          <h3 style={styles.sectionHeader}>Add Stock Entries</h3>
          {entries.map((entry, index) => {
            // Get descriptions for the selected item name
            const matchingDescriptions = products
              .filter(p => p.itemName === entry.itemName)
              .map(p => p.itemDescription)
              .filter((desc, idx, arr) => arr.indexOf(desc) === idx) // Remove duplicates
              .sort();

            return (
              <div key={index} style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #ccc', position: 'relative' }}>
                {entries.length > 1 && (
                  <button 
                    onClick={() => removeEntryRow(index)}
                    style={{ position: 'absolute', top: '0', right: '0', background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                )}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date *</label>
                  <input type="date" value={entry.date} onChange={e => handleEntryChange(index, 'date', e.target.value)} style={styles.input} required />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Item Name *</label>
                  <input type="text" placeholder="Type or select item name" value={entry.itemName} onChange={e => handleEntryChange(index, 'itemName', e.target.value)} list={`itemNames-${index}`} style={styles.input} required />
                  <datalist id={`itemNames-${index}`}>{uniqueItemNames.map((name, i) => (<option key={i} value={name} />))}</datalist>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description *</label>
                  <input type="text" placeholder={entry.itemName ? "Select description for this item" : "First select an item name"} value={entry.itemDescription} onChange={e => handleEntryChange(index, 'itemDescription', e.target.value)} list={`descriptions-${index}`} disabled={!entry.itemName} style={styles.input} required />
                  <datalist id={`descriptions-${index}`}>{matchingDescriptions.map((desc, i) => (<option key={i} value={desc} />))}</datalist>
                  {entry.itemName && matchingDescriptions.length === 0 && (<small style={styles.small}>No descriptions found for "{entry.itemName}". You can type a new one.</small>)}
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Rate (₹)</label>
                    <input type="number" placeholder="Rate per unit" value={entry.rate} onChange={e => handleEntryChange(index, 'rate', e.target.value)} step="0.01" style={styles.input} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Quantity *</label>
                    <input type="number" placeholder="Quantity" value={entry.quantity} onChange={e => handleEntryChange(index, 'quantity', e.target.value)} min="1" style={styles.input} required />
                  </div>
                </div>
                {entry.rate > 0 && entry.quantity > 0 && (<div style={styles.totalBox}><strong>Total Value: ₹{(Number(entry.rate) * Number(entry.quantity)).toFixed(2)}</strong></div>)}
              </div>
            );
          })}
          <div style={{ marginTop: '20px' }}>
            <button onClick={addNewEntryRow} style={styles.buttonSecondary}>➕ Add Another Entry</button>
            <button onClick={handleSubmit} style={styles.button}>{editingId ? 'Update Stock' : 'Submit Stock Entries'}</button>
          </div>
        </div>
      )}

      {activeTab === 'entries' && (
        <div style={styles.card}>
          <h3 style={styles.sectionHeader}>All Stock Entries</h3>
          {stockEntries.length === 0 ? (
            <p>No stock added yet.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Item</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Rate</th>
                  <th style={styles.th}>Quantity</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockEntries.map((s, idx) => (
                  <tr key={idx} style={idx % 2 === 0 ? styles.trStriped : {}}>
                    <td style={styles.td}>{s.date}</td>
                    <td style={styles.td}>{s.itemName}</td>
                    <td style={styles.td}>{s.itemDescription}</td>
                    <td style={styles.td}>₹{Number(s.rate).toFixed(2)}</td>
                    <td style={styles.td}>{s.quantity}</td>
                    <td style={styles.td}>₹{(Number(s.rate) * Number(s.quantity)).toFixed(2)}</td>
                    <td style={styles.td}>
                      <button onClick={() => handleEdit(s)} style={{ ...styles.buttonSecondary, padding: '5px 10px', fontSize: '0.95em', marginRight: '5px' }}>✏ Edit</button>
                      <button onClick={() => handleDelete(s.id)} style={{ ...styles.button, backgroundColor: '#dc3545', padding: '5px 10px', fontSize: '0.95em' }}>🗑 Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={styles.totalBox}>Total Production Worth: ₹{totalWorth.toFixed(2)}</div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div style={styles.card}>
          <h3 style={styles.sectionHeader}>Stock Summary (Production vs Sales)</h3>
          {stockSummary.length === 0 ? (
            <p>No stock summary available. Add some stock entries first.</p>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Last Updated</th>
                    <th style={styles.th}>Item Name</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Rate</th>
                    <th style={styles.th}>Total Produced</th>
                    <th style={styles.th}>Total Sold</th>
                    <th style={styles.th}>Remaining Stock</th>
                    <th style={styles.th}>Remaining Value</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stockSummary.map((item, idx) => (
                    <tr key={idx} style={idx % 2 === 0 ? styles.trStriped : {}}>
                      <td style={styles.td}>{item.lastDate}</td>
                      <td style={styles.td}>{item.itemName}</td>
                      <td style={styles.td}>{item.itemDescription}</td>
                      <td style={styles.td}>₹{Number(item.rate).toFixed(2)}</td>
                      <td style={styles.td}>{item.totalProduced}</td>
                      <td style={styles.td}>{item.totalSold}</td>
                      <td style={{ ...styles.td, fontWeight: 'bold', color: item.remainingStock < 0 ? '#dc3545' : item.remainingStock === 0 ? '#856404' : item.remainingStock < 5 ? '#0c5460' : '#28a745' }}>{item.remainingStock}</td>
                      <td style={styles.td}>₹{(Number(item.rate) * Number(item.remainingStock)).toFixed(2)}</td>
                      <td style={styles.td}>
                        {item.remainingStock < 0 ? '🔴 Oversold' : item.remainingStock === 0 ? '🟡 Out of Stock' : item.remainingStock < 5 ? '🔵 Low Stock' : '🟢 In Stock'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={styles.totalBox}>Total Remaining Stock Value: ₹{totalRemainingWorth.toFixed(2)}</div>
                <div>
                  <p><strong>Legend:</strong></p>
                  <p>🔴 Oversold | 🟡 Out of Stock | 🔵 Low Stock (&lt;5) | 🟢 In Stock</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default StockManagement;