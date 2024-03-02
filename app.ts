import express from "express";

import { router as index } from "./api/index";
import { router as user } from "./api/user";
import { router as posts } from "./api/posts";
import { router as vote } from "./api/vote";

import bodyParser from "body-parser";

export const app = express();
import cors from "cors";
app.use(
  cors({
    origin: "*",
  })
);

app.use(bodyParser.text());
app.use(bodyParser.json());

app.use("/", index);
app.use("/user", user);
app.use("/posts", posts);
app.use("/vote", vote);