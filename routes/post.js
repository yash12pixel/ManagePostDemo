const express = require("express");
const postSchema = require("../models/post");
const userSchema = require("../models/user");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { Router } = require("express");
const { findOneAndUpdate } = require("../models/user");
require("../passport")(passport);

router.post(
  "/createPost",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const user = req.params;
    let id = req.user._id;

    const { title, subtitle } = req.body;
    if (!title) {
      return res.status(400).json({ msg: "Title is required" });
    } else if (!subtitle) {
      return res.status(400).json({ msg: "Sub-Title is required" });
    } else {
      const post = await postSchema.create({
        title,
        subtitle,
        user: id,
      });

      await post.save();

      const userById = await userSchema.findByIdAndUpdate(
        { _id: id },
        { $push: { posts: post._id } },
        { new: true }
      );

      // userById.posts.push(post);
      // await userById.save();

      return res.status(200).send(userById);
    }
  }
);

router.patch(
  "/updatePost/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { id } = req.params;
    const { title, subtitle } = req.body;
    const isPost = await postSchema.findById(id);
    if (!isPost) {
      res.send(`no post with this id: ${id}`);
    }

    const updatePost = await postSchema.findByIdAndUpdate(
      { _id: id },
      { title: title, subtitle: subtitle },
      { new: true }
    );

    return res.send(updatePost);
  }
);

router.delete(
  "/deletePost/:post_id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const { post_id } = req.params;
    console.log("");
    let id = req.user._id;
    console.log("post_id::", post_id);
    const isPost = await postSchema.findById(post_id);
    if (!isPost) {
      res.send(`no post with this id: ${post_id}`);
    }
    await postSchema.findByIdAndDelete(post_id);
    const newPostId = `new ObjectId("${post_id}")`;
    const findUser = await userSchema.findOne({ _id: id });
    const updatePosts = findUser.posts.filter((posts) => {
      return posts != post_id;
    });

    console.log("postfinds::", updatePosts);
    const updateUser = await userSchema
      .findOneAndUpdate({ _id: id }, { $set: { posts: updatePosts } })
      .populate("posts");
    // await postSchema.findByIdAndDelete({ _id: post_id });

    // const temp = await userSchema
    //   .findOneAndUpdate({ _id: id }, { $pull: { posts: post_id } })
    //   .populate("posts");
    return res.send(updateUser);
  }
);

router.get(
  "/postByUser",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let id = req.user._id;
    const post_id = req.params;
    const userByPost = await userSchema.findById(id).populate("posts");
    return res.send(userByPost);
  }
);

router.get(
  "/postById/:post_id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let id = req.user._id;
    const { post_id } = req.params;
    console.log("post_id::", post_id);
    const isValidPostId = await postSchema.findOne({ _id: post_id });
    console.log("isValidPostId::", isValidPostId.user);
    if (!isValidPostId) {
      return res.send(`invalid post id: ${post_id}`);
    } else if (isValidPostId.user == id) {
      return res.send(`you are not owner`);
    } else {
      const post = await postSchema.findById({ _id: post_id }).populate("user");
      return res.send(post);
    }
  }
);

module.exports = router;
