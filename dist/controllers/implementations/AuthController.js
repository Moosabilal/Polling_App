"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const inversify_1 = require("inversify");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const types_1 = require("../../DI/types");
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
let AuthController = class AuthController {
    constructor(userService) {
        this.userService = userService;
        this.register = async (req, res) => {
            try {
                const { name, email, password } = req.body;
                const user = await this.userService.register(name, email, password);
                this.sendTokenResponse(user, res);
            }
            catch (error) {
                res.status(400).json({ success: false, message: error.message });
            }
        };
        this.login = async (req, res) => {
            try {
                const { email, password } = req.body;
                const user = await this.userService.login(email, password);
                if (!user) {
                    res.status(401).json({ success: false, message: 'Invalid credentials' });
                    return;
                }
                this.sendTokenResponse(user, res);
            }
            catch (error) {
                res.status(400).json({ success: false, message: error.message });
            }
        };
        this.me = async (req, res) => {
            try {
                if (!req.user) {
                    res.status(401).json({ success: false, message: 'Not authenticated' });
                    return;
                }
                const user = await this.userService.getUserById(req.user.id);
                res.status(200).json({ success: true, user });
            }
            catch (error) {
                res.status(400).json({ success: false, message: error.message });
            }
        };
        this.logout = async (req, res) => {
            res.clearCookie('token');
            res.json({ success: true, message: 'Logged out successfully' });
        };
    }
    sendTokenResponse(user, res) {
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: '24h'
        });
        const cookieOptions = {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        };
        res.status(200)
            .cookie('token', token, cookieOptions)
            .json({ success: true, user });
    }
};
exports.AuthController = AuthController;
exports.AuthController = AuthController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.IUserService)),
    __metadata("design:paramtypes", [Object])
], AuthController);
