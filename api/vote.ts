import express from "express";
import { conn } from "../dbconnect";
import mysql from "mysql";
import { queryAsync } from "../dbconnect";
import { VoteRequest } from "../model/vote_req";

export const router = express.Router();

router.get("/", (req, res) => {
    let sql = "select * from Votes";
    conn.query(sql, (err,result)=>{
        if (err) {
            res.status(400).json(err);
        } else {
            res.json(result);
        }
    });
});

//หน้าranking
router.get("/rank", (req, res) => {
    let sql = "SELECT Posts.Pid, Posts.ImageURL, total_score, Dailystats.* "+
    "FROM ( "+
    "    SELECT Posts.Pid, SUM(Votes.score) AS total_score "+
    "    FROM Posts "+
    "    JOIN Votes ON Posts.Pid = Votes.Pid "+
    "    GROUP BY Posts.Pid "+
    "    ORDER BY total_score DESC "+
    "    LIMIT 10 "+
    ") AS TopPosts "+
    "JOIN Posts ON TopPosts.Pid = Posts.Pid "+
    "LEFT JOIN Dailystats ON Posts.Pid = Dailystats.Pid "+
    "WHERE Dailystats.date = CURDATE() - INTERVAL 1 DAY OR Dailystats.Pid IS NULL "+
    "ORDER BY total_score DESC; ";
    conn.query(sql, (err,result)=>{
        if (err) {
            res.status(400).json(err);
        } else {
            res.json(result);
        }
    });
});

//เวลาเพิ่มรูปภาพใหม่ให้เพิ่มคะแนน 1000 ด้วย
router.post("/newposts", (req, res) => {
    const vote: VoteRequest = req.body;
    console.log(req.body);

    if(true){
        let sql = "INSERT INTO `Votes`(`Pid`, `score`,`vote_time`) VALUES (?,?,CURRENT_TIME())";
            sql = mysql.format(sql, [
            vote.Pid,
            1000
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

router.post("/win", (req, res) => {
    const vote: VoteRequest = req.body;
    console.log(req.body);
    
    if(true){
        let sql = "INSERT INTO `Votes`(`Pid`, `isVote`, `vote_time`, `score`) VALUES (?,?,CURRENT_TIME(),?)";
            sql = mysql.format(sql, [
            vote.Pid,
            "1",
            vote.score
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

router.post("/lose", (req, res) => {
    const vote: VoteRequest = req.body;
    console.log(req.body);
    if(true){
        let sql = "INSERT INTO `Votes`(`Pid`, `isVote`, `vote_time`, `score`) VALUES (?,?,CURRENT_TIME(),?)";
            sql = mysql.format(sql, [
            vote.Pid,
            "0",
            vote.score
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

//เอาrankปัจจุบันออกมาโชว์ทั้งหมด แล้วค่อยไปเปรียบเทียบใน front ถ้า Pid ตรงกัน
router.get("/nowRank", (req, res) => {

    let sql = "SELECT pid, SUM(score) AS total_score, "+ 
    "FIND_IN_SET(pid, ( "+ 
    "SELECT GROUP_CONCAT(pid ORDER BY total_score DESC) "+ 
    "FROM (SELECT pid, SUM(score) AS total_score FROM Votes GROUP BY pid ORDER BY total_score DESC) AS scores "+ 
    ")) AS `rank` "+ 
    "FROM Votes "+ 
    "GROUP BY pid "+ 
    "ORDER BY total_score DESC;";
    conn.query(sql, (err,result)=>{
        if(err) throw err;
        else {
          res.json(result);
        }
    });
});