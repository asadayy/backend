const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const register = async (req, res) => {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    res.status(201).json({ token: createToken(user._id, user.name) });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({ token: createToken(user._id, user.name) });
};

const createToken = (id, name) =>
    jwt.sign({ id, name }, process.env.JWT_SECRET, { expiresIn: "1d" });

module.exports = {
    register,
    login,
};