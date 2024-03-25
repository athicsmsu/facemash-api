import express from "express";
import { conn } from "../dbconnect";
import mysql from "mysql";

export const router = express.Router();

router.get("/", (req, res) => {
    let sql = "select * from Dailystats ";
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

//เอาวันที่และสถิติ 7 วันออกมา โดยวันที่formatเอาแค่วันเก็บไว้ในตัวแปล formatted_date
router.get("/grahp/:id", (req, res) => {
    const Pid = req.params.id;

    let sql = "SELECT *, DATE_FORMAT(date, '%d-%m-%Y') AS formatted_date "+
    "FROM Dailystats "+
    "WHERE Pid = ? "+
    "ORDER BY Did DESC "+
    "LIMIT 6;";
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