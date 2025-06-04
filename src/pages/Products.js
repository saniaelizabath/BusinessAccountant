
// import React, { useState, useEffect } from 'react';
// import { db, auth } from '../firebase';
// import {
//   collection,
//   addDoc,
//   getDocs,
//   query,
//   where,
//   deleteDoc,
//   doc
// } from 'firebase/firestore';

// function Products() {
//   const [itemName, setItemName] = useState('');
//   const [itemDescription, setItemDescription] = useState('');
//   const [rate, setRate] = useState('');
//   const [message, setMessage] = useState('');
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [showProducts, setShowProducts] = useState(false);
//   const [products, setProducts] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [userId, setUserId] = useState(null);

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged((user) => {
//       if (user) {
//         setUserId(user.uid);
//       } else {
//         setUserId(null);
//         setProducts([]);
//         setMessage("Please log in to view your products.");
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!itemName || !itemDescription || !rate) {
//       setMessage("All fields are required!");
//       return;
//     }

//     if (!userId) {
//       setMessage("You must be logged in to add products.");
//       return;
//     }

//     try {
//       const userProductsRef = collection(db, 'users', userId, 'products');
//       const q = query(
//         userProductsRef,
//         where('itemName', '==', itemName),
//         where('itemDescription', '==', itemDescription)
        
//       );
//       const querySnapshot = await getDocs(q);

//       if (!querySnapshot.empty) {
//         setMessage("Item already added!");
//         return;
//       }

//       await addDoc(userProductsRef, {
//         itemName,
//         itemDescription,
//         rate,
//         createdAt: new Date()
//       });

//       setMessage("Product added successfully!");
//       setItemName('');
//       setItemDescription('');
//       setRate('');
//       if (showProducts) handleShowProducts();
//     } catch (err) {
//       console.error("Error adding document: ", err);
//       setMessage("Error adding product");
//     }
//   };

//   const handleShowProducts = async () => {
//     if (!userId) {
//       setMessage("Please log in to view products.");
//       return;
//     }

//     if (!showProducts) {
//       const userProductsRef = collection(db, 'users', userId, 'products');
//       const querySnapshot = await getDocs(userProductsRef);
//       const productList = querySnapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
//       setProducts(productList);
//     }

//     setShowProducts(!showProducts);
//   };

//   const handleDelete = async (productId) => {
//     try {
//       await deleteDoc(doc(db, 'users', userId, 'products', productId));
//       setProducts(prev => prev.filter(product => product.id !== productId));
//       setMessage("Product deleted.");
//     } catch (error) {
//       console.error("Error deleting document:", error);
//       setMessage("Error deleting product.");
//     }
//   };

//   const filteredProducts = products.filter(product =>
//     product.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     product.itemDescription.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div style={{ padding: '20px' }}>
//       <h2>Products</h2>

//       <button onClick={() => setShowAddForm(!showAddForm)}>
//         {showAddForm ? 'Close ✖' : 'Add Product'}
//       </button>

//       <button onClick={handleShowProducts} style={{ marginLeft: '10px' }}>
//         {showProducts ? 'Hide Products ✖' : 'View Products'}
//       </button>

//       {showAddForm && (
//         <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
//           <input
//             type="text"
//             placeholder="Item Name"
//             value={itemName}
//             onChange={(e) => setItemName(e.target.value)}
//             required
//           /><br /><br />
//           <textarea
//             placeholder="Item Description"
//             value={itemDescription}
//             onChange={(e) => setItemDescription(e.target.value)}
//             required
//           ></textarea><br /><br />
//           <input
//             type="number"
//             placeholder="Rate"
//             value={rate}
//             onChange={(e) => setRate(e.target.value)}
//             required
//           /><br /><br />
//           <button type="submit">Add Product</button>
//         </form>
//       )}

//       {message && <p>{message}</p>}

//       {showProducts && (
//         <div style={{ marginTop: '20px' }}>
//           <h3>Product List:</h3>
//           <input
//             type="text"
//             placeholder="Search by name or description"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             style={{ marginBottom: '10px', padding: '5px', width: '300px' }}
//           />
//           {filteredProducts.length === 0 ? (
//             <p>No products match your search.</p>
//           ) : (
//             <table border="1" cellPadding="10" cellSpacing="0">
//               <thead>
//                 <tr>
//                   <th>Item Name</th>
//                   <th>Description</th>
//                   <th>Rate (₹)</th>
//                   <th>Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredProducts.map(product => (
//                   <tr key={product.id}>
//                     <td>{product.itemName}</td>
//                     <td>{product.itemDescription}</td>
//                     <td>{product.rate}</td>
//                     <td>
//                       <button onClick={() => handleDelete(product.id)}>🗑 Delete</button>
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

// export default Products;




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

  // Editing states
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

  return (
    <div style={{ padding: '20px' }}>
      <h2>Products</h2>

      <button onClick={() => setShowAddForm(!showAddForm)}>
        {showAddForm ? 'Close ✖' : 'Add Product'}
      </button>

      <button onClick={handleShowProducts} style={{ marginLeft: '10px' }}>
        {showProducts ? 'Hide Products ✖' : 'View Products'}
      </button>

      {showAddForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <input
            type="text"
            placeholder="Item Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
          /><br /><br />
          <textarea
            placeholder="Item Description"
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            required
          ></textarea><br /><br />
          <input
            type="number"
            placeholder="Rate"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            required
          /><br /><br />
          <button type="submit">Add Product</button>
        </form>
      )}

      {message && <p>{message}</p>}

      {showProducts && (
        <div style={{ marginTop: '20px' }}>
          <h3>Product List:</h3>
          <input
            type="text"
            placeholder="Search by name or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: '10px', padding: '5px', width: '300px' }}
          />
          {filteredProducts.length === 0 ? (
            <p>No products match your search.</p>
          ) : (
            <table border="1" cellPadding="10" cellSpacing="0">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Description</th>
                  <th>Rate (₹)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id}>
                    {editingProductId === product.id ? (
                      <>
                        <td>
                          <input
                            value={editingItemName}
                            onChange={(e) => setEditingItemName(e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            value={editingDescription}
                            onChange={(e) => setEditingDescription(e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editingRate}
                            onChange={(e) => setEditingRate(e.target.value)}
                          />
                        </td>
                        <td>
                          <button onClick={handleUpdate}>✅ Update</button>
                          <button onClick={cancelEdit} style={{ marginLeft: '5px' }}>✖ Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{product.itemName}</td>
                        <td>{product.itemDescription}</td>
                        <td>{product.rate}</td>
                        <td>
                          <button onClick={() => handleEdit(product)}>✏ Edit</button>
                          <button onClick={() => handleDelete(product.id)} style={{ marginLeft: '5px' }}>🗑 Delete</button>
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
  );
}

export default Products;
