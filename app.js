const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const validator = require("validator");
const helmet = require("helmet");
const dotenv = require("dotenv");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 8080;

dotenv.config();

app.use(express.static('build'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

const emailUsername = process.env.EMAILUSERNAME;
const emailPassword = process.env.EMAILPASSWORD;
const emailHost = process.env.EMAILHOST;

const contactEmail = nodemailer.createTransport({
    host: emailHost,
    port: 587,
    auth: {
        user: emailUsername,
        pass: emailPassword
    }
 });

 contactEmail.verify((error) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Ready to send");
    }
 });

 function getSanitizedString(dirtyString) {
    let cleanString = String(dirtyString);
    cleanString = validator.stripLow(dirtyString);
    cleanString = validator.blacklist(cleanString, "=/\<>`'");
    cleanString = validator.blacklist(cleanString, '"');
    cleanString = validator.escape(cleanString);
    return cleanString;
};

app.post("/contact", async (req, res) => {

    const token = getSanitizedString(req.body.token);
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLE_CAPTCHA_SECRET_KEY}&response=${token}`;

    try {
        const response = await axios.post(url);
        if (response.data.success) {
            const name = getSanitizedString(req.body.name) || "Unknown name";
            const email = getSanitizedString(req.body.email);
            const phone = getSanitizedString(req.body.phone);
            const message = getSanitizedString(req.body.message);
            const mail = {
                from: `"${name}" natasha@taradasi.com`,
                to: "natasha@taradasi.com",
                subject: "New Message",
                html: `
                    <h1>This is a new message from our website.</h1>
                    <p>Contact the client via phone or email indicated below.</p>
                    <p>Name: ${name}.</p>
                    <p>Phone: ${phone}.</p>
                    <p>Email: ${email}.</p>
                    <p>Message: ${message}.</p>
                    <p><em>This is an automated message. Do not reply directly in the email. Contact the client using the details above. </em></p>
                `
            };
            contactEmail.sendMail(mail, (error) => {
                if (error) {
                    res.json({status: "ERROR WHEN SENDING MESSAGE"});
                } else {
                    res.json({status: "Message sent"});
                }
            });
        } else {
            res.json({status: "Failure to pass Google reCaptcha test"});
        }
    } catch (error) {
        res.json({status: "Google reCaptcha Error"});
    }
});


app.listen(port, () => console.log(`Listening to port ${port}`));

