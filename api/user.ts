import express from "express";
import { conn } from "../dbconnect";
import mysql from "mysql";
import { queryAsync } from "../dbconnect";
import { UserRequest } from "../model/user_req";

export const router = express.Router();

router.get("/password", (req, res) => {
    const email = req.query.Email;
    let sql = "select Type,Password from Users where email = ?";
    sql = mysql.format(sql, [
        email,
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