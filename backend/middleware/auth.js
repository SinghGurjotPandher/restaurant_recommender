const jwt = require('jsonwebtoken');

// Rejects request if no valid JWT is present
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    try {
        const token = authHeader.split(' ')[1];
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

// Attaches req.user if valid token exists, but continues regardless
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            req.user = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            // Invalid token — continue as anonymous
        }
    }
    next();
}

module.exports = { requireAuth, optionalAuth };
