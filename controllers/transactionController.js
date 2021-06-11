const axios = require('axios');
const date = require('date-and-time');
const { diskStorage } = require('multer');
const admin = require('firebase-admin');
const serviceAccount = require('../keys/firebase-keyfile.json');


// let consumer_key = "EU5Z4OmEeB6HQnEgrdC9Au9sWtLSTABS";
// let consumer_secret = "BOVAe64FAxx4VMV1";
// let safaricom_pass_key = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
// let safaricom_business_shortcode = '174379';
// let url_auth = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
// let url_stk = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
// let auth_auth = "Basic " + Buffer.from(consumer_key + ":" + consumer_secret, "utf8").toString("base64");

let consumer_key = "Z0cCNOS6MghAoJKtMnn15lsTkWWYJtGX";
let consumer_secret = "g3AxtxAzt0zR78aJ";
let safaricom_pass_key = "21b31f2079dc3fe4431cefb846dd419a953517af3c1121545c0f3ea43ac28500";
let safaricom_business_shortcode = '4051171';
let url_auth = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
let url_stk = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
let auth_auth = "Basic " + Buffer.from(consumer_key + ":" + consumer_secret, "utf8").toString("base64");

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });

admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const initiateTransaction = (req, res) => {
    
    let accessToken = req.access_token;
    console.log(accessToken)
    let currentTimestamp = date.format(new Date(), "YYYYMMDDHHmmss")
    console.log(currentTimestamp);
    let password = safaricom_business_shortcode +""+ safaricom_pass_key +""+ currentTimestamp;
    let encodedPassword = Buffer.from(password, "utf8").toString("base64");

    let phoneNumber = req.body.phoneNumber;
    let amount = req.body.amount;
    let accountRef = req.body.accountRef;
    let lnmRequestBody = {
        "BusinessShortCode": "4051171",
        "Password": encodedPassword,
        "Timestamp": currentTimestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": phoneNumber,
        "PartyB": "4051171",
        "PhoneNumber": phoneNumber,
        "CallBackURL": "http://guineafowlproductions.co.ke/transactions/callback",
        "AccountReference": accountRef,
        "TransactionDesc": "Purchase Image"
    };

    let lnmHeaders = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '+accessToken
    };

    axios.post(url_stk, lnmRequestBody, {headers: lnmHeaders})
    .then((response) => {
        console.log("Tag1");
        console.log(response.data);
        res.json(response.data);
    })    
    .catch(err=>{
        console.log("Tag3");
        console.log(err);
        res.json(err.data);
    })
}

const auth = (req, res, next) => {
    axios.get(url_auth, {headers: {'Content-Type':'application/json', 'Authorization': auth_auth }})
    .then((response) => {
        // console.log(response.data.access_token);
        if(response.data.access_token){
            req.access_token = response.data.access_token
            next();
        }else{
            console.log("Tag4");
            res.json({err: "Error with response"})
        }
        // return response.data.access_token;
    }).catch(err =>{
        console.log("TAG5", err)
        res.json({err: err.response.statusText})
    })
}

const transactionCallback = (req, res) => {
    console.log(req.body)
    let payload = req.body.Body.stkCallback;
    
    let checkoutRequestID = payload.CheckoutRequestID
    let resultCode = payload.ResultCode;
    let resultDesc = payload.ResultDesc;
    let payloadMetaData = '';
    let receiptNumber = '';
    let amount = '';
    let transactionDate = '';
    let phoneNumber = '';

    if(resultCode == "0"){
        payloadMetaData = payload.CallbackMetadata.Item;
        receiptNumber = payloadMetaData[1].Value;
        amount = payloadMetaData[0].Value;
        transactionDate = payloadMetaData[3].Value;
        phoneNumber = payloadMetaData[4].Value;
    }else{
        payloadMetaData = 'null';
        receiptNumber = 'null';
        amount = 'null';
        transactionDate = 'null';
        phoneNumber = 'null';
    }

    console.log(resultCode);
    console.log(amount)
    // admin.initializeApp({
    //     credential: admin.credential.applicationDefault()
    // });
      
    // const db = admin.firestore();

    const db = admin.firestore();

    const docRef = db.collection('mpesaCallbacks').doc(checkoutRequestID);

    docRef.set({
        resultCode: resultCode,
        resultDesc: resultDesc,
        receiptNumber: receiptNumber,
        amount: amount,
        transactionDate: transactionDate,
        phoneNumber: phoneNumber
    }).then((result)=>{
        console.log(result)
        res.json(result)
    }).catch((err)=> {
        res.json(err)
        console.log(err)
    });
}

module.exports = {
    initiateTransaction,
    auth,
    transactionCallback
}
