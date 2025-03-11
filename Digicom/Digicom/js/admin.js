const firebaseConfig = {
  apiKey: "AIzaSyDIfSB1bJKjXCEUyWheck_FKCkz7PRFSLM",
  authDomain: "e-commerce-74d48.firebaseapp.com",
  projectId: "e-commerce-74d48",
  storageBucket: "e-commerce-74d48.firebasestorage.app",
  messagingSenderId: "709250336007",
  appId: "1:709250336007:web:8e39f2e20b4a12ae4531a2",
  measurementId: "G-WDJ44VSZTR"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged(user => {
  if (!user || user.email !== 'pravin@gmail.com') window.location.href = 'index.html';
});

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

  db.collection('products').add(productData)
    .then(() => {
      document.getElementById('addProductMessage').innerText = "Product added successfully!";
      document.getElementById('addProductForm').reset();
      loadProducts();
      loadAnalytics();
    })
    .catch(err => document.getElementById('addProductMessage').innerText = err.message);
});

function loadProducts() {
  const productListDiv = document.getElementById('productList');
  productListDiv.innerHTML = "Loading products...";
  db.collection('products').get()
    .then(snapshot => {
      productListDiv.innerHTML = "";
      snapshot.forEach(doc => {
        const prod = { id: doc.id, ...doc.data() };
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
            <button onclick="showEditForm('${prod.id}')">Edit</button>
            <div id="editForm_${prod.id}" class="edit-form">
              <form id="editProductForm_${prod.id}" class="form">
                <input type="text" id="editName_${prod.id}" value="${prod.name}" required>
                <input type="number" id="editPrice_${prod.id}" value="${prod.price}" required>
                <input type="number" id="editDiscountPrice_${prod.id}" value="${prod.discountPrice || ''}" placeholder="Discount Price (optional)">
                <input type="text" id="editBrand_${prod.id}" value="${prod.brand}" required>
                <select id="editCategory_${prod.id}">
                  <option value="electronics" ${prod.category === 'electronics' ? 'selected' : ''}>Electronics</option>
                  <option value="fashion" ${prod.category === 'fashion' ? 'selected' : ''}>Fashion</option>
                  <option value="furniture" ${prod.category === 'furniture' ? 'selected' : ''}>Furniture</option>
                  <option value="cosmetics" ${prod.category === 'cosmetics' ? 'selected' : ''}>Cosmetics</option>
                  <option value="foodAndHealth" ${prod.category === 'foodAndHealth' ? 'selected' : ''}>Food and Health</option>
                </select>
                <input type="number" id="editAvailability_${prod.id}" value="${prod.availability}" required>
                <select id="editCurrency_${prod.id}">
                  <option value="USD" ${prod.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                  <option value="INR" ${prod.currency === 'INR' ? 'selected' : ''}>INR (₹)</option>
                </select>
                <input type="text" id="editImageURLs_${prod.id}" value="${prod.imageURLs ? prod.imageURLs.join(', ') : ''}" placeholder="Image URLs (comma-separated)">
                <button type="submit">Save</button>
                <button type="button" onclick="hideEditForm('${prod.id}')">Cancel</button>
              </form>
              <div id="editMessage_${prod.id}" class="message"></div>
            </div>
          </div>
        `;
        productListDiv.appendChild(prodDiv);

        document.getElementById(`editProductForm_${prod.id}`).addEventListener('submit', e => {
          e.preventDefault();
          saveProductEdit(prod.id);
        });
      });
    });
}

function showEditForm(productId) {
  document.getElementById(`editForm_${productId}`).style.display = 'block';
}

function hideEditForm(productId) {
  document.getElementById(`editForm_${productId}`).style.display = 'none';
}

function saveProductEdit(productId) {
  const updatedData = {
    name: document.getElementById(`editName_${productId}`).value,
    price: parseFloat(document.getElementById(`editPrice_${productId}`).value),
    discountPrice: document.getElementById(`editDiscountPrice_${productId}`).value ? parseFloat(document.getElementById(`editDiscountPrice_${productId}`).value) : null,
    brand: document.getElementById(`editBrand_${productId}`).value,
    category: document.getElementById(`editCategory_${productId}`).value,
    availability: parseInt(document.getElementById(`editAvailability_${productId}`).value),
    currency: document.getElementById(`editCurrency_${productId}`).value,
    imageURLs: document.getElementById(`editImageURLs_${productId}`).value.split(',').map(url => url.trim()).filter(url => url)
  };

  db.collection('products').doc(productId).update(updatedData)
    .then(() => {
      document.getElementById(`editMessage_${productId}`).innerText = "Product updated successfully!";
      hideEditForm(productId);
      loadProducts();
      loadAnalytics();
    })
    .catch(err => document.getElementById(`editMessage_${productId}`).innerText = err.message);
}

function toggleProductStatus(productId, isActive) {
  db.collection('products').doc(productId).update({
    isActive: !isActive
  }).then(() => {
    loadProducts();
    loadAnalytics();
  });
}

function deleteProduct(productId) {
  if (confirm("Are you sure you want to delete this product?")) {
    db.collection('products').doc(productId).delete()
      .then(() => {
        loadProducts();
        loadAnalytics();
      });
  }
}

function loadOrders(category = 'all') {
  const orderListDiv = document.getElementById('orderList');
  orderListDiv.innerHTML = `Loading ${category === 'all' ? 'all' : category} orders...`;

  db.collection('orders').get()
    .then(snapshot => {
      orderListDiv.innerHTML = "";
      if (snapshot.empty) {
        orderListDiv.innerHTML = "No orders found.";
        return;
      }

      const ordersPromises = snapshot.docs.map(doc => {
        const order = { id: doc.id, ...doc.data() };
        return Promise.all(order.items.map(item =>
          db.collection('products').doc(item.productId).get()
            .then(prodDoc => ({
              ...item,
              category: prodDoc.exists ? prodDoc.data().category : 'unknown'
            }))
        )).then(updatedItems => ({ ...order, items: updatedItems }));
      });

      Promise.all(ordersPromises).then(orders => {
        orders.forEach(order => {
          const shouldDisplay = category === 'all' || order.items.some(item => item.category === category);
          if (shouldDisplay) {
            const orderDiv = document.createElement('div');
            orderDiv.classList.add('product-card');
            const orderDate = order.orderDate.toDate().toLocaleString();
            let itemsHtml = order.items.map(item => `
              <p>${item.name} x${item.quantity} (${item.category})</p>
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
          }
        });
        if (orderListDiv.innerHTML === "") {
          orderListDiv.innerHTML = `No ${category} orders found.`;
        }
      });
    })
    .catch(err => {
      console.error("Error loading orders:", err);
      orderListDiv.innerHTML = "Error loading orders.";
    });
}

function updateOrderStatus(orderId, status) {
  db.collection('orders').doc(orderId).update({ status })
    .then(() => loadOrders());
}

function loadAnalytics() {
  db.collection('orders').get().then(orderSnapshot => {
    const productSales = {};
    const categorySales = {};

    orderSnapshot.forEach(doc => {
      const order = doc.data();
      order.items.forEach(item => {
        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
        db.collection('products').doc(item.productId).get().then(prodDoc => {
          if (prodDoc.exists) {
            const category = prodDoc.data().category;
            categorySales[category] = (categorySales[category] || 0) + item.quantity;
          }
        });
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
    setTimeout(() => {
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

    // Top 10 Selling Products (Sorted by Units Sold and Category)
    const topProductsDiv = document.getElementById('topProducts');
    topProductsDiv.innerHTML = "<h4>Top 10 Selling Products</h4>";
    const topTable = document.createElement('table');
    topTable.classList.add('analytics-table');
    topTable.innerHTML = `
      <thead>
        <tr>
          <th>S.No</th>
          <th>Product Name</th>
          <th>Category</th>
          <th>Units Sold</th>
        </tr>
      </thead>
      <tbody>
      </tbody>
    `;
    const topTbody = topTable.querySelector('tbody');
    const sortedTopProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 10);
    Promise.all(sortedTopProducts.map(([prodId], index) =>
      db.collection('products').doc(prodId).get().then(doc => {
        if (doc.exists) {
          const prod = doc.data();
          return { name: prod.name, category: prod.category, qty: productSales[prodId], index: index + 1 };
        }
        return null;
      })
    )).then(products => {
      products.filter(p => p).sort((a, b) => a.category.localeCompare(b.category) || b.qty - a.qty).forEach(prod => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${prod.index}</td>
          <td>${prod.name}</td>
          <td>${prod.category}</td>
          <td>${prod.qty}</td>
        `;
        topTbody.appendChild(row);
      });
    });
    topProductsDiv.appendChild(topTable);

    // Bottom 10 Selling Products (Sorted by Units Sold and Category)
    const bottomProductsDiv = document.getElementById('bottomProducts');
    bottomProductsDiv.innerHTML = "<h4>Bottom 10 Selling Products</h4>";
    const bottomTable = document.createElement('table');
    bottomTable.classList.add('analytics-table');
    bottomTable.innerHTML = `
      <thead>
        <tr>
          <th>S.No</th>
          <th>Product Name</th>
          <th>Category</th>
          <th>Units Sold</th>
        </tr>
      </thead>
      <tbody>
      </tbody>
    `;
    const bottomTbody = bottomTable.querySelector('tbody');
    const sortedBottomProducts = Object.entries(productSales).sort((a, b) => a[1] - b[1]).slice(0, 10);
    Promise.all(sortedBottomProducts.map(([prodId], index) =>
      db.collection('products').doc(prodId).get().then(doc => {
        if (doc.exists) {
          const prod = doc.data();
          return { name: prod.name, category: prod.category, qty: productSales[prodId], index: index + 1 };
        }
        return null;
      })
    )).then(products => {
      products.filter(p => p).sort((a, b) => a.category.localeCompare(b.category) || a.qty - b.qty).forEach(prod => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${prod.index}</td>
          <td>${prod.name}</td>
          <td>${prod.category}</td>
          <td>${prod.qty}</td>
        `;
        bottomTbody.appendChild(row);
      });
    });
    bottomProductsDiv.appendChild(bottomTable);

    // Inventory Report (Sorted by Category and Name)
    const inventoryTbody = document.getElementById('inventoryTable').querySelector('tbody');
    inventoryTbody.innerHTML = '';
    db.collection('products').get().then(snapshot => {
      const products = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        ...doc.data(),
        index: index + 1
      })).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
      products.forEach(prod => {
        const priceUSD = prod.currency === 'INR' ? prod.price / 83 : prod.price;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${prod.index}</td>
          <td>${prod.name}</td>
          <td>${prod.category}</td>
          <td>${prod.availability}</td>
          <td>$${priceUSD.toFixed(2)}</td>
        `;
        inventoryTbody.appendChild(row);
      });
    });

    // Customer Report (Unchanged)
    const customerTbody = document.getElementById('customerTable').querySelector('tbody');
    customerTbody.innerHTML = '';
    db.collection('users').get().then(userSnapshot => {
      userSnapshot.forEach((userDoc, index) => {
        const user = userDoc.data();
        db.collection('orders').where('userId', '==', userDoc.id).get().then(orderSnapshot => {
          const totalOrders = orderSnapshot.size;
          const totalSpentUSD = orderSnapshot.docs.reduce((sum, doc) => sum + doc.data().totalAmountUSD, 0);
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${totalOrders}</td>
            <td>$${totalSpentUSD.toFixed(2)}</td>
          `;
          customerTbody.appendChild(row);
        });
      });
    });
  });
}

function downloadCostEstimationReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Y KART Cost Estimation Report", 105, 20, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleString()}`, 20, 30);

  let yPos = 40;
  doc.text("Top 10 Selling Products", 20, yPos);
  yPos += 10;
  doc.autoTable({
    startY: yPos,
    head: [['S.No', 'Product Name', 'Category', 'Units Sold']],
    body: Array.from(document.getElementById('topProducts').querySelector('tbody').rows).map(row => [
      row.cells[0].innerText,
      row.cells[1].innerText,
      row.cells[2].innerText,
      row.cells[3].innerText
    ])
  });
  yPos = doc.lastAutoTable.finalY + 10;

  doc.text("Bottom 10 Selling Products", 20, yPos);
  yPos += 10;
  doc.autoTable({
    startY: yPos,
    head: [['S.No', 'Product Name', 'Category', 'Units Sold']],
    body: Array.from(document.getElementById('bottomProducts').querySelector('tbody').rows).map(row => [
      row.cells[0].innerText,
      row.cells[1].innerText,
      row.cells[2].innerText,
      row.cells[3].innerText
    ])
  });

  doc.save('cost_estimation_report.pdf');
}

function downloadInventoryReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Christmas Inventory Report", 105, 20, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleString()}`, 20, 30);

  doc.autoTable({
    startY: 40,
    head: [['S.No', 'Product Name', 'Category', 'Stock', 'Price (USD)']],
    body: Array.from(document.getElementById('inventoryTable').querySelector('tbody').rows).map(row => [
      row.cells[0].innerText,
      row.cells[1].innerText,
      row.cells[2].innerText,
      row.cells[3].innerText,
      row.cells[4].innerText
    ])
  });

  doc.save('inventory_report.pdf');
}

function downloadCustomerReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Y KART Customer Report", 105, 20, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleString()}`, 20, 30);

  doc.autoTable({
    startY: 40,
    head: [['S.No', 'Name', 'Email', 'Total Orders', 'Total Spent (USD)']],
    body: Array.from(document.getElementById('customerTable').querySelector('tbody').rows).map(row => [
      row.cells[0].innerText,
      row.cells[1].innerText,
      row.cells[2].innerText,
      row.cells[3].innerText,
      row.cells[4].innerText
    ])
  });

  doc.save('customer_report.pdf');
}

function logout() {
  auth.signOut().then(() => window.location.href = 'index.html');
}

loadProducts();
loadOrders();
loadAnalytics();