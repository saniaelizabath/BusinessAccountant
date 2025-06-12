import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';

function Products() {
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [rate, setRate] = useState('');
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingRate, setEditingRate] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setProducts([]);
        setMessage("Please log in to view your products.");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName || !itemDescription || !rate) {
      setMessage("All fields are required!");
      return;
    }

    if (!userId) {
      setMessage("You must be logged in to add products.");
      return;
    }

    try {
      const userProductsRef = collection(db, 'users', userId, 'products');
      const q = query(
        userProductsRef,
        where('itemName', '==', itemName),
        where('itemDescription', '==', itemDescription)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setMessage("Item already added!");
        return;
      }

      await addDoc(userProductsRef, {
        itemName,
        itemDescription,
        rate,
        createdAt: new Date()
      });

      setMessage("Product added successfully!");
      setItemName('');
      setItemDescription('');
      setRate('');
      if (showProducts) handleShowProducts();
    } catch (err) {
      console.error("Error adding document: ", err);
      setMessage("Error adding product");
    }
  };

  const handleShowProducts = async () => {
    if (!userId) {
      setMessage("Please log in to view products.");
      return;
    }

    if (!showProducts) {
      const userProductsRef = collection(db, 'users', userId, 'products');
      const querySnapshot = await getDocs(userProductsRef);
      const productList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productList);
    }

    setShowProducts(!showProducts);
  };

  const handleDelete = async (productId) => {
    try {
      await deleteDoc(doc(db, 'users', userId, 'products', productId));
      setProducts(prev => prev.filter(product => product.id !== productId));
      setMessage("Product deleted.");
    } catch (error) {
      console.error("Error deleting document:", error);
      setMessage("Error deleting product.");
    }
  };

  const handleEdit = (product) => {
    setEditingProductId(product.id);
    setEditingItemName(product.itemName);
    setEditingDescription(product.itemDescription);
    setEditingRate(product.rate);
  };

  const handleUpdate = async () => {
    try {
      const productRef = doc(db, 'users', userId, 'products', editingProductId);
      await updateDoc(productRef, {
        itemName: editingItemName,
        itemDescription: editingDescription,
        rate: editingRate
      });
      setMessage("Product updated successfully!");
      setEditingProductId(null);
      handleShowProducts(); // Refresh list
    } catch (error) {
      console.error("Error updating product:", error);
      setMessage("Error updating product.");
    }
  };

  const cancelEdit = () => {
    setEditingProductId(null);
  };

  const filteredProducts = products.filter(product =>
    product.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.itemDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '40px',
      color: '#333',
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
    buttonGroup: {
      display: 'flex',
      gap: '15px',
      marginBottom: '30px',
    },
    button: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.95rem',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      backgroundColor: '#fff',
      color: '#2563eb',
      border: '1px solid #2563eb',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      ':hover': {
        backgroundColor: '#f8fafc',
      },
    },
    primaryButton: {
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      ':hover': {
        backgroundColor: '#1d4ed8',
      },
    },
    form: {
      background: '#ffffff',
      padding: '25px',
      borderRadius: '12px',
      marginBottom: '30px',
      border: '1px solid #e5e7eb',
    },
    input: {
      width: '100%',
      padding: '12px',
      marginBottom: '20px',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      background: '#fff',
      color: '#333',
      fontSize: '0.95rem',
      transition: 'border-color 0.2s ease',
      ':focus': {
        borderColor: '#2563eb',
        outline: 'none',
      },
    },
    searchInput: {
      width: '100%',
      maxWidth: '400px',
      padding: '12px 20px',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      background: '#fff',
      color: '#333',
      fontSize: '0.95rem',
      marginBottom: '20px',
      transition: 'all 0.2s ease',
      ':focus': {
        borderColor: '#2563eb',
        outline: 'none',
        boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
      },
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0 8px',
      marginTop: '20px',
    },
    tableHeader: {
      background: '#f8fafc',
      color: '#4b5563',
      padding: '15px',
      textAlign: 'left',
      borderBottom: '2px solid #e5e7eb',
      fontSize: '0.95rem',
      fontWeight: '600',
    },
    tableRow: {
      background: '#fff',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#f8fafc',
      },
    },
    tableCell: {
      padding: '15px',
      color: '#333',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '0.95rem',
    },
    actionButton: {
      padding: '8px 16px',
      margin: '0 5px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '0.9rem',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
    },
    editButton: {
      backgroundColor: '#2563eb',
      color: 'white',
      ':hover': {
        backgroundColor: '#1d4ed8',
      },
    },
    deleteButton: {
      backgroundColor: '#ef4444',
      color: 'white',
      ':hover': {
        backgroundColor: '#dc2626',
      },
    },
    message: {
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      backgroundColor: '#f0f9ff',
      border: '1px solid #bae6fd',
      color: '#0369a1',
      fontSize: '0.95rem',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>Products Management</h1>
          <div style={styles.buttonGroup}>
            <button 
              style={{
                ...styles.button, 
                ...(showAddForm ? {} : styles.primaryButton)
              }}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? '✖ Close Form' : '➕ Add New Product'}
            </button>
            <button 
              style={styles.button}
              onClick={handleShowProducts}
            >
              {showProducts ? '✖ Hide Products' : '📋 View Products'}
            </button>
          </div>
        </div>

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}

        {showAddForm && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              style={styles.input}
              type="text"
              placeholder="Item Name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />
            <textarea
              style={{...styles.input, minHeight: '100px', resize: 'vertical'}}
              placeholder="Item Description"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              required
            />
            <input
              style={styles.input}
              type="number"
              placeholder="Rate"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
            />
            <button type="submit" style={{...styles.button, ...styles.primaryButton}}>
              Add Product
            </button>
          </form>
        )}

        {showProducts && (
          <div>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="🔍 Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            {filteredProducts.length === 0 ? (
              <div style={styles.message}>No products match your search.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Item Name</th>
                    <th style={styles.tableHeader}>Description</th>
                    <th style={styles.tableHeader}>Rate (₹)</th>
                    <th style={styles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id} style={styles.tableRow}>
                      {editingProductId === product.id ? (
                        <>
                          <td style={styles.tableCell}>
                            <input
                              style={styles.input}
                              value={editingItemName}
                              onChange={(e) => setEditingItemName(e.target.value)}
                            />
                          </td>
                          <td style={styles.tableCell}>
                            <input
                              style={styles.input}
                              value={editingDescription}
                              onChange={(e) => setEditingDescription(e.target.value)}
                            />
                          </td>
                          <td style={styles.tableCell}>
                            <input
                              style={styles.input}
                              type="number"
                              value={editingRate}
                              onChange={(e) => setEditingRate(e.target.value)}
                            />
                          </td>
                          <td style={styles.tableCell}>
                            <button 
                              onClick={handleUpdate}
                              style={{...styles.actionButton, backgroundColor: '#22c55e'}}
                            >
                              ✅ Save
                            </button>
                            <button 
                              onClick={cancelEdit}
                              style={{...styles.actionButton, backgroundColor: '#ef4444'}}
                            >
                              ✖ Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={styles.tableCell}>{product.itemName}</td>
                          <td style={styles.tableCell}>{product.itemDescription}</td>
                          <td style={styles.tableCell}>{product.rate}</td>
                          <td style={styles.tableCell}>
                            <button 
                              onClick={() => handleEdit(product)}
                              style={{...styles.actionButton, ...styles.editButton}}
                            >
                              ✏ Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(product.id)}
                              style={{...styles.actionButton, ...styles.deleteButton}}
                            >
                              🗑 Delete
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
