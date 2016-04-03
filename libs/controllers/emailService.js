var nodemailer = require('nodemailer');
var xoauth2 = require('xoauth2');
var path = require('path');
var templatesDir = path.resolve(__dirname, '..', '..', 'views/mailer');
var emailTemplates = require('email-templates');
var config = require('./../config');

var EmailAddressRequiredError = new Error('email address required');

var generator = xoauth2.createXOAuth2Generator({
    user: config.get('mailer:user'),
    clientId: config.get('mailer:clientId'),
    clientSecret: config.get('mailer:clientSecret'),
    refreshToken: config.get('mailer:refreshToken'),
    accessToken: config.get('mailer:accessToken'),
    timeout: config.get('mailer:timeout')
});

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        xoauth2: generator
    }
});

exports.sendOne = function (templateName, locals, fn) {
    if (!locals.email)  return fn(EmailAddressRequiredError);
    if (!locals.subject) return fn(EmailAddressRequiredError);
    emailTemplates(templatesDir, function (err, template) {
        if (err) return fn(err);
        template(templateName, locals, function (err, html, text) {
            if (err) return fn(err);

            var mailOptions = {
                from: config.get('mailer:defaultFromAddress'),
                to: locals.email,
                subject: locals.subject,
                html: html,
                generateTextFromHTML: true,
                text: text
            };

            transporter.sendMail(mailOptions, function (error, responseStatus) {
                if (error) return fn(error);
                return fn(null, responseStatus.message, html, text);
            });
        });
    });
};


