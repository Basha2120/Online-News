import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import firebaseConfig from './firebaseConfig.js';


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// Show message function
function showMessage(message, divId) {
    let messageDiv = document.getElementById(divId);
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;
    setTimeout(function() {
        messageDiv.style.opacity = 0;
        setTimeout(() => { messageDiv.style.display = "none"; }, 1000); // Hide after fade out
    }, 5000);
}


// Function to hide all sections
function hideAllSections() {
    document.getElementById('profilePage').style.display = 'none';
    document.getElementById('subscriptionPage').style.display = 'none';
}

// Sign Up Event Listener
const signUp = document.getElementById('submitSignUp');
signUp.addEventListener('click', (event) => {
    event.preventDefault();
    console.log('Sign Up button clicked'); // Debugging line
    const email = document.getElementById('rEmail').value;
    const password = document.getElementById('rPassword').value;
    const firstName = document.getElementById('fName').value;
    const lastName = document.getElementById('lName').value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log('Sign Up successful'); // Debugging line
            const user = userCredential.user;
            setDoc(doc(db, "users", user.uid), {
                firstName: firstName,
                lastName: lastName,
                email: email
            });
            showMessage('Registered successfully', 'signUpMessage');
            setTimeout(() => {
                document.getElementById('signup').style.display = 'none';
                document.getElementById('signIn').style.display = 'block';
            }, 2000);
        })
        .catch((error) => {
            console.error('Sign Up error:', error); // Debugging line
            showMessage(error.message, 'signUpMessage');
        });
});

// Close Sign Up Modal
document.getElementById('closeSignUp').addEventListener('click', () => {
    document.getElementById('signup').style.display = 'none';
});

// Sign In Event Listener
const signIn = document.getElementById('submitSignIn');
signIn.addEventListener('click', (event) => {
    event.preventDefault();
    console.log('Sign In button clicked'); // Debugging line
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log('Sign In successful'); // Debugging line
            const user = userCredential.user;
            getDoc(doc(db, "users", user.uid)).then((docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    document.getElementById('welcomeMessage').innerText = `Welcome, ${userData.firstName} ${userData.lastName}`;
                    document.getElementById('signOut').style.display = 'block';
                    document.getElementById('signup').style.display = 'none';
                    document.getElementById('signIn').style.display = 'none';
                    showSection('subscriptionPage');
                    showSection('profilePage');
                }
            });
        })
        .catch((error) => {
            console.error('Sign In error:', error); // Debugging line
            showMessage(error.message, 'signInMessage');
        });
});

// Close Sign In Modal
document.getElementById('closeSignIn').addEventListener('click', () => {
    document.getElementById('signIn').style.display = 'none';
});

// Show/hide Sign Out button based on auth state
onAuthStateChanged(auth, (user) => {
    const signOutBtn = document.getElementById('signOut');
    if (user) {
        signOutBtn.style.display = 'block';
    } else {
        signOutBtn.style.display = 'none';
    }
});

// Sign Out Event Listener for home page
const signOutButton = document.getElementById('signOut');
signOutButton.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.reload();
    });
});

// Navigation Links
document.getElementById('openSignUp').addEventListener('click', () => {
    document.getElementById('signup').style.display = 'block';
    document.getElementById('signIn').style.display = 'none';
});

document.getElementById('openSignIn').addEventListener('click', () => {
    document.getElementById('signup').style.display = 'none';
    document.getElementById('signIn').style.display = 'block';
});

document.getElementById('signUpButton').addEventListener('click', () => {
    document.getElementById('signup').style.display = 'block';
    document.getElementById('signIn').style.display = 'none';
});

document.getElementById('signInButton').addEventListener('click', () => {
    document.getElementById('signup').style.display = 'none';
    document.getElementById('signIn').style.display = 'block';
});

// Home Page Navigation
document.getElementById('homeLink').addEventListener('click', () => {
    console.log('Home link clicked'); // Debugging line
    hideAllSections();
    document.getElementById('homePage').style.display = 'block'; // Show the home page
});

// Subscription Page Navigation
document.getElementById('subscriptionLink').addEventListener('click', () => {
    console.log('Subscription link clicked'); // Debugging line
    if (auth.currentUser) {
       hideAllSections();
        document.getElementById('subscriptionPage').style.display = 'block';
    } else {
        alert('Please sign in to access the subscription page.');
    }
});
// Handle subscription form submission
document.getElementById('subscriptionForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const newspaper = document.getElementById('newspaper').value;
    const plan = document.getElementById('plan').value;

    // Get user data to include in the subscription
    getDoc(doc(db, "users", auth.currentUser.uid)).then((docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            const firstName = userData.firstName;
            const lastName = userData.lastName;

            setDoc(doc(db, "users", auth.currentUser.uid), {
                firstName: firstName,
                lastName: lastName,
                subscription: {
                    newspaper: newspaper,
                    plan: plan
                }
            }, { merge: true }).then(() => {
                showMessage('Subscription updated successfully', 'subscriptionMessage');
                document.getElementById('subscriptionPage').style.display = 'none';
                document.getElementById('paymentPage').style.display = 'block';
            }).catch((error) => {
                console.error('Subscription error:', error);
            });
        }
    });
});

 
// payment form
document.getElementById('paymentMethod').addEventListener('change', (event) => {
    const paymentMethod = event.target.value;
    const paymentDetails = document.getElementById('paymentDetails');
    paymentDetails.innerHTML = '';

    if (paymentMethod === 'UPI') {
        paymentDetails.innerHTML = `
           UPI ID
            <input type="text" id="upiId" required>
        `;
    } else if (paymentMethod === 'Card') {
        paymentDetails.innerHTML = `
            Card Number
            <input type="text" id="cardNumber"  required>
            Expiry Date
            <input type="text" id="expiryDate" required>
            CVV
            <input type="text" id="cvv"  required>
        `;
    }
});

document.getElementById('paymentForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    if (paymentMethod === 'UPI') {
        const upiId = document.getElementById('upiId').value;
        // Process UPI payment here
        console.log('Processing UPI payment for ID:', upiId);
    } else if (paymentMethod === 'Card') {
        const cardNumber = document.getElementById('cardNumber').value;
        const expiryDate = document.getElementById('expiryDate').value;
        const cvv = document.getElementById('cvv').value;
        // Process Card payment here
        console.log('Processing Card payment for number:', cardNumber);
    }
    showMessage('Payment successful', 'subscriptionMessage');
    document.getElementById('paymentPage').style.display = 'none';
});



// Profile Page Navigation
document.getElementById('profileLink').addEventListener('click', () => {
    console.log('Profile link clicked'); // Debugging line
    if (auth.currentUser) {
        hideAllSections();
        document.getElementById('profilePage').style.display = 'block';
        getDoc(doc(db, "users", auth.currentUser.uid)).then((docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                document.getElementById('profileInfo').innerText = `Name: ${userData.firstName} ${userData.lastName}\nEmail: ${userData.email}`;
                if (userData.subscription) {
                    document.getElementById('subscriptionDetails').style.display = 'block';
                    document.getElementById('subscriptionInfo').innerText = `Newspaper: ${userData.subscription.newspaper}\nPlan: ${userData.subscription.plan}`;
                } else {
                    document.getElementById('subscriptionDetails').style.display = 'block';
                }
            }
        });
    } else {
        alert('Please sign in to access the profile page.');
    }
});

// Close buttons for modals
document.getElementById('profileCloseButton').addEventListener('click', () => {
    document.getElementById('profilePage').style.display = 'none';
});

document.getElementById('subscriptionCloseButton').addEventListener('click', () => {
    document.getElementById('subscriptionPage').style.display = 'none';
});
