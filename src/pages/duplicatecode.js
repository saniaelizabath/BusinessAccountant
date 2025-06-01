
// import React, { useState, useEffect, useRef } from 'react';
// import { db, auth } from '../firebase';
// import { collection, addDoc, getDocs } from 'firebase/firestore';
// import { Timestamp } from 'firebase/firestore';

// const CustomerOrders = () => {
//   const [userId, setUserId] = useState(null);
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const printRef = useRef();

//   const [formData, setFormData] = useState({
//     orderDate: '',
//     customerName: '',
//     address: '',
//     number: '',
//     itemName: '',
//     itemDescription: '',
//     rate: '',
//     quantity: '',
//     discount: '',
//     advance: '',
//     amountGiven: ''
//   });

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged(user => {
//       if (user) {
//         setUserId(user.uid);
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     const fetchProducts = async () => {
//       if (!userId) return;
//       const userProductsRef = collection(db, 'users', userId, 'products');
//       const snapshot = await getDocs(userProductsRef);
//       const data = snapshot.docs.map(doc => doc.data());
//       setProducts(data);
//     };
//     fetchProducts();
//   }, [userId]);

//   useEffect(() => {
//     const { itemName, itemDescription } = formData;
//     const matchedProduct = products.find(p =>
//       p.itemName === itemName && p.itemDescription === itemDescription
//     );
//     if (matchedProduct) {
//       setFormData(prev => ({
//         ...prev,
//         rate: matchedProduct.rate || 0
//       }));
//     }
//   }, [formData.itemName, formData.itemDescription, products]);

//   const handleChange = e => {
//     setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const handleSubmit = async e => {
//     e.preventDefault();
//     if (!userId) return;

//     const { rate, quantity, discount, advance, amountGiven } = formData;
//     const totalAmount = rate * quantity - (discount + advance);
//     const balance = totalAmount - amountGiven;

//     const orderData = {
//       ...formData,
//       rate: Number(rate),
//       quantity: Number(quantity),
//       discount: Number(discount),
//       advance: Number(advance),
//       amountGiven: Number(amountGiven),
//       totalAmount,
//       balance,
//       timestamp: Timestamp.now()
//     };

//     try {
//       const ordersRef = collection(db, 'users', userId, 'customerOrders');
//       await addDoc(ordersRef, orderData);
//       setOrders(prev => [...prev, orderData]);
//       setFormData({
//         orderDate: '',
//         customerName: '',
//         address: '',
//         number: '',
//         itemName: '',
//         itemDescription: '',
//         rate: '',
//         quantity: '',
//         discount: '',
//         advance: '',
//         amountGiven: ''
//       });
//     } catch (error) {
//       console.error('Error adding order:', error);
//     }
//   };

//   const calculatedTotal = formData.rate * formData.quantity - (Number(formData.discount) + Number(formData.advance));
//   const calculatedBalance = calculatedTotal - Number(formData.amountGiven);

//   const handlePrint = () => {
//     const printContents = printRef.current.innerHTML;
//     const printWindow = window.open('', '_blank');
//     printWindow.document.write(`
//       <html>
//         <head>
//           <title>Customer Bill</title>
//           <style>
//             body { font-family: Arial, sans-serif; padding: 20px; }
//             h2 { text-align: center; }
//             table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//             td, th { border: 1px solid #ccc; padding: 8px; text-align: left; }
//           </style>
//         </head>
//         <body>
//           ${printContents}
//         </body>
//       </html>
//     `);
//     printWindow.document.close();
//     printWindow.print();
//   };

//   return (
//     <div className="p-4">
//       <h2 className="text-xl font-bold mb-4">Add Customer Order</h2>

//       <form onSubmit={handleSubmit}>
//         <table className="table-auto w-full mb-4 border">
//           <thead>
//             <tr className="bg-gray-200">
//               <th className="p-2 border">Date</th>
//               <th className="p-2 border">Customer Name</th>
//               <th className="p-2 border">Address</th>
//               <th className="p-2 border">Phone</th>
//               <th className="p-2 border">Item Name</th>
//               <th className="p-2 border">Item Description</th>
//               <th className="p-2 border">Rate</th>
//               <th className="p-2 border">Quantity</th>
//               <th className="p-2 border">Discount</th>
//               <th className="p-2 border">Advance</th>
//               <th className="p-2 border">Amount Given</th>
//               <th className="p-2 border">Total Amount</th>
//               <th className="p-2 border">Balance</th>
//             </tr>
//           </thead>
//           <tbody>
//             <tr>
//               <td className="p-2 border"><input type="date" name="orderDate" value={formData.orderDate} onChange={handleChange} required className="border p-1" /></td>
//               <td className="p-2 border"><input name="customerName" value={formData.customerName} onChange={handleChange} required className="border p-1" /></td>
//               <td className="p-2 border"><input name="address" value={formData.address} onChange={handleChange} className="border p-1" /></td>
//               <td className="p-2 border"><input name="number" value={formData.number} onChange={handleChange} className="border p-1" /></td>
//               <td className="p-2 border">
//                 <input list="productNames" name="itemName" value={formData.itemName} onChange={handleChange} className="border p-1" />
//                 <datalist id="productNames">
//                   {Array.from(new Set(products.map(p => p.itemName))).map((name, i) => (
//                     <option key={i} value={name} />
//                   ))}
//                 </datalist>
//               </td>
//               <td className="p-2 border">
//                 <input list="productDescriptions" name="itemDescription" value={formData.itemDescription} onChange={handleChange} className="border p-1" />
//                 <datalist id="productDescriptions">
//                   {products
//                     .filter(p => p.itemName === formData.itemName)
//                     .map((p, i) => <option key={i} value={p.itemDescription} />)}
//                 </datalist>
//               </td>
//               <td className="p-2 border"><input name="rate" type="number" value={formData.rate} readOnly className="border p-1 bg-gray-100" /></td>
//               <td className="p-2 border"><input name="quantity" type="number" value={formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))} className="border p-1" /></td>
//               <td className="p-2 border"><input name="discount" type="number" value={formData.discount} onChange={(e) => setFormData(prev => ({ ...prev, discount: Number(e.target.value) }))} className="border p-1" /></td>
//               <td className="p-2 border"><input name="advance" type="number" value={formData.advance} onChange={(e) => setFormData(prev => ({ ...prev, advance: Number(e.target.value) }))} className="border p-1" /></td>
//               <td className="p-2 border"><input name="amountGiven" type="number" value={formData.amountGiven} onChange={(e) => setFormData(prev => ({ ...prev, amountGiven: Number(e.target.value) }))} className="border p-1" /></td>
//               <td className="p-2 border bg-gray-100">{calculatedTotal || 0}</td>
//               <td className="p-2 border bg-gray-100">{calculatedBalance || 0}</td>
//             </tr>
//           </tbody>
//         </table>
//         <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add Order</button>
//       </form>

//       <div className="mt-8" ref={printRef}>
//         <h2 className="text-center text-xl font-bold">Johnsons Cement Products</h2>
//         <h3 className="text-lg font-semibold mt-4">Customer Bill</h3>
//         <table className="w-full border mt-2">
//           <tbody>
//             <tr><td className="border p-2">Customer Name</td><td className="border p-2">{formData.customerName}</td></tr>
//             <tr><td className="border p-2">Address</td><td className="border p-2">{formData.address}</td></tr>
//             <tr><td className="border p-2">Phone</td><td className="border p-2">{formData.number}</td></tr>
//             <tr><td className="border p-2">Item</td><td className="border p-2">{formData.itemName}</td></tr>
//             <tr><td className="border p-2">Description</td><td className="border p-2">{formData.itemDescription}</td></tr>
//             <tr><td className="border p-2">Rate</td><td className="border p-2">{formData.rate}</td></tr>
//             <tr><td className="border p-2">Quantity</td><td className="border p-2">{formData.quantity}</td></tr>
//             <tr><td className="border p-2">Discount</td><td className="border p-2">{formData.discount}</td></tr>
//             <tr><td className="border p-2">Advance</td><td className="border p-2">{formData.advance}</td></tr>
//             <tr><td className="border p-2">Amount Given</td><td className="border p-2">{formData.amountGiven}</td></tr>
//             <tr><td className="border p-2 font-bold">Total Amount</td><td className="border p-2 font-bold">{calculatedTotal}</td></tr>
//             <tr><td className="border p-2 font-bold">Balance</td><td className="border p-2 font-bold">{calculatedBalance}</td></tr>
//           </tbody>
//         </table>
//       </div>

//       <button onClick={handlePrint} className="mt-4 bg-green-600 text-white px-4 py-2 rounded">Print Bill</button>

//       <h3 className="text-lg font-semibold mt-6 mb-2">Orders</h3>
//       <table className="min-w-full border">
//         <thead className="bg-gray-200">
//           <tr>
//             <th className="border p-2">Date</th>
//             <th className="border p-2">Customer Name</th>
//             <th className="border p-2">Address</th>
//             <th className="border p-2">Phone</th>
//             <th className="border p-2">Item</th>
//             <th className="border p-2">Description</th>
//             <th className="border p-2">Rate</th>
//             <th className="border p-2">Quantity</th>
//             <th className="border p-2">Discount</th>
//             <th className="border p-2">Advance</th>
//             <th className="border p-2">Amount Given</th>
//             <th className="border p-2">Total</th>
//             <th className="border p-2">Balance</th>
//           </tr>
//         </thead>
//         <tbody>
//           {orders.map((order, idx) => (
//             <tr key={idx}>
//               <td className="border p-2">{order.orderDate}</td>
//               <td className="border p-2">{order.customerName}</td>
//               <td className="border p-2">{order.address}</td>
//               <td className="border p-2">{order.number}</td>
//               <td className="border p-2">{order.itemName}</td>
//               <td className="border p-2">{order.itemDescription}</td>
//               <td className="border p-2">{order.rate}</td>
//               <td className="border p-2">{order.quantity}</td>
//               <td className="border p-2">{order.discount}</td>
//               <td className="border p-2">{order.advance}</td>
//               <td className="border p-2">{order.amountGiven}</td>
//               <td className="border p-2">{order.totalAmount}</td>
//               <td className="border p-2">{order.balance}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default CustomerOrders;






import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

const CustomerOrders = () => {
  const [userId, setUserId] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const printRef = useRef();

  const [formData, setFormData] = useState({
    orderDate: '',
    customerName: '',
    address: '',
    number: '',
    itemName: '',
    itemDescription: '',
    rate: '',
    quantity: '',
    discount: '',
    advance: '',
    amountGiven: ''
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!userId) return;
      const userProductsRef = collection(db, 'users', userId, 'products');
      const snapshot = await getDocs(userProductsRef);
      const data = snapshot.docs.map(doc => doc.data());
      setProducts(data);
    };
    fetchProducts();
  }, [userId]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userId) return;
      const ordersRef = collection(db, 'users', userId, 'customerOrders');
      const snapshot = await getDocs(query(ordersRef, orderBy('timestamp', 'desc')));
      const data = snapshot.docs.map(doc => doc.data());
      setOrders(data);
      setFilteredOrders(data); // initially show all
    };
    fetchOrders();
  }, [userId]);

  useEffect(() => {
    const { itemName, itemDescription } = formData;
    const matchedProduct = products.find(p =>
      p.itemName === itemName && p.itemDescription === itemDescription
    );
    if (matchedProduct) {
      setFormData(prev => ({
        ...prev,
        rate: matchedProduct.rate || 0
      }));
    }
  }, [formData.itemName, formData.itemDescription, products]);

  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!userId) return;

    const { rate, quantity, discount, advance, amountGiven } = formData;
    const totalAmount = rate * quantity - (discount + advance);
    const balance = totalAmount - amountGiven;

    const orderData = {
      ...formData,
      rate: Number(rate),
      quantity: Number(quantity),
      discount: Number(discount),
      advance: Number(advance),
      amountGiven: Number(amountGiven),
      totalAmount,
      balance,
      timestamp: Timestamp.now()
    };

    try {
      const ordersRef = collection(db, 'users', userId, 'customerOrders');
      await addDoc(ordersRef, orderData);
      setOrders(prev => [...prev, orderData]);
      setFormData({
        orderDate: '',
        customerName: '',
        address: '',
        number: '',
        itemName: '',
        itemDescription: '',
        rate: '',
        quantity: '',
        discount: '',
        advance: '',
        amountGiven: ''
      });
    } catch (error) {
      console.error('Error adding order:', error);
    }
  };

  const calculatedTotal = formData.rate * formData.quantity - (Number(formData.discount) + Number(formData.advance));
  const calculatedBalance = calculatedTotal - Number(formData.amountGiven);

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Customer Bill</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            td, th { border: 1px solid #ccc; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };
  useEffect(() => {
    const now = new Date();

    let filtered = orders;
    if (filterType === 'day') {
      filtered = orders.filter(order => {
        const date = new Date(order.orderDate);
        return (
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });
    } else if (filterType === 'month') {
      filtered = orders.filter(order => {
        const date = new Date(order.orderDate);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });
    } else if (filterType === 'specific' && filterDate) {
      filtered = orders.filter(order => order.orderDate === filterDate);
    }

    setFilteredOrders(filtered);
  }, [filterType, filterDate, orders]);
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Add Customer Order</h2>

      <form onSubmit={handleSubmit}>
        <table className="table-auto w-full mb-4 border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Customer Name</th>
              <th className="p-2 border">Address</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Item Name</th>
              <th className="p-2 border">Item Description</th>
              <th className="p-2 border">Rate</th>
              <th className="p-2 border">Quantity</th>
              <th className="p-2 border">Discount</th>
              <th className="p-2 border">Advance</th>
              <th className="p-2 border">Amount Given</th>
              <th className="p-2 border">Total Amount</th>
              <th className="p-2 border">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border"><input type="date" name="orderDate" value={formData.orderDate} onChange={handleChange} required className="border p-1" /></td>
              <td className="p-2 border"><input name="customerName" value={formData.customerName} onChange={handleChange} required className="border p-1" /></td>
              <td className="p-2 border"><input name="address" value={formData.address} onChange={handleChange} className="border p-1" /></td>
              <td className="p-2 border"><input name="number" value={formData.number} onChange={handleChange} className="border p-1" /></td>
              <td className="p-2 border">
                <input list="productNames" name="itemName" value={formData.itemName} onChange={handleChange} className="border p-1" />
                <datalist id="productNames">
                  {Array.from(new Set(products.map(p => p.itemName))).map((name, i) => (
                    <option key={i} value={name} />
                  ))}
                </datalist>
              </td>
              <td className="p-2 border">
                <input list="productDescriptions" name="itemDescription" value={formData.itemDescription} onChange={handleChange} className="border p-1" />
                <datalist id="productDescriptions">
                  {products
                    .filter(p => p.itemName === formData.itemName)
                    .map((p, i) => <option key={i} value={p.itemDescription} />)}
                </datalist>
              </td>
              <td className="p-2 border"><input name="rate" type="number" value={formData.rate} readOnly className="border p-1 bg-gray-100" /></td>
              <td className="p-2 border"><input name="quantity" type="number" value={formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))} className="border p-1" /></td>
              <td className="p-2 border"><input name="discount" type="number" value={formData.discount} onChange={(e) => setFormData(prev => ({ ...prev, discount: Number(e.target.value) }))} className="border p-1" /></td>
              <td className="p-2 border"><input name="advance" type="number" value={formData.advance} onChange={(e) => setFormData(prev => ({ ...prev, advance: Number(e.target.value) }))} className="border p-1" /></td>
              <td className="p-2 border"><input name="amountGiven" type="number" value={formData.amountGiven} onChange={(e) => setFormData(prev => ({ ...prev, amountGiven: Number(e.target.value) }))} className="border p-1" /></td>
              <td className="p-2 border bg-gray-100">{calculatedTotal || 0}</td>
              <td className="p-2 border bg-gray-100">{calculatedBalance || 0}</td>
            </tr>
          </tbody>
        </table>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add Order</button>
      </form>

      <div className="mt-8" ref={printRef}>
        <h2 className="text-center text-xl font-bold">Johnsons Cement Products</h2>
        <h3 className="text-lg font-semibold mt-4">Customer Bill</h3>
        <table className="w-full border mt-2">
          <tbody>
            <tr><td className="border p-2">Customer Name</td><td className="border p-2">{formData.customerName}</td></tr>
            <tr><td className="border p-2">Address</td><td className="border p-2">{formData.address}</td></tr>
            <tr><td className="border p-2">Phone</td><td className="border p-2">{formData.number}</td></tr>
            <tr><td className="border p-2">Item</td><td className="border p-2">{formData.itemName}</td></tr>
            <tr><td className="border p-2">Description</td><td className="border p-2">{formData.itemDescription}</td></tr>
            <tr><td className="border p-2">Rate</td><td className="border p-2">{formData.rate}</td></tr>
            <tr><td className="border p-2">Quantity</td><td className="border p-2">{formData.quantity}</td></tr>
            <tr><td className="border p-2">Discount</td><td className="border p-2">{formData.discount}</td></tr>
            <tr><td className="border p-2">Advance</td><td className="border p-2">{formData.advance}</td></tr>
            <tr><td className="border p-2">Amount Given</td><td className="border p-2">{formData.amountGiven}</td></tr>
            <tr><td className="border p-2 font-bold">Total Amount</td><td className="border p-2 font-bold">{calculatedTotal}</td></tr>
            <tr><td className="border p-2 font-bold">Balance</td><td className="border p-2 font-bold">{calculatedBalance}</td></tr>
          </tbody>
        </table>
      </div>

      <button onClick={handlePrint} className="mt-4 bg-green-600 text-white px-4 py-2 rounded">Print Bill</button>

      <div className="my-6">
        <label className="mr-2 font-semibold">Filter Orders:</label>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border p-1 mr-2">
          <option value="all">All</option>
          <option value="day">Orders of the Day</option>
          <option value="month">Orders of the Month</option>
          <option value="specific">Search by Specific Date</option>
        </select>
        {filterType === 'specific' && (
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="border p-1"
          />
        )}
      </div>

      {/* Orders Table */}
      <h3 className="text-lg font-semibold mt-6 mb-2">Orders</h3>
      <table className="min-w-full border">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Date</th>
            <th className="border p-2">Customer Name</th>
            <th className="border p-2">Address</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Item</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">Rate</th>
            <th className="border p-2">Quantity</th>
            <th className="border p-2">Discount</th>
            <th className="border p-2">Advance</th>
            <th className="border p-2">Amount Given</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Balance</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((order, idx) => (
            <tr key={idx}>
              <td className="border p-2">{order.orderDate}</td>
              <td className="border p-2">{order.customerName}</td>
              <td className="border p-2">{order.address}</td>
              <td className="border p-2">{order.number}</td>
              <td className="border p-2">{order.itemName}</td>
              <td className="border p-2">{order.itemDescription}</td>
              <td className="border p-2">{order.rate}</td>
              <td className="border p-2">{order.quantity}</td>
              <td className="border p-2">{order.discount}</td>
              <td className="border p-2">{order.advance}</td>
              <td className="border p-2">{order.amountGiven}</td>
              <td className="border p-2">{order.totalAmount}</td>
              <td className="border p-2">{order.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerOrders;

v3


import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

const CustomerOrders = () => {
  const [userId, setUserId] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const printRef = useRef();

  const [formData, setFormData] = useState({
    orderDate: '',
    customerName: '',
    address: '',
    number: '',
    itemName: '',
    itemDescription: '',
    rate: '',
    quantity: '',
    discount: '',
    advance: '',
    amountGiven: ''
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!userId) return;
      const userProductsRef = collection(db, 'users', userId, 'products');
      const snapshot = await getDocs(userProductsRef);
      const data = snapshot.docs.map(doc => doc.data());
      setProducts(data);
    };
    fetchProducts();
  }, [userId]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userId) return;
      const ordersRef = collection(db, 'users', userId, 'customerOrders');
      const snapshot = await getDocs(query(ordersRef, orderBy('timestamp', 'desc')));
      const data = snapshot.docs.map(doc => doc.data());
      setOrders(data);
      setFilteredOrders(data); // initially show all
    };
    fetchOrders();
  }, [userId]);

  useEffect(() => {
    const { itemName, itemDescription } = formData;
    const matchedProduct = products.find(p =>
      p.itemName === itemName && p.itemDescription === itemDescription
    );
    if (matchedProduct) {
      setFormData(prev => ({
        ...prev,
        rate: matchedProduct.rate || 0
      }));
    }
  }, [formData.itemName, formData.itemDescription, products]);

  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!userId) return;

    const { rate, quantity, discount, advance, amountGiven } = formData;
    const totalAmount = rate * quantity - (discount + advance);
    const balance = totalAmount - amountGiven;

    const orderData = {
      ...formData,
      rate: Number(rate),
      quantity: Number(quantity),
      discount: Number(discount),
      advance: Number(advance),
      amountGiven: Number(amountGiven),
      totalAmount,
      balance,
      timestamp: Timestamp.now()
    };

    try {
      const ordersRef = collection(db, 'users', userId, 'customerOrders');
      await addDoc(ordersRef, orderData);
      setOrders(prev => [...prev, orderData]);
      setFormData({
        orderDate: '',
        customerName: '',
        address: '',
        number: '',
        itemName: '',
        itemDescription: '',
        rate: '',
        quantity: '',
        discount: '',
        advance: '',
        amountGiven: ''
      });
    } catch (error) {
      console.error('Error adding order:', error);
    }
  };

  const calculatedTotal = formData.rate * formData.quantity - (Number(formData.discount) + Number(formData.advance));
  const calculatedBalance = calculatedTotal - Number(formData.amountGiven);
  const [searchMonthYear, setSearchMonthYear] = useState('');
  const [searchCustomerName, setSearchCustomerName] = useState('');

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Customer Bill</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            td, th { border: 1px solid #ccc; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };
  useEffect(() => {
    let filtered = [...orders];
  
    if (filterType === 'day') {
      const now = new Date();
      filtered = filtered.filter(order => {
        const date = new Date(order.orderDate);
        return (
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });
    } else if (filterType === 'month') {
      const now = new Date();
      filtered = filtered.filter(order => {
        const date = new Date(order.orderDate);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });
    } else if (filterType === 'specific' && filterDate) {
      filtered = filtered.filter(order => order.orderDate === filterDate);
    }
  
    // Apply month/year search
    if (searchMonthYear) {
      const [year, month] = searchMonthYear.split('-').map(Number);
      filtered = filtered.filter(order => {
        const date = new Date(order.orderDate);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      });
    }
  
    // Apply customer name filter
    if (searchCustomerName.trim()) {
      filtered = filtered.filter(order =>
        order.customerName?.toLowerCase().includes(searchCustomerName)
      );
    }
  
    setFilteredOrders(filtered);
  }, [orders, filterType, filterDate, searchMonthYear, searchCustomerName]);
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Add Customer Order</h2>

      <form onSubmit={handleSubmit}>
        <table className="table-auto w-full mb-4 border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Customer Name</th>
              <th className="p-2 border">Address</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Item Name</th>
              <th className="p-2 border">Item Description</th>
              <th className="p-2 border">Rate</th>
              <th className="p-2 border">Quantity</th>
              <th className="p-2 border">Discount</th>
              <th className="p-2 border">Advance</th>
              <th className="p-2 border">Amount Given</th>
              <th className="p-2 border">Total Amount</th>
              <th className="p-2 border">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border"><input type="date" name="orderDate" value={formData.orderDate} onChange={handleChange} required className="border p-1" /></td>
              <td className="p-2 border"><input name="customerName" value={formData.customerName} onChange={handleChange} required className="border p-1" /></td>
              <td className="p-2 border"><input name="address" value={formData.address} onChange={handleChange} className="border p-1" /></td>
              <td className="p-2 border"><input name="number" value={formData.number} onChange={handleChange} className="border p-1" /></td>
              <td className="p-2 border">
                <input list="productNames" name="itemName" value={formData.itemName} onChange={handleChange} className="border p-1" />
                <datalist id="productNames">
                  {Array.from(new Set(products.map(p => p.itemName))).map((name, i) => (
                    <option key={i} value={name} />
                  ))}
                </datalist>
              </td>
              <td className="p-2 border">
                <input list="productDescriptions" name="itemDescription" value={formData.itemDescription} onChange={handleChange} className="border p-1" />
                <datalist id="productDescriptions">
                  {products
                    .filter(p => p.itemName === formData.itemName)
                    .map((p, i) => <option key={i} value={p.itemDescription} />)}
                </datalist>
              </td>
              <td className="p-2 border"><input name="rate" type="number" value={formData.rate} readOnly className="border p-1 bg-gray-100" /></td>
              <td className="p-2 border"><input name="quantity" type="number" value={formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))} className="border p-1" /></td>
              <td className="p-2 border"><input name="discount" type="number" value={formData.discount} onChange={(e) => setFormData(prev => ({ ...prev, discount: Number(e.target.value) }))} className="border p-1" /></td>
              <td className="p-2 border"><input name="advance" type="number" value={formData.advance} onChange={(e) => setFormData(prev => ({ ...prev, advance: Number(e.target.value) }))} className="border p-1" /></td>
              <td className="p-2 border"><input name="amountGiven" type="number" value={formData.amountGiven} onChange={(e) => setFormData(prev => ({ ...prev, amountGiven: Number(e.target.value) }))} className="border p-1" /></td>
              <td className="p-2 border bg-gray-100">{calculatedTotal || 0}</td>
              <td className="p-2 border bg-gray-100">{calculatedBalance || 0}</td>
            </tr>
          </tbody>
        </table>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add Order</button>
      </form>

      <div className="mt-8" ref={printRef}>
        <h2 className="text-center text-xl font-bold">Johnsons Cement Products</h2>
        <h3 className="text-lg font-semibold mt-4">Customer Bill</h3>
        <table className="w-full border mt-2">
          <tbody>
            <tr><td className="border p-2">Customer Name</td><td className="border p-2">{formData.customerName}</td></tr>
            <tr><td className="border p-2">Address</td><td className="border p-2">{formData.address}</td></tr>
            <tr><td className="border p-2">Phone</td><td className="border p-2">{formData.number}</td></tr>
            <tr><td className="border p-2">Item</td><td className="border p-2">{formData.itemName}</td></tr>
            <tr><td className="border p-2">Description</td><td className="border p-2">{formData.itemDescription}</td></tr>
            <tr><td className="border p-2">Rate</td><td className="border p-2">{formData.rate}</td></tr>
            <tr><td className="border p-2">Quantity</td><td className="border p-2">{formData.quantity}</td></tr>
            <tr><td className="border p-2">Discount</td><td className="border p-2">{formData.discount}</td></tr>
            <tr><td className="border p-2">Advance</td><td className="border p-2">{formData.advance}</td></tr>
            <tr><td className="border p-2">Amount Given</td><td className="border p-2">{formData.amountGiven}</td></tr>
            <tr><td className="border p-2 font-bold">Total Amount</td><td className="border p-2 font-bold">{calculatedTotal}</td></tr>
            <tr><td className="border p-2 font-bold">Balance</td><td className="border p-2 font-bold">{calculatedBalance}</td></tr>
          </tbody>
        </table>
      </div>

      <button onClick={handlePrint} className="mt-4 bg-green-600 text-white px-4 py-2 rounded">Print Bill</button>

      <div className="my-6">
        <label className="mr-2 font-semibold">Filter Orders:</label>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border p-1 mr-2">
          <option value="all">All</option>
          <option value="day">Orders of the Day</option>
          <option value="month">Orders of the Month</option>
          <option value="specific">Search by Specific Date</option>
        </select>
        {filterType === 'specific' && (
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="border p-1"
          />
        )}
      </div>
      <div className="my-4 flex flex-wrap gap-4">
        <div>
          <label className="mr-2 font-medium">Filter by Month/Year:</label>
          <input
            type="month"
            value={searchMonthYear}
            onChange={e => setSearchMonthYear(e.target.value)}
            className="border p-1"
          />
        </div>
        <div>
          <label className="mr-2 font-medium">Filter by Customer Name:</label>
          <input
            type="text"
            placeholder="Enter customer name"
            value={searchCustomerName}
            onChange={e => setSearchCustomerName(e.target.value.toLowerCase())}
            className="border p-1"
          />
        </div>
      </div>

      {/* Orders Table */}
      <h3 className="text-lg font-semibold mt-6 mb-2">Orders</h3>
      <table className="min-w-full border">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Date</th>
            <th className="border p-2">Customer Name</th>
            <th className="border p-2">Address</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Item</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">Rate</th>
            <th className="border p-2">Quantity</th>
            <th className="border p-2">Discount</th>
            <th className="border p-2">Advance</th>
            <th className="border p-2">Amount Given</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Balance</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((order, idx) => (
            <tr key={idx}>
              <td className="border p-2">{order.orderDate}</td>
              <td className="border p-2">{order.customerName}</td>
              <td className="border p-2">{order.address}</td>
              <td className="border p-2">{order.number}</td>
              <td className="border p-2">{order.itemName}</td>
              <td className="border p-2">{order.itemDescription}</td>
              <td className="border p-2">{order.rate}</td>
              <td className="border p-2">{order.quantity}</td>
              <td className="border p-2">{order.discount}</td>
              <td className="border p-2">{order.advance}</td>
              <td className="border p-2">{order.amountGiven}</td>
              <td className="border p-2">{order.totalAmount}</td>
              <td className="border p-2">{order.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerOrders;



v4 



import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, writeBatch, doc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
// Removed Material-UI import - using HTML/Tailwind instead

const CustomerOrders = () => {
  const [userId, setUserId] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [totalBalance, setTotalBalance] = useState(0);
  const printRef = useRef();

  const [formData, setFormData] = useState({
    orderDate: '',
    customerName: '',
    address: '',
    number: '',
    itemName: '',
    itemDescription: '',
    rate: '',
    quantity: '',
    discount: '',
    advance: '',
    amountGiven: ''
  });

  // Filter states
  const [searchMonthYear, setSearchMonthYear] = useState('');
  const [searchCustomerName, setSearchCustomerName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!userId) return;
      const userProductsRef = collection(db, 'users', userId, 'products');
      const snapshot = await getDocs(userProductsRef);
      const data = snapshot.docs.map(doc => doc.data());
      setProducts(data);
    };
    fetchProducts();
  }, [userId]);

  // Extract fetchOrders as a separate function
  const fetchOrders = async () => {
    if (!userId) return;
    const ordersRef = collection(db, 'users', userId, 'customerOrders');
    const snapshot = await getDocs(query(ordersRef, orderBy('timestamp', 'desc')));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Include document ID
    setOrders(data);
    setFilteredOrders(data);
  };

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  useEffect(() => {
    const { itemName, itemDescription } = formData;
    const matchedProduct = products.find(p =>
      p.itemName === itemName && p.itemDescription === itemDescription
    );
    if (matchedProduct) {
      setFormData(prev => ({
        ...prev,
        rate: matchedProduct.rate || 0
      }));
    }
  }, [formData.itemName, formData.itemDescription, products]);

  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!userId) return;

    const { rate, quantity, discount, advance, amountGiven } = formData;
    const totalAmount = rate * quantity - (discount + advance);
    const balance = totalAmount - amountGiven;

    const orderData = {
      ...formData,
      rate: Number(rate),
      quantity: Number(quantity),
      discount: Number(discount),
      advance: Number(advance),
      amountGiven: Number(amountGiven),
      totalAmount,
      balance,
      timestamp: Timestamp.now()
    };

    try {
      const ordersRef = collection(db, 'users', userId, 'customerOrders');
      await addDoc(ordersRef, orderData);
      
      // Refresh orders after adding
      fetchOrders();
      
      setFormData({
        orderDate: '',
        customerName: '',
        address: '',
        number: '',
        itemName: '',
        itemDescription: '',
        rate: '',
        quantity: '',
        discount: '',
        advance: '',
        amountGiven: ''
      });
    } catch (error) {
      console.error('Error adding order:', error);
    }
  };

  const calculatedTotal = formData.rate * formData.quantity - (Number(formData.discount) + Number(formData.advance));
  const calculatedBalance = calculatedTotal - Number(formData.amountGiven);

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Customer Bill</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            td, th { border: 1px solid #ccc; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  useEffect(() => {
    let filtered = [...orders];
  
    if (filterType === 'day') {
      const now = new Date();
      filtered = filtered.filter(order => {
        const date = new Date(order.orderDate);
        return (
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });
    } else if (filterType === 'month') {
      const now = new Date();
      filtered = filtered.filter(order => {
        const date = new Date(order.orderDate);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });
    } else if (filterType === 'specific' && filterDate) {
      filtered = filtered.filter(order => order.orderDate === filterDate);
    }
  
    // Apply month/year search
    if (searchMonthYear) {
      const [year, month] = searchMonthYear.split('-').map(Number);
      filtered = filtered.filter(order => {
        const date = new Date(order.orderDate);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      });
    }
  
    // Apply customer name filter
    if (searchCustomerName.trim()) {
      filtered = filtered.filter(order =>
        order.customerName?.toLowerCase().includes(searchCustomerName)
      );
    }

    setFilteredOrders(filtered);
    
    // Calculate total balance for filtered orders
    const calculatedTotalBalance = filtered.reduce((acc, order) => acc + parseFloat(order.balance || 0), 0);
    setTotalBalance(calculatedTotalBalance);
  }, [orders, filterType, filterDate, searchMonthYear, searchCustomerName]);

  const handlePayment = async () => {
    if (!paymentAmount || !paymentDate) {
      alert("Please enter both payment amount and date.");
      return;
    }

    let remaining = parseFloat(paymentAmount);
    const updatedOrders = [...filteredOrders].sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));
  
    const batch = writeBatch(db);
    for (const order of updatedOrders) {
      if (remaining <= 0) break;
  
      const orderRef = doc(db, 'users', userId, 'customerOrders', order.id);
      const currentBalance = parseFloat(order.balance || 0);
      const deduction = Math.min(currentBalance, remaining);
      const newBalance = (currentBalance - deduction).toFixed(2);
  
      batch.update(orderRef, { balance: parseFloat(newBalance) });
  
      remaining -= deduction;
    }
  
    try {
      await batch.commit();
      alert("Payment processed successfully.");
      setPaymentAmount('');
      setPaymentDate('');
      fetchOrders(); // reload data
    } catch (error) {
      console.error('Error processing payment:', error);
      alert("Error processing payment. Please try again.");
    }
  };
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Add Customer Order</h2>

      <form onSubmit={handleSubmit}>
        <table className="table-auto w-full mb-4 border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Customer Name</th>
              <th className="p-2 border">Address</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Item Name</th>
              <th className="p-2 border">Item Description</th>
              <th className="p-2 border">Rate</th>
              <th className="p-2 border">Quantity</th>
              <th className="p-2 border">Discount</th>
              <th className="p-2 border">Advance</th>
              <th className="p-2 border">Amount Given</th>
              <th className="p-2 border">Total Amount</th>
              <th className="p-2 border">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border"><input type="date" name="orderDate" value={formData.orderDate} onChange={handleChange} required className="border p-1" /></td>
              <td className="p-2 border"><input name="customerName" value={formData.customerName} onChange={handleChange} required className="border p-1" /></td>
              <td className="p-2 border"><input name="address" value={formData.address} onChange={handleChange} className="border p-1" /></td>
              <td className="p-2 border"><input name="number" value={formData.number} onChange={handleChange} className="border p-1" /></td>
              <td className="p-2 border">
                <input list="productNames" name="itemName" value={formData.itemName} onChange={handleChange} className="border p-1" />
                <datalist id="productNames">
                  {Array.from(new Set(products.map(p => p.itemName))).map((name, i) => (
                    <option key={i} value={name} />
                  ))}
                </datalist>
              </td>
              <td className="p-2 border">
                <input list="productDescriptions" name="itemDescription" value={formData.itemDescription} onChange={handleChange} className="border p-1" />
                <datalist id="productDescriptions">
                  {products
                    .filter(p => p.itemName === formData.itemName)
                    .map((p, i) => <option key={i} value={p.itemDescription} />)}
                </datalist>
              </td>
              <td className="p-2 border"><input name="rate" type="number" value={formData.rate} readOnly className="border p-1 bg-gray-100" /></td>
              <td className="p-2 border"><input name="quantity" type="number" value={formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))} className="border p-1" /></td>
              <td className="p-2 border"><input name="discount" type="number" value={formData.discount} onChange={(e) => setFormData(prev => ({ ...prev, discount: Number(e.target.value) }))} className="border p-1" /></td>
              <td className="p-2 border"><input name="advance" type="number" value={formData.advance} onChange={(e) => setFormData(prev => ({ ...prev, advance: Number(e.target.value) }))} className="border p-1" /></td>
              <td className="p-2 border"><input name="amountGiven" type="number" value={formData.amountGiven} onChange={(e) => setFormData(prev => ({ ...prev, amountGiven: Number(e.target.value) }))} className="border p-1" /></td>
              <td className="p-2 border bg-gray-100">{calculatedTotal || 0}</td>
              <td className="p-2 border bg-gray-100">{calculatedBalance || 0}</td>
            </tr>
          </tbody>
        </table>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add Order</button>
      </form>

      <div className="mt-8" ref={printRef}>
        <h2 className="text-center text-xl font-bold">Johnsons Cement Products</h2>
        <h3 className="text-lg font-semibold mt-4">Customer Bill</h3>
        <table className="w-full border mt-2">
          <tbody>
            <tr><td className="border p-2">Customer Name</td><td className="border p-2">{formData.customerName}</td></tr>
            <tr><td className="border p-2">Address</td><td className="border p-2">{formData.address}</td></tr>
            <tr><td className="border p-2">Phone</td><td className="border p-2">{formData.number}</td></tr>
            <tr><td className="border p-2">Item</td><td className="border p-2">{formData.itemName}</td></tr>
            <tr><td className="border p-2">Description</td><td className="border p-2">{formData.itemDescription}</td></tr>
            <tr><td className="border p-2">Rate</td><td className="border p-2">{formData.rate}</td></tr>
            <tr><td className="border p-2">Quantity</td><td className="border p-2">{formData.quantity}</td></tr>
            <tr><td className="border p-2">Discount</td><td className="border p-2">{formData.discount}</td></tr>
            <tr><td className="border p-2">Advance</td><td className="border p-2">{formData.advance}</td></tr>
            <tr><td className="border p-2">Amount Given</td><td className="border p-2">{formData.amountGiven}</td></tr>
            <tr><td className="border p-2 font-bold">Total Amount</td><td className="border p-2 font-bold">{calculatedTotal}</td></tr>
            <tr><td className="border p-2 font-bold">Balance</td><td className="border p-2 font-bold">{calculatedBalance}</td></tr>
          </tbody>
        </table>
      </div>

      <button onClick={handlePrint} className="mt-4 bg-green-600 text-white px-4 py-2 rounded">Print Bill</button>

      <div className="my-6">
        <label className="mr-2 font-semibold">Filter Orders:</label>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border p-1 mr-2">
          <option value="all">All</option>
          <option value="day">Orders of the Day</option>
          <option value="month">Orders of the Month</option>
          <option value="specific">Search by Specific Date</option>
        </select>
        {filterType === 'specific' && (
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="border p-1"
          />
        )}
      </div>
      
      <div className="my-4 flex flex-wrap gap-4">
        <div>
          <label className="mr-2 font-medium">Filter by Month/Year:</label>
          <input
            type="month"
            value={searchMonthYear}
            onChange={e => setSearchMonthYear(e.target.value)}
            className="border p-1"
          />
        </div>
        <div>
          <label className="mr-2 font-medium">Filter by Customer Name:</label>
          <input
            type="text"
            placeholder="Enter customer name"
            value={searchCustomerName}
            onChange={e => setSearchCustomerName(e.target.value.toLowerCase())}
            className="border p-1"
          />
        </div>
      </div>

      {/* Orders Table */}
      <h3 className="text-lg font-semibold mt-6 mb-2">Orders</h3>
      <table className="min-w-full border">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Date</th>
            <th className="border p-2">Customer Name</th>
            <th className="border p-2">Address</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Item</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">Rate</th>
            <th className="border p-2">Quantity</th>
            <th className="border p-2">Discount</th>
            <th className="border p-2">Advance</th>
            <th className="border p-2">Amount Given</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Balance</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((order, idx) => (
            <tr key={idx}>
              <td className="border p-2">{order.orderDate}</td>
              <td className="border p-2">{order.customerName}</td>
              <td className="border p-2">{order.address}</td>
              <td className="border p-2">{order.number}</td>
              <td className="border p-2">{order.itemName}</td>
              <td className="border p-2">{order.itemDescription}</td>
              <td className="border p-2">{order.rate}</td>
              <td className="border p-2">{order.quantity}</td>
              <td className="border p-2">{order.discount}</td>
              <td className="border p-2">{order.advance}</td>
              <td className="border p-2">{order.amountGiven}</td>
              <td className="border p-2">{order.totalAmount}</td>
              <td className="border p-2">{order.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-4">
        <h3 className="text-lg font-semibold">
          Total Balance: ₹{totalBalance.toFixed(2)}
        </h3>
      </div>

      {searchCustomerName && filteredOrders.length > 0 && (
        <div className="mt-4 p-4 border border-gray-300 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            Make a Payment for {searchCustomerName}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Payment Amount</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter payment amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <button 
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
                onClick={handlePayment}
              >
                Submit Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;