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

let currentUser = null;
let currentOrder = null;
let allProducts = [];
let brands = new Set();
let supercoinsAvailable = 0;
let supercoinsUsed = 0;

// Popup Functions
function showPopup(title, message) {
  document.getElementById('popupTitle').innerText = title;
  document.getElementById('popupMessage').innerText = message;
  document.getElementById('customPopup').style.display = 'flex';
}

function closePopup() {
  document.getElementById('customPopup').style.display = 'none';
}

function showSection(sectionId) {
  // Hide all sections and remove 'active' class
  document.querySelectorAll('.section').forEach(section => {
      section.classList.add('hidden');
      section.classList.remove('active');
  });

  // Show the selected section
  let selectedSection = document.getElementById(sectionId);
  if (selectedSection) {
      selectedSection.classList.remove('hidden');
      selectedSection.classList.add('active');
  } else {
      console.error("Section not found: " + sectionId);
      return;
  }

  // Load content based on section using switch-case
  switch (sectionId) {
      case 'home':
          loadHomeProducts(); // Only load home products when "home" is clicked
          break;
      case 'products':
          loadProducts('all');
          break;
      case 'cart':
          loadCart();
          break;
      case 'wishlist':
          loadWishlist();
          break;
      case 'history':
          loadHistory();
          break;
      case 'orders':
          loadOrders();
          break;
      default:
          console.warn("No specific function for this section.");
          break;
  }
}

function showAdminLogin() {
  showSection('adminLogin');
}

document.getElementById('registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  if (email === 'yages@store.com') {
      document.getElementById('regMessage').innerText = "This email is reserved for admin!";
      return;
  }
  const userData = {
      name: document.getElementById('regName').value,
      age: parseInt(document.getElementById('regAge').value),
      gender: document.getElementById('regGender').value,
      phone: document.getElementById('regPhone').value,
      dateOfBirth: document.getElementById('regDob').value,
      email: email,
      credit: 0,
      supercoins: 0,
      cart: [],
      orderHistory: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  auth.createUserWithEmailAndPassword(email, password)
      .then(cred => {
          currentUser = cred.user;
          document.getElementById('regMessage').innerText = "Registration successful!";
          return db.collection('users').doc(currentUser.uid).set(userData);
      })
      .then(() => {
          showPopup("Success", "Registration successful!");
          setTimeout(() => {
              closePopup();
              showSection('home');
          }, 2000);
      })
      .catch(err => document.getElementById('regMessage').innerText = err.message);
});

document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  auth.signInWithEmailAndPassword(email, password)
      .then(cred => {
          currentUser = cred.user;
          document.getElementById('loginMessage').innerText = "Login successful!";
          loadSupercoins();
          showPopup("Success", "Login successful!");
          setTimeout(() => {
              closePopup();
              showSection('home');
          }, 2000);
      })
      .catch(err => document.getElementById('loginMessage').innerText = err.message);
});

document.getElementById('adminLoginForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  if (email !== 'pravin@gmail.com' || password !== 'Pravin@123') {
      document.getElementById('adminLoginMessage').innerText = "Invalid admin credentials!";
      return;
  }
  auth.signInWithEmailAndPassword(email, password)
      .then(() => {
          document.getElementById('adminLoginMessage').innerText = "Admin login successful!";
          showPopup("Success", "Admin login successful!");
          setTimeout(() => {
              closePopup();
              window.location.href = 'admin.html';
          }, 2000);
      })
      .catch(err => document.getElementById('adminLoginMessage').innerText = err.message);
});

function showForgotPassword() {
  showSection('forgotPassword');
}

document.getElementById('forgotPasswordForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value;
  auth.sendPasswordResetEmail(email)
      .then(() => {
          document.getElementById('forgotMessage').innerText = "Password reset link sent to your email!";
          setTimeout(() => showSection('login'), 3000);
      })
      .catch(err => document.getElementById('forgotMessage').innerText = err.message);
});

function continueGuest() {
  auth.signInAnonymously()
      .then(cred => {
          currentUser = cred.user;
          showPopup("Success", "Signed in as guest.");
          setTimeout(() => {
              closePopup();
              supercoinsAvailable = 0;
              showSection('home');
          }, 2000);
      })
      .catch(err => showPopup("Error", err.message));
}

function loadSupercoins() {
  if (!currentUser || currentUser.isAnonymous) return;
  db.collection('users').doc(currentUser.uid).get()
      .then(doc => {
          supercoinsAvailable = doc.data().supercoins || 0;
      });
}

function loadHomeProducts() {
  const homeProductsDiv = document.getElementById('homeProducts');
  homeProductsDiv.innerHTML = "Loading products...";
  db.collection('products').where('isActive', '==', true).get()
      .then(snapshot => {
          homeProductsDiv.innerHTML = "";
          snapshot.forEach(doc => {
              const prod = { id: doc.id, ...doc.data() };
              const imageUrl = prod.imageURLs && prod.imageURLs.length > 0 ? prod.imageURLs[0] : 'assets/images/nothing.png';
              const prodDiv = document.createElement('div');
              prodDiv.classList.add('product-card');
              const priceSymbol = prod.currency === 'INR' ? '₹' : '$';
              prodDiv.innerHTML = `
                  <div class="product-image" style="background-image: url('${imageUrl}');" onerror="this.style.backgroundImage='url(assets/images/nothing.png)'">
                      <div class="quick-view">Quick View</div>
                  </div>
                  <div class="product-info">
                      <h3 class="product-name">${prod.name}</h3>
                      <p>Brand: ${prod.brand}</p>
                      <p>Price: ${priceSymbol}${prod.price}</p>
                      ${prod.discountPrice ? `<p>Discount: ${priceSymbol}${prod.discountPrice}</p>` : ''}
                      <p>Availability: ${prod.availability}</p>
                      <button onclick="addToCart('${prod.id}', '${prod.name}')">Add to Cart</button>
                      <button onclick="addToWishlist('${prod.id}', '${prod.name}')">Add to Wishlist</button>
                  </div>
              `;
              homeProductsDiv.appendChild(prodDiv);
          });
      })
      .catch(err => {
          console.error("Error loading home products:", err);
          homeProductsDiv.innerHTML = "Error loading products.";
      });
}

function loadProducts(category) {
  const productsListDiv = document.getElementById('productsList');
  productsListDiv.innerHTML = `Loading ${category === 'all' ? 'all' : category} products...`;
  let query = db.collection('products').where('isActive', '==', true);
  if (category !== 'all') query = query.where('category', '==', category);

  query.get()
      .then(snapshot => {
          allProducts = [];
          brands.clear();
          document.getElementById('filterBrand').innerHTML = '<option value="all">All Brands</option>';
          snapshot.forEach(doc => {
              const prod = { id: doc.id, ...doc.data() };
              allProducts.push(prod);
              brands.add(prod.brand);
          });
          brands.forEach(brand => {
              const option = document.createElement('option');
              option.value = brand;
              option.text = brand;
              document.getElementById('filterBrand').appendChild(option);
          });
          applyFilters();
      })
      .catch(err => {
          console.error("Error loading products:", err);
          productsListDiv.innerHTML = "Error loading products.";
      });
}

function applyFilters() {
  const productsListDiv = document.getElementById('productsList');
  const filterAvailability = document.getElementById('filterAvailability').value;
  const sortBy = document.getElementById('sortBy').value;
  const filterBrand = document.getElementById('filterBrand').value;

  let filteredProducts = [...allProducts];

  if (filterAvailability === 'inStock') {
      filteredProducts = filteredProducts.filter(prod => prod.availability > 0);
  } else if (filterAvailability === 'outOfStock') {
      filteredProducts = filteredProducts.filter(prod => prod.availability <= 0);
  }

  if (filterBrand !== 'all') {
      filteredProducts = filteredProducts.filter(prod => prod.brand === filterBrand);
  }

  filteredProducts.sort((a, b) => {
      if (sortBy === 'nameAsc') return a.name.localeCompare(b.name);
      if (sortBy === 'nameDesc') return b.name.localeCompare(a.name);
      if (sortBy === 'priceAsc') return (a.discountPrice || a.price) - (b.discountPrice || b.price);
      if (sortBy === 'priceDesc') return (b.discountPrice || b.price) - (a.discountPrice || a.price);
      return 0;
  });

  productsListDiv.innerHTML = "";
  if (filteredProducts.length === 0) {
      productsListDiv.innerHTML = "No products match your filters.";
      return;
  }

  filteredProducts.forEach(prod => {
      const imageUrl = prod.imageURLs && prod.imageURLs.length > 0 ? prod.imageURLs[0] : 'assets/images/nothing.png';
      const prodDiv = document.createElement('div');
      prodDiv.classList.add('product-card');
      const priceSymbol = prod.currency === 'INR' ? '₹' : '$';
      prodDiv.innerHTML = `
          <div class="product-image" style="background-image: url('${imageUrl}');" onerror="this.style.backgroundImage='url(assets/images/nothing.png)'">
              <div class="quick-view">Quick View</div>
          </div>
          <div class="product-info">
              <h3 class="product-name">${prod.name}</h3>
              <p>Brand: ${prod.brand}</p>
              <p>Price: ${priceSymbol}${prod.price}</p>
              ${prod.discountPrice ? `<p>Discount: ${priceSymbol}${prod.discountPrice}</p>` : ''}
              <p>Availability: ${prod.availability}</p>
              <button onclick="addToCart('${prod.id}', '${prod.name}')">Add to Cart</button>
              <button onclick="addToWishlist('${prod.id}', '${prod.name}')">Add to Wishlist</button>
          </div>
      `;
      productsListDiv.appendChild(prodDiv);
  });
}

function addToCart(productId, name) {
  if (!currentUser) {
      showPopup("Error", "Please login first!");
      setTimeout(closePopup, 2000);
      return;
  }
  db.collection('products').doc(productId).get()
      .then(doc => {
          if (!doc.exists || doc.data().availability <= 0) {
              showPopup("Error", "Product is out of stock!");
              setTimeout(closePopup, 2000);
              return;
          }
          const prod = doc.data();
          const price = prod.discountPrice || prod.price || 0;
          const imageUrl = prod.imageURLs && prod.imageURLs.length > 0 ? prod.imageURLs[0] : 'assets/images/nothing.png';
          const currency = prod.currency || 'USD';
          const cartRef = db.collection('users').doc(currentUser.uid).collection('cart');
          cartRef.where('productId', '==', productId).get()
              .then(snapshot => {
                  if (snapshot.empty) {
                      cartRef.add({
                          productId: productId,
                          name: name,
                          price: price,
                          currency: currency,
                          brand: prod.brand,
                          discountPrice: prod.discountPrice || null,
                          availability: prod.availability,
                          imageUrl: imageUrl,
                          quantity: 1,
                          addedAt: firebase.firestore.FieldValue.serverTimestamp()
                      }).then(() => {
                          showPopup("Success", `${name} added to cart.`);
                          setTimeout(closePopup, 2000);
                          loadCart();
                          updateCartCount();
                      });
                  } else {
                      const doc = snapshot.docs[0];
                      const newQuantity = doc.data().quantity + 1;
                      if (newQuantity > prod.availability) {
                          showPopup("Error", "Cannot add more items than available stock!");
                          setTimeout(closePopup, 2000);
                          return;
                      }
                      cartRef.doc(doc.id).update({
                          quantity: newQuantity
                      }).then(() => {
                          showPopup("Success", `${name} quantity updated in cart.`);
                          setTimeout(closePopup, 2000);
                          loadCart();
                          updateCartCount();
                      });
                  }
              });
      });
}

function loadCart() {
  if (!currentUser) {
      showPopup("Error", "Please login first!");
      setTimeout(closePopup, 2000);
      return;
  }
  const cartListDiv = document.getElementById('cartList');
  cartListDiv.innerHTML = "";
  db.collection('users').doc(currentUser.uid).collection('cart').get()
      .then(snapshot => {
          if (snapshot.empty) {
              cartListDiv.innerHTML = "Your cart is empty.";
              return;
          }
          snapshot.forEach(doc => {
              const item = doc.data();
              const totalPrice = item.price * item.quantity;
              const priceSymbol = item.currency === 'INR' ? '₹' : '$';
              const itemDiv = document.createElement('div');
              itemDiv.classList.add('product-card');
              itemDiv.innerHTML = `
                  <div class="product-image" style="background-image: url('${item.imageUrl || 'assets/images/nothing.png'}');" onerror="this.style.backgroundImage='url(assets/images/nothing.png)'"></div>
                  <div class="product-info">
                      <h3 class="product-name">${item.name} x${item.quantity}</h3>
                      <p>Brand: ${item.brand}</p>
                      <p>Price: ${priceSymbol}${item.price}</p>
                      ${item.discountPrice ? `<p>Discount: ${priceSymbol}${item.discountPrice}</p>` : ''}
                      <p>Total: ${priceSymbol}${totalPrice}</p>
                      <p>Availability: ${item.availability}</p>
                      <button onclick="updateCartQuantity('${doc.id}', ${item.quantity + 1}, '${item.productId}')">+</button>
                      <button onclick="updateCartQuantity('${doc.id}', ${item.quantity - 1}, '${item.productId}')">-</button>
                      <button onclick="deleteCartItem('${doc.id}')">Delete</button>
                  </div>
              `;
              cartListDiv.appendChild(itemDiv);
          });
          updateCartCount();
      })
      .catch(err => console.error(err));
}

function updateCartQuantity(docId, newQuantity, productId) {
  const cartRef = db.collection('users').doc(currentUser.uid).collection('cart').doc(docId);
  db.collection('products').doc(productId).get().then(prodDoc => {
      const availability = prodDoc.data().availability;
      if (newQuantity > availability) {
          showPopup("Error", "Cannot increase quantity beyond available stock!");
          setTimeout(closePopup, 2000);
          return;
      }
      if (newQuantity <= 0) {
          cartRef.delete().then(() => loadCart());
      } else {
          cartRef.update({ quantity: newQuantity }).then(() => loadCart());
      }
  });
}

function deleteCartItem(docId) {
  if (!currentUser) {
      showPopup("Error", "Please login first!");
      setTimeout(closePopup, 2000);
      return;
  }
  const cartRef = db.collection('users').doc(currentUser.uid).collection('cart').doc(docId);
  cartRef.delete()
      .then(() => {
          showPopup("Success", "Item removed from cart.");
          setTimeout(closePopup, 2000);
          loadCart();
      })
      .catch(err => showPopup("Error", "Error removing item: " + err.message));
}

function addToWishlist(productId, name) {
  if (!currentUser) {
      showPopup("Error", "Please login first!");
      setTimeout(closePopup, 2000);
      return;
  }
  const wishlistRef = db.collection('wishlist').doc(`${currentUser.uid}_${productId}`);
  db.collection('products').doc(productId).get().then(doc => {
      const prod = doc.data();
      const price = prod.discountPrice || prod.price || 0;
      const imageUrl = prod.imageURLs && prod.imageURLs.length > 0 ? prod.imageURLs[0] : 'assets/images/nothing.png';
      const currency = prod.currency || 'USD';
      wishlistRef.get().then(wishDoc => {
          if (wishDoc.exists) {
              wishlistRef.update({
                  quantity: wishDoc.data().quantity + 1,
                  addedAt: firebase.firestore.FieldValue.serverTimestamp()
              }).then(() => {
                  showPopup("Success", `${name} quantity updated in wishlist.`);
                  setTimeout(closePopup, 2000);
                  loadWishlist();
              });
          } else {
              wishlistRef.set({
                  userId: currentUser.uid,
                  productId: productId,
                  name: name,
                  price: price,
                  currency: currency,
                  brand: prod.brand,
                  discountPrice: prod.discountPrice || null,
                  availability: prod.availability,
                  imageUrl: imageUrl,
                  quantity: 1,
                  addedAt: firebase.firestore.FieldValue.serverTimestamp()
              }).then(() => {
                  showPopup("Success", `${name} added to wishlist.`);
                  setTimeout(closePopup, 2000);
                  loadWishlist();
              });
          }
      });
  }).catch(err => showPopup("Error", err.message));
}

function loadWishlist() {
  if (!currentUser) {
      showPopup("Error", "Please login first!");
      setTimeout(closePopup, 2000);
      return;
  }
  const wishlistListDiv = document.getElementById('wishlistList');
  wishlistListDiv.innerHTML = "";
  db.collection('wishlist').where("userId", "==", currentUser.uid).get()
      .then(snapshot => {
          if (snapshot.empty) wishlistListDiv.innerHTML = "Your wishlist is empty.";
          snapshot.forEach(doc => {
              const item = doc.data();
              const priceSymbol = item.currency === 'INR' ? '₹' : '$';
              const itemDiv = document.createElement('div');
              itemDiv.classList.add('product-card');
              itemDiv.innerHTML = `
                  <div class="product-image" style="background-image: url('${item.imageUrl || 'assets/images/nothing.png'}');" onerror="this.style.backgroundImage='url(assets/images/nothing.png)'"></div>
                  <div class="product-info">
                      <h3 class="product-name">${item.name} x${item.quantity}</h3>
                      <p>Brand: ${item.brand}</p>
                      <p>Price: ${priceSymbol}${item.price}</p>
                      ${item.discountPrice ? `<p>Discount: ${priceSymbol}${item.discountPrice}</p>` : ''}
                      <p>Availability: ${item.availability}</p>
                  </div>
              `;
              wishlistListDiv.appendChild(itemDiv);
          });
      })
      .catch(err => console.error(err));
}

function placeOrder() {
  if (!currentUser) {
      showPopup("Error", "Please login first!");
      setTimeout(closePopup, 2000);
      return;
  }
  const userCartRef = db.collection('users').doc(currentUser.uid).collection('cart');
  userCartRef.get().then(snapshot => {
      if (snapshot.empty) {
          showPopup("Error", "Your cart is empty!");
          setTimeout(closePopup, 2000);
          return;
      }
      let cartItems = [];
      snapshot.forEach(doc => cartItems.push({ id: doc.id, ...doc.data() }));
      const variants = cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          currency: item.currency,
          name: item.name,
          brand: item.brand,
          discountPrice: item.discountPrice,
          availability: item.availability,
          imageUrl: item.imageUrl
      }));
      const totalAmountUSD = variants.reduce((sum, item) => {
          const priceUSD = item.currency === 'INR' ? item.price / 83 : item.price;
          return sum + (priceUSD * item.quantity);
      }, 0);

      const batch = db.batch();
      let stockValid = true;
      cartItems.forEach(item => {
          const productRef = db.collection('products').doc(item.productId);
          db.runTransaction(transaction => {
              return transaction.get(productRef).then(doc => {
                  const currentAvailability = doc.data().availability;
                  if (currentAvailability < item.quantity) {
                      stockValid = false;
                      throw new Error(`Insufficient stock for ${item.name}. Only ${currentAvailability} left.`);
                  }
                  transaction.update(productRef, { availability: currentAvailability - item.quantity });
              });
          }).catch(err => {
              showPopup("Error", err.message);
              setTimeout(closePopup, 2000);
              stockValid = false;
          });
      });

      if (!stockValid) return;

      db.collection('orders').add({
          userId: currentUser.uid,
          items: variants,
          totalAmountUSD: totalAmountUSD,
          status: 'ordered',
          paymentStatus: 'pending',
          orderDate: firebase.firestore.FieldValue.serverTimestamp()
      }).then(orderRef => {
          currentOrder = { id: orderRef.id, totalAmountUSD, cartItems: snapshot };
          document.getElementById('paymentAmount').innerText = totalAmountUSD.toFixed(2);
          document.getElementById('supercoinsAvailable').innerText = supercoinsAvailable;
          document.getElementById('paymentModal').style.display = 'flex';
          togglePaymentFields();
      });
  });
}

function applySupercoins() {
  const supercoinsInput = parseInt(document.getElementById('supercoinsToUse').value) || 0;
  if (supercoinsInput > supercoinsAvailable) {
      showPopup("Error", "You don't have enough supercoins!");
      setTimeout(closePopup, 2000);
      return;
  }
  if (supercoinsInput < 0) {
      showPopup("Error", "Supercoins cannot be negative!");
      setTimeout(closePopup, 2000);
      return;
  }
  supercoinsUsed = supercoinsInput;
  const totalAmountUSD = currentOrder.totalAmountUSD - (supercoinsUsed / 83);
  document.getElementById('paymentAmount').innerText = totalAmountUSD.toFixed(2);
}

function togglePaymentFields() {
  const method = document.getElementById('paymentMethod').value;
  const cardDetails = document.getElementById('cardDetails');
  const upiDetails = document.getElementById('upiDetails');
  cardDetails.style.display = (method === 'credit_card' || method === 'debit_card') ? 'block' : 'none';
  upiDetails.style.display = method === 'upi' ? 'block' : 'none';
}

function processPayment() {
  if (!currentOrder || !currentUser) {
      showPopup("Error", "Order or user not found!");
      setTimeout(closePopup, 2000);
      return;
  }
  const paymentMethod = document.getElementById('paymentMethod').value;
  const transactionId = `TXN${Date.now()}`;
  const finalAmountUSD = currentOrder.totalAmountUSD - (supercoinsUsed / 83);

  if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      const cardNumber = document.getElementById('cardNumber').value;
      const cvv = document.getElementById('cvv').value;
      const expiryDate = document.getElementById('expiryDate').value;

      if (!cardNumber || cardNumber.length !== 16 || !/^\d+$/.test(cardNumber)) {
          showPopup("Error", "Please enter a valid 16-digit card number.");
          setTimeout(closePopup, 2000);
          return;
      }
      if (!cvv || cvv.length !== 3 || !/^\d+$/.test(cvv)) {
          showPopup("Error", "Please enter a valid 3-digit CVV.");
          setTimeout(closePopup, 2000);
          return;
      }
      if (!expiryDate) {
          showPopup("Error", "Please enter a valid expiry date.");
          setTimeout(closePopup, 2000);
          return;
      }
  } else if (paymentMethod === 'upi') {
      const upiId = document.getElementById('upiId').value;
      if (!upiId || !/^[a-zA-Z0-9]+@[a-zA-Z0-9]+$/.test(upiId)) {
          showPopup("Error", "Please enter a valid UPI ID (e.g., user@upi).");
          setTimeout(closePopup, 2000);
          return;
      }
  }

  setTimeout(() => {
      db.collection('payments').add({
          userId: currentUser.uid,
          orderId: currentOrder.id,
          amount: finalAmountUSD,
          supercoinsUsed: supercoinsUsed,
          paymentMethod: paymentMethod,
          transactionId: transactionId,
          status: 'completed',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
          db.collection('orders').doc(currentOrder.id).update({
              status: 'confirmed',
              paymentStatus: 'paid',
              supercoinsUsed: supercoinsUsed
          }).then(() => {
              currentOrder.cartItems.forEach(doc => doc.ref.delete());
              const totalINR = currentOrder.totalAmountUSD * 83;
              const supercoinsEarned = totalINR >= 500 ? 10 : 0;
              db.collection('users').doc(currentUser.uid).update({
                  orderHistory: firebase.firestore.FieldValue.arrayUnion(currentOrder.id),
                  supercoins: firebase.firestore.FieldValue.increment(supercoinsEarned - supercoinsUsed)
              }).then(() => {
                  generateInvoice(currentOrder, transactionId, paymentMethod, supercoinsEarned);
                  showPopup("Success", `Payment successful! Order confirmed. ${supercoinsEarned} supercoins earned. Invoice downloaded.`);
                  setTimeout(closePopup, 2000);
                  closePaymentModal();
                  loadCart();
                  loadSupercoins();
                  currentOrder = null;
                  supercoinsUsed = 0;
              });
          });
      }).catch(err => {
          showPopup("Error", "Payment failed: " + err.message);
          setTimeout(closePopup, 2000);
          db.collection('orders').doc(currentOrder.id).update({
              status: 'failed',
              paymentStatus: 'failed'
          });
      });
  }, 1000);
}

function generateInvoice(order, transactionId, paymentMethod, supercoinsEarned) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("VESTE Invoice", 105, 20, { align: "center" });
  doc.setFontSize(10);
  doc.text("VESTE Pvt. Ltd.", 20, 30);
  doc.text("500 Terry Francine Street, San Francisco, CA 94158", 20, 35);
  doc.text("GSTIN: 12ABCDE3456F1Z5", 20, 40);
  doc.text(`Invoice No: ${transactionId}`, 150, 30);
  doc.text(`Date: ${new Date().toLocaleString()}`, 150, 35);

  db.collection('users').doc(currentUser.uid).get().then(userDoc => {
      const userData = userDoc.data();
      doc.setFontSize(12);
      doc.text("Bill To:", 20, 50);
      doc.setFontSize(10);
      doc.text(`${userData.name}`, 20, 55);
      doc.text(`${userData.email}`, 20, 60);
      doc.text(`${userData.phone}`, 20, 65);

      doc.setFontSize(12);
      doc.text("Order Details:", 20, 75);
      doc.setFontSize(10);
      let yPos = 85;
      doc.text("S.No", 20, yPos);
      doc.text("Item", 35, yPos);
      doc.text("Qty", 85, yPos);
      doc.text("Unit Price", 105, yPos);
      doc.text("Discount", 135, yPos);
      doc.text("Total", 165, yPos);
      yPos += 5;
      doc.line(20, yPos, 190, yPos);
      yPos += 5;

      let subtotalINR = 0;
      order.cartItems.forEach((item, index) => {
          const priceINR = item.data().currency === 'INR' ? item.data().price : item.data().price * 83;
          const discountINR = item.data().discountPrice ? (item.data().currency === 'INR' ? item.data().discountPrice : item.data().discountPrice * 83) : null;
          const totalINR = (discountINR || priceINR) * item.data().quantity;
          subtotalINR += totalINR;
          doc.text(`${index + 1}`, 20, yPos);
          doc.text(item.data().name, 35, yPos);
          doc.text(`${item.data().quantity}`, 85, yPos);
          doc.text(`₹${priceINR.toFixed(2)}`, 105, yPos);
          doc.text(discountINR ? `₹${discountINR.toFixed(2)}` : '-', 135, yPos);
          doc.text(`₹${totalINR.toFixed(2)}`, 165, yPos);
          yPos += 10;
      });

      doc.line(20, yPos, 190, yPos);
      yPos += 5;
      doc.text(`Subtotal: ₹${subtotalINR.toFixed(2)}`, 150, yPos);
      yPos += 10;
      doc.text(`Supercoins Used: ${supercoinsUsed} (₹${supercoinsUsed.toFixed(2)})`, 150, yPos);
      yPos += 10;
      const finalINR = subtotalINR - supercoinsUsed;
      doc.text(`Total: ₹${finalINR.toFixed(2)} ($${finalINR / 83})`, 150, yPos);
      yPos += 10;
      doc.text(`Supercoins Earned: ${supercoinsEarned}`, 150, yPos);

      yPos += 20;
      doc.setFontSize(8);
      doc.text("Thank you for shopping with VESTE! For queries, contact support@veste.com", 105, yPos, { align: "center" });
      yPos += 5;
      doc.text("Terms & Conditions apply. All prices inclusive of taxes.", 105, yPos, { align: "center" });

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=OrderID:${order.id},TransactionID:${transactionId}`;
      const qrImage = new Image();
      qrImage.crossOrigin = "Anonymous";
      qrImage.src = qrUrl;

      qrImage.onload = () => {
          yPos += 20;
          doc.addImage(qrImage, 'PNG', 80, yPos, 50, 50);
          doc.save(`invoice_${order.id}.pdf`);
      };

      qrImage.onerror = () => {
          console.error("Failed to load QR code.");
          yPos += 20;
          doc.text("QR Code unavailable", 105, yPos, { align: "center" });
          doc.save(`invoice_${order.id}.pdf`);
      };
  });
}

function closePaymentModal() {
  document.getElementById('paymentModal').style.display = 'none';
  document.getElementById('cardDetails').style.display = 'none';
  document.getElementById('upiDetails').style.display = 'none';
  supercoinsUsed = 0;
}

function loadHistory() {
  if (!currentUser) {
      showPopup("Error", "Please login first!");
      setTimeout(closePopup, 2000);
      return;
  }
  const historyListDiv = document.getElementById('historyList');
  historyListDiv.innerHTML = "";
  db.collection('orders').where("userId", "==", currentUser.uid).get()
      .then(snapshot => {
          if (snapshot.empty) historyListDiv.innerHTML = "No orders yet.";
          snapshot.forEach(doc => {
              const order = doc.data();
              const orderDiv = document.createElement('div');
              orderDiv.classList.add('product-card');
              const orderDate = order.orderDate.toDate().toLocaleString();
              let itemsHtml = '';
              order.items.forEach(item => {
                  const priceSymbol = item.currency === 'INR' ? '₹' : '$';
                  itemsHtml += `
                      <div class="product-image" style="background-image: url('${item.imageUrl || 'assets/images/nothing.png'}');" onerror="this.style.backgroundImage='url(assets/images/nothing.png)'"></div>
                      <p>${item.name} x${item.quantity}</p>
                      <p>Brand: ${item.brand}</p>
                      <p>Price: ${priceSymbol}${item.price}</p>
                      ${item.discountPrice ? `<p>Discount: ${priceSymbol}${item.discountPrice}</p>` : ''}
                      <p>Availability: ${item.availability}</p>
                  `;
              });
              orderDiv.innerHTML = `
                  <div class="product-info">
                      <h3 class="product-name">Order on ${orderDate}</h3>
                      ${itemsHtml}
                      <div class="product-price">Total: $${order.totalAmountUSD.toFixed(2)} - ${order.paymentStatus}</div>
                  </div>
              `;
              historyListDiv.appendChild(orderDiv);
          });
      })
      .catch(err => console.error(err));
}

function loadOrders() {
  if (!currentUser) {
      showPopup("Error", "Please login first!");
      setTimeout(closePopup, 2000);
      return;
  }
  const ordersListDiv = document.getElementById('ordersList');
  ordersListDiv.innerHTML = "";
  db.collection('orders').where("userId", "==", currentUser.uid).get()
      .then(snapshot => {
          if (snapshot.empty) ordersListDiv.innerHTML = "No orders yet.";
          snapshot.forEach(doc => {
              const order = doc.data();
              const orderDiv = document.createElement('div');
              orderDiv.classList.add('product-card');
              const orderDate = order.orderDate.toDate().toLocaleString();
              let itemsHtml = '';
              order.items.forEach(item => {
                  const priceSymbol = item.currency === 'INR' ? '₹' : '$';
                  itemsHtml += `
                      <p>${item.name} x${item.quantity}</p>
                      <p>Brand: ${item.brand}</p>
                      <p>Price: ${priceSymbol}${item.price}</p>
                      ${item.discountPrice ? `<p>Discount: ${priceSymbol}${item.discountPrice}</p>` : ''}
                      <p>Availability: ${item.availability}</p>
                  `;
              });
              const status = order.status === 'ordered' ? 'Ordered' :
                          order.status === 'shipped' ? 'Shipped' :
                          order.status === 'out_for_delivery' ? 'Out for Delivery' :
                          order.status === 'delivered' ? 'Delivered' : order.status;
              orderDiv.innerHTML = `
                  <div class="product-image" style="background-image: url('${order.items[0].imageUrl || 'assets/images/nothing.png'}');" onerror="this.style.backgroundImage='url(assets/images/nothing.png)'"></div>
                  <div class="product-info">
                      <h3 class="product-name">Order on ${orderDate}</h3>
                      ${itemsHtml}
                      <div class="product-price">Status: ${status}</div>
                  </div>
              `;
              ordersListDiv.appendChild(orderDiv);
          });
      })
      .catch(err => console.error(err));
}

function logout() {
  auth.signOut().then(() => {
      currentUser = null;
      showPopup("Success", "Logged out successfully.");
      setTimeout(() => {
          closePopup();
          showSection('home');
          window.location.href = 'index.html';
      }, 2000);
  });
}

function updateCartCount() {
  if (!currentUser) {
      document.querySelector('.cart-count').textContent = '0';
      return;
  }
  db.collection('users').doc(currentUser.uid).collection('cart').get()
      .then(snapshot => {
          const count = snapshot.docs.reduce((sum, doc) => sum + doc.data().quantity, 0);
          document.querySelector('.cart-count').textContent = count;
      });
}

// Function to update navigation based on authentication state
function updateNavigation(user) {
  // Elements that should be visible only when logged in
  const loggedInElements = [
      document.getElementById('nav-wishlist'),
      document.getElementById('nav-orders'),
      document.getElementById('nav-history'),
      document.getElementById('nav-logout')
  ];
  
  // Elements that should be visible only when not logged in
  const loggedOutElements = [
      document.getElementById('nav-login'),
      document.getElementById('nav-register'),
      document.getElementById('nav-guest')
  ];
  
  if (user) {
      // User is logged in
      loggedInElements.forEach(element => {
          if (element) element.style.display = 'block';
      });
      
      loggedOutElements.forEach(element => {
          if (element) element.style.display = 'none';
      });
  } else {
      // User is not logged in
      loggedInElements.forEach(element => {
          if (element) element.style.display = 'none';
      });
      
      loggedOutElements.forEach(element => {
          if (element) element.style.display = 'block';
      });
  }
}

auth.onAuthStateChanged(user => {
  currentUser = user;
  updateNavigation(user);
  if (user && !user.isAnonymous) loadSupercoins();
  updateCartCount();
  if (document.getElementById('home') && document.getElementById('home').classList.contains('active')) {
      loadHomeProducts();
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const dropdownToggle = document.querySelector('.dropdown-toggle');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  
  if (dropdownToggle && dropdownMenu) {
      dropdownToggle.addEventListener('click', function() {
          dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
      });
      
      document.addEventListener('click', function(event) {
          if (!event.target.matches('.dropdown-toggle') && !event.target.closest('.dropdown-menu')) {
              dropdownMenu.style.display = 'none';
          }
      });
  }

  // Show the home section by default, but don't load products yet
  showSection('home');
  document.getElementById('homeProducts').innerHTML = ""; // Clear any initial content
});

