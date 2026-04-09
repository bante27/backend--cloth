exports.adminOnly = (req, res, next) => {
    // req.user የመጣው ከቀደመው 'protect' middleware ነው
    if (req.user && req.user.role === 'admin') {
        next(); // አድሚን ከሆነ ወደ ልብስ መመዝገቢያው እለፍ
    } else {
        return res.status(403).json({ 
            success: false, 
            msg: 'ይህ ቦታ ለአድሚን ብቻ የተፈቀደ ነው! ተራ ደንበኛ ልብስ መመዝገብ አይችልም' 
        });
    }
};