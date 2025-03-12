// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDIfSB1bJKjXCEUyWheck_FKCkz7PRFSLM",
  authDomain: "e-commerce-74d48.firebaseapp.com",
  projectId: "e-commerce-74d48",
  storageBucket: "e-commerce-74d48.firebasestorage.app",
  messagingSenderId: "709250336007",
  appId: "1:709250336007:web:8e39f2e20b4a12ae4531a2",
  measurementId: "G-WDJ44VSZTR"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Authentication State Listener
auth.onAuthStateChanged(user => {
  console.log("Auth state changed. User:", user ? user.email : "No user");
  if (!user) {
      window.location.href = 'index.html';
  } else {
      // User is authenticated, check if they are an admin
      checkAdminStatus(user.email);
  }
});

// Function to check if user is an admin
function checkAdminStatus(email) {
  console.log("Checking admin status for:", email);
  // Check if the user exists in the admins collection
  db.collection('admins').where('email', '==', email).get()
      .then(snapshot => {
          if (snapshot.empty && email !== 'pravin@gmail.com') {
              console.log("Not an admin, redirecting...");
              window.location.href = 'index.html';
          } else {
              console.log("Admin access granted");
              // User is an admin, continue loading the admin page
              loadProducts();
              loadOrders('all');
              loadAnalytics();
          }
      })
      .catch(error => {
          console.error("Error checking admin status:", error);
          // Allow access for pravin@gmail.com even if there's an error
          if (email === 'pravin@gmail.com') {
              loadProducts();
              loadOrders('all');
              loadAnalytics();
          } else {
              window.location.href = 'index.html';
          }
      });
}

// Add Product Form Submission
document.getElementById('addProductForm').addEventListener('submit', e => {
  e.preventDefault();
  const productData = {
      name: document.getElementById('productName').value,
      price: parseFloat(document.getElementById('productPrice').value),
      discountPrice: document.getElementById('productDiscountPrice').value ? parseFloat(document.getElementById('productDiscountPrice').value) : null,
      brand: document.getElementById('productBrand').value,
      category: document.getElementById('productCategory').value,
      availability: parseInt(document.getElementById('productAvailability').value),
      currency: document.getElementById('productCurrency').value,
      imageURLs: document.getElementById('productImageURLs').value.split(',').map(url => url.trim()).filter(url => url),
      isActive: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  console.log("Adding product:", productData);

  db.collection('products').add(productData)
      .then(() => {
          document.getElementById('addProductMessage').innerText = "Product added successfully!";
          document.getElementById('addProductForm').reset();
          loadProducts();
          loadAnalytics(); // Update analytics after adding a product
      })
      .catch(err => {
          console.error("Error adding product:", err);
          document.getElementById('addProductMessage').innerText = err.message;
      });
});

// Load Products
function loadProducts() {
  const productListDiv = document.getElementById('productList');
  console.log("Loading products...");
  productListDiv.innerHTML = "Loading products...";
  db.collection('products').get()
      .then(snapshot => {
          console.log("Products found:", snapshot.size);
          productListDiv.innerHTML = "";
          if (snapshot.empty) {
              productListDiv.innerHTML = "No products found";
              return;
          }
          snapshot.forEach(doc => {
              const prod = { id: doc.id, ...doc.data() };
              console.log("Product:", prod);
              const imageUrl = prod.imageURLs && prod.imageURLs.length > 0 ? prod.imageURLs[0] : 'assets/images/nothing.png';
              const prodDiv = document.createElement('div');
              prodDiv.classList.add('product-card');
              const priceSymbol = prod.currency === 'INR' ? '₹' : '$';
              prodDiv.innerHTML = `
                  <div class="product-image" style="background-image: url('${imageUrl}');" onerror="this.style.backgroundImage='url(assets/images/nothing.png)'"></div>
                  <div class="product-info">
                      <h3 class="product-name">${prod.name}</h3>
                      <p>Brand: ${prod.brand}</p>
                      <p>Price: ${priceSymbol}${prod.price}</p>
                      ${prod.discountPrice ? `<p>Discount: ${priceSymbol}${prod.discountPrice}</p>` : ''}
                      <p>Category: ${prod.category}</p>
                      <p>Availability: ${prod.availability}</p>
                      <button onclick="toggleProductStatus('${prod.id}', ${prod.isActive})">${prod.isActive ? 'Deactivate' : 'Activate'}</button>
                      <button onclick="deleteProduct('${prod.id}')">Delete</button>
                  </div>
              `;
              productListDiv.appendChild(prodDiv);
          });
      })
      .catch(error => {
          console.error("Error loading products:", error);
          productListDiv.innerHTML = "Error loading products: " + error.message;
      });
}

// Toggle Product Status
function toggleProductStatus(productId, isActive) {
  console.log("Toggling status for product:", productId, "Current status:", isActive);
  db.collection('products').doc(productId).update({
      isActive: !isActive
  }).then(() => {
      loadProducts();
      loadAnalytics(); // Update analytics after status change
  }).catch(error => {
      console.error("Error toggling product status:", error);
  });
}

// Delete Product
function deleteProduct(productId) {
  console.log("Deleting product:", productId);
  if (confirm("Are you sure you want to delete this product?")) {
      db.collection('products').doc(productId).delete()
          .then(() => {
              loadProducts();
              loadAnalytics(); // Update analytics after deletion
          })
          .catch(error => {
              console.error("Error deleting product:", error);
          });
  }
}

// Load Orders
function loadOrders(category = 'all') {
  const orderListDiv = document.getElementById('orderList');
  console.log("Loading orders for category:", category);
  orderListDiv.innerHTML = "Loading orders...";
  let query = db.collection('orders');
  if (category !== 'all') {
      // Note: This assumes your order items have a category field. Adjust based on your data structure.
      query = query.where('items', 'array-contains-any', [{ category: category }]);
  }
  query.get()
      .then(snapshot => {
          console.log("Orders found:", snapshot.size);
          orderListDiv.innerHTML = "";
          if (snapshot.empty) {
              orderListDiv.innerHTML = "No orders found";
              return;
          }
          snapshot.forEach(doc => {
              const order = { id: doc.id, ...doc.data() };
              console.log("Order:", order);
              const orderDiv = document.createElement('div');
              orderDiv.classList.add('product-card');
              const orderDate = order.orderDate.toDate().toLocaleString();
              let itemsHtml = order.items.map(item => `
                  <p>${item.name} x${item.quantity}</p>
                  <p>Price: ${item.currency === 'INR' ? '₹' : '$'}${item.price}</p>
              `).join('');
              orderDiv.innerHTML = `
                  <div class="product-info">
                      <h3 class="product-name">Order ${order.id} - ${orderDate}</h3>
                      ${itemsHtml}
                      <p>Total: $${order.totalAmountUSD.toFixed(2)}</p>
                      <p>Status: ${order.status}</p>
                      <select onchange="updateOrderStatus('${order.id}', this.value)">
                          <option value="ordered" ${order.status === 'ordered' ? 'selected' : ''}>Ordered</option>
                          <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                          <option value="out_for_delivery" ${order.status === 'out_for_delivery' ? 'selected' : ''}>Out for Delivery</option>
                          <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                      </select>
                  </div>
              `;
              orderListDiv.appendChild(orderDiv);
          });
      })
      .catch(error => {
          console.error("Error loading orders:", error);
          orderListDiv.innerHTML = "Error loading orders: " + error.message;
      });
}

// Update Order Status
function updateOrderStatus(orderId, status) {
  console.log("Updating order status:", orderId, "to", status);
  db.collection('orders').doc(orderId).update({ status })
      .then(() => loadOrders())
      .catch(error => {
          console.error("Error updating order status:", error);
      });
}

// Load Analytics
function loadAnalytics() {
  console.log("Loading analytics...");
  db.collection('orders').get().then(orderSnapshot => {
      const productSales = {};
      const categorySales = {};

      orderSnapshot.forEach(doc => {
          const order = doc.data();
          order.items.forEach(item => {
              productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
              const prodRef = db.collection('products').doc(item.productId);
              prodRef.get().then(prodDoc => {
                  if (prodDoc.exists) {
                      const category = prodDoc.data().category;
                      categorySales[category] = (categorySales[category] || 0) + item.quantity;
                  }
              }).catch(error => console.error("Error fetching product for analytics:", error));
          });
      });

      // Bar Chart: Product Sales
      const barCtx = document.getElementById('salesBarChart').getContext('2d');
      new Chart(barCtx, {
          type: 'bar',
          data: {
              labels: Object.keys(productSales),
              datasets: [{
                  label: 'Units Sold',
                  data: Object.values(productSales),
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 1
              }]
          },
          options: {
              responsive: false,
              scales: { y: { beginAtZero: true } }
          }
      });

      // Pie Chart: Category Distribution
      setTimeout(() => { // Wait for category data to populate
          const pieCtx = document.getElementById('categoryPieChart').getContext('2d');
          new Chart(pieCtx, {
              type: 'pie',
              data: {
                  labels: Object.keys(categorySales),
                  datasets: [{
                      data: Object.values(categorySales),
                      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                  }]
              },
              options: { responsive: false }
          });
      }, 1000);

      // Comparison Chart: Monthly Sales (example data)
      const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');
      new Chart(comparisonCtx, {
          type: 'line',
          data: {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [{
                  label: '2024 Sales',
                  data: [50, 60, 70, 80, 90, 100],
                  borderColor: '#FF6384',
                  fill: false
              }, {
                  label: '2025 Sales',
                  data: [60, 70, 80, 90, 100, 110],
                  borderColor: '#36A2EB',
                  fill: false
              }]
          },
          options: { responsive: false }
      });

      // Top 10 Selling Products
      const topProductsDiv = document.getElementById('topProducts');
      topProductsDiv.innerHTML = "<h4>Top 10 Selling Products</h4>";
      const sortedProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 10);
      sortedProducts.forEach(([prodId, qty]) => {
          db.collection('products').doc(prodId).get().then(doc => {
              if (doc.exists) {
                  const prod = doc.data();
                  const div = document.createElement('div');
                  div.innerHTML = `${prod.name} - ${qty} units`;
                  topProductsDiv.appendChild(div);
              }
          }).catch(error => console.error("Error fetching top product:", error));
      });

      // Bottom 10 Selling Products
      const bottomProductsDiv = document.getElementById('bottomProducts');
      bottomProductsDiv.innerHTML = "<h4>Bottom 10 Selling Products</h4>";
      const bottomProducts = Object.entries(productSales).sort((a, b) => a[1] - b[1]).slice(0, 10);
      bottomProducts.forEach(([prodId, qty]) => {
          db.collection('products').doc(prodId).get().then(doc => {
              if (doc.exists) {
                  const prod = doc.data();
                  const div = document.createElement('div');
                  div.innerHTML = `${prod.name} - ${qty} units`;
                  bottomProductsDiv.appendChild(div);
              }
          }).catch(error => console.error("Error fetching bottom product:", error));
      });
  }).catch(error => {
      console.error("Error loading analytics:", error);
  });
}

// Logout Function
function logout() {
  console.log("Logging out...");
  auth.signOut().then(() => window.location.href = 'index.html')
      .catch(error => console.error("Error logging out:", error));
}

// Initial Load Calls (kept as per your original code)
loadProducts();
loadOrders();
loadAnalytics();