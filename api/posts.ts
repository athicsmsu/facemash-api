import express from "express";
import path from "path";
import multer from "multer";
import mysql from "mysql";

export const router = express.Router();

import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { conn } from "../dbconnect";

const firebaseConfig = {
  apiKey: "AIzaSyCBH_sntU282PiEt7p_LHoJZmlmoAq1Hb8",
  authDomain: "posts-upload.firebaseapp.com",
  projectId: "posts-upload",
  storageBucket: "posts-upload.appspot.com",
  messagingSenderId: "1091740669318",
  appId: "1:1091740669318:web:f8a5040e9f08a47bd58807",
  measurementId: "G-M0MNWQXC5Q"
};

initializeApp(firebaseConfig);

const storage = getStorage();
class FileMiddleware {
  filename = "";
  public readonly diskLoader = multer({
    storage: multer.memoryStorage(),

    limits: {
      fileSize: 67108864, // 64 MByte
    },
  });
}

const fileUpload = new FileMiddleware();

router.post("/:id", fileUpload.diskLoader.single("file"), async (req, res) => {
    const UserID = req.params.id;

    const filename = Math.round(Math.random() * 10000) + ".png";
    const storageRef = ref(storage,"/images/"+filename);
    const metaData = { contentType : req.file!.mimetype };
    const snapshot = await uploadBytesResumable(storageRef,req.file!.buffer,metaData)
    const url = await getDownloadURL(snapshot.ref);
    res.status(200).json({ 
        filename: url 
    });

    let sql = "INSERT INTO `Posts`(`UserID`, `ImageURL`) VALUES (?,?)";
    sql = mysql.format(sql, [
        UserID,
        url
    ]);
    conn.query(sql, (err, result) => {
        if (err) throw err;
        // res.status(201).json({
        //     affected_row: result.affectedRows, 
        //     last_idx: result.insertId
        // });
    });
});

router.get("/", (req, res) => {
  let sql = "select * from Posts";
  conn.query(sql, (err,result)=>{
      if (err) {
          res.status(400).json(err);
      } else {
          res.json(result);
      }
  });
});

router.get("/score/:id", (req, res) => {
  const Pid = req.params.id;
  let sql = "SELECT SUM(Votes.score) AS total_score FROM Posts JOIN Votes ON Posts.Pid = Votes.Pid WHERE Votes.Pid = ?";
  sql = mysql.format(sql, [
      Pid
  ]);
  conn.query(sql, (err,result)=>{
      if (err) {
          res.status(400).json(err);
      } else {
          res.json(result);
      }
  });
});

router.get("/:id", (req, res) => {
  const UserID = req.params.id;
  let sql = "select * from Posts where UserID = ?";
  sql = mysql.format(sql, [
      UserID
  ]);
  conn.query(sql, (err,result)=>{
      if (err) {
          res.status(400).json(err);
      } else {
          res.json(result);
      }
  });
});