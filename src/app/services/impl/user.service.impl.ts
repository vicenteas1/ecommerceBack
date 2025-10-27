import { ApiResponse } from '../../models/api-response.model.js';
import { UserService } from '../../services/user.service.js';
import { UserClass, UserModel } from '../../models/user.model.js';
import { Logger } from '../../config/logger.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginResult } from '../../interfaces/login.interface.js';
import { Types } from 'mongoose';
import { HttpStatus } from '../../enum/http.status.js';
import { CreateUserDTO, ListUsersQuery, LoginDTO, Paged, UpdateUserDTO } from '../../types/user.type.js';
import { JwtPayloadUser } from '../../interfaces/user.interface.js';

type SafeUser = Pick<UserClass, 'id' | 'username' | 'email' | 'role' | 'fech_creacion' | 'fech_modif'>;

export class UserServiceImpl implements UserService {
  async create(data: CreateUserDTO): Promise<ApiResponse<SafeUser | null>> {
    try {
      const username = data.username?.trim();
      const email = data.email?.toLowerCase().trim();
      const password = data.password;
      const role = data.role ?? 'buyer';
      console.log("hola")

      if (!username || !email || !password) {
        return ApiResponse.fail('Faltan campos obligatorios (username, email, password)', HttpStatus.BAD_REQUEST);
      }

      const exists = await UserModel.findOne({ $or: [{ email }, { username }] }).lean();
      if (exists) return ApiResponse.fail('Usuario ya existe (email o username)', HttpStatus.CONFLICT);

      const saved = await UserModel.create({
        username,
        email,
        password: password,
        role,
        createdBy: data.createdBy ?? 'system',
      });

      return ApiResponse.ok<SafeUser>(this.toSafe(saved), HttpStatus.CREATED, 'Usuario creado');
    } catch (err: any) {
      Logger.error(`UserService.create error: ${err?.message ?? err}`);
      return ApiResponse.fail(err?.message ?? 'No se pudo crear el usuario', HttpStatus.BAD_REQUEST);
    }
  }

  async login(data: LoginDTO): Promise<ApiResponse<LoginResult | null>> {
    try {
      const email = data.email?.toLowerCase().trim();
      const password = data.password;

      if (!email || !password) {
        return ApiResponse.fail('Faltan campos obligatorios (email, password)', HttpStatus.BAD_REQUEST);
      }

      const user = await UserModel.findOne({ email }).select('+password');
      if (!user) return ApiResponse.fail('Usuario no encontrado', HttpStatus.NOT_FOUND);

      const ok = await bcryptjs.compare(password, user.password);
      if (!ok) return ApiResponse.fail('Credenciales inválidas', HttpStatus.UNAUTHORIZED);

      const payload: { user: JwtPayloadUser } = {
        user: { id: user.id, email: user.email, role: user.role, username: user.username },
      };

      const accessToken = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '30m' });

      const result: LoginResult = {
        user: this.toSafe(user),
        accessToken,
      };

      return ApiResponse.ok(result, HttpStatus.OK, 'OK');
    } catch (err: any) {
      Logger.error(`UserService.login error: ${err?.message ?? err}`);
      return ApiResponse.fail(err?.message ?? 'Error en login', HttpStatus.INTERNAL_ERROR);
    }
  }

  async verifyToken(
    user: JwtPayloadUser,
    refresh: boolean
  ): Promise<ApiResponse<{ valid: boolean; user: JwtPayloadUser; token?: string }>> {
    try {
      const found = await UserModel.findById(user.id).lean();
      if (!found) return ApiResponse.fail('Sesión inválida (usuario no existe)', HttpStatus.UNAUTHORIZED);

      let token: string | undefined;
      if (refresh) {
        token = jwt.sign({ user }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
      }

      return ApiResponse.ok({ valid: true, user, ...(token ? { token } : {}) }, HttpStatus.OK, 'OK');
    } catch (err: any) {
      Logger.error(`UserService.verifyToken error: ${err?.message ?? err}`);
      return ApiResponse.ok({ valid: false, user, token: undefined }, HttpStatus.INTERNAL_ERROR, 'NOK');
    }
  }

  async updateById(id: string, update: UpdateUserDTO): Promise<ApiResponse<SafeUser | null> | null> {
    try {
      if (!this.validateId(id)) return ApiResponse.fail('ID inválido', HttpStatus.BAD_REQUEST);

      const $set: Record<string, unknown> = {};
      if (update.username !== undefined) {
        const u = String(update.username).trim();
        if (!u) return ApiResponse.fail('username inválido', HttpStatus.BAD_REQUEST);
        $set.username = u;
      }
      if (update.email !== undefined) {
        const e = String(update.email).toLowerCase().trim();
        const emailRe = /^\S+@\S+\.\S+$/;
        if (!emailRe.test(e)) return ApiResponse.fail('email inválido', HttpStatus.BAD_REQUEST);
        $set.email = e;
      }
      if (update.role !== undefined) {
        $set.role = update.role;
      }
      if (update.updatedBy !== undefined) {
        $set.updatedBy = update.updatedBy;
      }

      if (Object.keys($set).length === 0) return ApiResponse.fail('Nada para actualizar', HttpStatus.BAD_REQUEST);

      const updated = await UserModel.findByIdAndUpdate(id, { $set }, { new: true, runValidators: true });
      if (!updated) return ApiResponse.fail('Usuario no encontrado', HttpStatus.NOT_FOUND);

      return ApiResponse.ok<SafeUser>(this.toSafe(updated), HttpStatus.OK, 'Actualizado');
    } catch (err: any) {
      Logger.error(`UserService.updateById error: ${err?.message ?? err}`);
      return ApiResponse.fail(err?.message ?? 'No se pudo actualizar', HttpStatus.INTERNAL_ERROR);
    }
  }

  async getById(id: string): Promise<ApiResponse<SafeUser | null> | null> {
    try {
      if (!this.validateId(id)) return ApiResponse.fail('ID inválido', HttpStatus.BAD_REQUEST);
      const user = await UserModel.findById(id).lean();
      if (!user) return ApiResponse.fail('Usuario no encontrado', HttpStatus.NOT_FOUND);
      return ApiResponse.ok<SafeUser>(this.toSafe(user as UserClass), HttpStatus.OK, 'OK');
    } catch (err: any) {
      Logger.error(`UserService.getById error: ${err?.message ?? err}`);
      return ApiResponse.fail(err?.message ?? 'NOK', HttpStatus.INTERNAL_ERROR);
    }
  }

  async list(query?: ListUsersQuery): Promise<ApiResponse<Paged<SafeUser>>> {
    try {
      const page = Math.max(1, Number(query?.page ?? 1));
      const limit = Math.min(100, Math.max(1, Number(query?.limit ?? 10)));
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (query?.q) {
        const q = String(query.q).trim();
        filter.$or = [
          { username: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ];
      }

      const [itemsRaw, total] = await Promise.all([
        UserModel.find(filter).sort({ fech_creacion: -1 }).skip(skip).limit(limit).lean(),
        UserModel.countDocuments(filter),
      ]);

      const items: SafeUser[] = itemsRaw.map((u) => this.toSafe(u as UserClass));
      return ApiResponse.ok<Paged<SafeUser>>({ items, total, page, limit }, HttpStatus.OK, 'OK');
    } catch (err: any) {
      Logger.error(`UserService.list error: ${err?.message ?? err}`);
      return ApiResponse.fail('No se pudo listar usuarios', HttpStatus.INTERNAL_ERROR) as unknown as ApiResponse<Paged<SafeUser>>;
    }
  }

  async removeById(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      if (!this.validateId(id)) return ApiResponse.fail('ID inválido', HttpStatus.BAD_REQUEST);
      const res = await UserModel.findByIdAndDelete(id);
      return ApiResponse.ok({ deleted: !!res }, HttpStatus.OK, !!res ? 'Eliminado' : 'No existía');
    } catch (err: any) {
      Logger.error(`UserService.removeById error: ${err?.message ?? err}`);
      return ApiResponse.fail('No se pudo eliminar', HttpStatus.INTERNAL_ERROR);
    }
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<ApiResponse<{ changed: boolean }>> {
    try {
      if (!this.validateId(userId)) return ApiResponse.fail('ID inválido', HttpStatus.BAD_REQUEST);
      if (!newPassword || newPassword.length < 8) {
        return ApiResponse.fail('La nueva contraseña debe tener al menos 8 caracteres', HttpStatus.BAD_REQUEST);
      }

      const user = await UserModel.findById(userId).select('+password');
      if (!user) return ApiResponse.fail('Usuario no encontrado', HttpStatus.NOT_FOUND);

      const ok = await bcryptjs.compare(oldPassword, user.password);
      if (!ok) return ApiResponse.fail('Contraseña actual inválida', HttpStatus.BAD_REQUEST);

      user.password = newPassword;
      await user.save();

      return ApiResponse.ok({ changed: true }, HttpStatus.OK, 'Contraseña actualizada');
    } catch (err: any) {
      Logger.error(`UserService.changePassword error: ${err?.message ?? err}`);
      return ApiResponse.fail('No se pudo cambiar la contraseña', HttpStatus.INTERNAL_ERROR);
    }
  }

  private async encryptPwd(password: string): Promise<string> {
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    return hashedPassword;
  }

  private validateId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  private toSafe(u: UserClass): SafeUser {
    return {
      id: (u as any).id ?? (u as any)._id?.toString(),
      username: (u as any).username,
      email: (u as any).email,
      role: (u as any).role,
      fech_creacion: (u as any).fech_creacion,
      fech_modif: (u as any).fech_modif,
    };
  }
}
