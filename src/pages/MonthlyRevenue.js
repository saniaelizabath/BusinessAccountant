import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Package, Calendar, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import dayjs from 'dayjs';

function MonthlyRevenue() {
  const [userId, setUserId] = useState(null);
  const [monthlyData, setMonthlyData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('overview');

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '40px',
    },
    contentWrapper: {
      maxWidth: '1400px',
      margin: '0 auto',
    },
    header: {
      marginBottom: '40px',
    },
    title: {
      fontSize: '2.2rem',
      marginBottom: '10px',
      color: '#2563eb',
      fontWeight: '600',
    },
    subtitle: {
      color: '#64748b',
      fontSize: '1.1rem',
    },
    navTabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '24px',
      padding: '8px',
      background: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    tab: {
      padding: '12px 20px',
      borderRadius: '8px',
      fontSize: '0.95rem',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    activeTab: {
      backgroundColor: '#2563eb',
      color: 'white',
    },
    inactiveTab: {
      color: '#64748b',
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: '#f1f5f9',
      },
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    statCard: {
      background: '#ffffff',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    statTitle: {
      color: '#64748b',
      fontSize: '0.95rem',
      fontWeight: '500',
    },
    statValue: {
      fontSize: '1.8rem',
      fontWeight: '600',
      color: '#0f172a',
    },
    statTrend: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '0.9rem',
      fontWeight: '500',
    },
    trendPositive: {
      color: '#059669',
    },
    trendNegative: {
      color: '#dc2626',
    },
    chartContainer: {
      background: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '30px',
    },
    chartTitle: {
      fontSize: '1.2rem',
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: '20px',
    },
    summaryFooter: {
      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      borderRadius: '12px',
      padding: '30px',
      color: 'white',
      marginTop: '40px',
    },
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '30px',
      textAlign: 'center',
    },
    summaryLabel: {
      color: '#93c5fd',
      fontSize: '0.95rem',
      marginBottom: '8px',
    },
    summaryValue: {
      fontSize: '1.8rem',
      fontWeight: '600',
    },
    loadingContainer: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      background: '#f8fafc',
    },
    spinner: {
      width: '48px',
      height: '48px',
      border: '4px solid #2563eb',
      borderTop: '4px solid transparent',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    errorContainer: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px',
      background: '#f8fafc',
    },
    errorMessage: {
      color: '#dc2626',
      fontSize: '1.2rem',
      marginBottom: '16px',
    },
    retryButton: {
      padding: '12px 24px',
      backgroundColor: '#2563eb',
      color: 'white',
      borderRadius: '8px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      '&:hover': {
        backgroundColor: '#1d4ed8',
      },
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0',
    },
    tableHeader: {
      background: '#f8fafc',
      color: '#4b5563',
      padding: '16px',
      fontSize: '0.95rem',
      fontWeight: '600',
      textAlign: 'left',
      borderBottom: '2px solid #e5e7eb',
    },
    tableCell: {
      padding: '16px',
      borderBottom: '1px solid #e5e7eb',
      color: '#0f172a',
      fontSize: '0.95rem',
    },
    positiveValue: {
      color: '#059669',
      fontWeight: '500',
    },
    negativeValue: {
      color: '#dc2626',
      fontWeight: '500',
    },
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        await calculateMonthlyRevenue(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const calculateMonthlyRevenue = async (uid) => {
    try {
      setLoading(true);
      setError(null);

      const [ordersSnap, materialsSnap, employeesSnap] = await Promise.all([
        getDocs(collection(db, 'users', uid, 'customerOrders')),
        getDocs(collection(db, 'users', uid, 'raw_material_purchases')),
        getDocs(collection(db, 'users', uid, 'employees'))
      ]);

      const data = {};

      const ensureMonthExists = (month) => {
        if (!data[month]) {
          data[month] = { income: 0, materials: 0, wages: 0 };
        }
      };

      // Aggregate Orders (Income)
      ordersSnap.forEach(doc => {
        const orderData = doc.data();
        const totalAmount = orderData.totalAmount || orderData.total || orderData.amount || orderData.totalPrice || 0;
        const date = orderData.date || orderData.createdAt || orderData.orderDate || orderData.timestamp;
        
        if (!date) return;
        
        try {
          let dateObj;
          if (date.toDate && typeof date.toDate === 'function') {
            dateObj = date.toDate();
          } else if (date instanceof Date) {
            dateObj = date;
          } else if (typeof date === 'string') {
            dateObj = new Date(date);
          } else {
            return;
          }
          
          const month = dayjs(dateObj).format('YYYY-MM');
          ensureMonthExists(month);
          data[month].income += Number(totalAmount) || 0;
        } catch (dateError) {
          console.warn('Invalid date in order:', doc.id, dateError);
        }
      });

      // Aggregate Raw Material Expenses
      materialsSnap.forEach(doc => {
        const materialData = doc.data();
        const price = Number(materialData.price) || 0;
        const date = materialData.date || materialData.purchaseDate || materialData.createdAt;
        
        if (!date) return;
        
        try {
          let dateObj;
          if (date.toDate && typeof date.toDate === 'function') {
            dateObj = date.toDate();
          } else if (date instanceof Date) {
            dateObj = date;
          } else if (typeof date === 'string') {
            dateObj = new Date(date);
          } else {
            return;
          }
          
          const month = dayjs(dateObj).format('YYYY-MM');
          ensureMonthExists(month);
          data[month].materials += price;
        } catch (dateError) {
          console.warn('Invalid date in material purchase:', doc.id, dateError);
        }
      });

      // Aggregate Employee Wages by month
      employeesSnap.forEach(doc => {
        const wageData = doc.data();
        const wage = Number(wageData.wage) || Number(wageData.amount) || Number(wageData.salary) || 0;
        const date = wageData.date || wageData.paymentDate || wageData.paidDate;
        
        if (!date) return;
        
        try {
          let dateObj;
          if (date.toDate && typeof date.toDate === 'function') {
            dateObj = date.toDate();
          } else if (date instanceof Date) {
            dateObj = date;
          } else if (typeof date === 'string') {
            dateObj = new Date(date);
          } else {
            return;
          }
          
          const month = dayjs(dateObj).format('YYYY-MM');
          ensureMonthExists(month);
          data[month].wages += wage;
        } catch (dateError) {
          console.warn('Invalid date in wage record:', doc.id, dateError);
        }
      });

      setMonthlyData(data);
    } catch (err) {
      console.error('Error calculating monthly revenue:', err);
      setError('Failed to calculate monthly revenue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics data
  const getAnalyticsData = () => {
    const sortedMonths = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b));
    
    const chartData = sortedMonths.map(([month, { income, materials, wages }]) => ({
      month: dayjs(month).format('MMM YYYY'),
      income,
      materials,
      wages,
      revenue: income - materials - wages,
      profit_margin: income > 0 ? ((income - materials - wages) / income * 100) : 0
    }));

    const totals = sortedMonths.reduce(
      (acc, [_, { income, materials, wages }]) => ({
        income: acc.income + income,
        materials: acc.materials + materials,
        wages: acc.wages + wages,
      }),
      { income: 0, materials: 0, wages: 0 }
    );

    const totalRevenue = totals.income - totals.materials - totals.wages;
    const avgMonthlyRevenue = chartData.length > 0 ? totalRevenue / chartData.length : 0;
    const bestMonth = chartData.reduce((best, current) => 
      current.revenue > (best?.revenue || -Infinity) ? current : best, null);
    const worstMonth = chartData.reduce((worst, current) => 
      current.revenue < (worst?.revenue || Infinity) ? current : worst, null);

    // Expense breakdown for pie chart
    const expenseData = [
      { name: 'Materials', value: totals.materials, color: '#ef4444' },
      { name: 'Wages', value: totals.wages, color: '#f59e0b' },
    ];

    // Growth analysis
    const growthData = chartData.map((item, index) => {
      if (index === 0) return { ...item, growth: 0 };
      const prevRevenue = chartData[index - 1].revenue;
      const growth = prevRevenue !== 0 ? ((item.revenue - prevRevenue) / Math.abs(prevRevenue)) * 100 : 0;
      return { ...item, growth };
    });

    return {
      chartData,
      totals,
      totalRevenue,
      avgMonthlyRevenue,
      bestMonth,
      worstMonth,
      expenseData,
      growthData,
      profitMargin: totals.income > 0 ? (totalRevenue / totals.income * 100) : 0
    };
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ color: '#64748b' }}>Loading revenue analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorMessage}>{error}</div>
        <button 
          onClick={() => userId && calculateMonthlyRevenue(userId)}
          style={styles.retryButton}
        >
          Retry
        </button>
      </div>
    );
  }

  const analytics = getAnalyticsData();

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Revenue Analytics</h1>
          <p style={styles.subtitle}>Comprehensive financial analysis and insights</p>
        </div>

        {/* Navigation Tabs */}
        <nav style={styles.navTabs}>
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
            { id: 'breakdown', label: 'Breakdown', icon: PieChartIcon },
            { id: 'table', label: 'Detailed Table', icon: Calendar }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              style={{
                ...styles.tab,
                ...(activeView === id ? styles.activeTab : styles.inactiveTab)
              }}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </nav>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statTitle}>Total Revenue</div>
            <div style={styles.statValue}>₹{analytics.totalRevenue.toFixed(2)}</div>
            <div style={{
              ...styles.statTrend,
              ...(analytics.totalRevenue >= 0 ? styles.trendPositive : styles.trendNegative)
            }}>
              {analytics.totalRevenue >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{Math.abs(analytics.profitMargin).toFixed(1)}% margin</span>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statTitle}>Total Income</div>
            <div style={styles.statValue}>₹{analytics.totals.income.toFixed(2)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statTitle}>Total Expenses</div>
            <div style={styles.statValue}>₹{(analytics.totals.materials + analytics.totals.wages).toFixed(2)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statTitle}>Average Monthly Revenue</div>
            <div style={styles.statValue}>₹{analytics.avgMonthlyRevenue.toFixed(2)}</div>
          </div>
        </div>

        {/* Content based on active view */}
        {activeView === 'overview' && (
          <div>
            {/* Revenue Trend Chart */}
            <div style={styles.chartContainer}>
              <h3 style={styles.chartTitle}>Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analytics.chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toFixed(2)}`, '']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2563eb" 
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Best and Worst Performance */}
            <div style={styles.statsGrid}>
              <div style={styles.chartContainer}>
                <h3 style={styles.chartTitle}>Best Performing Month</h3>
                {analytics.bestMonth && (
                  <>
                    <div style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px' }}>
                      {analytics.bestMonth.month}
                    </div>
                    <div style={styles.positiveValue}>
                      ₹{analytics.bestMonth.revenue.toFixed(2)}
                    </div>
                    <div style={{ color: '#64748b', marginTop: '8px' }}>
                      Profit Margin: {analytics.bestMonth.profit_margin.toFixed(1)}%
                    </div>
                  </>
                )}
              </div>
              <div style={styles.chartContainer}>
                <h3 style={styles.chartTitle}>Needs Improvement</h3>
                {analytics.worstMonth && (
                  <>
                    <div style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px' }}>
                      {analytics.worstMonth.month}
                    </div>
                    <div style={styles.negativeValue}>
                      ₹{analytics.worstMonth.revenue.toFixed(2)}
                    </div>
                    <div style={{ color: '#64748b', marginTop: '8px' }}>
                      Profit Margin: {analytics.worstMonth.profit_margin.toFixed(1)}%
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'trends' && (
          <div>
            {/* Income vs Expenses */}
            <div style={styles.chartContainer}>
              <h3 style={styles.chartTitle}>Income vs Expenses Trend</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toFixed(2)}`, '']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#059669" 
                    strokeWidth={3}
                    dot={{ fill: '#059669' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="materials" 
                    stroke="#dc2626" 
                    strokeWidth={2}
                    dot={{ fill: '#dc2626' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="wages" 
                    stroke="#eab308" 
                    strokeWidth={2}
                    dot={{ fill: '#eab308' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Growth Rate */}
            <div style={styles.chartContainer}>
              <h3 style={styles.chartTitle}>Month-over-Month Growth Rate</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    formatter={(value) => [`${value.toFixed(1)}%`, 'Growth']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="growth">
                    {analytics.growthData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={entry.growth >= 0 ? '#059669' : '#dc2626'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeView === 'breakdown' && (
          <div style={styles.statsGrid}>
            {/* Expense Breakdown */}
            <div style={styles.chartContainer}>
              <h3 style={styles.chartTitle}>Expense Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.expenseData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`₹${value.toFixed(2)}`, '']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Comparison */}
            <div style={styles.chartContainer}>
              <h3 style={styles.chartTitle}>Monthly Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toFixed(2)}`, '']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#059669" />
                  <Bar dataKey="materials" fill="#dc2626" />
                  <Bar dataKey="wages" fill="#eab308" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeView === 'table' && (
          <div style={styles.chartContainer}>
            <h3 style={styles.chartTitle}>Detailed Monthly Report</h3>
            {analytics.chartData.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '48px' }}>
                No data available for revenue calculation.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Month</th>
                      <th style={styles.tableHeader}>Income</th>
                      <th style={styles.tableHeader}>Materials</th>
                      <th style={styles.tableHeader}>Wages</th>
                      <th style={styles.tableHeader}>Revenue</th>
                      <th style={styles.tableHeader}>Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.chartData.map((row, index) => (
                      <tr key={index}>
                        <td style={styles.tableCell}>{row.month}</td>
                        <td style={styles.tableCell}>₹{row.income.toFixed(2)}</td>
                        <td style={styles.tableCell}>₹{row.materials.toFixed(2)}</td>
                        <td style={styles.tableCell}>₹{row.wages.toFixed(2)}</td>
                        <td style={{
                          ...styles.tableCell,
                          ...(row.revenue >= 0 ? styles.positiveValue : styles.negativeValue)
                        }}>
                          ₹{row.revenue.toFixed(2)}
                        </td>
                        <td style={{
                          ...styles.tableCell,
                          ...(row.profit_margin >= 0 ? styles.positiveValue : styles.negativeValue)
                        }}>
                          {row.profit_margin.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Summary Footer */}
        <div style={styles.summaryFooter}>
          <div style={styles.summaryGrid}>
            <div>
              <p style={styles.summaryLabel}>Average Monthly Revenue</p>
              <p style={styles.summaryValue}>₹{analytics.avgMonthlyRevenue.toFixed(2)}</p>
            </div>
            <div>
              <p style={styles.summaryLabel}>Total Months</p>
              <p style={styles.summaryValue}>{analytics.chartData.length}</p>
            </div>
            <div>
              <p style={styles.summaryLabel}>Total Income</p>
              <p style={styles.summaryValue}>₹{analytics.totals.income.toFixed(2)}</p>
            </div>
            <div>
              <p style={styles.summaryLabel}>Net Revenue</p>
              <p style={styles.summaryValue}>₹{analytics.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthlyRevenue;