// chatbotService.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy as firestoreOrderBy, // Renamed to avoid conflict
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db, auth } from '../../firebase';

class ChatbotService {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Database schema definition with exact field types and descriptions
    this.dbSchema = {
      customerOrders: {
        fields: {
          address: { type: 'string', description: 'Customer delivery address' },
          advance: { type: 'number', description: 'Advance payment amount' },
          amountGiven: { type: 'number', description: 'Total amount paid' },
          balance: { type: 'number', description: 'Remaining balance to be paid' },
          customerName: { type: 'string', description: 'Name of the customer' },
          discount: { type: 'number', description: 'Discount amount applied' },
          items: { 
            type: 'array',
            items: {
              type: 'map',
              fields: {
                itemDescription: { type: 'string', description: 'Description of the ordered item' },
                itemName: { type: 'string', description: 'Name of the ordered item' },
                quantity: { type: 'number', description: 'Quantity ordered' },
                rate: { type: 'number', description: 'Price per unit' }
              }
            },
            description: 'List of items in the order'
          },
          itemsSubtotal: { type: 'number', description: 'Subtotal of all items before discount' },
          number: { type: 'string', description: 'Order number/reference' },
          orderDate: { type: 'string', description: 'Date of the order' },
          timestamp: { type: 'timestamp', description: 'Order creation timestamp' },
          totalAmount: { type: 'number', description: 'Total order amount after discount' }
        },
        description: 'Customer orders and billing information',
        keywords: ['order', 'bill', 'invoice', 'purchase', 'customer', 'balance', 'payment', 'amount']
      },
      employees: {
        fields: {
          createdAt: { type: 'timestamp', description: 'Employee record creation date' },
          date: { type: 'timestamp', description: 'Employment date' },
          name: { type: 'string', description: 'Employee name' },
          wage: { type: 'number', description: 'Employee wage amount' }
        },
        description: 'Employee details and wage information',
        keywords: ['employee', 'staff', 'worker', 'wage', 'salary', 'payment']
      },
      products: {
        fields: {
          createdAt: { type: 'timestamp', description: 'Product creation timestamp' },
          itemDescription: { type: 'string', description: 'Product description' },
          itemName: { type: 'string', description: 'Product name' },
          rate: { type: 'string', description: 'Product price/rate' }
        },
        description: 'Product catalog with descriptions and rates',
        keywords: ['product', 'item', 'catalog', 'price', 'rate']
      },
      raw_material_purchases: {
        fields: {
          date: { type: 'timestamp', description: 'Purchase date' },
          material: { type: 'string', description: 'Raw material name' },
          price: { type: 'number', description: 'Purchase price' },
          quantity: { type: 'number', description: 'Quantity purchased' }
        },
        description: 'Raw material purchase records',
        keywords: ['raw material', 'purchase', 'material', 'buy', 'procurement']
      },
      raw_material_usages: {
        fields: {
          date: { type: 'timestamp', description: 'Usage date' },
          material: { type: 'string', description: 'Raw material name' },
          quantity: { type: 'number', description: 'Quantity used' }
        },
        description: 'Raw material usage tracking',
        keywords: ['raw material', 'usage', 'consumption', 'used']
      },
      stock: {
        fields: {
          date: { type: 'string', description: 'Stock update date' },
          itemDescription: { type: 'string', description: 'Item description' },
          itemName: { type: 'string', description: 'Item name' },
          quantity: { type: 'number', description: 'Current stock quantity' },
          rate: { type: 'number', description: 'Current stock rate/price' }
        },
        description: 'Current stock levels and inventory',
        keywords: ['stock', 'inventory', 'available', 'quantity']
      }
    };
  }

  // Test Firebase connection
  async testFirebaseConnection() {
    try {
      console.log('Testing Firebase connection...');
      console.log('DB instance:', db);
      console.log('Auth instance:', auth);
      
      // Check if user is authenticated
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const userId = auth.currentUser.uid;
      console.log('Current user ID:', userId);
      
      // Test with a simple query - try products first with user path
      const testQuery = collection(db, 'users', userId, 'products');
      const snapshot = await getDocs(testQuery);
      console.log('Firebase connection test passed. Docs found:', snapshot.size);
      return { success: true, docCount: snapshot.size, userId };
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate query plan from user prompt
  async generateQueryPlan(userPrompt) {
    // Convert schema to a format that's easier for the AI to understand
    const schemaInfo = Object.entries(this.dbSchema)
      .map(([table, info]) => {
        const fields = Object.entries(info.fields)
          .map(([field, fieldInfo]) => `${field} (${fieldInfo.type}): ${fieldInfo.description}`)
          .join('\n    ');
        
        return `${table}:
  Description: ${info.description}
  Keywords: ${info.keywords.join(', ')}
  Fields:
    ${fields}`;
      })
      .join('\n\n');

    const prompt = `
You are a business data assistant for a business management application. Analyze the user's request and generate a database query plan.

Database Schema:
${schemaInfo}

User Request: "${userPrompt}"

Generate a query plan that matches the user's intent with the appropriate table and action.
Consider these rules for matching:

1. Table Selection:
- Match keywords in the request with table keywords
- 'order', 'bill', 'invoice' → customerOrders
- 'employee', 'staff', 'wage' → employees
- 'product', 'item', 'rate' → products
- 'raw material', 'material' → raw_material_purchases or raw_material_usages
- 'stock', 'inventory' → stock

2. Action Detection:
- READ: show, list, display, what is, how much, find, search, get
- CREATE: add, create, insert, new, make
- UPDATE: update, change, modify, set, edit
- DELETE: delete, remove, cancel

3. Field Mapping:
- price/rate/cost → rate field
- name → customerName/name/itemName based on table
- quantity → quantity field
- amount → totalAmount/amountGiven based on context

4. Special Cases:
- For orders: handle items array, balance calculations
- For stock: track quantity and rate together
- For employees: include date with wage updates
- For raw materials: handle both purchases and usage

Respond with this exact JSON structure (no other text):
{
  "table": "table_name",
  "action": "read|create|update|delete",
  "filters": [{"field": "field_name", "operator": "==|>|<|>=|<=", "value": "value"}],
  "orderBy": {"field": "field_name", "direction": "asc|desc"},
  "limit": number,
  "data": {}, // For create/update actions
  "docId": "id", // For update/delete actions
  "summary": "Human readable explanation"
}

Example Queries and Responses:

1. "What is the rate of black para interlock?"
{
  "table": "products",
  "action": "read",
  "filters": [{"field": "itemName", "operator": "==", "value": "black para interlock"}],
  "summary": "Finding rate for product 'black para interlock'"
}

2. "Add new employee John with wage 1000"
{
  "table": "employees",
  "action": "create",
  "data": {
    "name": "John",
    "wage": 1000,
    "date": "${new Date().toISOString()}"
  },
  "summary": "Creating new employee record for John"
}

3. "Show orders with balance more than 1000"
{
  "table": "customerOrders",
  "action": "read",
  "filters": [{"field": "balance", "operator": ">", "value": 1000}],
  "orderBy": {"field": "orderDate", "direction": "desc"},
  "summary": "Finding orders with pending balance over 1000"
}

4. "Update product XYZ rate to 500"
{
  "table": "products",
  "action": "update",
  "filters": [{"field": "itemName", "operator": "==", "value": "XYZ"}],
  "data": {
    "rate": "500"
  },
  "summary": "Updating rate for product XYZ"
}

5. "Show current stock of all items"
{
  "table": "stock",
  "action": "read",
  "orderBy": {"field": "itemName", "direction": "asc"},
  "summary": "Listing all items in stock"
}

6. "Add raw material purchase: 100kg cotton at 50 per kg"
{
  "table": "raw_material_purchases",
  "action": "create",
  "data": {
    "material": "cotton",
    "quantity": 100,
    "price": 50,
    "date": "${new Date().toISOString()}"
  },
  "summary": "Recording purchase of cotton raw material"
}

IMPORTANT: 
- Return only the JSON object
- Ensure all field names exactly match the schema
- For number fields (rate, quantity, price, wage), convert string values to numbers
- Include all required fields for create operations
- For read operations with no specific filters, return all records
`;

    let text = '';
    try {
      console.log('Generating query plan for:', userPrompt);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      text = response.text();
      
      console.log('Raw AI response:', text);
      
      // Extract JSON from response (handle markdown formatting)
      let jsonText = text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Remove any leading/trailing whitespace and newlines
      jsonText = jsonText.trim();
      
      console.log('Cleaned JSON text:', jsonText);
      
      // Parse JSON response
      const queryPlan = JSON.parse(jsonText);
      
      // Validate the query plan
      this.validateQueryPlan(queryPlan);
      
      console.log('Generated query plan:', queryPlan);
      return queryPlan;
      
    } catch (error) {
      console.error('Error in generateQueryPlan:', error);
      console.error('Raw response that failed:', text);
      
      if (error instanceof SyntaxError) {
        throw new Error('Failed to generate a valid query plan. Please try rephrasing your request.');
      } else {
        throw new Error(`Failed to understand the request: ${error.message}`);
      }
    }
  }

  // Helper method to validate query plan
  validateQueryPlan(queryPlan) {
    if (!queryPlan.table || !queryPlan.action) {
      throw new Error('Invalid query plan: missing table or action');
    }

    // Validate table exists
    if (!this.dbSchema[queryPlan.table]) {
      throw new Error(`Unknown table: ${queryPlan.table}`);
    }

    // Get table schema
    const tableSchema = this.dbSchema[queryPlan.table];
    const schemaFields = Object.keys(tableSchema.fields);

    // Validate filters
    if (queryPlan.filters) {
      queryPlan.filters = queryPlan.filters.filter(filter => {
        // Check if field exists in schema
        if (!schemaFields.includes(filter.field)) {
          console.warn(`Invalid filter field: ${filter.field}`);
          return false;
        }
        
        // Validate operator
        const validOperators = ['==', '>', '<', '>=', '<='];
        if (!validOperators.includes(filter.operator)) {
          console.warn(`Invalid operator: ${filter.operator}`);
          return false;
        }
        
        // Validate value type matches field type
        const fieldType = tableSchema.fields[filter.field].type;
        const valueType = typeof filter.value;
        if (fieldType === 'number' && valueType !== 'number') {
          filter.value = Number(filter.value);
        }
        
        return true;
      });

      // Remove filters array if all filters were invalid
      if (queryPlan.filters.length === 0) {
        delete queryPlan.filters;
      }
    }

    // Validate orderBy
    if (queryPlan.orderBy) {
      if (!schemaFields.includes(queryPlan.orderBy.field)) {
        delete queryPlan.orderBy;
      }
    }

    // Validate data for create/update
    if (queryPlan.data && (queryPlan.action === 'create' || queryPlan.action === 'update')) {
      const validData = {};
      Object.entries(queryPlan.data).forEach(([field, value]) => {
        if (schemaFields.includes(field)) {
          // Convert value to correct type
          if (tableSchema.fields[field].type === 'number') {
            validData[field] = Number(value);
          } else {
            validData[field] = value;
          }
        }
      });
      queryPlan.data = validData;

      // For create action, validate required fields
      if (queryPlan.action === 'create') {
        const missingFields = schemaFields.filter(field => {
          // Skip auto-generated fields and optional fields
          const skipFields = ['id', 'createdAt', 'timestamp', 'date'];
          if (skipFields.includes(field)) return false;
          
          return !queryPlan.data[field];
        });

        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
      }
    }

    return queryPlan;
  }

  // Execute Firebase query based on plan
  async executeQuery(queryPlan) {
    try {
      console.log('Executing query plan:', queryPlan);
      
      // Check if user is authenticated
      if (!auth.currentUser) {
        throw new Error('User not authenticated. Please sign in first.');
      }
      
      const userId = auth.currentUser.uid;
      console.log('Executing query for user:', userId);
      
      const { table, action, filters, orderBy, limit: queryLimit, data, docId } = queryPlan;
      
      // Validate required fields
      if (!table) {
        throw new Error('Table name is required');
      }
      
      if (!action) {
        throw new Error('Action is required');
      }
      
      // Get table schema
      const tableSchema = this.dbSchema[table];
      if (!tableSchema) {
        throw new Error(`Table ${table} not found`);
      }
      
      const schemaFields = Object.keys(tableSchema.fields);
      
      if (action === 'read') {
        console.log('Querying table:', table, 'for user:', userId);
        
        // Create user-specific collection path
        let firestoreQuery = collection(db, 'users', userId, table);
        
        // Apply filters
        if (filters && filters.length > 0) {
          console.log('Applying filters:', filters);
          filters.forEach(filter => {
            if (!filter.field || !filter.operator || filter.value === undefined) {
              throw new Error(`Invalid filter: ${JSON.stringify(filter)}`);
            }
            
            // Validate field exists in schema
            if (!schemaFields.includes(filter.field)) {
              console.warn(`Field '${filter.field}' not found in schema for table '${table}'`);
              return;
            }
            
            firestoreQuery = query(firestoreQuery, where(filter.field, filter.operator, filter.value));
          });
        }
        
        // Apply ordering
        if (orderBy && orderBy.field && orderBy.field.trim() !== '') {
          console.log('Applying order by:', orderBy);
          
          // Validate field exists in schema
          if (!schemaFields.includes(orderBy.field)) {
            console.warn(`OrderBy field '${orderBy.field}' not found in schema for table '${table}'`);
          } else {
            firestoreQuery = query(firestoreQuery, firestoreOrderBy(orderBy.field, orderBy.direction || 'asc'));
          }
        }
        
        // Apply limit
        if (queryLimit && queryLimit > 0) {
          console.log('Applying limit:', queryLimit);
          firestoreQuery = query(firestoreQuery, limit(queryLimit));
        }
        
        console.log('Executing Firestore query...');
        const querySnapshot = await getDocs(firestoreQuery);
        console.log('Query executed successfully, docs found:', querySnapshot.size);
        
        const results = [];
        
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('Results processed:', results.length);
        return results;
      }
      
      // Handle create action
      else if (action === 'create') {
        console.log('Creating new document in table:', table);
        
        if (!data) {
          throw new Error('Data is required for create action');
        }
        
        // Add timestamps
        const timestamp = new Date();
        const documentData = {
          ...data,
          createdAt: timestamp,
          timestamp: timestamp
        };
        
        // Create document in user-specific collection
        const collectionRef = collection(db, 'users', userId, table);
        const docRef = await addDoc(collectionRef, documentData);
        
        console.log('Document created successfully with ID:', docRef.id);
        return [{ id: docRef.id, ...documentData }];
      }
      
      // Handle update action
      else if (action === 'update') {
        console.log('Updating document in table:', table);
        
        if (!docId) {
          throw new Error('Document ID is required for update action');
        }
        
        if (!data) {
          throw new Error('Update data is required');
        }
        
        // Update document in user-specific collection
        const docRef = doc(db, 'users', userId, table, docId);
        const updateData = {
          ...data,
          updatedAt: new Date()
        };
        
        await updateDoc(docRef, updateData);
        
        console.log('Document updated successfully');
        return [{ id: docId, ...updateData }];
      }
      
      // Handle delete action
      else if (action === 'delete') {
        console.log('Deleting document from table:', table);
        
        if (!docId) {
          throw new Error('Document ID is required for delete action');
        }
        
        // Delete document from user-specific collection
        const docRef = doc(db, 'users', userId, table, docId);
        await deleteDoc(docRef);
        
        console.log('Document deleted successfully');
        return [{ id: docId, status: 'deleted' }];
      }
      
      throw new Error(`Invalid action '${action}'`);
      
    } catch (error) {
      console.error('Detailed error in executeQuery:', error);
      console.error('Query plan that failed:', queryPlan);
      
      // Provide more specific error messages
      if (error.code === 'permission-denied') {
        throw new Error('Database access denied. Make sure you are signed in and have proper permissions.');
      } else if (error.code === 'not-found') {
        throw new Error(`Collection '${queryPlan.table}' not found in database.`);
      } else if (error.code === 'invalid-argument') {
        throw new Error(`Invalid query argument: ${error.message}`);
      } else {
        throw new Error(`Database query failed: ${error.message}`);
      }
    }
  }

  // Format results for user display
  async formatResults(results, queryPlan, originalPrompt) {
    if (!results || results.length === 0) {
      return "No results found for your query.";
    }

    const prompt = `
Format the following database results into a user-friendly response.

Original User Request: "${originalPrompt}"
Query Summary: "${queryPlan.summary || 'Database query results'}"
Number of Results: ${results.length}

Database Results:
${JSON.stringify(results, null, 2)}

Please provide a clear, conversational response that:
1. Summarizes what was found
2. Presents the key information in an easy-to-read format
3. Uses bullet points or tables where appropriate
4. Includes relevant totals or calculations if applicable
5. Keeps the response concise but informative

Format the response in a friendly, conversational tone.
`;

    try {
      console.log('Formatting results...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const formattedText = response.text();
      console.log('Results formatted successfully');
      return formattedText;
    } catch (error) {
      console.error('Error formatting results:', error);
      // Fallback to basic formatting
      console.log('Using fallback formatting');
      return this.basicFormatResults(results, queryPlan);
    }
  }

  // Fallback formatting method
  basicFormatResults(results, queryPlan) {
    const { table } = queryPlan;
    let response = `Found ${results.length} result(s) from ${table}:\n\n`;
    
    results.forEach((item, index) => {
      response += `${index + 1}. `;
      Object.entries(item).forEach(([key, value]) => {
        if (key !== 'id' && value !== undefined && value !== null) {
          response += `${key}: ${value}, `;
        }
      });
      response = response.slice(0, -2) + '\n';
    });
    
    return response;
  }

  // Main chatbot processing method
  async processUserRequest(userPrompt) {
    try {
      console.log('Processing user request:', userPrompt);
      
      // Step 1: Generate query plan
      console.log('Step 1: Generating query plan...');
      const queryPlan = await this.generateQueryPlan(userPrompt);
      
      // Step 2: Execute query
      console.log('Step 2: Executing query...');
      const results = await this.executeQuery(queryPlan);
      
      // Step 3: Format results
      console.log('Step 3: Formatting results...');
      const formattedResponse = await this.formatResults(results, queryPlan, userPrompt);
      
      console.log('Request processed successfully');
      return {
        success: true,
        response: formattedResponse,
        queryPlan: queryPlan,
        resultCount: results.length
      };
      
    } catch (error) {
      console.error('Error processing user request:', error);
      return {
        success: false,
        response: error.message,
        error: error.message
      };
    }
  }

  // Helper method to get available tables
  getAvailableTables() {
    return Object.keys(this.dbSchema);
  }

  // Helper method to get table schema
  getTableSchema(tableName) {
    return this.dbSchema[tableName] || null;
  }
}

export default ChatbotService;