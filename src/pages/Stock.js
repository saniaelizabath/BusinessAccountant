// import React, { useEffect, useState } from 'react';
// import { db, auth } from '../firebase';
// import {
//   collection,
//   addDoc,
//   getDocs,
//   doc,
//   updateDoc,
//   deleteDoc
// } from 'firebase/firestore';

// function StockManagement() {
//   const [userId, setUserId] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [stockEntries, setStockEntries] = useState([]);
//   const [entries, setEntries] = useState([
//     { date: '', itemName: '', itemDescription: '', rate: 0, quantity: 1 }
//   ]);
//   const [editingId, setEditingId] = useState(null);

//   useEffect(() => {
//     auth.onAuthStateChanged((user) => {
//       if (user) {
//         setUserId(user.uid);
//         fetchProducts(user.uid);
//         fetchStock(user.uid);
//       }
//     });
//   }, []);

//   const fetchProducts = async (uid) => {
//     const productsRef = collection(db, 'users', uid, 'products');
//     const snapshot = await getDocs(productsRef);
//     const productList = snapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data()
//     }));
//     setProducts(productList);
//   };

//   const fetchStock = async (uid) => {
//     const stockRef = collection(db, 'users', uid, 'stock');
//     const snapshot = await getDocs(stockRef);
//     const stockList = snapshot.docs.map(doc => ({
//       id: doc.id,
//       ...doc.data()
//     }));
//     setStockEntries(stockList);
//   };

//   const handleEntryChange = (index, field, value) => {
//     const updated = [...entries];
//     updated[index][field] = field === 'rate' || field === 'quantity' ? Number(value) : value;

//     const currentEntry = updated[index];
//     const matched = products.find(
//       (p) =>
//         p.itemName === currentEntry.itemName &&
//         p.itemDescription === currentEntry.itemDescription
//     );

//     if (matched) {
//       updated[index].rate = matched.rate;
//     }

//     setEntries(updated);
//   };

//   const addNewEntryRow = () => {
//     setEntries([
//       ...entries,
//       { date: '', itemName: '', itemDescription: '', rate: 0, quantity: 1 }
//     ]);
//   };

//   const handleSubmit = async () => {
//     if (!userId) return;

//     const stockRef = collection(db, 'users', userId, 'stock');

//     for (const entry of entries) {
//       const dataToSave = {
//         ...entry,
//         rate: Number(entry.rate),
//         quantity: Number(entry.quantity)
//       };

//       if (editingId) {
//         const docRef = doc(stockRef, editingId);
//         await updateDoc(docRef, dataToSave);
//       } else {
//         await addDoc(stockRef, dataToSave);
//       }
//     }

//     setEditingId(null);
//     setEntries([{ date: '', itemName: '', itemDescription: '', rate: 0, quantity: 1 }]);
//     fetchStock(userId);
//   };

//   const handleEdit = (entry) => {
//     setEntries([entry]);
//     setEditingId(entry.id || null);
//   };

//   const handleDelete = async (id) => {
//     if (!userId) return;
//     await deleteDoc(doc(db, 'users', userId, 'stock', id));
//     fetchStock(userId);
//   };

//   const totalWorth = stockEntries.reduce((sum, e) => sum + (e.rate * e.quantity), 0);

//   const uniqueItemNames = [...new Set(products.map(p => p.itemName))];

//   return (
//     <div style={{ padding: '20px' }}>
//       <h2>Stock Management</h2>

//       {entries.map((entry, index) => {
//         // Filter descriptions matching selected itemName
//         const matchingDescriptions = [
//           ...new Set(
//             products
//               .filter(p => p.itemName === entry.itemName)
//               .map(p => p.itemDescription)
//           )
//         ];

//         return (
//           <div key={index} style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #ccc' }}>
//             <input
//               type="date"
//               value={entry.date}
//               onChange={e => handleEntryChange(index, 'date', e.target.value)}
//             /><br /><br />

//             <input
//               type="text"
//               placeholder="Item Name"
//               value={entry.itemName}
//               onChange={e => handleEntryChange(index, 'itemName', e.target.value)}
//               list={`itemNames-${index}`}
//             />
//             <datalist id={`itemNames-${index}`}>
//               {uniqueItemNames.map((name, i) => (
//                 <option key={i} value={name} />
//               ))}
//             </datalist>
//             <br /><br />

//             <input
//               type="text"
//               placeholder="Description"
//               value={entry.itemDescription}
//               onChange={e => handleEntryChange(index, 'itemDescription', e.target.value)}
//               list={`descriptions-${index}`}
//             />
//             <datalist id={`descriptions-${index}`}>
//               {matchingDescriptions.map((desc, i) => (
//                 <option key={i} value={desc} />
//               ))}
//             </datalist>
//             <br /><br />

//             <input
//               type="number"
//               placeholder="Rate"
//               value={entry.rate}
//               onChange={e => handleEntryChange(index, 'rate', e.target.value)}
//             />
//             <br /><br />

//             <input
//               type="number"
//               placeholder="Quantity"
//               value={entry.quantity}
//               onChange={e => handleEntryChange(index, 'quantity', e.target.value)}
//             />
//           </div>
//         );
//       })}

//       <button onClick={addNewEntryRow}>➕ Add Another Entry</button>
//       <br /><br />
//       <button onClick={handleSubmit}>
//         {editingId ? 'Update Stock' : 'Submit Stock Entries'}
//       </button>

//       <hr />

//       <h3>Stock Entries</h3>
//       {stockEntries.length === 0 ? (
//         <p>No stock added yet.</p>
//       ) : (
//         <table border={1} cellPadding={10}>
//           <thead>
//             <tr>
//               <th>Date</th>
//               <th>Item</th>
//               <th>Description</th>
//               <th>Rate</th>
//               <th>Quantity</th>
//               <th>Total</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {stockEntries.map((s, idx) => (
//               <tr key={idx}>
//                 <td>{s.date}</td>
//                 <td>{s.itemName}</td>
//                 <td>{s.itemDescription}</td>
//                 <td>₹{s.rate}</td>
//                 <td>{s.quantity}</td>
//                 <td>₹{s.rate * s.quantity}</td>
//                 <td>
//                   <button onClick={() => handleEdit(s)}>✏ Edit</button>
//                   <button onClick={() => handleDelete(s.id)}>🗑 Delete</button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}

//       <h3>Total Worth of Stock: ₹{totalWorth}</h3>
//     </div>
//   );
// }

// export default StockManagement;



// import React, { useEffect, useState } from 'react';
// import { db, auth } from '../firebase';
// import {
//   collection,
//   addDoc,
//   getDocs,
//   doc,
//   updateDoc,
//   deleteDoc
// } from 'firebase/firestore';

// function StockManagement() {
//   const [userId, setUserId] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [stockEntries, setStockEntries] = useState([]);
//   const [customerOrders, setCustomerOrders] = useState([]);
//   const [stockSummary, setStockSummary] = useState([]);
//   const [entries, setEntries] = useState([
//     { date: '', itemName: '', itemDescription: '', rate: 0, quantity: 1 }
//   ]);
//   const [editingId, setEditingId] = useState(null);
//   const [activeTab, setActiveTab] = useState('entries'); // 'entries' or 'summary'

//   useEffect(() => {
//     auth.onAuthStateChanged((user) => {
//       if (user) {
//         setUserId(user.uid);
//         fetchProducts(user.uid);
//         fetchStock(user.uid);
//         fetchCustomerOrders(user.uid);
//       }
//     });
//   }, []);

//   useEffect(() => {
//     if (stockEntries.length > 0 || customerOrders.length > 0) {
//       calculateStockSummary();
//     }
//   }, [stockEntries, customerOrders]);

//   const fetchProducts = async (uid) => {
//     try {
//       const productsRef = collection(db, 'users', uid, 'products');
//       const snapshot = await getDocs(productsRef);
//       const productList = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
//       setProducts(productList);
//       console.log('Products fetched:', productList);
//     } catch (error) {
//       console.error('Error fetching products:', error);
//       setProducts([]);
//     }
//   };

//   const fetchStock = async (uid) => {
//     try {
//       const stockRef = collection(db, 'users', uid, 'stock');
//       const snapshot = await getDocs(stockRef);
//       const stockList = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
//       setStockEntries(stockList);
//       console.log('Stock entries fetched:', stockList);
//     } catch (error) {
//       console.error('Error fetching stock:', error);
//       setStockEntries([]);
//     }
//   };

//   const fetchCustomerOrders = async (uid) => {
//     try {
//       // Try both possible collection names
//       let ordersRef = collection(db, 'users', uid, 'customerorders');
//       let snapshot = await getDocs(ordersRef);
      
//       // If no documents found, try alternative collection name
//       if (snapshot.empty) {
//         ordersRef = collection(db, 'users', uid, 'orders');
//         snapshot = await getDocs(ordersRef);
//       }
      
//       const ordersList = snapshot.docs.map(doc => {
//         const data = doc.data();
//         console.log('Raw order data:', data); // Debug log
//         return {
//           id: doc.id,
//           ...data
//         };
//       });
      
//       setCustomerOrders(ordersList);
//       console.log('Customer orders fetched:', ordersList);
//     } catch (error) {
//       console.error('Error fetching customer orders:', error);
//       setCustomerOrders([]);
//     }
//   };

//   const calculateStockSummary = () => {
//     console.log('Calculating stock summary...');
//     console.log('Stock entries:', stockEntries);
//     console.log('Customer orders:', customerOrders);

//     // Group stock entries by itemName and itemDescription
//     const productionStock = {};
    
//     stockEntries.forEach(entry => {
//       const key = `${entry.itemName || ''}_${entry.itemDescription || ''}`;
//       if (!productionStock[key]) {
//         productionStock[key] = {
//           itemName: entry.itemName || '',
//           itemDescription: entry.itemDescription || '',
//           rate: entry.rate || 0,
//           totalProduced: 0,
//           lastDate: entry.date || ''
//         };
//       }
//       productionStock[key].totalProduced += Number(entry.quantity) || 0;
//       // Keep the most recent date
//       if (entry.date > productionStock[key].lastDate) {
//         productionStock[key].lastDate = entry.date;
//       }
//     });

//     // Calculate sold quantities from customer orders
//     const soldStock = {};
    
//     customerOrders.forEach(order => {
//       // Handle different possible structures of order data
//       // Check for various possible item array names
//       let items = [];
      
//       if (order.items && Array.isArray(order.items)) {
//         items = order.items;
//       } else if (order.orderItems && Array.isArray(order.orderItems)) {
//         items = order.orderItems;
//       } else if (order.products && Array.isArray(order.products)) {
//         items = order.products;
//       } else if (Array.isArray(order)) {
//         // In case the order itself is an array
//         items = order;
//       }
      
//       console.log('Processing order items:', items); // Debug log
      
//       items.forEach(item => {
//         if (item && item.itemName && item.itemDescription) {
//           const key = `${item.itemName}_${item.itemDescription}`;
//           if (!soldStock[key]) {
//             soldStock[key] = 0;
//           }
//           const quantity = Number(item.quantity) || 0;
//           soldStock[key] += quantity;
//           console.log(`Added ${quantity} to ${key}, total now: ${soldStock[key]}`); // Debug log
//         }
//       });
//     });

//     console.log('Sold stock summary:', soldStock); // Debug log

//     // Combine production and sales data
//     const summary = Object.keys(productionStock).map(key => {
//       const production = productionStock[key];
//       const sold = soldStock[key] || 0;
//       const remainingStock = production.totalProduced - sold;

//       return {
//         itemName: production.itemName,
//         itemDescription: production.itemDescription,
//         rate: production.rate,
//         lastDate: production.lastDate,
//         totalProduced: production.totalProduced,
//         totalSold: sold,
//         remainingStock: remainingStock
//       };
//     });

//     // Also include items that were sold but not in production (if any)
//     Object.keys(soldStock).forEach(key => {
//       if (!productionStock[key]) {
//         const [itemName, itemDescription] = key.split('_');
//         summary.push({
//           itemName: itemName || '',
//           itemDescription: itemDescription || '',
//           rate: 0,
//           lastDate: '',
//           totalProduced: 0,
//           totalSold: soldStock[key],
//           remainingStock: -soldStock[key] // Negative indicates oversold
//         });
//       }
//     });

//     // Sort by item name for better organization
//     summary.sort((a, b) => a.itemName.localeCompare(b.itemName));
//     console.log('Final stock summary:', summary); // Debug log
//     setStockSummary(summary);
//   };

//   const handleEntryChange = (index, field, value) => {
//     const updated = [...entries];
//     updated[index][field] = field === 'rate' || field === 'quantity' ? Number(value) : value;

//     const currentEntry = updated[index];
//     const matched = products.find(
//       (p) =>
//         p.itemName === currentEntry.itemName &&
//         p.itemDescription === currentEntry.itemDescription
//     );

//     if (matched) {
//       updated[index].rate = matched.rate;
//     }

//     setEntries(updated);
//   };

//   const addNewEntryRow = () => {
//     setEntries([
//       ...entries,
//       { date: '', itemName: '', itemDescription: '', rate: 0, quantity: 1 }
//     ]);
//   };

//   const removeEntryRow = (index) => {
//     if (entries.length > 1) {
//       const updated = entries.filter((_, i) => i !== index);
//       setEntries(updated);
//     }
//   };

//   const handleSubmit = async () => {
//     if (!userId) return;

//     const stockRef = collection(db, 'users', userId, 'stock');

//     for (const entry of entries) {
//       if (!entry.date || !entry.itemName || !entry.itemDescription) {
//         alert('Please fill all required fields for each entry');
//         return;
//       }

//       const dataToSave = {
//         ...entry,
//         rate: Number(entry.rate),
//         quantity: Number(entry.quantity)
//       };

//       if (editingId) {
//         const docRef = doc(stockRef, editingId);
//         await updateDoc(docRef, dataToSave);
//       } else {
//         await addDoc(stockRef, dataToSave);
//       }
//     }

//     setEditingId(null);
//     setEntries([{ date: '', itemName: '', itemDescription: '', rate: 0, quantity: 1 }]);
//     fetchStock(userId);
//   };

//   const handleEdit = (entry) => {
//     setEntries([entry]);
//     setEditingId(entry.id || null);
//     setActiveTab('entries');
//   };

//   const handleDelete = async (id) => {
//     if (!userId) return;
//     if (window.confirm('Are you sure you want to delete this stock entry?')) {
//       await deleteDoc(doc(db, 'users', userId, 'stock', id));
//       fetchStock(userId);
//     }
//   };

//   const handleRefreshData = () => {
//     if (userId) {
//       fetchProducts(userId);
//       fetchStock(userId);
//       fetchCustomerOrders(userId);
//     }
//   };

//   const totalWorth = stockEntries.reduce((sum, e) => sum + (Number(e.rate) * Number(e.quantity)), 0);
//   const totalRemainingWorth = stockSummary.reduce((sum, item) => sum + (Number(item.rate) * Number(item.remainingStock)), 0);

//   const uniqueItemNames = [...new Set(products.map(p => p.itemName))];

//   const tabStyle = (isActive) => ({
//     padding: '10px 20px',
//     marginRight: '10px',
//     backgroundColor: isActive ? '#007bff' : '#f8f9fa',
//     color: isActive ? 'white' : 'black',
//     border: '1px solid #dee2e6',
//     cursor: 'pointer',
//     borderRadius: '5px 5px 0 0'
//   });

//   return (
//     <div style={{ padding: '20px' }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//         <h2>Stock Management</h2>
//         <button 
//           onClick={handleRefreshData}
//           style={{
//             backgroundColor: '#17a2b8',
//             color: 'white',
//             border: 'none',
//             padding: '8px 16px',
//             borderRadius: '4px',
//             cursor: 'pointer'
//           }}
//         >
//           🔄 Refresh Data
//         </button>
//       </div>

//       {/* Debug Information */}
//       <div style={{ 
//         backgroundColor: '#f8f9fa', 
//         padding: '10px', 
//         marginBottom: '20px', 
//         borderRadius: '4px',
//         fontSize: '12px'
//       }}>
//         <strong>Debug Info:</strong> Stock Entries: {stockEntries.length} | Customer Orders: {customerOrders.length} | Summary Items: {stockSummary.length}
//       </div>

//       {/* Tab Navigation */}
//       <div style={{ marginBottom: '20px', borderBottom: '1px solid #dee2e6' }}>
//         <button 
//           style={tabStyle(activeTab === 'entries')}
//           onClick={() => setActiveTab('entries')}
//         >
//           Stock Entries
//         </button>
//         <button 
//           style={tabStyle(activeTab === 'summary')}
//           onClick={() => setActiveTab('summary')}
//         >
//           Stock Summary
//         </button>
//       </div>

//       {activeTab === 'entries' && (
//         <>
//           {/* Entry Form */}
//           <h3>Add Stock Entries</h3>
//           {entries.map((entry, index) => {
//             const matchingDescriptions = [
//               ...new Set(
//                 products
//                   .filter(p => p.itemName === entry.itemName)
//                   .map(p => p.itemDescription)
//               )
//             ];

//             return (
//               <div key={index} style={{ 
//                 marginBottom: '30px', 
//                 paddingBottom: '20px', 
//                 borderBottom: '1px solid #ccc',
//                 position: 'relative'
//               }}>
//                 {entries.length > 1 && (
//                   <button 
//                     onClick={() => removeEntryRow(index)}
//                     style={{
//                       position: 'absolute',
//                       top: '0',
//                       right: '0',
//                       background: '#dc3545',
//                       color: 'white',
//                       border: 'none',
//                       borderRadius: '50%',
//                       width: '25px',
//                       height: '25px',
//                       cursor: 'pointer'
//                     }}
//                   >
//                     ×
//                   </button>
//                 )}

//                 <input
//                   type="date"
//                   value={entry.date}
//                   onChange={e => handleEntryChange(index, 'date', e.target.value)}
//                   required
//                 /><br /><br />

//                 <input
//                   type="text"
//                   placeholder="Item Name *"
//                   value={entry.itemName}
//                   onChange={e => handleEntryChange(index, 'itemName', e.target.value)}
//                   list={`itemNames-${index}`}
//                   required
//                 />
//                 <datalist id={`itemNames-${index}`}>
//                   {uniqueItemNames.map((name, i) => (
//                     <option key={i} value={name} />
//                   ))}
//                 </datalist>
//                 <br /><br />

//                 <input
//                   type="text"
//                   placeholder="Description *"
//                   value={entry.itemDescription}
//                   onChange={e => handleEntryChange(index, 'itemDescription', e.target.value)}
//                   list={`descriptions-${index}`}
//                   required
//                 />
//                 <datalist id={`descriptions-${index}`}>
//                   {matchingDescriptions.map((desc, i) => (
//                     <option key={i} value={desc} />
//                   ))}
//                 </datalist>
//                 <br /><br />

//                 <input
//                   type="number"
//                   placeholder="Rate"
//                   value={entry.rate}
//                   onChange={e => handleEntryChange(index, 'rate', e.target.value)}
//                   step="0.01"
//                 />
//                 <br /><br />

//                 <input
//                   type="number"
//                   placeholder="Quantity *"
//                   value={entry.quantity}
//                   onChange={e => handleEntryChange(index, 'quantity', e.target.value)}
//                   min="1"
//                   required
//                 />
//               </div>
//             );
//           })}

//           <button onClick={addNewEntryRow} style={{ marginRight: '10px' }}>
//             ➕ Add Another Entry
//           </button>
//           <button onClick={handleSubmit} style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 20px' }}>
//             {editingId ? 'Update Stock' : 'Submit Stock Entries'}
//           </button>

//           <hr />

//           {/* Stock Entries Table */}
//           <h3>All Stock Entries</h3>
//           {stockEntries.length === 0 ? (
//             <p>No stock added yet.</p>
//           ) : (
//             <>
//               <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse' }}>
//                 <thead>
//                   <tr style={{ backgroundColor: '#f8f9fa' }}>
//                     <th>Date</th>
//                     <th>Item</th>
//                     <th>Description</th>
//                     <th>Rate</th>
//                     <th>Quantity</th>
//                     <th>Total</th>
//                     <th>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {stockEntries.map((s, idx) => (
//                     <tr key={idx}>
//                       <td>{s.date}</td>
//                       <td>{s.itemName}</td>
//                       <td>{s.itemDescription}</td>
//                       <td>₹{Number(s.rate).toFixed(2)}</td>
//                       <td>{s.quantity}</td>
//                       <td>₹{(Number(s.rate) * Number(s.quantity)).toFixed(2)}</td>
//                       <td>
//                         <button onClick={() => handleEdit(s)} style={{ marginRight: '5px' }}>
//                           ✏ Edit
//                         </button>
//                         <button onClick={() => handleDelete(s.id)} style={{ backgroundColor: '#dc3545', color: 'white' }}>
//                           🗑 Delete
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//               <h3>Total Production Worth: ₹{totalWorth.toFixed(2)}</h3>
//             </>
//           )}
//         </>
//       )}

//       {activeTab === 'summary' && (
//         <>
//           {/* Stock Summary Table */}
//           <h3>Stock Summary (Production vs Sales)</h3>
//           {stockSummary.length === 0 ? (
//             <p>No stock summary available. Add some stock entries first.</p>
//           ) : (
//             <>
//               <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse' }}>
//                 <thead>
//                   <tr style={{ backgroundColor: '#f8f9fa' }}>
//                     <th>Last Updated</th>
//                     <th>Item Name</th>
//                     <th>Description</th>
//                     <th>Rate</th>
//                     <th>Total Produced</th>
//                     <th>Total Sold</th>
//                     <th>Remaining Stock</th>
//                     <th>Remaining Value</th>
//                     <th>Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {stockSummary.map((item, idx) => (
//                     <tr key={idx} style={{
//                       backgroundColor: item.remainingStock < 0 ? '#ffe6e6' : 
//                                      item.remainingStock === 0 ? '#fff3cd' : 
//                                      item.remainingStock < 5 ? '#d1ecf1' : 'white'
//                     }}>
//                       <td>{item.lastDate}</td>
//                       <td>{item.itemName}</td>
//                       <td>{item.itemDescription}</td>
//                       <td>₹{Number(item.rate).toFixed(2)}</td>
//                       <td>{item.totalProduced}</td>
//                       <td>{item.totalSold}</td>
//                       <td style={{ 
//                         fontWeight: 'bold',
//                         color: item.remainingStock < 0 ? '#dc3545' : 
//                                item.remainingStock === 0 ? '#856404' : 
//                                item.remainingStock < 5 ? '#0c5460' : '#28a745'
//                       }}>
//                         {item.remainingStock}
//                       </td>
//                       <td>₹{(Number(item.rate) * Number(item.remainingStock)).toFixed(2)}</td>
//                       <td>
//                         {item.remainingStock < 0 ? '🔴 Oversold' : 
//                          item.remainingStock === 0 ? '🟡 Out of Stock' : 
//                          item.remainingStock < 5 ? '🔵 Low Stock' : '🟢 In Stock'}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
              
//               <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
//                 <h3>Total Remaining Stock Value: ₹{totalRemainingWorth.toFixed(2)}</h3>
//                 <div>
//                   <p><strong>Legend:</strong></p>
//                   <p>🔴 Oversold | 🟡 Out of Stock | 🔵 Low Stock (&lt;5) | 🟢 In Stock</p>
//                 </div>
//               </div>
//             </>
//           )}
//         </>
//       )}
//     </div>
//   );
// }

// export default StockManagement;




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
      // Try both possible collection names
      let ordersRef = collection(db, 'users', uid, 'customerOrders');
      let snapshot = await getDocs(ordersRef);
      
      
      
      const ordersList = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('=== RAW ORDER DATA ===');
        console.log('Document ID:', doc.id);
        console.log('Full data object:', data);
        console.log('Data keys:', Object.keys(data));
        
        // Log potential item arrays
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
      // Keep the most recent date
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
      
      // Handle different possible structures of order data
      let items = [];
      
      // Check various possible locations for items
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
        // Check if the items might be stored as individual properties
        console.log('No array found, checking for individual item properties...');
        
        // Sometimes items might be stored as separate fields
        const possibleItemFields = Object.keys(order).filter(key => 
          key.startsWith('item') || key.includes('Item') || key.includes('product')
        );
        console.log('Possible item fields:', possibleItemFields);
        
        // Try to reconstruct items from individual fields
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
          remainingStock: -soldStock[key] // Negative indicates oversold
        });
      }
    });

    // Sort by item name for better organization
    summary.sort((a, b) => a.itemName.localeCompare(b.itemName));
    console.log('\n=== FINAL SUMMARY ===');
    console.log('Summary items:', summary);
    setStockSummary(summary);
  };

  const handleEntryChange = (index, field, value) => {
    const updated = [...entries];
    updated[index][field] = field === 'rate' || field === 'quantity' ? Number(value) : value;

    const currentEntry = updated[index];
    const matched = products.find(
      (p) =>
        p.itemName === currentEntry.itemName &&
        p.itemDescription === currentEntry.itemDescription
    );

    if (matched) {
      updated[index].rate = matched.rate;
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

  const uniqueItemNames = [...new Set(products.map(p => p.itemName))];

  const tabStyle = (isActive) => ({
    padding: '10px 20px',
    marginRight: '10px',
    backgroundColor: isActive ? '#007bff' : '#f8f9fa',
    color: isActive ? 'white' : 'black',
    border: '1px solid #dee2e6',
    cursor: 'pointer',
    borderRadius: '5px 5px 0 0'
  });

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Stock Management</h2>
        <button 
          onClick={handleRefreshData}
          style={{
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Debug Information */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '10px', 
        marginBottom: '20px', 
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <strong>Debug Info:</strong> Stock Entries: {stockEntries.length} | Customer Orders: {customerOrders.length} | Summary Items: {stockSummary.length}
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #dee2e6' }}>
        <button 
          style={tabStyle(activeTab === 'entries')}
          onClick={() => setActiveTab('entries')}
        >
          Stock Entries
        </button>
        <button 
          style={tabStyle(activeTab === 'summary')}
          onClick={() => setActiveTab('summary')}
        >
          Stock Summary
        </button>
      </div>

      {activeTab === 'entries' && (
        <>
          {/* Entry Form */}
          <h3>Add Stock Entries</h3>
          {entries.map((entry, index) => {
            const matchingDescriptions = [
              ...new Set(
                products
                  .filter(p => p.itemName === entry.itemName)
                  .map(p => p.itemDescription)
              )
            ];

            return (
              <div key={index} style={{ 
                marginBottom: '30px', 
                paddingBottom: '20px', 
                borderBottom: '1px solid #ccc',
                position: 'relative'
              }}>
                {entries.length > 1 && (
                  <button 
                    onClick={() => removeEntryRow(index)}
                    style={{
                      position: 'absolute',
                      top: '0',
                      right: '0',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '25px',
                      height: '25px',
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                )}

                <input
                  type="date"
                  value={entry.date}
                  onChange={e => handleEntryChange(index, 'date', e.target.value)}
                  required
                /><br /><br />

                <input
                  type="text"
                  placeholder="Item Name *"
                  value={entry.itemName}
                  onChange={e => handleEntryChange(index, 'itemName', e.target.value)}
                  list={`itemNames-${index}`}
                  required
                />
                <datalist id={`itemNames-${index}`}>
                  {uniqueItemNames.map((name, i) => (
                    <option key={i} value={name} />
                  ))}
                </datalist>
                <br /><br />

                <input
                  type="text"
                  placeholder="Description *"
                  value={entry.itemDescription}
                  onChange={e => handleEntryChange(index, 'itemDescription', e.target.value)}
                  list={`descriptions-${index}`}
                  required
                />
                <datalist id={`descriptions-${index}`}>
                  {matchingDescriptions.map((desc, i) => (
                    <option key={i} value={desc} />
                  ))}
                </datalist>
                <br /><br />

                <input
                  type="number"
                  placeholder="Rate"
                  value={entry.rate}
                  onChange={e => handleEntryChange(index, 'rate', e.target.value)}
                  step="0.01"
                />
                <br /><br />

                <input
                  type="number"
                  placeholder="Quantity *"
                  value={entry.quantity}
                  onChange={e => handleEntryChange(index, 'quantity', e.target.value)}
                  min="1"
                  required
                />
              </div>
            );
          })}

          <button onClick={addNewEntryRow} style={{ marginRight: '10px' }}>
            ➕ Add Another Entry
          </button>
          <button onClick={handleSubmit} style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 20px' }}>
            {editingId ? 'Update Stock' : 'Submit Stock Entries'}
          </button>

          <hr />

          {/* Stock Entries Table */}
          <h3>All Stock Entries</h3>
          {stockEntries.length === 0 ? (
            <p>No stock added yet.</p>
          ) : (
            <>
              <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th>Date</th>
                    <th>Item</th>
                    <th>Description</th>
                    <th>Rate</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stockEntries.map((s, idx) => (
                    <tr key={idx}>
                      <td>{s.date}</td>
                      <td>{s.itemName}</td>
                      <td>{s.itemDescription}</td>
                      <td>₹{Number(s.rate).toFixed(2)}</td>
                      <td>{s.quantity}</td>
                      <td>₹{(Number(s.rate) * Number(s.quantity)).toFixed(2)}</td>
                      <td>
                        <button onClick={() => handleEdit(s)} style={{ marginRight: '5px' }}>
                          ✏ Edit
                        </button>
                        <button onClick={() => handleDelete(s.id)} style={{ backgroundColor: '#dc3545', color: 'white' }}>
                          🗑 Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h3>Total Production Worth: ₹{totalWorth.toFixed(2)}</h3>
            </>
          )}
        </>
      )}

      {activeTab === 'summary' && (
        <>
          {/* Stock Summary Table */}
          <h3>Stock Summary (Production vs Sales)</h3>
          {stockSummary.length === 0 ? (
            <p>No stock summary available. Add some stock entries first.</p>
          ) : (
            <>
              <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th>Last Updated</th>
                    <th>Item Name</th>
                    <th>Description</th>
                    <th>Rate</th>
                    <th>Total Produced</th>
                    <th>Total Sold</th>
                    <th>Remaining Stock</th>
                    <th>Remaining Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stockSummary.map((item, idx) => (
                    <tr key={idx} style={{
                      backgroundColor: item.remainingStock < 0 ? '#ffe6e6' : 
                                     item.remainingStock === 0 ? '#fff3cd' : 
                                     item.remainingStock < 5 ? '#d1ecf1' : 'white'
                    }}>
                      <td>{item.lastDate}</td>
                      <td>{item.itemName}</td>
                      <td>{item.itemDescription}</td>
                      <td>₹{Number(item.rate).toFixed(2)}</td>
                      <td>{item.totalProduced}</td>
                      <td>{item.totalSold}</td>
                      <td style={{ 
                        fontWeight: 'bold',
                        color: item.remainingStock < 0 ? '#dc3545' : 
                               item.remainingStock === 0 ? '#856404' : 
                               item.remainingStock < 5 ? '#0c5460' : '#28a745'
                      }}>
                        {item.remainingStock}
                      </td>
                      <td>₹{(Number(item.rate) * Number(item.remainingStock)).toFixed(2)}</td>
                      <td>
                        {item.remainingStock < 0 ? '🔴 Oversold' : 
                         item.remainingStock === 0 ? '🟡 Out of Stock' : 
                         item.remainingStock < 5 ? '🔵 Low Stock' : '🟢 In Stock'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <h3>Total Remaining Stock Value: ₹{totalRemainingWorth.toFixed(2)}</h3>
                <div>
                  <p><strong>Legend:</strong></p>
                  <p>🔴 Oversold | 🟡 Out of Stock | 🔵 Low Stock (&lt;5) | 🟢 In Stock</p>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default StockManagement;