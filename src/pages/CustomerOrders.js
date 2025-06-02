
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, writeBatch, doc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { Typography, Box, Grid, TextField, Button, Card, CardContent, Divider, IconButton, Collapse } from '@mui/material';
import { Print, Visibility, VisibilityOff, Receipt, TableChart, Clear } from '@mui/icons-material';

const CustomerOrders = () => {
  const [userId, setUserId] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [totalBalance, setTotalBalance] = useState(0);
  const [showCustomerBill, setShowCustomerBill] = useState(false);
  const printRef = useRef();
  const recordsPrintRef = useRef();

  const [formData, setFormData] = useState({
    orderDate: '',
    customerName: '',
    address: '',
    number: '',
    discount: '',
    advance: '',
    amountGiven: ''
  });

  const [items, setItems] = useState([{
    itemName: '',
    itemDescription: '',
    rate: '',
    quantity: ''
  }]);
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
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setOrders(data);
  };

  // Fetch payments
  const fetchPayments = async () => {
    if (!userId) return;
    const paymentsRef = collection(db, 'users', userId, 'payments');
    const snapshot = await getDocs(query(paymentsRef, orderBy('timestamp', 'desc')));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPayments(data);
  };

  useEffect(() => {
    fetchOrders();
    fetchPayments();
  }, [userId]);


  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const addItem = () => {
    setItems([...items, { itemName: '', itemDescription: '', rate: '', quantity: '' }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Auto-fill rate when item is selected
    if (field === 'itemName' || field === 'itemDescription') {
      const matchedProduct = products.find(p =>
        p.itemName === newItems[index].itemName && 
        p.itemDescription === newItems[index].itemDescription
      );
      if (matchedProduct && newItems[index].itemName && newItems[index].itemDescription) {
        newItems[index].rate = matchedProduct.rate || 0;
      }
    }
    
    setItems(newItems);
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!userId) return;

    // Validate that at least one item has all required fields
    const validItems = items.filter(item => 
      item.itemName && item.itemDescription && item.rate && item.quantity
    );
    
    if (validItems.length === 0) {
      alert('Please add at least one complete item to the order.');
      return;
    }

    const orderData = {
      ...formData,
      items: validItems.map(item => ({
        ...item,
        rate: Number(item.rate),
        quantity: Number(item.quantity)
      })),
      discount: Number(formData.discount),
      advance: Number(formData.advance),
      amountGiven: Number(formData.amountGiven),
      itemsSubtotal,
      totalAmount: calculatedTotal,
      balance: calculatedBalance,
      timestamp: Timestamp.now()
    };

    try {
      const ordersRef = collection(db, 'users', userId, 'customerOrders');
      await addDoc(ordersRef, orderData);
      
      fetchOrders();
      alert('Order added successfully!');
    } catch (error) {
      console.error('Error adding order:', error);
    }
  };
  // Function to clear customer bill data
  const clearCustomerBill = () => {
    setFormData({
      orderDate: '',
      customerName: '',
      address: '',
      number: '',
      discount: '',
      advance: '',
      amountGiven: ''
    });
    setItems([{
      itemName: '',
      itemDescription: '',
      rate: '',
      quantity: ''
    }]);
  };

  const itemsSubtotal = items.reduce((sum, item) => 
    sum + (Number(item.rate) * Number(item.quantity) || 0), 0
  );
  const calculatedTotal = itemsSubtotal - (Number(formData.discount) + Number(formData.advance));
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

  const handlePrintRecords = () => {
    const printContents = recordsPrintRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Orders & Payment Records</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
            h2, h3 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            td, th { border: 1px solid #333; padding: 6px; text-align: left; font-size: 11px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .order-row { background-color: #f9f9f9; }
            .payment-row { background-color: #e8f5e8; }
            .balance-positive { color: #d32f2f; font-weight: bold; }
            .balance-negative { color: #2e7d32; font-weight: bold; }
            .total-balance { font-size: 14px; font-weight: bold; margin-top: 20px; text-align: center; }
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

  // Filter function for both orders and payments
  useEffect(() => {
    let filteredOrdersData = [...orders];
    let filteredPaymentsData = [...payments];
  
    // Apply date filters
    if (filterType === 'day') {
      const now = new Date();
      filteredOrdersData = filteredOrdersData.filter(order => {
        const date = new Date(order.orderDate);
        return (
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });
      filteredPaymentsData = filteredPaymentsData.filter(payment => {
        const date = new Date(payment.paymentDate);
        return (
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });
    } else if (filterType === 'month') {
      const now = new Date();
      filteredOrdersData = filteredOrdersData.filter(order => {
        const date = new Date(order.orderDate);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });
      filteredPaymentsData = filteredPaymentsData.filter(payment => {
        const date = new Date(payment.paymentDate);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });
    } else if (filterType === 'specific' && filterDate) {
      filteredOrdersData = filteredOrdersData.filter(order => order.orderDate === filterDate);
      filteredPaymentsData = filteredPaymentsData.filter(payment => payment.paymentDate === filterDate);
    }
  
    // Apply month/year search
    if (searchMonthYear) {
      const [year, month] = searchMonthYear.split('-').map(Number);
      filteredOrdersData = filteredOrdersData.filter(order => {
        const date = new Date(order.orderDate);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      });
      filteredPaymentsData = filteredPaymentsData.filter(payment => {
        const date = new Date(payment.paymentDate);
        return date.getFullYear() === year && date.getMonth() + 1 === month;
      });
    }
  
    // Apply customer name filter
    if (searchCustomerName.trim()) {
      filteredOrdersData = filteredOrdersData.filter(order =>
        order.customerName?.toLowerCase().includes(searchCustomerName)
      );
      filteredPaymentsData = filteredPaymentsData.filter(payment =>
        payment.customerName?.toLowerCase().includes(searchCustomerName)
      );
    }

    setFilteredOrders(filteredOrdersData);
    setFilteredPayments(filteredPaymentsData);
    
    // Calculate total balance considering both orders and payments
    const totalOrderBalance = filteredOrdersData.reduce((acc, order) => acc + parseFloat(order.balance || 0), 0);
    const totalPayments = filteredPaymentsData.reduce((acc, payment) => acc + parseFloat(payment.amount || 0), 0);
    const calculatedTotalBalance = totalOrderBalance - totalPayments;
    setTotalBalance(calculatedTotalBalance);
  }, [orders, payments, filterType, filterDate, searchMonthYear, searchCustomerName]);

  const handlePayment = async () => {
    if (!paymentAmount || !paymentDate || !searchCustomerName) {
      alert("Please enter payment amount, date, and make sure a customer is selected.");
      return;
    }

    try {
      // Add payment record
      const paymentData = {
        customerName: searchCustomerName,
        amount: parseFloat(paymentAmount),
        paymentDate: paymentDate,
        timestamp: Timestamp.now()
      };

      const paymentsRef = collection(db, 'users', userId, 'payments');
      await addDoc(paymentsRef, paymentData);

      alert("Payment recorded successfully.");
      setPaymentAmount('');
      setPaymentDate('');
      
      // Refresh data
      fetchPayments();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert("Error recording payment. Please try again.");
    }
  };

  // Combine and sort orders and payments for display
  const combinedData = [
    ...filteredOrders.map(order => ({ 
      ...order, 
      type: 'order',
      date: order.orderDate,
      sortDate: new Date(order.orderDate)
    })),
    ...filteredPayments.map(payment => ({ 
      ...payment, 
      type: 'payment',
      date: payment.paymentDate,
      sortDate: new Date(payment.paymentDate)
    }))
  ].sort((a, b) => b.sortDate - a.sortDate);
  
  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h4" component="h1" sx={{ textAlign: 'center', color: '#1976d2', fontWeight: 'bold', mb: 1 }}>
            Johnsons Cement Products
          </Typography>
          <Typography variant="h6" sx={{ textAlign: 'center', color: '#666' }}>
            Customer Order Management System
          </Typography>
        </CardContent>
      </Card>

      {/* Customer Orders Section - Now always visible */}
      <Card sx={{ mb: 4, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 3, color: '#1976d2', fontWeight: 'bold' }}>
            Add Customer Order
          </Typography>

          <form onSubmit={handleSubmit}>
            <Box sx={{ overflowX: 'auto', mb: 3 }}>
              {/* Customer Info Section */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Customer Information</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Order Date"
                    InputLabelProps={{ shrink: true }}
                    name="orderDate"
                    value={formData.orderDate}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>

              {/* Items Section */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Items</Typography>
              <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', border: '1px solid #ddd', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1976d2', color: 'white' }}>
                    <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>Item Name</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>Item Description</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>Rate</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>Quantity</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>Subtotal</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        <input 
                          list={`productNames-${index}`} 
                          value={item.itemName} 
                          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                          style={{ border: '1px solid #ccc', padding: '8px', width: '100%', borderRadius: '4px' }} 
                        />
                        <datalist id={`productNames-${index}`}>
                          {Array.from(new Set(products.map(p => p.itemName))).map((name, i) => (
                            <option key={i} value={name} />
                          ))}
                        </datalist>
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        <input 
                          list={`productDescriptions-${index}`} 
                          value={item.itemDescription} 
                          onChange={(e) => handleItemChange(index, 'itemDescription', e.target.value)}
                          style={{ border: '1px solid #ccc', padding: '8px', width: '100%', borderRadius: '4px' }} 
                        />
                        <datalist id={`productDescriptions-${index}`}>
                          {products
                            .filter(p => p.itemName === item.itemName)
                            .map((p, i) => <option key={i} value={p.itemDescription} />)}
                        </datalist>
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        <input 
                          type="number" 
                          value={item.rate} 
                          readOnly 
                          style={{ border: '1px solid #ccc', padding: '8px', width: '100%', borderRadius: '4px', backgroundColor: '#f5f5f5' }} 
                        />
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        <input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          style={{ border: '1px solid #ccc', padding: '8px', width: '100%', borderRadius: '4px' }} 
                        />
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f0f0f0', fontWeight: 'bold', textAlign: 'center' }}>
                        {(Number(item.rate) * Number(item.quantity)) || 0}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          size="small"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <Button variant="outlined" color="primary" onClick={addItem}>
                  Add Another Item
                </Button>
                
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary" 
                  sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                >
                  Add Order
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  onClick={clearCustomerBill}
                  startIcon={<Clear />}
                  sx={{ px: 3, py: 1.5 }}
                >
                  Clear Form
                </Button>
              </Box>

              {/* Order Summary */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Order Summary</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Items Subtotal"
                    value={itemsSubtotal}
                    InputProps={{ readOnly: true }}
                    sx={{ backgroundColor: '#f5f5f5' }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Discount"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Advance"
                    name="advance"
                    value={formData.advance}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Amount Given"
                    name="amountGiven"
                    value={formData.amountGiven}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Total Amount"
                    value={calculatedTotal || 0}
                    InputProps={{ readOnly: true }}
                    sx={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Balance"
                    value={calculatedBalance || 0}
                    InputProps={{ 
                      readOnly: true,
                      style: { color: calculatedBalance >= 0 ? '#d32f2f' : '#2e7d32', fontWeight: 'bold' }
                    }}
                    sx={{ backgroundColor: '#f0f0f0' }}
                  />
                </Grid>
              </Grid>
            </Box>
          </form>

          {/* Toggle Customer Bill Button */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={showCustomerBill ? <VisibilityOff /> : <Visibility />}
              onClick={() => setShowCustomerBill(!showCustomerBill)}
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
            >
              {showCustomerBill ? 'Hide Customer Bill' : 'Show Customer Bill'}
            </Button>
          </Box>

          {/* Customer Bill Section - Now toggleable */}
          <Collapse in={showCustomerBill}>
            <Divider sx={{ my: 4 }} />
            <div ref={printRef}>
              <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
                Johnsons Cement Products
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Customer Bill</Typography>
              <table style={{ width: '100%', border: '1px solid #333', marginTop: '8px' }}>
                <tbody>
                  <tr><td style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold' }}>Customer Name</td><td style={{ border: '1px solid #333', padding: '8px' }}>{formData.customerName}</td></tr>
                  <tr><td style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold' }}>Address</td><td style={{ border: '1px solid #333', padding: '8px' }}>{formData.address}</td></tr>
                  <tr><td style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold' }}>Phone</td><td style={{ border: '1px solid #333', padding: '8px' }}>{formData.number}</td></tr>
                  <tr><td style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold' }}>Order Date</td><td style={{ border: '1px solid #333', padding: '8px' }}>{formData.orderDate}</td></tr>
                </tbody>
              </table>  

              <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>Items Ordered:</Typography>
              <table style={{ width: '100%', border: '1px solid #333', marginTop: '8px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold' }}>Item</th>
                    <th style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold' }}>Description</th>
                    <th style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold' }}>Rate</th>
                    <th style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold' }}>Qty</th>
                    <th style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #333', padding: '8px' }}>{item.itemName}</td>
                      <td style={{ border: '1px solid #333', padding: '8px' }}>{item.itemDescription}</td>
                      <td style={{ border: '1px solid #333', padding: '8px' }}>{item.rate}</td>
                      <td style={{ border: '1px solid #333', padding: '8px' }}>{item.quantity}</td>
                      <td style={{ border: '1px solid #333', padding: '8px' }}>{(Number(item.rate) * Number(item.quantity)) || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <table style={{ width: '100%', border: '1px solid #333', marginTop: '16px' }}>
                <tbody>
                  <tr><td style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold' }}>Items Subtotal</td><td style={{ border: '1px solid #333', padding: '8px' }}>{itemsSubtotal}</td></tr>
                  <tr><td style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold' }}>Discount</td><td style={{ border: '1px solid #333', padding: '8px' }}>{formData.discount}</td></tr>
                  <tr><td style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold' }}>Advance</td><td style={{ border: '1px solid #333', padding: '8px' }}>{formData.advance}</td></tr>
                  <tr><td style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold' }}>Amount Given</td><td style={{ border: '1px solid #333', padding: '8px' }}>{formData.amountGiven}</td></tr>
                  <tr><td style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Total Amount</td><td style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>{calculatedTotal}</td></tr>
                  <tr><td style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>Balance</td><td style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>{calculatedBalance}</td></tr>
                </tbody>
              </table>
            </div>

            <Button onClick={handlePrint} variant="contained" color="success" startIcon={<Receipt />} sx={{ mt: 2, px: 4, py: 1.5 }}>
              Print Bill
            </Button>
          </Collapse>
        </CardContent>
      </Card>

      {/* Filters Section */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 'bold' }}>
            Filter Records
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Filter Type:</Typography>
              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)} 
                style={{ border: '1px solid #ccc', padding: '12px', width: '100%', borderRadius: '4px', fontSize: '14px' }}
              >
                <option value="all">All Records</option>
                <option value="day">Today's Records</option>
                <option value="month">This Month's Records</option>
                <option value="specific">Specific Date</option>
              </select>
            </Grid>
            {filterType === 'specific' && (
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Select Date:</Typography>
                <input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  style={{ border: '1px solid #ccc', padding: '12px', width: '100%', borderRadius: '4px', fontSize: '14px' }}
                />
              </Grid>
            )}
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Month/Year Filter:</Typography>
              <input
                type="month"
                value={searchMonthYear}
                onChange={e => setSearchMonthYear(e.target.value)}
                style={{ border: '1px solid #ccc', padding: '12px', width: '100%', borderRadius: '4px', fontSize: '14px' }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Customer Name:</Typography>
              <input
                type="text"
                placeholder="Enter customer name"
                value={searchCustomerName}
                onChange={e => setSearchCustomerName(e.target.value.toLowerCase())}
                style={{ border: '1px solid #ccc', padding: '12px', width: '100%', borderRadius: '4px', fontSize: '14px' }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>


      {/* Orders & Payment Records Section */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              Orders & Payment Records
            </Typography>
            <Button
              onClick={handlePrintRecords}
              variant="contained"
              color="secondary"
              startIcon={<Print />}
              sx={{ px: 3, py: 1.5 }}
            >
              Print Records
            </Button>
          </Box>

          <div ref={recordsPrintRef}>
            <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
              Johnsons Cement Products
            </Typography>
            <Typography variant="h6" sx={{ textAlign: 'center', mb: 3 }}>
              Orders & Payment Records Report
            </Typography>
            
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '1400px', borderCollapse: 'collapse', border: '1px solid #333' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1976d2', color: 'white' }}>
                    <th style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold' }}>Type</th>
                    <th style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold' }}>Date</th>
                    <th style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold' }}>Customer Name</th>
                    <th style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold' }}>Address</th>
                    <th style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold' }}>Phone</th>
                    <th style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold' }}>Item</th>
                    <th style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold' }}>Description</th>
                    <th style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold' }}>Rate</th>
                    <th style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold' }}>Quantity</th>
                    <th style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold' }}>Discount</th>
                    <th style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold' }}>Advance</th>
                    <th style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold' }}>Amount Given</th>
                    <th style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold' }}>Total</th>
                    <th style={{ border: '1px solid #333', padding: '12px', fontWeight: 'bold' }}>Balance/Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {combinedData.map((record, idx) => (
                    <tr key={`${record.type}-${idx}`} className={record.type === 'payment' ? 'payment-row' : 'order-row'}>
                      <td style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold', textAlign: 'center' }}>
                        {record.type === 'order' ? (
                          <span style={{ color: '#1976d2', backgroundColor: '#e3f2fd', padding: '4px 8px', borderRadius: '4px' }}>ORDER</span>
                        ) : (
                          <span style={{ color: '#2e7d32', backgroundColor: '#e8f5e8', padding: '4px 8px', borderRadius: '4px' }}>PAYMENT</span>
                        )}
                      </td>
                      <td style={{ border: '1px solid #333', padding: '8px' }}>{record.date}</td>
                      <td style={{ border: '1px solid #333', padding: '8px', fontWeight: 'bold' }}>{record.customerName}</td>
                      {record.type === 'order' ? (
                        <>
                          <td style={{ border: '1px solid #333', padding: '8px' }}>{record.address}</td>
                          <td style={{ border: '1px solid #333', padding: '8px' }}>{record.number}</td>
                          <td style={{ border: '1px solid #333', padding: '8px' }}>
                            {record.items ? record.items.map((item, idx) => (
                              <div key={idx}>{item.itemName}</div>
                            )) : record.itemName}
                          </td>
                          <td style={{ border: '1px solid #333', padding: '8px' }}>
                            {record.items ? record.items.map((item, idx) => (
                              <div key={idx}>{item.itemDescription}</div>
                            )) : record.itemDescription}
                          </td>
                          <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>
                            {record.items ? record.items.map((item, idx) => (
                              <div key={idx}>{item.rate}</div>
                            )) : record.rate}
                          </td>
                          <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'center' }}>
                            {record.items ? record.items.map((item, idx) => (
                              <div key={idx}>{item.quantity}</div>
                            )) : record.quantity}
                          </td>
                          <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>{record.discount}</td>
                          <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>{record.advance}</td>
                          <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>{record.amountGiven}</td>
                          <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{record.totalAmount}</td>
                          <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right', fontWeight: 'bold' }} className="balance-positive">₹{record.balance}</td>
                        </>
                      ) : (

                        <>
                          <td style={{ border: '1px solid #333', padding: '8px', color: '#999', textAlign: 'center' }}>-</td>
                          <td style={{ border: '1px solid #333', padding: '8px', color: '#999', textAlign: 'center' }}>-</td>
                          <td style={{ border: '1px solid #333', padding: '8px', color: '#999', textAlign: 'center' }}>-</td>
                          <td style={{ border: '1px solid #333', padding: '8px', color: '#999', textAlign: 'center' }}>-</td>
                          <td style={{ border: '1px solid #333', padding: '8px', color: '#999', textAlign: 'center' }}>-</td>
                          <td style={{ border: '1px solid #333', padding: '8px', color: '#999', textAlign: 'center' }}>-</td>
                          <td style={{ border: '1px solid #333', padding: '8px', color: '#999', textAlign: 'center' }}>-</td>
                          <td style={{ border: '1px solid #333', padding: '8px', color: '#999', textAlign: 'center' }}>-</td>
                          <td style={{ border: '1px solid #333', padding: '8px', color: '#999', textAlign: 'center' }}>-</td>
                          <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right', fontWeight: 'bold' }} className="balance-negative">-₹{record.amount}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
            
            <div className="total-balance" style={{ marginTop: '20px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold', padding: '15px', backgroundColor: totalBalance >= 0 ? '#ffebee' : '#e8f5e8', border: `2px solid ${totalBalance >= 0 ? '#f44336' : '#4caf50'}`, borderRadius: '8px' }}>
              Net Balance: ₹{totalBalance.toFixed(2)} {totalBalance < 0 ? '(Overpaid)' : '(Due)'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net Balance Display */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 'bold', 
              color: totalBalance >= 0 ? '#d32f2f' : '#2e7d32',
              backgroundColor: totalBalance >= 0 ? '#ffebee' : '#e8f5e8',
              padding: 2,
              borderRadius: 2,
              border: `2px solid ${totalBalance >= 0 ? '#f44336' : '#4caf50'}`
            }}
          >
            Net Balance: ₹{totalBalance.toFixed(2)} {totalBalance < 0 ? '(Overpaid)' : '(Due)'}
          </Typography>
        </CardContent>
      </Card>

      {/* Payment Recording Section */}
      {searchCustomerName && filteredOrders.length > 0 && (
        <Card sx={{ boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, color: '#1976d2', fontWeight: 'bold' }}>
              Record Payment for: {searchCustomerName.toUpperCase()}
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Payment Amount (₹)"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Payment Date"
                  InputLabelProps={{ shrink: true }}
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button 
                  variant="contained" 
                  color="success" 
                  onClick={handlePayment}
                  fullWidth
                  size="large"
                  sx={{ height: '56px', fontSize: '1.1rem', borderRadius: 2 }}
                >
                  Record Payment
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CustomerOrders;