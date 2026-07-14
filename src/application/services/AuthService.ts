import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { UserModel } from "@/domain/models";
import { ApiError } from "@/shared/api";
import { env } from "@/shared/env";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
};

export class AuthService {
  async login(body: unknown) {
    const parsed = loginSchema.parse(body);
    const user = await UserModel.findOne({ email: parsed.email, isActive: true });
    if (!user) throw new ApiError(401, "Invalid credentials");

    const isMatch = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!isMatch) throw new ApiError(401, "Invalid credentials");

    user.lastLoginAt = new Date();
    await user.save();

    const payload: AuthUser = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions
    };

    return {
      user: payload,
      token: jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" })
    };
  }

  verify(token?: string) {
    if (!token) throw new ApiError(401, "Missing authorization token");
    try {
      return jwt.verify(token.replace("Bearer ", ""), env.jwtSecret) as AuthUser;
    } catch {
      throw new ApiError(401, "Invalid authorization token");
    }
  }
}
