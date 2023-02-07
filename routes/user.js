const express = require("express");
const userSchema = require("../models/user");
const router = express.Router();
const jwt = require("jsonwebtoken");
const JWT_KEY = "6dqw7dydyw7ewyuw";
const { hashPassword } = require("../utils/util");
const bcrypt = require("bcryptjs");

router.post("/signup", async (req, res) => {
  const { name, bio, website, email, password } = req.body;
  if (!name) {
    return res.status(400).json({ msg: "Name is required" });
  } else if (!bio) {
    return res.status(400).json({ msg: "Biodata is required" });
  } else if (!website) {
    return res.status(400).json({ msg: "Website is required" });
  } else if (!email) {
    return res.status(400).json({ msg: "Email is required" });
  } else if (!password) {
    return res.status(400).json({ msg: "Password is required" });
  } else {
    const checkEmailExist = await userSchema.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    });

    if (checkEmailExist) {
      return res
        .status(400)
        .json({ msg: "Email is already taken, try with another email" });
    }
    let hash = await hashPassword(password);
    console.log("hash::", hash);
    let user = {
      name: name,
      bio: bio,
      website: website,
      email: email,
      password: hash,
    };
    const newUser = new userSchema(user);
    await newUser.save();
    // const user = await userSchema.create({
    //   name,
    //   bio,
    //   website,
    //   email,
    //   hash,
    // });
    return res.send(newUser);
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ msg: "Email is required" });
  } else if (!password) {
    res.status(400).json({ msg: "Password is required" });
  } else {
    const userExist = await userSchema.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    });
    if (!userExist) {
      return res.status(400).json({ msg: "User does not exist" });
    }
    console.log("userExist::", userExist);
    let id = userExist._id;

    const passwordIsValid = bcrypt.compareSync(password, userExist.password);

    if (!passwordIsValid) {
      return res.status(400).json({ msg: "Your credentials are not valid" });
    }

    const jwtToken = jwt.sign(
      {
        email,
        id,
      },
      JWT_KEY,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).send({ accessToken: jwtToken });
  }
});

router.get("/find", async (req, res) => {
  const user = await userSchema.find();
  return res.send(user);
});

module.exports = router;
