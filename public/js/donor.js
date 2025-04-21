// Donor interface functionality

// DOM Elements
const donationForm = document.getElementById('donationForm');
const activeDonationsList = document.getElementById('activeDonationsList');
const donationHistoryList = document.getElementById('donationHistoryList');

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

// Handle donation form submission
if (donationForm) {
    donationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('User not authenticated');

            const donation = {
                foodType: donationForm.foodType.value,
                quantity: parseInt(donationForm.quantity.value),
                expiryDate: donationForm.expiryDate.value,
                pickupAddress: donationForm.pickupAddress.value,
                pickupTime: donationForm.pickupTime.value,
                notes: donationForm.notes.value,
                status: 'active',
                donorId: user.uid,
                donorEmail: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('donations').add(donation);
            
            // Reset form and show success message
            donationForm.reset();
            alert('Donation posted successfully!');
            
            // Refresh active donations list
            loadActiveDonations();
        } catch (error) {
            console.error('Error posting donation:', error);
            alert('Error posting donation: ' + error.message);
        }
    });
}

// Load active donations
async function loadActiveDonations() {
    if (!activeDonationsList) return;
    
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User not authenticated');

        const snapshot = await db.collection('donations')
            .where('donorId', '==', user.uid)
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc')
            .get();

        activeDonationsList.innerHTML = '';
        
        if (snapshot.empty) {
            activeDonationsList.innerHTML = '<p>No active donations found.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const donation = doc.data();
            const card = createDonationCard(doc.id, donation);
            activeDonationsList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading active donations:', error);
        activeDonationsList.innerHTML = '<p>Error loading donations.</p>';
    }
}

// Load donation history
async function loadDonationHistory() {
    if (!donationHistoryList) return;
    
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User not authenticated');

        const snapshot = await db.collection('donations')
            .where('donorId', '==', user.uid)
            .where('status', 'in', ['completed', 'cancelled'])
            .orderBy('createdAt', 'desc')
            .get();

        donationHistoryList.innerHTML = '';
        
        if (snapshot.empty) {
            donationHistoryList.innerHTML = '<p>No donation history found.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const donation = doc.data();
            const card = createDonationCard(doc.id, donation);
            donationHistoryList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading donation history:', error);
        donationHistoryList.innerHTML = '<p>Error loading donation history.</p>';
    }
}

// Create donation card element
function createDonationCard(id, donation) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const statusClass = {
        'active': 'status-active',
        'claimed': 'status-claimed',
        'completed': 'status-completed',
        'cancelled': 'status-cancelled'
    }[donation.status] || '';

    card.innerHTML = `
        <h3>${donation.foodType}</h3>
        <p><strong>Quantity:</strong> ${donation.quantity}</p>
        <p><strong>Expiry Date:</strong> ${new Date(donation.expiryDate).toLocaleDateString()}</p>
        <p><strong>Pickup Time:</strong> ${new Date(donation.pickupTime).toLocaleString()}</p>
        <p><strong>Status:</strong> <span class="${statusClass}">${donation.status}</span></p>
        ${donation.status === 'active' ? `
            <button onclick="cancelDonation('${id}')">Cancel Donation</button>
        ` : ''}
    `;

    return card;
}

// Cancel donation
async function cancelDonation(donationId) {
    if (!confirm('Are you sure you want to cancel this donation?')) return;

    try {
        await db.collection('donations').doc(donationId).update({
            status: 'cancelled',
            cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Donation cancelled successfully!');
        loadActiveDonations();
        loadDonationHistory();
    } catch (error) {
        console.error('Error cancelling donation:', error);
        alert('Error cancelling donation: ' + error.message);
    }
}

// Real-time updates for donation status changes
function setupDonationStatusListener() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    db.collection('donations')
        .where('donorId', '==', user.uid)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified') {
                    loadActiveDonations();
                    loadDonationHistory();
                }
            });
        });
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadActiveDonations();
    loadDonationHistory();
    setupDonationStatusListener();
});