import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Alert, ToastAndroid} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { TextInput } from 'react-native-gesture-handler';
import firebase from 'firebase';
import db from '../config'

export default class TransactionScreen extends React.Component {
    constructor(){
        super();
        this.state={
            hasCameraPermissions : null,
            scanned : false,
            scannedBookId : '',
            scannedStudentId : '',
            buttonState : 'normal',
        }
    }

    getCameraPermissions = async(id)=>{
        const {status} = await Permissions.askAsync(Permissions.CAMERA);

        this.setState({
            /*status === "granted" is true when user has granted permission 
            status === "granted" is false when user has not granted the permission */
            hasCameraPermissions : status === "granted",
            buttonState : id,
            scanned : false
        })
    }

    checkStudentEligibilityForBookIssue= async()=>{
        const studentRef = await db.collection("students").where("studentId","==",this.state.scannedStudentId).get();
        var isStudentEligible = ""

        if(studentRef.docs.length == 0){
            this.setState({
                scannedStudentId: '',
                scannedBookId: ''
            })
            isStudentEligible = false;
            Alert.alert("The student id doesn't exist in the database");
        }

        else{
            studentRef.docs.map((doc)=>{
                var student = doc.data();
                if(student.numberOfBooksIssued < 2){
                    isStudentEligible = true;
                }

                else{
                    isStudentEligible = false;
                    Alert.alert("The student has already issued 2 books");
                    this.setState({
                        scannedBookId: '',
                        scannedStudentId: ''
                    })
                }
            })
        }

        return isStudentEligible;
    }

    checkStudentEligibilityForReturn= async()=>{
        const transactionRef = await db.collection("transactions").where("bookId","==",this.state.scannedBookId).limit(1).get();
        var isStudentEligible = ""

        transactionRef.docs.map((doc)=>{
            var lastBookTransaction = doc.data();
            if(lastBookTransaction.studentId === this.state.scannedStudentId){
                isStudentEligible = true;
            }

            else{
                isStudentEligible = false;
                Alert.alert("The book wasn't issued by this student");
                this.setState({
                    scannedBookId: '',
                    scannedStudentId: ''
                })
            }
        })

        return isStudentEligible;
    }

    checkBookEligibility= async()=>{
        const bookRef = await db.collection("books").where("bookId","==",this.state.scannedBookId).get();
        var transactionType = ""

        if(bookRef.docs.length == 0){
            transactionType = false;
            console.log(bookRef.docs.length);
        }

        else{
            bookRef.docs.map((doc)=>{
                var book = doc.data();
                if(book.bookAvailability){
                    transactionType = "Issue"
                }

                else{
                    transactionType = "Return"
                }
            })
        }

        return transactionType;
    }

    handleBarCodeScanned = async({type,data})=>{
        const {buttonState} = this.state;
        
        if(buttonState === "BookId"){
            this.setState({
                scanned : true,
                scannedBookId : data,
                buttonState : 'normal'
            })
        }

        else if(buttonState === "StudentId"){
            this.setState({
                scanned : true,
                scannedStudentId : data,
                buttonState : 'normal'
            })
        }
    }

    handleTransaction=async()=>{
        //verify if student is eligible for book issue or return
        //student exists in the database
        //issue: no of books issued <2
        //issue: verify book availability
        //return: last transaction => book issued by the same student id
        var transactionType = await this.checkBookEligibility();

        if(!transactionType){
            Alert.alert("This book doesn't exist in the library database");
            this.setState({
                scannedStudentId: '',
                scannedBookId: ''
            })
        }

        else if(transactionType === "Issue"){
            var isStudentEligible = await this.checkStudentEligibilityForBookIssue();

            if(isStudentEligible){
                this.initiateBookIssue();
                Alert.alert("Book issued to the student");
            }
        }

        else{
            var isStudentEligible = await this.checkStudentEligibilityForReturn();

            if(isStudentEligible){
                this.initiateBookReturn();
                Alert.alert("Book returned to the library");
            }
        }
    }

    initiateBookIssue=async()=>{
        //Add a transaction
        db.collection("transactions").add({
            'studentId': this.state.scannedStudentId,
            'bookId': this.state.scannedBookId,
            'date':firebase.firestore.Timestamp.now().toDate(),
            'transactionType': "Issue"
        })
        //Change book status
        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability': false
        })
        //Change number of issued books for student
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued': firebase.firestore.FieldValue.increment(1)
        })
        this.setState({
            scannedStudentId: '',
            scannedBookId: ''
        })
    }

    initiateBookReturn=async()=>{
        //Add a transaction
        db.collection("transactions").add({
            'studentId': this.state.scannedStudentId,
            'bookId': this.state.scannedBookId,
            'date':firebase.firestore.Timestamp.now().toDate(),
            'transactionType': "Return"
        })
        //Change book status
        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability': true
        })
        //Change number of issued books for student
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued': firebase.firestore.FieldValue.increment(-1)
        })
        this.setState({
            scannedStudentId: '',
            scannedBookId: ''
        })
    }

    render(){
        const hasCameraPermissions = this.state.hasCameraPermissions;
        const scanned = this.state.scanned;
        const buttonState = this.state.buttonState;

        if(buttonState !== "normal" && hasCameraPermissions){
            return(
                <BarCodeScanner
                    onBarCodeScanned = {scanned ? this.handleBarCodeScanned : undefined}
                    style = {StyleSheet.absoluteFillObject}
                />
            );
        }

        else if(buttonState === "normal"){
            return(
                <KeyboardAvoidingView style={styles.container} behavior = "padding" enabled>
                    <View>
                        <Image 
                            source = {require("../assets/booklogo.jpg")}
                            style = {{width:200, height:200}}
                        />
                        <Text style = {{textAlign:'center', fontSize:30}}>Wily</Text>
                    </View>

                    <View style = {styles.inputView}>
                        <TextInput 
                            style = {styles.inputBox}
                            placeholder = "Book Id"
                            value = {this.state.scannedBookId}
                            onChangeText={text=>this.setState({scannedBookId: text})}
                        />
                        <TouchableOpacity
                            style = {styles.scanButton}
                            onPress = {()=>{
                                this.getCameraPermissions("BookId")
                            }}
                        >
                            <Text style = {styles.buttonText}>Scan</Text>
                        </TouchableOpacity>
                    </View>

                    <View style = {styles.inputView}>
                        <TextInput 
                            style = {styles.inputBox}
                            placeholder = "Student Id"
                            value = {this.state.scannedStudentId}
                            onChangeText={text=>this.setState({scannedStudentId: text})}
                        />
                        <TouchableOpacity
                            style = {styles.scanButton}
                            onPress = {()=>{
                                this.getCameraPermissions("StudentId")
                            }}
                        >
                            <Text style = {styles.buttonText}>Scan</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        style = {styles.submitButton}
                        onPress = {async()=>{
                            this.handleTransaction()
                    }}>
                        <Text style = {styles.submitButtonText}>Submit</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            );
        }
    }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      padding: 10,
      margin: 10
    },
    buttonText:{
      fontSize: 15,
      textAlign: 'center',
      marginTop: 10
    },
    inputView:{
      flexDirection: 'row',
      margin: 20
    },
    inputBox:{
      width: 200,
      height: 40,
      borderWidth: 1.5,
      borderRightWidth: 0,
      fontSize: 20
    },
    scanButton:{
      backgroundColor: '#66BB6A',
      width: 50,
      borderWidth: 1.5,
      borderLeftWidth: 0
    },
    submitButton:{
        backgroundColor: '#FBC02D',
        width: 100,
        height: 50
    },
    submitButtonText:{
        padding: 10,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white'
    }
});
