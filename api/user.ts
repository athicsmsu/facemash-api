import express from "express";
import { conn } from "../dbconnect";
import mysql from "mysql";
import { queryAsync } from "../dbconnect";
import { UserRequest } from "../model/user_req";

export const router = express.Router();


//ไว้เอาข้อมูลทุกอย่างของ user ทุกคน
router.get("/userAll", (req, res) => {
    const email = req.query.Email;
    let sql = "select * from Users";
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

//ไว้เช็ค email และ password
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

//ไว้เอาข้อมูลทุกอย่างของ user คนนั้นๆ
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

//ไว้ sign up User
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

//เปลี่ยนข้อมูลของ User
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

//เปลี่ยนรหัสผ่านของ User
  router.post("/edit", (req, res)=>{
    const UserID = req.body.UserID;
    const oldPass = req.body.oldPass;
    const newPass = req.body.newPass;
    const cfPass = req.body.cfPass;

    let select = "select * from Users where UserID = ? ";
    select = mysql.format(select, [
        UserID
    ]);

    conn.query(select, (err, result)=>{
        if(err) throw err;
        if (oldPass == result[0].Password) {
            if (newPass == cfPass) {
                let sql = "UPDATE `Users` SET `Password`= ? WHERE `UserID`= ?";
                sql = mysql.format(sql, [
                cfPass,
                UserID
                ]);
                conn.query(sql, (err, result)=>{
                if(err) throw err;
                    res.status(200).json({
                        result: "success"
                    });
                });
            }
            else{
                res.status(200).json({
                    result: "Not_Math"
                });
            }
            
        }
        else{
            res.status(200).json({
                result: "Not_Password"
            });
        }
        
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

// ตั้งค่า multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 64 * 1024 * 1024 } // 64 MB
});

// เปลี่ยน Avatar ของ User
router.post("/:id", upload.single("file"), async (req, res) => {
    const UserID = req.params.id;

    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    // ลบไฟล์เก่าจาก Firebase Storage
    let select = "SELECT Avatar FROM Users WHERE UserID = ?";
    select = mysql.format(select, [UserID]);
    conn.query(select, async (err, result) => {
        if (err) return res.status(400).json(err);

        const imagePath = result[0]?.Avatar;
        if (imagePath) {
            const storageRefOld = ref(storage, imagePath);
            try {
                await deleteObject(storageRefOld);
                console.log("Old image deleted");
            } catch (error) {
                console.log("No old image to delete");
            }
        }

        // อัปโหลดไฟล์ใหม่ไป Firebase Storage
        const filename = Math.round(Math.random() * 10000) + ".png";
        const storageRef = ref(storage, "/Avatar/" + filename);
        const metaData = { contentType: req.file!.mimetype };
        const snapshot = await uploadBytesResumable(storageRef, req.file!.buffer, metaData);
        const url = await getDownloadURL(snapshot.ref);

        // อัปเดตใน DB
        let sql = "UPDATE `Users` SET `Avatar`=? WHERE `UserID`=?";
        sql = mysql.format(sql, [url, UserID]);
        conn.query(sql, (err, result) => {
            if (err) throw err;
            res.status(200).json({ filename: url });
        });
    });
});
