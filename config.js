import firebase from 'firebase';
require('@firebase/firestore');

var firebaseConfig = {
    apiKey: "AIzaSyCbdx--8OIFszG7cAt7bVv1KMpBRQgltvk",
    authDomain: "c71willyapp.firebaseapp.com",
    databaseURL: "https://c71willyapp.firebaseio.com",
    projectId: "c71willyapp",
    storageBucket: "c71willyapp.appspot.com",
    messagingSenderId: "377580050497",
    appId: "1:377580050497:web:23e72336539e51363d0ec0"
};

  // Initialize Firebase
firebase.initializeApp(firebaseConfig);

export default firebase.firestore();
