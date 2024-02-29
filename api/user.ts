import express from "express";
import { conn } from "../dbconnect";
import mysql from "mysql";
import { queryAsync } from "../dbconnect";
import { UserRequest } from "../model/user_req";

export const router = express.Router();

router.get("/", (req, res) => {
    const email = req.query.Email;
    let sql = "select Type,Password,UserID from Users where email = ?";
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
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

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
    const storageRef = ref(storage,"/Avatar/"+filename);
    const metaData = { contentType : req.file!.mimetype };
    const snapshot = await uploadBytesResumable(storageRef,req.file!.buffer,metaData)
    const url = await getDownloadURL(snapshot.ref);
    res.status(200).json({ 
        filename: url 
    });

    let sql = "update  `Users` set `Avatar`=?  where `UserID`=?";
    sql = mysql.format(sql, [
        url,
        UserID
    ]);
    conn.query(sql, (err, result) => {
        if (err) throw err;
        // res.status(201).json({
        //     affected_row: result.affectedRows, 
        //     last_idx: result.insertId
        // });
    });
});
