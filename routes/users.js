const express = require('express');
const router = express.Router();
const conn = require('../mariadb');
const {body, param, validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');

const dotenv = require('dotenv');
dotenv.config();

router.use(express.json());

const validate = (req, res, next) => {
	const err = validationResult(req)

	if (err.isEmpty()) {
		return next();
	} else {
		return res.status(400).json(err.array());
	}
}

router.post(
	'/login', 
	[
		body('email').notEmpty().isEmail().withMessage(`이메일 입력 필요`),
		body('password').notEmpty().isString().withMessage(`비밀번호 입력 필요`),
		validate,
	],
	(req, res) => {
		const { email, password } = req.body;
		conn.query(
			'SELECT * FROM `users` WHERE email = ?',
			email,
			function (err, result) {
				if (err) {
					console.log(err);
					return res.status(400).json({
						message: `회원 정보를 찾을 수 없습니다.`,
					})
				}
				let loginUser = result[0];
				if (loginUser && loginUser.password === password) {
					// token 발급
					const token = jwt.sign({
						email: loginUser.email,
						name: loginUser.name,
					}, process.env.PRIVATE_KEY, {
						expiresIn: '5m',
						issuer: "yuseong",
					});

					res.cookie("token", token, {
					httpOnly: true,
					});

					console.log(token);
					res.json({
						message: `${loginUser.name}님 로그인 되었습니다`,
					})
				} else {
					res.status(401).json({
						message: "이메일 또는 비밀번호가 틀렸습니다.",
					})
				}
			}
		);
	}
)

// 회원가입
router.post(
	'/join', 
	[
		body('email').notEmpty().isEmail().withMessage(`이메일 입력 필요`),
		body('name').notEmpty().isString().withMessage(`이름 입력 필요`),
		body('password').notEmpty().isString().withMessage(`비밀번호 입력 필요`),
		body('contact').notEmpty().isString().withMessage(`연락처 입력 필요`),
		validate,
	],
	(req, res) => {
		const { email, name, password, contact } = req.body;
		conn.query(
			`INSERT INTO users(email, name, password, contact) 
				VALUES (?, ?, ?, ?)`,
			[email, name, password, contact],
			function (err, result) {
				if (err) {
					console.log(err);
					return res.status(400).json({
						message: `회원가입에 실패했습니다.`,
					})
				}
				if (result.affectedRows) {
					res.status(201).json({
						message: `${name}님 가입을 축하합니다.`,
					})
				} else {
					res.status(400).json(result)
				}
			}
		);
	}
)

//회원 개별 정보 조회 및 탈퇴
router
	.route('/users')
	.get(
		[
			body('email').notEmpty().isEmail().withMessage(`이메일 입력 필요`),
		],
		(req, res) => {
			let { email } = req.body;
			conn.query(
				`SELECT * FROM users WHERE email = ?`,
				email,
				function (err, result) {
					if (err) {
						console.log(err);
						return res.status(400).json({
							message: `회원 정보를 찾을 수 없습니다.`,
						})
					}

					if (result.length) {
						res.json(result);
					} else {
						res.status(404).json({
							message: "회원 정보를 찾을 수 없습니다.",
						})
					}
				}
			);
		}
	)
	.delete(
		[
			body('email').notEmpty().isEmail().withMessage(`이메일 입력 필요`),
		],
		(req, res) => {
			let { email } = req.body;
			conn.query(
				'DELETE FROM users WHERE email = ?',
				email,
				function (err, result) {
					if (err) {
						console.log(err);
						return res.status(400).json({
							message: `회원 정보를 찾을 수 없습니다.`,
						})
					}
					
					if (result.affectedRows) {
						res.json({
							message: `${email}님 다음에 또 뵙겠습니다`,
						})
					} else {
						res.status(404).json({
							message: "회원 정보를 찾을 수 없습니다.",
						})
					}
				}
			);
		}
	)

module.exports = router;

