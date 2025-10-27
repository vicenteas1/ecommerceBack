import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, RoleClass, type UserRole } from './role.model.js';

export class UserClass extends Document {
  username!: string;
  email!: string;
  password!: string;
  role!: UserRole;

  createdBy!: string;
  updatedBy?: string;

  fech_creacion!: Date;
  fech_modif!: Date;

  async comparePassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.password);
  }
}

const userSchema = new Schema<UserClass>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email inválido"],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ROLES,
      default: RoleClass.BUYER.value,
      required: true,
    },
    createdBy: {
      type: String,
      default: "system",
      immutable: true,
    },
    updatedBy: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: { createdAt: "fech_creacion", updatedAt: "fech_modif" },
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        const { _id, password, __v, ...rest } = ret;
        return { id: _id, ...rest };
      },
    },
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.set("password", await bcrypt.hash(this.get("password"), 10));
  }
});

userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as any;
  if (update?.password) {
    update.password = await bcrypt.hash(update.password, 10);
    this.setUpdate(update);
  }
  next();
});

userSchema.loadClass(UserClass);

export const UserModel = model<UserClass>("User", userSchema);
