import express from "express";
import { conn } from "../dbconnect";
import mysql from "mysql";

export const router = express.Router();

router.get("/", (req, res) => {
    let sql = "select * from Dailystats";
    conn.query(sql, (err,result)=>{
        if (err) {
            res.status(400).json(err);
        } else {
            res.json(result);
        }
    });
});

router.get("/:id", (req, res) => {
    
    const Pid = req.params.id;

    let sql = "select * from Dailystats Where Pid = ? ORDER BY Did DESC LIMIT 1";
    sql = mysql.format(sql, [
        Pid
    ]);
    conn.query(sql, (err,result)=>{
        if(err) throw err;
        else {
          res.json(result);
        }
    });
});

router.get("/grahp/:id", (req, res) => {
    
    const Pid = req.params.id;

    let sql = "select * from Dailystats Where Pid = ? ORDER BY Did LIMIT 7";
    sql = mysql.format(sql, [
        Pid
    ]);
    conn.query(sql, (err,result)=>{
        if(err) throw err;
        else {
          res.json(result);
        }
    });
});