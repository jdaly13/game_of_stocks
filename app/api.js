var User = require('../app/models/user');
module.exports = function (express, app, passport) {
    
    var router = express.Router();
    
    router.use(function (req, res, next) {
        if (req.isAuthenticated()) {
            next();    
        }
        
    });
               
    router.get('/portfolio', function (req, res) {
        res.json({
            data: req.user.local
        });
    });
    
    router.post('/balance', function (req, res, done) {
       
       User.findOne({ 'local.email' :  req.user.local.email }, function(err, user) {
            if (err) return done(err);
           
           user.local.availableBalance = req.body.availableBalance;
           user.local.totalInvestedAmount = req.body.totalInvestedAmount;
           user.local.netBalance = req.body.netBalance;
           user.local.gainOrLoss = req.body.gainsAndLossesTotal;
           console.log(user);
           
            user.save(function(err) {
                if (err)
                    throw err;
                res.send({
                    success:true,
                    data: user.local
                });
            });  
           
       })
    });
    
    app.use('/api', router);
    
}