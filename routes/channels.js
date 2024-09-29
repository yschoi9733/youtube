const express = require('express');
const router = express.Router();
const conn = require('../mariadb');
const {body, param, validationResult} = require('express-validator');

router.use(express.json());

const validate = (req, res, next) => {
	const err = validationResult(req);

	if (err.isEmpty()) {
		return next();
	} else {
		return res.status(400).json(err.array());
	}
}

router
	.route('/')
	.get(
		[
			body('userId').notEmpty().isInt().withMessage('숫자 입력 필요'),	
			validate,
		],
		(req, res) => {
			let { userId } = req.body;
			conn.query(
				`SELECT * FROM channels WHERE user_id = ?`,
				userId,
				(err, result) => {
					if (err) {
						console.log(err);
						return notFoundChannel(res);
					}

					if (result.length) {
						res.json(result);
					} else {
						notFoundChannel(res);
					}
				}
			)
		}
	)	
	.post(
		[
			body('userId').notEmpty().isInt().withMessage('숫자 입력 필요'),
			body('name').notEmpty().isString().withMessage("문자 입력 필요"),
			validate,
		],		
		(req, res) => {
			let {name, userId} = req.body;
			conn.query(
				`INSERT INTO channels (name, user_id) VALUES (?, ?)`,
				[name, userId],
				(err, result) => {
					if (err) {
						console.log(err);
						return res.status(400).json({
							message: `채널 생성을 실패했습니다.`,
						})
					}

					if (result.affectedRows) {
						res.status(201).json({
							message: `${name} 채널을 생성했습니다.`,
						})
					} else {
						res.status(400).json({
							message: `채널 생성을 실패했습니다.`,
						})
					}
				}
			)
		}
	)

router
	.route('/:id')
	.get(
		[
			param('id').notEmpty().isInt().withMessage("숫자 입력 필요"),
			validate,
		],
		(req, res) => {
			let { id } = req.params;
			conn.query(
				`SELECT * FROM channels WHERE id = ?`,
				id,
				function (err, result) {
					if (err) {
						console.log(err);
						return notFoundChannel(res);
					}

					if (result.length) {
						res.json(result);
					} else {
						notFoundChannel(res);
					}
				}
			)
		}
	)
	.put(
		[
		param('id').notEmpty().isInt().withMessage(`숫자 입력 필요`),
		body('name').notEmpty().isString().withMessage('문자 입력 필요'),
		validate,
		],
		(req, res) => {
			let { id } = req.params;
			let { name } = req.body;
			conn.query(
				`UPDATE channels SET name = ? WHERE id = ?`,
				[name, id],
				(err, result) => {
					if (err) {
						console.log(err);
						return notFoundChannel(res);
					}
					if (result.affectedRows) {
						res.json({
							message: `채널명이 ${name}으로 수정되었습니다.`,
						})
					} else {
						notFoundChannel(res);
					}
				}
			)
		}
	)
	.delete(
		[
			param('id').notEmpty().isInt().withMessage(`숫자 입력 필요`),
			validate,
		],
		(req, res) => {
			let { id } = req.params;
			conn.query(
				`DELETE FROM channels WHERE id = ?`,
				id,
				(err, result) => {
					if (err) {
						console.log(err);
						return notFoundChannel(res);
					}
					if (result.affectedRows){
						res.json({
							message: `채널이 성공적으로 삭제되었습니다.`
						})
					} else {
						notFoundChannel(res);
					}
				}
			)
		}
	)

function notFoundChannel(res) {
	res.status(404).json({
		message: "채널 정보를 찾을 수 없습니다.",
	})
}

module.exports = router;

