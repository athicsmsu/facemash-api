import express from "express";
import { conn } from "../dbconnect";
import mysql from "mysql";
import { queryAsync } from "../dbconnect";
import { UserRequest } from "../model/user_req";

export const router = express.Router();

router.get("/", (req, res) => {
    const email = req.query.Email;
    let sql = "select Type,Password,UserID,Email from Users where email = ?";
    sql = mysql.format(sql, [
        email
    ]);
    conn.query(sql, (err,result)=>{
        if (err) {
            res.status(401).json(err);
        } else {
            res.json(result);
        }
    });
});

router.get("/:id", (req, res) => {
    const UserID = req.params.id;
    let sql = "select * from Users where UserID = ?";
    sql = mysql.format(sql, [
        UserID,
    ]);
    conn.query(sql, (err,result)=>{
        if (err) {
            res.status(401).json(err);
        } else {
            res.json(result);
        }
    });
});

router.post("/", (req, res) => {
    const user: UserRequest = req.body;
    console.log(req.body);
    
    let sql = "INSERT INTO `Users`(`Username`, `Email`, `Password`, `Type`) VALUES (?,?,?,?)";
    sql = mysql.format(sql, [
        user.Username,
        user.Email,
        user.Password,
        "user"
    ]);
    conn.query(sql, (err, result) => {
        if (err) throw err;
        res.status(201).json({ 
            affected_row: result.affectedRows,
            last_idx: result.insertId
        });
    });
});

router.put("/:id", async (req, res) => {
    const id = req.params.id;
    const user: UserRequest = req.body;
  
    let sql = mysql.format("select * from Users where UserID = ?", [id]);
    const result = await queryAsync(sql);

    const JsonStr = JSON.stringify(result);
    const JsonObj = JSON.parse(JsonStr);
    const userOriginal : UserRequest = JsonObj[0];
  
    let updateUser = {...userOriginal, ...user};

    sql = "update  `Users` set `Username`=?, `Email`=?, `Password`=?, `Type`=?, `Avatar`=?  where `UserID`=?";
    sql = mysql.format(sql, [
        updateUser.Username,
        updateUser.Email,
        updateUser.Password,
        updateUser.Type,
        updateUser.Avatar,
        id,
    ]);
    conn.query(sql, (err, result) => {
        if (err) throw err;
        res.status(201).json({ affected_row: result.affectedRows });
    });
});

import multer from "multer";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

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

    let select = "SELECT Avatar FROM Users WHERE UserID = ?";
    select = mysql.format(select, [
        UserID
    ]);
    conn.query(select, async (err, result)=>{
        if (err) {
            res.status(400).json(err);
        }
        const imagePath = result[0].Avatar; // Assuming ImageURL contains the filename
        if(imagePath == null){
            const filename = Math.round(Math.random() * 10000) + ".png";
            const storageRef = ref(storage,"/Avatar/"+filename);
            const metaData = { contentType : req.file!.mimetype };
            const snapshot = await uploadBytesResumable(storageRef,req.file!.buffer,metaData)
            const url = await getDownloadURL(snapshot.ref);
            let sql = "update  `Users` set `Avatar`=?  where `UserID`=?";
            sql = mysql.format(sql, [
                url,
                UserID
            ]);
            conn.query(sql, (err, result) => {
                if (err) throw err;
                res.status(201).json({
                    affected_row: result.affectedRows, 
                    last_idx: result.insertId
                });
            });
        } else {
            // Construct the storage reference using the correct path
            const storageRefOld = ref(storage, imagePath);
            try {
                await deleteObject(storageRefOld);
            } catch (error) {
                res.status(501).json({ error: 'Error deleting image from storage' });
            }
            const filename = Math.round(Math.random() * 10000) + ".png";
            const storageRef = ref(storage,"/Avatar/"+filename);
            const metaData = { contentType : req.file!.mimetype };
            const snapshot = await uploadBytesResumable(storageRef,req.file!.buffer,metaData)
            const url = await getDownloadURL(snapshot.ref);
            let sql = "update  `Users` set `Avatar`=?  where `UserID`=?";
            sql = mysql.format(sql, [
                url,
                UserID
            ]);
            conn.query(sql, (err, result) => {
                if (err) throw err;
                res.status(201).json({
                    affected_row: result.affectedRows, 
                    last_idx: result.insertId
                });
            });
        }
    });
});