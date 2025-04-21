// Admin dashboard functionality

// DOM Elements
const totalUsers = document.getElementById('totalUsers');
const donorCount = document.getElementById('donorCount');
const volunteerCount = document.getElementById('volunteerCount');
const activeDonations = document.getElementById('activeDonations');
const completedRescues = document.getElementById('completedRescues');
const foodSaved = document.getElementById('foodSaved');
const usersList = document.getElementById('usersList');
const donationsList = document.getElementById('donationsList');

// Navigation functionality
document.querySelectorAll('.dashboard-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(targetId).classList.remove('hidden');
        
        // Update active menu item
        document.querySelectorAll('.dashboard-menu li').forEach(item => {
            item.classList.remove('active');
        });
        e.target.parentElement.classList.add('active');
    });
});

// Load overview statistics
async function loadOverviewStats() {
    try {
        // Get user statistics
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => doc.data());
        
        const donors = users.filter(user => user.role === 'donor');
        const volunteers = users.filter(user => user.role === 'volunteer');
        
        totalUsers.textContent = users.length;
        donorCount.textContent = donors.length;
        volunteerCount.textContent = volunteers.length;

        // Get donation statistics
        const donationsSnapshot = await db.collection('donations').get();
        const donations = donationsSnapshot.docs.map(doc => doc.data());
        
        const active = donations.filter(d => d.status === 'active').length;
        const completed = donations.filter(d => d.status === 'completed').length;
        const totalQuantity = donations
            .filter(d => d.status === 'completed')
            .reduce((sum, d) => sum + (d.quantity || 0), 0);
        
        activeDonations.textContent = active;
        completedRescues.textContent = completed;
        foodSaved.textContent = totalQuantity;

    } catch (error) {
        console.error('Error loading overview stats:', error);
    }
}

// Load users list
async function loadUsers() {
    if (!usersList) return;

    try {
        const snapshot = await db.collection('users').get();
        usersList.innerHTML = '';

        snapshot.forEach(doc => {
            const user = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${new Date(user.createdAt.toDate()).toLocaleDateString()}</td>
                <td>${user.status || 'active'}</td>
                <td>
                    <button onclick="toggleUserStatus('${doc.id}', '${user.status || 'active'}')"
                            class="${user.status === 'suspended' ? 'activate-btn' : 'suspend-btn'}">
                        ${user.status === 'suspended' ? 'Activate' : 'Suspend'}
                    </button>
                </td>
            `;
            usersList.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        usersList.innerHTML = '<tr><td colspan="5">Error loading users.</td></tr>';
    }
}

// Load donations list
async function loadDonations() {
    if (!donationsList) return;

    try {
        const snapshot = await db.collection('donations')
            .orderBy('createdAt', 'desc')
            .get();

        donationsList.innerHTML = '';

        snapshot.forEach(doc => {
            const donation = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(donation.createdAt.toDate()).toLocaleDateString()}</td>
                <td>${donation.donorEmail}</td>
                <td>${donation.foodType}</td>
                <td>${donation.quantity}</td>
                <td>${donation.status}</td>
                <td>
                    <button onclick="viewDonationDetails('${doc.id}')">View Details</button>
                    ${donation.status === 'active' ? 
                        `<button onclick="cancelDonation('${doc.id}')">Cancel</button>` : ''}
                </td>
            `;
            donationsList.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading donations:', error);
        donationsList.innerHTML = '<tr><td colspan="6">Error loading donations.</td></tr>';
    }
}

// Toggle user status (suspend/activate)
async function toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const confirmMessage = `Are you sure you want to ${newStatus === 'suspended' ? 'suspend' : 'activate'} this user?`;
    
    if (!confirm(confirmMessage)) return;

    try {
        await db.collection('users').doc(userId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        loadUsers();
    } catch (error) {
        console.error('Error updating user status:', error);
        alert('Error updating user status: ' + error.message);
    }
}

// View donation details
function viewDonationDetails(donationId) {
    // Implement modal or redirect to detailed view
    alert('Donation details view not implemented yet.');
}

// Cancel donation
async function cancelDonation(donationId) {
    if (!confirm('Are you sure you want to cancel this donation?')) return;

    try {
        await db.collection('donations').doc(donationId).update({
            status: 'cancelled',
            cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
            cancelledBy: 'admin'
        });
        
        loadDonations();
    } catch (error) {
        console.error('Error cancelling donation:', error);
        alert('Error cancelling donation: ' + error.message);
    }
}

// Generate reports
function generateReport() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }

    // Implement report generation logic
    alert('Report generation not implemented yet.');
}

// Real-time updates
function setupRealtimeListeners() {
    // Listen for user changes
    db.collection('users').onSnapshot(() => {
        loadOverviewStats();
        loadUsers();
    });

    // Listen for donation changes
    db.collection('donations').onSnapshot(() => {
        loadOverviewStats();
        loadDonations();
    });
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadOverviewStats();
    loadUsers();
    loadDonations();
    setupRealtimeListeners();
});