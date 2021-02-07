const axios = require('axios');
const date = require('date-and-time');

const initiateTransaction = (req, res) => {
    let consumer_key = "EU5Z4OmEeB6HQnEgrdC9Au9sWtLSTABS";
    let consumer_secret = "BOVAe64FAxx4VMV1";
    let safaricom_pass_key = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
    let safaricom_business_shortcode = '174379';
    let url_auth = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    let url_stk = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    let auth_auth = "Basic " + Buffer.from(consumer_key + ":" + consumer_secret, "utf8").toString("base64");

    axios.get(url_auth, {headers: {'Content-Type':'application/json', 'Authorization': auth_auth }})
    .then((response) => {
        console.log(response.data.access_token);
        return response.data.access_token;
    })
    .then((accessToken)=>{
        let currentTimestamp = date.format(new Date(), "YYYYMMDDHHmmss")
        console.log(currentTimestamp);
        let password = safaricom_business_shortcode +""+ safaricom_pass_key +""+ currentTimestamp;
        let encodedPassword = Buffer.from(password, "utf8").toString("base64");

        let phoneNumber = req.body.phoneNumber;
        let amount = req.body.amount;
        let lnmRequestBody = {
            "BusinessShortCode": "174379",
            "Password": encodedPassword,
            "Timestamp": currentTimestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phoneNumber,
            "PartyB": "174379",
            "PhoneNumber": phoneNumber,
            "CallBackURL": "http://34.67.233.142/fbtest/fbinit.php",
            "AccountReference": "Image Purchase",
            "TransactionDesc": "Purchase Image"
        };

        let lnmHeaders = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+accessToken
        };

        return axios.post(url_stk, lnmRequestBody, {headers: lnmHeaders})
    })
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

module.exports = {
    initiateTransaction
}