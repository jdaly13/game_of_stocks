// app/routes.js
var User = require('../app/models/user');
module.exports = function(app, passport, crypto, async, nodemailer ) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', redirectToProfile, function(req, res, next) {     
        res.render('index.ejs',{
            message: req.flash('success')
        }); // load the index.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', redirectToProfile,  function(req, res) {
        // render the page and pass in any flash data if it exists
        
        res.render('login.ejs', { 
            message: req.flash('loginMessage')
        }); 
    });
    
    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // process the login form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    // app.post('/signup', do all our passport stuff here);

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        console.log(req.user)
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
    
    app.get('/forgot', function(req, res) {
        res.render('forgot.ejs', {
            user: req.user,
            message: req.flash('info')
        });
    });
    
    app.post('/forgot', function(req, res, next) {
      async.waterfall([
        function(done) {
          crypto.randomBytes(20, function(err, buf) {
            var token = buf.toString('hex');
            done(err, token);
          });
        },
        function(token, done) {
          User.findOne({ 'local.email': req.body.email }, function(err, user) {
             // console.log(req.body.email, err, user);
            if (!user) {
             // req.flash('error', 'No account with that email address exists.');
              //return done(null, false, req.flash('error', 'No account with that email address exists.'));
                return res.render('forgot.ejs', { 
                    message: 'No account with that email address exists.'
                });
            //  return res.redirect('/forgot');
            }

            user.local.resetPasswordToken = token;
            user.local.resetPasswordExpires = Date.now() + 3600000; // 1 hour
            user.save(function(err) {
                if (err) {console.log(err);}
              done(err, token, user);
            });
          });
        },
        function(token, user, done) {
          var smtpTransport = nodemailer.createTransport('SMTP', {
            service: 'SendGrid',
            auth: {
              user: 'jaimiedaly',
              pass: 'milkfat13'
            }
          });
          var mailOptions = {
            to: user.local.email,
            from: 'James Daly <jaimiedaly@gmail.com>',
            subject: 'Node.js Password Reset',
            text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
              'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
              'http://' + req.headers.host + '/reset/' + token + '\n\n' +
              'If you did not request this, please ignore this email and your password will remain unchanged.\n'
          };
            console.log(mailOptions);
          smtpTransport.sendMail(mailOptions, function(err) {
              if (err) {console.log(err)}
              console.log('success')
            req.flash('info', 'An e-mail has been sent to ' + user.local.email + ' with further instructions.');
            done(err, 'done');
          });
        }
      ], function(err) {
        if (err) return next(err);
        res.redirect('/forgot');
      });
    });
    
    app.get('/reset/:token', function(req, res) {
        console.log(req.params.token);
      User.findOne({ 'local.resetPasswordToken': req.params.token, 'local.resetPasswordExpires': { $gt: Date.now() } }, function(err, user) {
          console.log(err, user);
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('/forgot');
        }
        res.render('reset.ejs', {
          user: req.user,
          message: false
        });
      });
    });
    
    app.post('/reset/:token', function(req, res) {
        console.log(req, res)
      async.waterfall([
        function(done) {
          User.findOne({ 'local.resetPasswordToken': req.params.token, 'local.resetPasswordExpires': { $gt: Date.now() } }, function(err, user) {
              console.log(done);
            if (!user) {
              req.flash('error', 'Password reset token is invalid or has expired.');
              return res.redirect('back');
            }
              console.log(req.body);
          if (req.body.password !== req.body.confirm) {
                return res.render('/reset/:token', { 
                    message: 'Passwords do not match!'
                });
          }
              
            user.local.password = user.generateHash(req.body.password);
            user.local.resetPasswordToken = undefined;
            user.local.resetPasswordExpires = undefined;

            user.local.save(function(err) {
             // req.logIn(user, function(err) {
                done(err, user);
             // });
            }); 
          });
        },
        function(user, done) {
          var smtpTransport = nodemailer.createTransport('SMTP', {
            service: 'SendGrid',
            auth: {
              user: 'jaimiedaly',
              pass: 'milkfat13'
            }
          });
          var mailOptions = {
            to: user.local.email,
            from: 'James Daly <jaimiedaly@gmail.com>',
            subject: 'Your password has been changed',
            text: 'Hello,\n\n' +
              'This is a confirmation that the password for your account ' + user.local.email + ' has just been changed.\n'
          };
          smtpTransport.sendMail(mailOptions, function(err) {
            req.flash('success', 'Success! Your password has been changed.');
            done(err);
          });
        }
      ], function(err) {
        res.redirect('/');
      });
    });
    
    app.post('/pickstocks', function(req, res) {
        console.log(req.user);
        console.log(req.body);
        
        User.findOne({ 'local.email' :  req.user.local.email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

            // all is well, return successful user
            if (!user.local.startAmount) {
                user.local.startAmount = 100000.00;
            }
            
            user.local.balance = user.local.balance - req.body.investedamount;
            user.local.portfolio.push({
                'symbol': req.body.symbol,
                'noOfShares': parseInt(req.body.noOfShares),
                'price': parseInt(req.body.price),
                'investedamount': parseInt(req.body.investedamount)
            });
            user.save(function(err) {
                if (err)
                    throw err;
                res.send({success:true});
            }); 
        });
    });
    

    
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

function redirectToProfile (req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/profile');
    }
}