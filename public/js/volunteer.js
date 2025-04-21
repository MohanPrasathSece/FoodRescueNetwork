// Volunteer interface functionality

// DOM Elements
const availableDonationsList = document.getElementById('availableDonationsList');
const scheduledPickupsList = document.getElementById('scheduledPickupsList');
const completedRescuesList = document.getElementById('completedRescuesList');
const claimModal = document.getElementById('claimModal');
const claimForm = document.getElementById('claimForm');

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

// Filter functionality
const locationFilter = document.getElementById('locationFilter');
const foodTypeFilter = document.getElementById('foodTypeFilter');

if (locationFilter) {
    locationFilter.addEventListener('input', loadAvailableDonations);
}

if (foodTypeFilter) {
    foodTypeFilter.addEventListener('change', loadAvailableDonations);
}

// Load available donations
async function loadAvailableDonations() {
    if (!availableDonationsList) return;
    
    try {
        let query = db.collection('donations')
            .where('status', '==', 'active')
            .orderBy('createdAt', 'desc');

        const snapshot = await query.get();
        availableDonationsList.innerHTML = '';
        
        if (snapshot.empty) {
            availableDonationsList.innerHTML = '<p>No available donations found.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const donation = doc.data();
            // Apply filters
            if (locationFilter && locationFilter.value && 
                !donation.pickupAddress.toLowerCase().includes(locationFilter.value.toLowerCase())) {
                return;
            }
            if (foodTypeFilter && foodTypeFilter.value && 
                donation.foodType.toLowerCase() !== foodTypeFilter.value.toLowerCase()) {
                return;
            }

            const card = createDonationCard(doc.id, donation);
            availableDonationsList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading available donations:', error);
        availableDonationsList.innerHTML = '<p>Error loading donations.</p>';
    }
}

// Load scheduled pickups
async function loadScheduledPickups() {
    if (!scheduledPickupsList) return;
    
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User not authenticated');

        const snapshot = await db.collection('donations')
            .where('volunteerId', '==', user.uid)
            .where('status', '==', 'claimed')
            .orderBy('pickupTime')
            .get();

        scheduledPickupsList.innerHTML = '';
        
        if (snapshot.empty) {
            scheduledPickupsList.innerHTML = '<p>No scheduled pickups found.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const donation = doc.data();
            const card = createPickupCard(doc.id, donation);
            scheduledPickupsList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading scheduled pickups:', error);
        scheduledPickupsList.innerHTML = '<p>Error loading pickups.</p>';
    }
}

// Load completed rescues
async function loadCompletedRescues() {
    if (!completedRescuesList) return;
    
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('User not authenticated');

        const snapshot = await db.collection('donations')
            .where('volunteerId', '==', user.uid)
            .where('status', '==', 'completed')
            .orderBy('completedAt', 'desc')
            .get();

        completedRescuesList.innerHTML = '';
        
        if (snapshot.empty) {
            completedRescuesList.innerHTML = '<p>No completed rescues found.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const donation = doc.data();
            const card = createRescueCard(doc.id, donation);
            completedRescuesList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading completed rescues:', error);
        completedRescuesList.innerHTML = '<p>Error loading rescues.</p>';
    }
}

// Create donation card element
function createDonationCard(id, donation) {
    const card = document.createElement('div');
    card.className = 'card';
    
    card.innerHTML = `
        <h3>${donation.foodType}</h3>
        <p><strong>Quantity:</strong> ${donation.quantity}</p>
        <p><strong>Expiry Date:</strong> ${new Date(donation.expiryDate).toLocaleDateString()}</p>
        <p><strong>Pickup Address:</strong> ${donation.pickupAddress}</p>
        <p><strong>Preferred Pickup Time:</strong> ${new Date(donation.pickupTime).toLocaleString()}</p>
        <p><strong>Notes:</strong> ${donation.notes || 'None'}</p>
        <button onclick="openClaimModal('${id}')">Claim Donation</button>
    `;

    return card;
}

// Create pickup card element
function createPickupCard(id, donation) {
    const card = document.createElement('div');
    card.className = 'card';
    
    card.innerHTML = `
        <h3>${donation.foodType}</h3>
        <p><strong>Pickup Time:</strong> ${new Date(donation.pickupTime).toLocaleString()}</p>
        <p><strong>Address:</strong> ${donation.pickupAddress}</p>
        <p><strong>Donor:</strong> ${donation.donorEmail}</p>
        <button onclick="markAsCompleted('${id}')">Mark as Completed</button>
        <button onclick="cancelClaim('${id}')">Cancel Claim</button>
    `;

    return card;
}

// Create rescue card element
function createRescueCard(id, donation) {
    const card = document.createElement('div');
    card.className = 'card';
    
    card.innerHTML = `
        <h3>${donation.foodType}</h3>
        <p><strong>Completed:</strong> ${new Date(donation.completedAt.toDate()).toLocaleString()}</p>
        <p><strong>Quantity:</strong> ${donation.quantity}</p>
        <p><strong>Donor:</strong> ${donation.donorEmail}</p>
    `;

    return card;
}

// Claim modal functionality
let currentDonationId = null;

function openClaimModal(donationId) {
    currentDonationId = donationId;
    claimModal.classList.remove('hidden');
}

function closeModal() {
    claimModal.classList.add('hidden');
    currentDonationId = null;
    claimForm.reset();
}

// Handle claim form submission
if (claimForm) {
    claimForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('User not authenticated');

            await db.collection('donations').doc(currentDonationId).update({
                status: 'claimed',
                volunteerId: user.uid,
                volunteerEmail: user.email,
                pickupTime: claimForm.pickupTime.value,
                transportMethod: claimForm.transportMethod.value,
                volunteerNotes: claimForm.notes.value,
                claimedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            closeModal();
            alert('Donation claimed successfully!');
            loadAvailableDonations();
            loadScheduledPickups();
        } catch (error) {
            console.error('Error claiming donation:', error);
            alert('Error claiming donation: ' + error.message);
        }
    });
}

// Mark donation as completed
async function markAsCompleted(donationId) {
    if (!confirm('Are you sure you want to mark this pickup as completed?')) return;

    try {
        await db.collection('donations').doc(donationId).update({
            status: 'completed',
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Pickup marked as completed!');
        loadScheduledPickups();
        loadCompletedRescues();
    } catch (error) {
        console.error('Error completing pickup:', error);
        alert('Error completing pickup: ' + error.message);
    }
}

// Cancel claim
async function cancelClaim(donationId) {
    if (!confirm('Are you sure you want to cancel this claim?')) return;

    try {
        await db.collection('donations').doc(donationId).update({
            status: 'active',
            volunteerId: firebase.firestore.FieldValue.delete(),
            volunteerEmail: firebase.firestore.FieldValue.delete(),
            transportMethod: firebase.firestore.FieldValue.delete(),
            volunteerNotes: firebase.firestore.FieldValue.delete(),
            claimedAt: firebase.firestore.FieldValue.delete()
        });
        
        alert('Claim cancelled successfully!');
        loadScheduledPickups();
        loadAvailableDonations();
    } catch (error) {
        console.error('Error cancelling claim:', error);
        alert('Error cancelling claim: ' + error.message);
    }
}

// Real-time updates for donation status changes
function setupDonationStatusListener() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    db.collection('donations')
        .where('volunteerId', '==', user.uid)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified') {
                    loadScheduledPickups();
                    loadCompletedRescues();
                }
            });
        });
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadAvailableDonations();
    loadScheduledPickups();
    loadCompletedRescues();
    setupDonationStatusListener();
});