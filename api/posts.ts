import express from "express";
import path from "path";
import multer from "multer";
import mysql from "mysql";

export const router = express.Router();

import { initializeApp } from "firebase/app";
import { getStorage, ref, deleteObject, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { conn } from "../dbconnect";

const firebaseConfig = {
    apiKey: "AIzaSyCI363cN5s4fKAyfgBG6T8TcXxcua-e6ZE",
    authDomain: "facemash-msu.firebaseapp.com",
    projectId: "facemash-msu",
    storageBucket: "facemash-msu.appspot.com",
    messagingSenderId: "245009169704",
    appId: "1:245009169704:web:10f6dbc7041259c3e3e41d",
    measurementId: "G-9PDEXGKE9H"
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

    let sql = "INSERT INTO `Posts`(`UserID`, `ImageURL`) VALUES (?,?)";
    sql = mysql.format(sql, [
        UserID,
        url
    ]);
    conn.query(sql, (err, result) => {
        if (err) throw err;
        res.status(201).json({
            affected_row: result.affectedRows, 
            last_idx: result.insertId
        });
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

router.delete("/:id", (req, res) => {
    const Pid = req.params.id;
    
    let sql = "SELECT ImageURL FROM Posts WHERE Pid = ?";
    sql = mysql.format(sql, [
        Pid
    ]);
    conn.query(sql, async (err, result)=>{
        if (err) {
            res.status(400).json(err);
        }
        const imagePath = result[0].ImageURL; // Assuming ImageURL contains the filename
        sql = "DELETE FROM Posts WHERE Pid = ?";
        // Construct the storage reference using the correct path
        const storageRef = ref(storage, imagePath);
        
        try {
            await deleteObject(storageRef);
            console.log('Image deleted successfully');
        } catch (error) {
            res.status(501).json({ error: 'Error deleting image from storage' });
            return;
        }
        
        conn.query(sql, [Pid], (err, result) => {
            if (err) throw err;
            res.status(201).json({
                affected_row: result.affectedRows
            });
        });
    });
});
