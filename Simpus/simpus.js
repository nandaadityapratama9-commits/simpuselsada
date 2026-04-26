// Data Storage menggunakan LocalStorage
let users = JSON.parse(localStorage.getItem('libraryUsers')) || [];
let books = JSON.parse(localStorage.getItem('libraryBooks')) || [];
let loans = JSON.parse(localStorage.getItem('libraryLoans')) || [];
let currentUser = null;
let editingBookId = null;


// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const authModal = document.getElementById('authModal');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const searchInput = document.getElementById('searchInput');
const profileBtn = document.getElementById('profileBtn');
const logoutBtn = document.getElementById('logoutBtn');
const bookModal = document.getElementById('bookModal');
const addBookForm = document.getElementById('addBookForm');
const profileForm = document.getElementById('profileForm');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    hideLoading();
    checkAuthStatus();
    setupEventListeners();
    if (currentUser) {
        loadUserData();
        showDashboardStats();
        renderBooks();
        renderLoans();
        renderRecentActivity();
    }
});

// Loading Animation
function hideLoading() {
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 2000);
}

// Auth Functions
function checkAuthStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
        updateHeader();
    } else {
        showAuthModal();
    }
}

function showAuthModal() {
    authModal.classList.add('active');
}

function hideAuthModal() {
    authModal.classList.remove('active');
}

function showMainApp() {
    authModal.classList.remove('active');
    mainApp.classList.remove('hidden');
    setTimeout(() => {
        mainApp.style.opacity = '1';
        mainApp.style.transform = 'translateY(0)';
    }, 100);
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tab + 'Form').classList.add('active');
}

// Login Handler
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showMainApp();
        updateHeader();
        showDashboardStats();
        renderBooks();
        renderLoans();
        renderRecentActivity();
        addActivity('login', `${user.name} berhasil login`);
    } else {
        alert('Email atau password salah!');
    }
});

// Register Handler
registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    if (users.find(u => u.email === email)) {
        alert('Email sudah terdaftar!');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        name,
        username,
        email,
        password,
        phone: '',
        avatar: '',
        joined: new Date().toLocaleDateString('id-ID')
    };
    
    users.push(newUser);
    localStorage.setItem('libraryUsers', JSON.stringify(users));
    
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    showMainApp();
    updateHeader();
    showDashboardStats();
    renderBooks();
    renderLoans();
    renderRecentActivity();
    addActivity('register', `${name} berhasil mendaftar`);
    
    alert('Pendaftaran berhasil! Selamat datang di LibraTech.');
});

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const page = this.getAttribute('data-page');
        
        // Update active nav
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        // Show page
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page).classList.add('active');
        
        // Load page data
        switch(page) {
            case 'dashboard':
                showDashboardStats();
                renderRecentActivity();
                break;
            case 'books':
                renderBooks();
                break;
            case 'loans':
                renderLoans();
                break;
            case 'add-book':
                break;
            case 'profile':
                loadProfileData();
                break;
        }
    });
});

// Search Functionality
searchInput.addEventListener('input', function() {
    renderBooks();
});

// Books Management
addBookForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const book = {
        id: Date.now(),
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        publisher: document.getElementById('bookPublisher').value,
        year: document.getElementById('bookYear').value,
        isbn: document.getElementById('bookISBN').value,
        stock: parseInt(document.getElementById('bookStock').value),
        available: parseInt(document.getElementById('bookStock').value),
        addedBy: currentUser.id,
        addedDate: new Date().toLocaleDateString('id-ID')
    };
    
    books.push(book);
    localStorage.setItem('libraryBooks', JSON.stringify(books));
    
    addBookForm.reset();
    renderBooks();
    showDashboardStats();
    addActivity('add_book', `${currentUser.name} menambahkan buku "${book.title}"`);
    
    alert('Buku berhasil ditambahkan!');
});

// Profile Management
profileForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    currentUser.name = document.getElementById('profileName').value;
    currentUser.username = document.getElementById('profileUsername').value;
    currentUser.email = document.getElementById('profileEmail').value;
    currentUser.phone = document.getElementById('profilePhone').value;
    
    // Update in users array
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('libraryUsers', JSON.stringify(users));
    }
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateHeader();
    addActivity('update_profile', `${currentUser.name} memperbarui profil`);
    
    alert('Profil berhasil diperbarui!');
});

// Loan Management
function borrowBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book || book.available <= 0) {
        alert('Buku tidak tersedia!');
        return;
    }
    
    const loan = {
        id: Date.now(),
        bookId,
        userId: currentUser.id,
        borrowDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        status: 'active'
    };
    
    loans.push(loan);
    book.available--;
    localStorage.setItem('libraryBooks', JSON.stringify(books));
    localStorage.setItem('libraryLoans', JSON.stringify(loans));
    
    renderBooks();
    renderLoans();
    showDashboardStats();
    addActivity('borrow', `${currentUser.name} meminjam "${book.title}"`);
    
    alert('Buku berhasil dipinjam! Harap dikembalikan dalam 14 hari.');
}

function returnBook(loanId) {
    const loan = loans.find(l => l.id == loanId);
    if (!loan || loan.status !== 'active') return;
    
    const book = books.find(b => b.id === loan.bookId);
    if (book) {
        book.available++;
    }
    
    loan.status = 'returned';
    loan.returnDate = new Date().toISOString();
    
    localStorage.setItem('libraryBooks', JSON.stringify(books));
    localStorage.setItem('libraryLoans', JSON.stringify(loans));
    
    renderBooks();
    renderLoans();
    showDashboardStats();
    addActivity('return', `${currentUser.name} mengembalikan buku`);
    
    alert('Buku berhasil dikembalikan!');
}

// Rendering Functions
function renderBooks(filteredBooks = null) {
    const container = document.getElementById('booksList');
    const searchTerm = searchInput.value.toLowerCase();
    let booksToShow = filteredBooks || books;
    
    if (searchTerm) {
        booksToShow = books.filter(book => 
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm)
        );
    }
    
    container.innerHTML = booksToShow.map(book => `
        <div class="book-card" onclick="showBookModal(${book.id})">
            <h3>${book.title}</h3>
            <p><strong>Penulis:</strong> ${book.author}</p>
            <p><strong>Penerbit:</strong> ${book.publisher}</p>
            <p><strong>Tahun:</strong> ${book.year}</p>
            <p><strong>Stok Tersedia:</strong> ${book.available}/${book.stock}</p>
            <div class="book-actions">
                ${book.available > 0 ? 
                    `<button class="btn-small btn-borrow" onclick="event.stopPropagation(); borrowBook(${book.id})">
                        <i class="fas fa-hand-holding"></i> Pinjam
                    </button>` : 
                    `<span class="stock-out">Stok Habis</span>`
                }
            </div>
        </div>
    `).join('');
}

function renderLoans() {
    const activeLoansList = document.getElementById('activeLoansList');
    const loanHistoryList = document.getElementById('loanHistoryList');
    
    const userLoans = loans.filter(loan => loan.userId === currentUser.id);
    const activeLoans = userLoans.filter(loan => loan.status === 'active');
    const returnedLoans = userLoans.filter(loan => loan.status === 'returned');
    
    activeLoansList.innerHTML = activeLoans.map(loan => {
        const book = books.find(b => b.id === loan.bookId);
        const dueDate = new Date(loan.dueDate).toLocaleDateString('id-ID');
        return `
            <div class="loan-item">
                <div>
                    <strong>${book ? book.title : 'Buku tidak ditemukan'}</strong>
                    <br><small>Pinjam: ${new Date(loan.borrowDate).toLocaleDateString('id-ID')}</small>
                    <br><small>Tenggat: ${dueDate}</small>
                </div>
                <button class="btn-small btn-return" onclick="returnBook(${loan.id})">
                    <i class="fas fa-undo"></i> Kembalikan
                </button>
            </div>
        `;
    }).join('');
    
    loanHistoryList.innerHTML = returnedLoans.slice(-5).map(loan => {
        const book = books.find(b => b.id === loan.bookId);
        return `
            <div class="loan-item">
                <div>
                    <strong>${book ? book.title : 'Buku tidak ditemukan'}</strong>
                    <br><small>Pinjam: ${new Date(loan.borrowDate).toLocaleDateString('id-ID')}</small>
                    <br><small>Kembali: ${new Date(loan.returnDate).toLocaleDateString('id-ID')}</small>
                </div>
                <span class="status returned"><i class="fas fa-check"></i> Selesai</span>
            </div>
        `;
    }).join('');
}

function showDashboardStats() {
    document.getElementById('totalBooks').textContent = books.length;
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('activeLoans').textContent = loans.filter(l => l.status === 'active').length;
    document.getElementById('returnedBooks').textContent = loans.filter(l => l.status === 'returned').length;
}

function renderRecentActivity() {
    const container = document.getElementById('recentActivityList');
    const activities = JSON.parse(localStorage.getItem('libraryActivities')) || [];
    const recentActivities = activities.slice(-5).reverse();
    
    container.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            </div>
            <div>
                <strong>${activity.message}</strong>
                <br><small>${new Date(activity.timestamp).toLocaleString('id-ID')}</small>
            </div>
        </div>
    `).join('');
}

function addActivity(type, message) {
    const activities = JSON.parse(localStorage.getItem('libraryActivities')) || [];
    activities.push({
        type,
        message,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('libraryActivities', JSON.stringify(activities.slice(-50))); // Keep last 50
}

function getActivityIcon(type) {
    const icons = {
        login: 'sign-in-alt',
        register: 'user-plus',
        add_book: 'book',
        borrow: 'hand-holding',
        return: 'undo',
        update_profile: 'user-edit'
    };
    return icons[type] || 'info-circle';
}

// Profile Functions
function loadProfileData() {
    document.getElementById('profileName').value = currentUser.name;
    document.getElementById('profileUsername').value = currentUser.username;
    document.getElementById('profileEmail').value = currentUser.email;
    document.getElementById('profilePhone').value = currentUser.phone || '';
}

function loadUserData() {
    document.getElementById('userNameHeader').textContent = currentUser.name;
}

function updateHeader() {
    document.getElementById('userNameHeader').textContent = currentUser.name;
}

// Modal Functions
function showBookModal(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    document.getElementById('bookModalContent').innerHTML = `
        <div class="book-details">
            <h2>${book.title}</h2>
            <p style="font-size: 1.2rem; color: #666;">${book.author}</p>
        </div>
        <div class="book-meta">
            <div class="book-meta-item">
                <strong>Penerbit</strong>
                ${book.publisher}
            </div>
            <div class="book-meta-item">
                <strong>Tahun</strong>
                ${book.year}
            </div>
            <div class="book-meta-item">
                <strong>ISBN</strong>
                ${book.isbn || 'Tidak tersedia'}
            </div>
            <div class="book-meta-item">
                <strong>Stok</strong>
                ${book.available}/${book.stock}
            </div>
            <div class="book-meta-item">
                <strong>Ditambahkan</strong>
                ${book.addedDate}
            </div>
        </div>
        ${book.available > 0 ? 
            `<div style="text-align: center; margin-top: 2rem;">
                <button class="btn-primary" onclick="borrowBook(${book.id})" style="width: 200px;">
                    <i class="fas fa-hand-holding"></i> Pinjam Buku Ini
                </button>
            </div>` : 
            `<div style="text-align: center; margin-top: 2rem; color: #ff6b6b;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3>Stok Buku Habis</h3>
            </div>`
        }
    `;
    
    bookModal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

// Event Listeners Setup
function setupEventListeners() {
    // Close buttons
    document.getElementById('closeAuth').onclick = () => hideAuthModal();
    document.querySelector('#bookModal .close-btn').onclick = () => closeModal(bookModal);
    
    // Close modals on outside click
    window.onclick = function(event) {
        if (event.target === authModal) hideAuthModal();
        if (event.target === bookModal) closeModal(bookModal);
    };
    
    // Logout
    logoutBtn.onclick = function() {
        localStorage.removeItem('currentUser');
        currentUser = null;
        location.reload();
    };
    
    // Profile button
    profileBtn.onclick = () => {
        document.querySelector('.nav-link[data-page="profile"]').click();
    };
}

// Close modals with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        hideAuthModal();
        closeModal(bookModal);
    }
});

// Auto-hide loading after login animation
setTimeout(() => {
    if (loadingScreen.style.display !== 'none') {
        hideLoading();
    }
}, 3000);
// Update profile display dari form
function updateProfileDisplay() {
    document.getElementById('profileNameDisplay').textContent = document.getElementById('profileName').value || 'Nama Pengguna';
    document.getElementById('profileEmailDisplay').textContent = document.getElementById('profileEmail').value || 'email@example.com';
    document.getElementById('profilePhoneDisplay').textContent = document.getElementById('profilePhone').value || '+62 812-3456-7890';
    document.getElementById('userNameHeader').textContent = document.getElementById('profileName').value || 'Pengguna';
}

// Event listener untuk profile form
document.getElementById('profileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    updateProfileDisplay();
    alert('✅ Profil berhasil diupdate!');
});
// Tambahkan fungsi ini di bagian atas setelah data storage
let activities = JSON.parse(localStorage.getItem('libraryActivities')) || [];

// Update fungsi addActivity yang sudah ada
function addActivity(type, message) {
    const activity = {
        id: Date.now(),
        type,
        message,
        timestamp: new Date().toISOString(),
        userId: currentUser ? currentUser.id : null,
        userName: currentUser ? currentUser.name : 'Sistem'
    };
    
    activities.unshift(activity); // Tambah di awal array (recent first)
    activities = activities.slice(0, 50); // Keep only last 50 activities
    
    localStorage.setItem('libraryActivities', JSON.stringify(activities));
    renderRecentActivity(); // Auto render setelah ditambah
}

// Update fungsi renderRecentActivity
function renderRecentActivity() {
    const container = document.getElementById('recentActivityList');
    if (!container) return;
    
    const recentActivities = activities.slice(0, 10); // Show 10 latest
    
    container.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${getActivityColor(activity.type)}">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-message">${activity.message}</div>
                <div class="activity-time">
                    <small>${formatTimeAgo(activity.timestamp)}</small>
                </div>
            </div>
        </div>
    `).join('');
    
    // Jika tidak ada aktivitas
    if (recentActivities.length === 0) {
        container.innerHTML = `
            <div class="activity-item empty">
                <i class="fas fa-clock"></i>
                <div>Belum ada aktivitas</div>
            </div>
        `;
    }
}

// Tambahkan helper functions untuk aktivitas
function getActivityIcon(type) {
    const icons = {
        login: 'sign-in-alt',
        register: 'user-plus',
        add_book: 'plus-circle',
        borrow: 'hand-holding',
        return: 'undo-alt',
        update_profile: 'user-edit',
        delete_book: 'trash-alt',
        edit_book: 'edit'
    };
    return icons[type] || 'info-circle';
}

function getActivityColor(type) {
    const colors = {
        login: 'bg-green-100 text-green-600',
        register: 'bg-blue-100 text-blue-600',
        add_book: 'bg-indigo-100 text-indigo-600',
        borrow: 'bg-orange-100 text-orange-600',
        return: 'bg-green-100 text-green-600',
        update_profile: 'bg-purple-100 text-purple-600',
        delete_book: 'bg-red-100 text-red-600',
        edit_book: 'bg-yellow-100 text-yellow-600'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now - activityTime;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    
    return activityTime.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// === UPDATE SEMUA EVENT HANDLERS DENGAN AKTIVITAS ===

// 1. LOGIN - Sudah ada, tapi diperbaiki
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showMainApp();
        updateHeader();
        showDashboardStats();
        renderBooks();
        renderLoans();
        renderRecentActivity();
        addActivity('login', `🔐 <strong>${user.name}</strong> berhasil login`);
    } else {
        alert('Email atau password salah!');
    }
});

// 2. REGISTER - Sudah ada, diperbaiki
registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    if (users.find(u => u.email === email)) {
        alert('Email sudah terdaftar!');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        name,
        username,
        email,
        password,
        phone: '',
        avatar: '',
        joined: new Date().toLocaleDateString('id-ID')
    };
    
    users.push(newUser);
    localStorage.setItem('libraryUsers', JSON.stringify(users));
    
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    showMainApp();
    updateHeader();
    showDashboardStats();
    renderBooks();
    renderLoans();
    renderRecentActivity();
    addActivity('register', `👤 <strong>${name}</strong> berhasil bergabung`);
    
    alert('Pendaftaran berhasil! Selamat datang di LibraTech.');
});

// 3. ADD BOOK - Sudah ada, diperbaiki
addBookForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const book = {
        id: Date.now(),
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        publisher: document.getElementById('bookPublisher').value,
        year: document.getElementById('bookYear').value,
        isbn: document.getElementById('bookISBN').value,
        stock: parseInt(document.getElementById('bookStock').value),
        available: parseInt(document.getElementById('bookStock').value),
        addedBy: currentUser.id,
        addedDate: new Date().toLocaleDateString('id-ID')
    };
    
    books.push(book);
    localStorage.setItem('libraryBooks', JSON.stringify(books));
    
    addBookForm.reset();
    renderBooks();
    showDashboardStats();
    renderRecentActivity();
    addActivity('add_book', `📚 <strong>${currentUser.name}</strong> menambahkan buku "${book.title}"`);
    
    alert('Buku berhasil ditambahkan!');
});

// 4. PROFILE UPDATE - Sudah ada, diperbaiki
profileForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const oldName = currentUser.name;
    currentUser.name = document.getElementById('profileName').value;
    currentUser.username = document.getElementById('profileUsername').value;
    currentUser.email = document.getElementById('profileEmail').value;
    currentUser.phone = document.getElementById('profilePhone').value;
    
    // Update in users array
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('libraryUsers', JSON.stringify(users));
    }
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateHeader();
    renderRecentActivity();
    addActivity('update_profile', `✏️ <strong>${oldName}</strong> memperbarui profil`);
    
    alert('Profil berhasil diperbarui!');
});

// 5. BORROW BOOK - Sudah ada, diperbaiki
function borrowBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book || book.available <= 0) {
        alert('Buku tidak tersedia!');
        return;
    }
    
    const loan = {
        id: Date.now(),
        bookId,
        userId: currentUser.id,
        borrowDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
    };
    
    loans.push(loan);
    book.available--;
    localStorage.setItem('libraryBooks', JSON.stringify(books));
    localStorage.setItem('libraryLoans', JSON.stringify(loans));
    
    renderBooks();
    renderLoans();
    showDashboardStats();
    renderRecentActivity();
    addActivity('borrow', `📖 <strong>${currentUser.name}</strong> meminjam "${book.title}"`);
    
    alert('Buku berhasil dipinjam! Harap dikembalikan dalam 14 hari.');
}

// 6. RETURN BOOK - Sudah ada, diperbaiki
function returnBook(loanId) {
    const loan = loans.find(l => l.id == loanId);
    if (!loan || loan.status !== 'active') return;
    
    const book = books.find(b => b.id === loan.bookId);
    if (book) {
        book.available++;
    }
    
    loan.status = 'returned';
    loan.returnDate = new Date().toISOString();
    
    localStorage.setItem('libraryBooks', JSON.stringify(books));
    localStorage.setItem('libraryLoans', JSON.stringify(loans));
    
    renderBooks();
    renderLoans();
    showDashboardStats();
    renderRecentActivity();
    addActivity('return', `✅ <strong>${currentUser.name}</strong> mengembalikan "${book ? book.title : 'buku'}"`);
    
    alert('Buku berhasil dikembalikan!');
}

// 7. LOGOUT - Tambahkan aktivitas
logoutBtn.onclick = function() {
    addActivity('logout', `🚪 <strong>${currentUser.name}</strong> logout`);
    localStorage.removeItem('currentUser');
    currentUser = null;
    location.reload();
};

// 8. TAMBAHKAN FUNGSI DELETE BOOK (BONUS)
function deleteBook(bookId) {
    if (!confirm('Yakin ingin menghapus buku ini?')) return;
    
    const book = books.find(b => b.id === bookId);
    books = books.filter(b => b.id !== bookId);
    
    // Hapus pinjaman terkait
    loans = loans.filter(l => l.bookId !== bookId);
    
    localStorage.setItem('libraryBooks', JSON.stringify(books));
    localStorage.setItem('libraryLoans', JSON.stringify(loans));
    
    renderBooks();
    showDashboardStats();
    renderRecentActivity();
    addActivity('delete_book', `🗑️ <strong>${currentUser.name}</strong> menghapus "${book.title}"`);
    
    alert('Buku berhasil dihapus!');
}

// Update fungsi renderBooks untuk menambahkan tombol delete (admin only)
function renderBooks(filteredBooks = null) {
    const container = document.getElementById('booksList');
    const searchTerm = searchInput.value.toLowerCase();
    let booksToShow = filteredBooks || books;
    
    if (searchTerm) {
        booksToShow = books.filter(book => 
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm)
        );
    }
    
    container.innerHTML = booksToShow.map(book => `
        <div class="book-card" onclick="showBookModal(${book.id})">
            <h3>${book.title}</h3>
            <p><strong>Penulis:</strong> ${book.author}</p>
            <p><strong>Penerbit:</strong> ${book.publisher}</p>
            <p><strong>Tahun:</strong> ${book.year}</p>
            <p><strong>Stok Tersedia:</strong> <span class="stock-count">${book.available}/${book.stock}</span></p>
            <div class="book-actions">
                ${book.available > 0 ? 
                    `<button class="btn-small btn-borrow" onclick="event.stopPropagation(); borrowBook(${book.id})">
                        <i class="fas fa-hand-holding"></i> Pinjam
                    </button>` : 
                    `<span class="stock-out">Stok Habis</span>`
                }
                <button class="btn-small btn-danger" onclick="event.stopPropagation(); deleteBook(${book.id})" title="Hapus Buku">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// 9. Load activities saat init
function initActivities() {
    activities = JSON.parse(localStorage.getItem('libraryActivities')) || [];
    renderRecentActivity();
}

// Update DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    hideLoading();
    checkAuthStatus();
    setupEventListeners();
    initActivities(); // Tambahkan ini
    
    if (currentUser) {
        loadUserData();
        showDashboardStats();
        renderBooks();
        renderLoans();
        renderRecentActivity();
    }
});

// Update dashboard navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const page = this.getAttribute('data-page');
        
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page).classList.add('active');
        
        switch(page) {
            case 'dashboard':
                showDashboardStats();
                renderRecentActivity();
                break;
            case 'books':
                renderBooks();
                break;
            case 'loans':
                renderLoans();
                break;
            case 'add-book':
                break;
            case 'profile':
                loadProfileData();
                break;
        }
    });
});