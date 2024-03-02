import express from "express";
import { conn } from "../dbconnect";
import mysql from "mysql";
import { queryAsync } from "../dbconnect";
import { UserRequest } from "../model/user_req";
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

router.get("/rank", (req, res) => {
    let sql = "SELECT Posts.Pid, Posts.ImageURL,SUM(Votes.score) AS total_score FROM Posts JOIN Votes ON Posts.Pid = Votes.Pid GROUP BY Posts.Pid ORDER BY total_score DESC";
    conn.query(sql, (err,result)=>{
        if (err) {
            res.status(400).json(err);
        } else {
            res.json(result);
        }
    });
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